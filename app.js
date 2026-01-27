const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const flash = require("connect-flash");

dotenv.config();
const app = express();

const pool = require("./config/db");

/* MIDDLEWARE */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    store: new pgSession({
      pool,
      tableName: "session"
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 2 // 2 hours
    }
  })
);

// Flash messages
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg")[0] || null;
  res.locals.error_msg = req.flash("error_msg")[0] || null;
  res.locals.username = req.session.username || null;
  next();
});

/* VIEW ENGINE */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* ROUTES */
app.use(require("./routes/authRoutes"));
app.use(require("./routes/userRoutes"));
app.use(require("./routes/adminRoutes"));

/* ROOT – Redirect based on role or show homepage */
app.get("/", async (req, res) => {
  try {
    if (req.session.role === "admin") return res.redirect("/admin/dashboard");
    if (req.session.role === "user") return res.redirect("/dashboard");

    // Add timeout fallback for slow DB
    const resultPromise = pool.query("SELECT * FROM resorts ORDER BY id");
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("DB timeout")), 3000)
    );

    const result = await Promise.race([resultPromise, timeoutPromise]);

    res.render("home", {
      resorts: result.rows || [],
      username: null
    });
  } catch (err) {
    console.error("Error loading homepage:", err);
    res.render("home", {
      resorts: [],
      username: null,
      error_msg: "Unable to load resorts. Please try again later."
    });
  }
});

/* LOGOUT */
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

/* HEALTHCHECK */
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.send("✅ DB connected");
  } catch {
    res.status(500).send("❌ DB connection failed");
  }
});

/* SERVER */
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log("✅ Server running on port", PORT)
);