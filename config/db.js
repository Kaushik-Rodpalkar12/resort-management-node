const mysql = require("mysql2");

const db = mysql.createPool(process.env.MYSQL_PUBLIC_URL);

db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Connected to Railway MySQL Database");
    connection.release();
  }
});

module.exports = db;
