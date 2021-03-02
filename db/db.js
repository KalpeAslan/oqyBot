const {Pool} = require('pg');
const pool = new Pool({
    user: 'postgres',
    password: 'aslan2001',
    host: 'localhost',
    port: 5402,
    database: 'oqybot'
});
pool.queryNew = async (queryBody)=>{
    const result = await pool.query(queryBody);
    if(result.rows[0] === undefined || result.rows[0] === null) return null;
    const key = Object.keys(result.rows[0]);
    return result.rows[0][key];
}
module.exports = pool;