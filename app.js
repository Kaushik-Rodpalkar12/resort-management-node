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

// Session store with fallback if DB is slow/unreachable
let store;
try {
  store = new pgSession({ pool, tableName: "session" });
} catch (err) {
  console.error("Session store init failed, using memory:", err.message);
  store = undefined;
}

app.use(
  session({
    store,
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

    let resorts = [];
    try {
      const resultPromise = pool.query("SELECT * FROM resorts ORDER BY id");
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DB timeout")), 15000)
      );
      const result = await Promise.race([resultPromise, timeoutPromise]);
      resorts = result.rows || [];
    } catch (dbErr) {
      console.error("Homepage DB query failed:", dbErr.message);
    }

    res.render("home", {
      resorts,
      username: null,
      error_msg: resorts.length === 0 ? "Resorts unavailable right now." : null
    });
  } catch (err) {
    console.error("Error loading homepage:", err.message);
    res.status(500).send("Error loading homepage");
  }
});

/* BOOKINGS PAGE – resilient query */
app.get("/bookings", async (req, res) => {
  try {
    let bookings = [];
    try {
      const resultPromise = pool.query("SELECT * FROM bookings ORDER BY id DESC");
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DB timeout")), 15000)
      );
      const result = await Promise.race([resultPromise, timeoutPromise]);
      bookings = result.rows || [];
    } catch (dbErr) {
      console.error("Bookings query failed:", dbErr.message);
    }

    res.render("bookings", {
      bookings,
      error_msg: bookings.length === 0 ? "Bookings unavailable right now." : null
    });
  } catch (err) {
    console.error("Error loading bookings:", err.message);
    res.status(500).send("Error loading bookings");
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
  } catch (err) {
    console.error("Healthcheck failed:", err.message);
    res.status(500).send("❌ DB connection failed: " + err.message);
  }
});

/* SERVER */
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log("✅ Server running on port", PORT)
);