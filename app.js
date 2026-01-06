const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const session = require("express-session");

dotenv.config();

const app = express();

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
// DATABASE (POSTGRES)
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
    await db.query(
      "INSERT INTO users (username, password, role) VALUES ($1, $2, $3)",
      [username, password, "user"]
    );

    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.send("User already exists");
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
    const result = await db.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.send("Invalid username or password");
    }

    const user = result.rows[0];

    // ✅ SIMPLE PASSWORD CHECK
    if (password !== user.password) {
      return res.send("Invalid username or password");
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;

    // ROLE BASED REDIRECT
    if (user.role === "admin") {
      res.redirect("/admin/dashboard");
    } else {
      res.redirect("/dashboard");
    }

  } catch (err) {
    console.error(err);
    res.send("Login failed");
  }
});

// =========================
// USER DASHBOARD
// =========================
app.get("/dashboard", (req, res) => {
  if (!req.session.userId || req.session.role !== "user") {
    return res.redirect("/login");
  }

  res.render("dashboard", {
    username: req.session.username
  });
});

// =========================
// ADMIN DASHBOARD
// =========================
app.get("/admin/dashboard", (req, res) => {
  if (!req.session.userId || req.session.role !== "admin") {
    return res.redirect("/login");
  }

  res.render("adminDashboard", {
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
    await db.query("SELECT 1");
    res.json({ status: "SUCCESS" });
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
