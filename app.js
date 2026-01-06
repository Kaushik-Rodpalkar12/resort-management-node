const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");
const adminRoutes = require("./routes/adminRoutes");
dotenv.config();
const app = express();

/* =========================
   DATABASE (SUPABASE)
========================= */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/* =========================
   MIDDLEWARES
========================= */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    store: new pgSession({
      pool: pool,
      tableName: "session"
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  })
);
app.use("/", adminRoutes);
/* =========================
   VIEW ENGINE
========================= */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* =========================
   ROOT
========================= */
app.get("/", (req, res) => res.redirect("/login"));

/* =========================
   REGISTER
========================= */
app.get("/register", (req, res) => {
  res.render("register", { error: null });
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render("register", { error: "All fields required" });
  }

  try {
    const existing = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );

    if (existing.rows.length > 0) {
      return res.render("register", { error: "Username already exists" });
    }

    await pool.query(
      "INSERT INTO users (username, password, role) VALUES ($1, $2, $3)",
      [username, password, "user"]
    );

    res.redirect("/login");
  } catch (err) {
    console.error("REGISTER ERROR:", err.message);
    res.render("register", { error: "Server error" });
  }
});

/* =========================
   LOGIN
========================= */
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.render("login", { error: "Invalid credentials" });
    }

    const user = result.rows[0];

    if (password !== user.password) {
      return res.render("login", { error: "Invalid credentials" });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;

    user.role === "admin"
      ? res.redirect("/admin/dashboard")
      : res.redirect("/dashboard");

  } catch (err) {
    console.error("LOGIN ERROR:", err.message);
    res.render("login", { error: "Login failed" });
  }
});

/* =========================
   DASHBOARDS
========================= */
app.get("/dashboard", (req, res) => {
  if (!req.session.userId || req.session.role !== "user") {
    return res.redirect("/login");
  }
  res.render("dashboard", { username: req.session.username });
});

app.get("/admin/dashboard", (req, res) => {
  if (!req.session.userId || req.session.role !== "admin") {
    return res.redirect("/login");
  }
  res.render("adminDashboard", { username: req.session.username });
});
app.get("/resorts", async (req, res) => {
  const result = await db.query("SELECT * FROM resorts ORDER BY id DESC");
  res.render("userResorts", { resorts: result.rows });
});

/* =========================
   LOGOUT
========================= */
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

/* =========================
   DB TEST
========================= */
app.get("/db-test", async (req, res) => {
  try {
    const r = await pool.query("SELECT NOW()");
    res.json({ status: "OK", time: r.rows[0] });
  } catch (err) {
    res.json({ status: "FAILED", error: err.message });
  }
});

/* =========================
   SERVER
========================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on ${PORT}`));
