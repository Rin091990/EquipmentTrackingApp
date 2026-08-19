require('./config');

const { Pool } = require('pg');

// התחבר ל-Neon
const client = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

client.on('error', (err) => {
  console.error('PostgreSQL idle client error:', err.message);
});

client.query('SELECT 1').then(() => {
  console.log('✅ התחברנו ל-Neon בהצלחה!');
}).catch(err => {
  console.error('❌ שגיאה בחיבור:', err.message);
});

module.exports = client;
