const Pool = require('pg').Pool;

const pool = new Pool({
    connectionString: "postgres://default:OEQw6y0nhBWG@ep-twilight-wave-073761-pooler.us-east-1.postgres.vercel-storage.com:5432/verceldb?sslmode=require",
});

module.exports = pool;