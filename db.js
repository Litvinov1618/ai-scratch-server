const Pool = require('pg').Pool;

const pool = new Pool({
    user: 'postgres',
    password: "8220",
    host: 'localhost',
    port: 5432,
    database: 'ai_scratch_db'
});

module.exports = pool;