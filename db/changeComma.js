
const _ = require('lodash');
function changeCommas(datas,isDecode = false){
    if(isDecode){
        return datas.map(data=>_.replace(data,'[comma]',','));
    }  
    return datas.map(data=>_.replace(data,',','[comma]'));
    
}
module.exports = changeCommas;