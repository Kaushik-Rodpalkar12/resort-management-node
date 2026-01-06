const express = require("express");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// =========================
// MIDDLEWARES
// =========================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// =========================
// VIEW ENGINE
// =========================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// =========================
// DATABASE
// =========================
const db = require("./config/db");

// =========================
// ROUTES
// =========================

// HOME
app.get("/", (req, res) => {
  res.send("Resort Management System Backend is Live ✅");
});

// LOGIN PAGE
app.get("/login", (req, res) => {
  res.render("login");
});

// REGISTER PAGE
app.get("/register", (req, res) => {
  res.render("register");
});

// REGISTER POST
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.send("Username and Password required ❌");
  }

  try {
    const sql = "INSERT INTO users (username, password) VALUES (?, ?)";
    await db.query(sql, [username, password]);

    res.send("User registered successfully ✅");
  } catch (err) {
    console.error(err);
    res.status(500).send("Registration failed ❌");
  }
});

// LOGIN POST (OPTIONAL BASIC)
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE username = ? AND password = ?",
      [username, password]
    );

    if (rows.length > 0) {
      res.send("Login successful ✅");
    } else {
      res.send("Invalid credentials ❌");
    }
  } catch (err) {
    res.status(500).send("Login error ❌");
  }
});

// =========================
// DB TEST
// =========================
app.get("/db-test", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS result");
    res.json({ status: "SUCCESS", rows });
  } catch (err) {
    res.status(500).json({ status: "FAILED", error: err.message });
  }
});

// =========================
// SERVER
// =========================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
