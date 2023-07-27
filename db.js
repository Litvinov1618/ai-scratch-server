const Pool = require('pg').Pool;
require('dotenv').config();

const LOCAL_SERVER_SETTINGS = {
    user: process.env.LOCAL_SERVER_USER,
    password: process.env.LOCAL_SERVER_PASSWORD,
    host: 'localhost',
    port: 5432,
    database: process.env.LOCAL_SERVER_DB,
};

const VERCEL_SERVER_SETTINGS = {
    connectionString: process.env.POSTGRES_URL + '?sslmode=require',
};

const pool = new Pool(process.env.SERVER_MODE === 'local' ? LOCAL_SERVER_SETTINGS : VERCEL_SERVER_SETTINGS);

module.exports = pool;