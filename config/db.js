const { Pool } = require("pg");

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },   // required for Supabase/Render
  max: 5,                               // keep pool small for free tier
  idleTimeoutMillis: 30000,             // close idle connections after 30s
  connectionTimeoutMillis: 20000        // fail if connection takes >20s
});

// Handle unexpected errors gracefully
pool.on("error", (err) => {
  console.error("Unexpected DB error:", err.message);
});

module.exports = pool;