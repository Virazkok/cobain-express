require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Pastikan DATABASE_URL tersedia
if (!process.env.DATABASE_URL) {
  throw new Error('Missing required environment variable: DATABASE_URL');
}

// Load CA certificate with extra fallbacks and support for inline PEM
function loadCA() {
  const env = process.env.PG_SSL_CA;
  if (!env) return undefined;

  // Jika env berisi langsung isi PEM, kembalikan langsung
  if (env.includes('-----BEGIN CERTIFICATE-----')) {
    return env;
  }

  // kandidat path tambahan (cwd, __dirname, parent, langsung basename di certs)
  const candidates = [
    env,
    path.resolve(process.cwd(), env),
    path.resolve(__dirname, env),
    path.resolve(__dirname, '..', env),
    path.resolve(__dirname, '..', 'certs', path.basename(env)),
    path.resolve(process.cwd(), 'certs', path.basename(env)),
  ].filter(Boolean);

  for (const p of [...new Set(candidates)]) {
    try {
      return fs.readFileSync(p, 'utf8');
    } catch (e) {
      // ignore, coba kandidat berikutnya
    }
  }

  // Jika ingin toleran, set ALLOW_MISSING_PG_SSL_CA=true di .env agar tidak throw
  if (process.env.ALLOW_MISSING_PG_SSL_CA === 'true') {
    console.warn(
      `PG_SSL_CA is set but file not found. Tried: ${candidates.join(', ')}. Continuing without CA.`
    );
    return undefined;
  }

  throw new Error(
    `PG_SSL_CA is set but file not found. Tried: ${candidates.join(', ')}`
  );
}

let ssl;
const ca = loadCA();
if (ca) {
  ssl = { ca };
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};