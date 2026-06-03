const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();
app.use(cors());
app.use(express.json());
const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'flashtest',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'password',
});
async function initDB() {
  let retries = 10;
  while (retries > 0) {
    try {
      await pool.query('CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, text TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW())');
      console.log('[DB] Ready!'); break;
    } catch(e) { retries--; console.log('[DB] Waiting...', retries); await new Promise(r => setTimeout(r, 3000)); }
  }
}
app.get('/health', (req, res) => res.json({ status: 'ok', app: process.env.APP_NAME || 'FlashTest' }));
app.get('/api/messages', async (req, res) => {
  try { const r = await pool.query('SELECT * FROM messages ORDER BY created_at DESC LIMIT 10'); res.json(r.rows); }
  catch(e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/messages', async (req, res) => {
  try { const { text } = req.body; const r = await pool.query('INSERT INTO messages (text) VALUES ($1) RETURNING *', [text]); res.json(r.rows[0]); }
  catch(e) { res.status(500).json({ error: e.message }); }
});
const PORT = process.env.PORT || 3001;
initDB().then(() => app.listen(PORT, () => console.log('Backend on port ' + PORT)));
