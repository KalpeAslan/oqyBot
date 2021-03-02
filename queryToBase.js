const axios = require('axios');

const url = 'localhost:4000';

function getGrants(subjects,score){
    const result = {
        subjects,
        score
    };

    axinos.get(url,JSON.stringify(result))
    .then(data=>{
        return data.grants
    })
    .catch(e=>{
        console.log(e)
    });
}