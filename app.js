const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const session = require("express-session");
const bcrypt = require("bcrypt");

dotenv.config();

const app = express();

// =========================
// ADMIN MIDDLEWARE
// =========================
function isAdmin(req, res, next) {
  if (!req.session.userId || req.session.role !== "admin") {
    return res.redirect("/login");
  }
  next();
}

// =========================
// MIDDLEWARES
// =========================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: "resort_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  })
);

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
// ROOT ROUTE
// =========================
app.get("/", (req, res) => {
  res.redirect("/login");
});

// =========================
// REGISTER
// =========================
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.send("All fields required");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (username, password, role) VALUES (?, ?, 'user')",
      [username, hashedPassword]
    );

    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.send("User already exists or error occurred");
  }
});

// =========================
// LOGIN
// =========================
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      return res.send("Invalid username or password");
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.send("Invalid username or password");
    }

    // ✅ SAVE ROLE IN SESSION (CRITICAL FIX)
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;

    // ✅ ADMIN REDIRECT
    if (user.role === "admin") {
      return res.redirect("/admin/dashboard");
    }

    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.send("Login failed");
  }
});

// =========================
// USER DASHBOARD
// =========================
app.get("/dashboard", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  res.render("dashboard", {
    username: req.session.username
  });
});

// =========================
// ADMIN DASHBOARD
// =========================
app.get("/admin/dashboard", isAdmin, (req, res) => {
  res.render("admin_dashboard", {
    username: req.session.username
  });
});

// =========================
// LOGOUT
// =========================
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// =========================
// DB TEST
// =========================
app.get("/db-test", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS result");
    res.json({ status: "SUCCESS", rows });
  } catch (err) {
    res.json({ status: "FAILED", error: err.message });
  }
});

// =========================
// SERVER
// =========================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
