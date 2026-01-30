const express = require("express");
const router = express.Router();
const pool = require("../config/db");

/* LOGIN */
router.get("/login", (req, res) => {
  res.render("login", {
    error_msg: req.flash("error_msg"),
    success_msg: req.flash("success_msg")
  });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE username=$1", [username]);

    if (result.rows.length === 0) {
      req.flash("error_msg", "Invalid credentials");
      return res.redirect("/login");
    }

    const user = result.rows[0];

    if (password !== user.password) {
      req.flash("error_msg", "Invalid credentials");
      return res.redirect("/login");
    }

    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration failed:", err.message);
        req.flash("error_msg", "Session error");
        return res.redirect("/login");
      }

      req.session.userId = user.id;
      req.session.role = user.role;
      req.session.username = user.username;

      req.flash("success_msg", "Login successful!");
      if (user.role === "admin") {
        return res.redirect("/admin/dashboard");
      } else {
        return res.redirect("/dashboard");
      }
    });
  } catch (err) {
    console.error("Login error:", err.message);
    req.flash("error_msg", "Server error");
    res.redirect("/login");
  }
});

/* REGISTER */
router.get("/register", (req, res) => {
  res.render("register", {
    error_msg: req.flash("error_msg"),
    success_msg: req.flash("success_msg")
  });
});

router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const exists = await pool.query("SELECT id FROM users WHERE username=$1", [username]);

    if (exists.rows.length > 0) {
      req.flash("error_msg", "User already exists");
      return res.redirect("/register");
    }

    await pool.query(
      "INSERT INTO users (username, password, role) VALUES ($1, $2, 'user')",
      [username, password]
    );

    req.flash("success_msg", "Registration successful! Please login.");
    res.redirect("/login");
  } catch (err) {
    console.error("Register error:", err.message);
    req.flash("error_msg", "Server error");
    res.redirect("/register");
  }
});

module.exports = router;