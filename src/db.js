const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'clotheshop',
  password: String(process.env.DB_PASSWORD),
  port: 5430,
});

module.exports = pool;
