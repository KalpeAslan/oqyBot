const axios = require('axios');

const User = require('../db/user.js');

const _ = require('lodash');
const changeCommas = require('../db/changeComma.js');
const pgarray = require('pg-array');
class Menu {

    //just helpers...

    constructor(language,subjectsAllLang){
        this.language = language;
        this.subjectsAllLang = subjectsAllLang;
    }
    isScore(scoreRaw) {
        const score = Number(scoreRaw) / 1;
        console.log(score)
        if (isNaN(score)) {
            return false
        }
        if(score >= 50 && score <= 140) return true;
        
    }


    isSubj(subj) { //Done
        const subjectsAll = this.language === 'kz' ? this.subjectsAllLang.kz : this.subjectsAllLang.ru;

        const keys = Object.keys(subjectsAll);
        return keys.some(key => {
            if (subjectsAll[key].name === subj) return true;
        });
    }

    getShort(subj) { //Done
        const subjectsAll = this.language === 'kz' ? this.subjectsAllLang.kz : this.subjectsAllLang.ru;
        const keys = Object.keys(subjectsAll);
        const short = keys.reduce((acc, key) => {
            if (subjectsAll[key].name === subj) {
                acc = subjectsAll[key].short;
            }
            return acc
        }, 0);
        return short;
    }

    getFirstSubjectButtons(bot, id) { //Done
        const messages = {
            kz: 'Бірінші пәніңді менюдан таңда',
            ru: 'Выбери первый предмет в меню'
        };
        const message = this.language === 'kz' ? messages.kz : messages.ru;
        const subjectsAll = this.language === 'kz' ? this.subjectsAllLang.kz : this.subjectsAllLang.ru;

        const keys = Object.keys(subjectsAll);
        const subjects = keys.map(key => subjectsAll[key].name);
        const elems = subjects.map(subj => [subj]);
        return bot.sendMessage(id, message, {
            reply_markup: {
                keyboard: elems,
                one_time_keyboard: true
            }
        })
    }

    // bot,id,language,
    async getAreaButtonsAll(bot, id) {
        const user = new User();
        const short = await user.getSubjects(id);
        const branchesRaw = await axios.post('http://localhost:4000/branches/postBranches/telegram', short).then((datas) => {
            return datas.data
        }).catch(e => {
            console.log(e)
        });
        const branchesForPut = changeCommas(branchesRaw);
        pgarray(branchesForPut.flat());

        const choseTheBranches = this.language === 'kz' ? 'Ұнайтын салаңды таңда' : 'Выбери сферы которые тебе нравятся'

        user.putElem(id, 'areas',pgarray(branchesForPut.flat()));
        const branches = branchesRaw.map(branch => [branch]);
        bot.sendMessage(id, choseTheBranches, {
            reply_markup: {
                keyboard: branches,
                one_time_keyboard: true
            }
        });
        return branches;
    }

    async menuController(bot, id, data) {
        const user = new User();
        const isKz = this.language === 'kz'
        const descs = {
            changeArea: isKz ? 'Саланы өзгерту' : 'Изменить предыдущий область',
            getResult : isKz ?  'Нәтижелерді қарау': 'Смотреть результаты',
            changeScore: isKz ? 'Баллды өзгерту' : 'Изменить балл',
            changeSubjects: isKz ? 'Бейіндік пәнді өзгерту' : 'Изменить предыдущий предмет',
            noGrants: isKz ? '\u{1F62A}	Сіздің балыңыз бойынша грант жок' : '\u{1F62A} По вашему баллу грантов нет',
            inputScore: isKz ? 'Балыңды енгіз' : 'Введи свой балл',
            wrongInput: isKz ? 'ҰБТ балың 50-140 дейін' : 'Допустимые баллы в ЕНТ 50-140',
            choseOtherArea: isKz ? 'Басқа сала таңда' : 'Выбери другой профиль'
        }
        switch (data){
            case `\u{25C0} ${descs.changeArea}`:
                await this.backToLast(id);
                const buttons = await this.getAreaButtons(bot, id);
                return buttons;
            case `\u{2705} ${descs.getResult}`:
                console.log('work')
                const grants =await this.getGrants(id);
                if(grants.length ===0) return await bot.sendMessage(id,descs.noGrants);
                return await bot.sendMessage(id,grants);
            case `\u{1F4AF} ${descs.changeScore}`:
                user.putElem(id,'state','Inputed score');
                break;
            case `\u{1F4DA} ${descs.changeSubjects}`:
                user.dropColumn(id,'branches');
                return this.getFirstSubjectButtons(bot,id);
        }




        




        const checkToLength = await this.checkToLength(id);
        if (checkToLength === true) {
            return await this.getAreaButtons(bot, id, true);
        } else if (this.isSubj(data) === true) {
            user.putElem(id, 'state', 'CHOSED SUBJECTS');
            const short = this.getShort(data);
            user.putElem(id,'subjects', short);
            user.putElem(id, 'state','Inputs score');
            return bot.sendMessage(id, descs.inputScore);
        }

        const state = await user.getState(id);

        if (state === 'Inputs score') {
            if (!this.isScore(data)) {
                return await bot.sendMessage(id, desc.wrongInput)
            }
            const score = Number(data) / 1;
            user.putElem(id,'score',score);

            user.putElem(id, 'state','Inputed score');
            this.getAreaButtonsAll(bot, id);
        }


        const isInclude = await user.isInclude(id, data);

        if (isInclude.state) {
            return bot.sendMessage(id, descs.choseOtherArea);
        }

        if (isInclude) {
            await user.putElem(id, 'state','CHOSED FIRST AREA');
            await user.putBranch(id, data);
            const checkToLength = await this.checkToLength(id);
            if (checkToLength === true) {
                return await this.getAreaButtons(bot, id, true);
            }
            return await this.getAreaButtons(bot, id);
        }
    }

    async checkToLength(id) {
        const user = new User();
        const length = await user.getLength(id);
        if (length === false) return null;
        return Number(length) >= 4 ? true : false

    }
    async getAreaButtons(bot, id, isFull = false) {
        const user = new User();
        const branches = await user.getBranches(id);

        if(branches.length === 0) return await this.getAreaButtonsAll(bot,id)
        const allAreas = await user.getAreas(id);
        const filtered = _.pullAll(allAreas, branches).map(elem => [elem]);
        filtered.unshift(['\u{2705} Смотреть результаты']);
        filtered.push(['\u{25C0} Изменить предыдущий предмет'],['\u{1F4AF} Изменить балл'],['\u{1F4DA} Изменить предметы']);

        const descs = {
            only4Br: this.language === 'kz' ? 'ҰБТда тек 4 проф.сала таңдауға болады' : 'В ЕНТ можно выбырать только 4 проф. сферы',
            choseArea: this.language === 'kz' ? 'Ұнайтын слаңды таңда': 'Выбери проф.область'
        }
        const message = isFull ? descs.only4Br : descs.choseArea;
        bot.sendMessage(id, message, {
            reply_markup: {
                keyboard: filtered,
                one_time_keyboard: true
            }
        })

    }

    async backToLast(id) {
        const user = new User();
        await user.backLast(id)
    }

    async getGrants(id) {
        const user = new User();
        const branches = await user.getBranches(id);
        const subjects = await user.getSubjects(id);
        const score = await user.getScore(id,'score');

        const result = {
            branches: branches,
            subjects: subjects,
            score: score
        }
        const grants = await axios.post('http://localhost:4000/branches/setProfsByBraches/telegram', result)
            .then(datas => datas.data)
            .catch(e => console.log(e));
        grants.forEach(elem=>console.log(elem))
        return grants.join(' \n ');
    }
};



module.exports = Menu;