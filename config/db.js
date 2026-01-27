const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // ✅ required for Supabase
  },
  // Optional: keep connections short-lived for pooler stability
  max: 5,              // limit concurrent connections
  idleTimeoutMillis: 30000, // close idle clients after 30s
  connectionTimeoutMillis: 10000 // fail fast if DB is unreachable
});

module.exports = pool;