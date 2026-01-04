const express = require("express");
const app = express();
const path = require("path");
require("dotenv").config();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ROUTES (THIS WAS MISSING)
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Mount routes
app.use("/", authRoutes);
app.use("/", userRoutes);
app.use("/", adminRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Resort Management Backend is Live 🚀");
});

// Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
