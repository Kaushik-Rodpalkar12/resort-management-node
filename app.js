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
const authRoutes = require("./routes/authRoutes");

// ⚠️ VERY IMPORTANT: use routes like this
app.use("/", authRoutes);

// =========================
// HEALTH CHECK
// =========================
app.get("/health", (req, res) => {
  res.send("Server is healthy 🚀");
});

// =========================
// DATABASE TEST ROUTE
// =========================
app.get("/db-test", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1");
    res.json({
      status: "SUCCESS",
      message: "Database connected successfully",
      result: rows
    });
  } catch (err) {
    res.status(500).json({
      status: "FAILED",
      error: err.message
    });
  }
});

// =========================
// HOME ROUTE (OPTIONAL)
// =========================
app.get("/", (req, res) => {
  res.send("Resort Management System Backend is Live ✅");
});

// =========================
// SERVER
// =========================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
