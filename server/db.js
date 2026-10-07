const { Pool } = require("pg");

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "little_pages",
    password: "136255",
    port: 5432,
});

module.exports = pool;