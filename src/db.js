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

  if (env.includes('-----BEGIN CERTIFICATE-----')) {
    return env;
  }

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
      // ignore
    }
  }

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
const allowSelfSigned = process.env.PG_SSL_ALLOW_SELF_SIGNED === 'true';

if (ca) {
  ssl = {
    ca,
    // jika allowSelfSigned=true, kita nonaktifkan strict verification
    rejectUnauthorized: !allowSelfSigned,
  };
} else if (allowSelfSigned) {
  // tidak ada CA tapi eksplisit mengizinkan self-signed
  ssl = { rejectUnauthorized: false };
}

if (allowSelfSigned) {
  console.warn('PG_SSL_ALLOW_SELF_SIGNED=true — TLS certificate verification is disabled (INSECURE).');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};