require('dotenv/config');
const { Pool } = require('pg');
const url = process.env.DATABASE_URL + '&sslaccept=accept_invalid_certs';
const pool = new Pool({ connectionString: url });
pool.query('SELECT 1 AS ok')
  .then(r => {
    console.log('OK', r.rows[0]);
  })
  .catch(e => {
    console.error('ERR', e.message);
  })
  .finally(() => pool.end());
