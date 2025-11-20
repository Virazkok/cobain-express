require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Pastikan DATABASE_URL tersedia
if (!process.env.DATABASE_URL) {
  throw new Error('Missing required environment variable: DATABASE_URL');
}

// Load CA certificate supporting:
// - inline PEM in PG_SSL_CA
// - base64 in PG_SSL_CA_B64
// - file path fallbacks (local) if present
function loadCA() {
  const inline = process.env.PG_SSL_CA;
  const b64 = process.env.PG_SSL_CA_B64;

  if (inline && inline.includes('-----BEGIN CERTIFICATE-----')) {
    return inline;
  }

  if (b64) {
    try {
      return Buffer.from(b64, 'base64').toString('utf8');
    } catch (e) {
      console.warn('Failed to decode PG_SSL_CA_B64:', e.message);
    }
  }

  const env = inline || process.env.PG_SSL_CA;
  if (!env) return undefined;

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
    rejectUnauthorized: !allowSelfSigned,
  };
} else if (allowSelfSigned) {
  ssl = { rejectUnauthorized: false };
}

if (allowSelfSigned) {
  console.warn('PG_SSL_ALLOW_SELF_SIGNED=true — TLS certificate verification is disabled (INSECURE).');
}

// debug: remove after verifying envs
console.log('DB SSL config:', {
  has_DATABASE_URL: !!process.env.DATABASE_URL,
  has_PG_SSL_CA: !!process.env.PG_SSL_CA,
  has_PG_SSL_CA_B64: !!process.env.PG_SSL_CA_B64,
  PG_SSL_ALLOW_SELF_SIGNED: process.env.PG_SSL_ALLOW_SELF_SIGNED,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};