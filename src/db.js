require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Pastikan DATABASE_URL tersedia (karena kamu mau pake DATABASE_URL saja)
if (!process.env.DATABASE_URL) {
  throw new Error('Missing required environment variable: DATABASE_URL');
}

// Load CA certificate (optional) with beberapa kandidat path
function loadCA() {
  if (!process.env.PG_SSL_CA) return undefined;

  const candidates = [
    process.env.PG_SSL_CA,
    path.resolve(process.cwd(), process.env.PG_SSL_CA),
    path.resolve(__dirname, process.env.PG_SSL_CA),
  ];

  for (const p of [...new Set(candidates)]) {
    try {
      return fs.readFileSync(p).toString();
    } catch (e) {
      // ignore and try next
    }
  }

  throw new Error(
    `PG_SSL_CA is set but file not found. Tried: ${candidates.join(', ')}`
  );
}

let ssl;
const ca = loadCA();
if (ca) {
  // pg accepts ssl: { ca: <string> } — tambahkan rejectUnauthorized jika perlu
  ssl = { ca };
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool, // expose pool jika perlu transaksi manual
};