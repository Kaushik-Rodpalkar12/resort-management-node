const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,                     // keep pool small for Supabase free tier
  idleTimeoutMillis: 30000,   // close idle clients after 30s
  connectionTimeoutMillis: 15000 // allow up to 15s to connect
});

pool.on("error", (err) => {
  console.error("Unexpected DB error:", err.message);
});

module.exports = pool;