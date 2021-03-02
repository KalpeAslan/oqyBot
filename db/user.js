const db = require('./db.js');
const pgarray = require('pg-array');

const _ = require('lodash');
const changeCommas = require('./changeComma.js');

class User {
    async setIdNameLang(id, name) {
        await db.query(`INSERT INTO person (msgid,name,language,branches,areas,subjects,score,state) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [id, name, null, pgarray([]), pgarray([]), null, null, null]);
    }

    async delete(id){
        await db.query(`DELETE FROM person WHERE msgid = ${id}`)
    }
    async putElem(id,name,elem){
        await db.query(`UPDATE person SET ${name} = '${elem}' WHERE msgid = ${id}`)
    }
    
    
    async putBranch(id, branch) {
        const branches = await db.queryNew(`SELECT branches FROM person WHERE msgid = ${id}`);

        if (branches.length === 0) {
            branches.push(branch)
            const readyBranches = pgarray([changeCommas(branches)]);
            await db.query(`UPDATE person SET branches = '${readyBranches}' WHERE msgid = ${id}`);
            return;
        }
        branches.push(branch);

        const readyBranches = pgarray(changeCommas(branches));
        await db.query(`UPDATE person SET branches = '${readyBranches}' WHERE msgid = ${id}`);
    }





    //check elems
    async isInclude(id, branchRaw) {
        try {
            const branch = _.replace(branchRaw, ',', '[comma]');
            const isBranchesIncludes = await db.queryNew(`SELECT EXISTS (select name from person where msgid = ${id} AND branches @> '{"${branch}"}')`);
            if (Boolean(isBranchesIncludes)) { //Checking for including area in out used branches
                const res = {
                    state: true,
                    value: 'includesInBranches'
                };
                return res;
            }
            const elem = await db.queryNew(`SELECT EXISTS (select name from person where msgid = ${id} AND areas @> '{"${branch}"}')`);
            return Boolean(elem);
        } catch (e) {
            console.log(e)
        }
    }

    //getters

    async getLength(id) {
        const length = await db.queryNew(`SELECT array_length(branches,1) FROM person WHERE msgid = ${id}`);
        if (length == null) return false;
        return Number(length)
    }

    async getAreas(id) {
        const areas = await db.queryNew(`SELECT areas FROM person WHERE msgid = ${id}`);
        return changeCommas(areas, true);
    }

    async getBranches(id) {
        const branchesRaw = await db.queryNew(`SELECT branches FROM person WHERE msgid = ${id}`);
        return changeCommas(branchesRaw, true);
    }

    async getSubjects(id) {
        const subjects = await db.queryNew(`SELECT subjects FROM person WHERE msgid = ${id}`);
        return subjects;
    }

    async getState(id) {
        const state = await db.queryNew(`SELECT state FROM person WHERE msgid = ${id}`);
        return state;
    }
    async getLangugage(id) {
        const lang = await db.queryNew(`SELECT language FROM person WHERE msgid =${id}`);
        return lang;
    }

    async getScore(id, elemRaw) {
        const elem = await db.queryNew(`SELECT ${elemRaw} FROM person WHERE msgid = ${id}`);
        return elem;
    }

    //remove last 
    async backLast(id) {
        const branches = await db.queryNew(`SELECT branches FROM person WHERE msgid = ${id}`);
        branches.pop();
        const branchesNew = changeCommas(branches);
        const readyBranches = pgarray(branchesNew);
        await db.query(`UPDATE person SET branches = '${readyBranches}' WHERE msgid = ${id}`);
    }


    async dropColumn(id, name) {
        const empty = pgarray([]);
        db.query(`UPDATE person SET ${name} = '${empty}' WHERE msgid = ${id}`)
    }
}

module.exports = User;