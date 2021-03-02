const User = require('./db/user.js');


const TelegramBot = require('node-telegram-bot-api');
const TOKEN = '1617221899:AAGE9w1OySZvOou5uNcj1KfAcPc67owg0UY';

const Main = require('./menu/menu.js');

const bot = new TelegramBot(TOKEN, {
    polling: {
        interval: 300,
        autoStart: true,
        params: {
            timeout: 10
        }
    }
});

bot.onText(RegExp('/start'), async (msg) => {
    
    const choseLang = 'ҰБТ тапсырған тіліңді таңда \n Выбери язык на котором сдал ЕНТ';
    const user =  new User();
    await user.delete(msg.chat.id);
    bot.sendMessage(msg.chat.id, choseLang, {
        reply_markup: {
            inline_keyboard: [
                [{
                        text: '\u{1F1F0}\u{1F1FF} Қазақ тілі',
                        callback_data: 'kz',
                    },
                    {
                        text: '\u{1F1F7}\u{1F1FA} Русский язык',
                        callback_data: 'ru'
                    }
                ]
            ]
        }
    });
});



bot.on('callback_query', async (query) => {
    const {chat} = query.message;
    const data = query.data;
    const user = new User();
    const language = await user.getLangugage(query.id);
    const menu = new Main(language,subjectsAllLang);
    menu.getFirstSubjectButtons(bot,chat.id,data);
    
    user.setIdNameLang(chat.id,chat.first_name);
    user.putElem(chat.id,'language',data);
});

const subjectsAllLang = require('./db/subjAll.js')
bot.on('message',async (msg)=>{
    const id = msg.chat.id;
    const data = msg.text;
    const user = new User();
    const language = await user.getLangugage(id);
    const menu = new Main(language,subjectsAllLang);
    menu.menuController(bot,id,data);
    
})
bot.on("polling_error", console.log)