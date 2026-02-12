const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { ensureUser } = require("../middlewares/auth");


// =====================
// Dashboard Route
// =====================
router.get("/dashboard", ensureUser, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT image_url FROM resorts WHERE image_url IS NOT NULL"
    );

    const images = result.rows.map((r) => r.image_url);

    res.render("dashboard", {
      username: req.session.username,
      resortImages: images,
    });
  } catch (err) {
    console.error("Error loading dashboard:", err);
    res.status(500).send("Dashboard error");
  }
});


// =====================
// View All Resorts
// =====================
router.get("/user/resorts", ensureUser, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM resorts ORDER BY id"
    );

    res.render("userResorts", {
      resorts: result.rows,
      username: req.session.username,
    });
  } catch (err) {
    console.error("Error loading resorts:", err);
    res.status(500).send("Resorts error");
  }
});


// =====================
// Book a Resort
// =====================
router.get("/user/book/:resortName", ensureUser, async (req, res) => {
  const { resortName } = req.params;
  const username = req.session.username;

  try {
    const resort = await pool.query(
      "SELECT * FROM resorts WHERE name = $1",
      [resortName]
    );

    if (resort.rows.length === 0) {
      req.flash("error_msg", "Resort not found");
      return res.redirect("/user/resorts");
    }

    const bookingDate = new Date();
    const price = resort.rows[0].price;

    await pool.query(
      `INSERT INTO bookings 
       (username, resort_name, price, booking_date, status) 
       VALUES ($1, $2, $3, $4, $5)`,
      [username, resortName, price, bookingDate, "Pending"]
    );

    req.flash("success_msg", "Booking successful! Check your bookings.");
    res.redirect("/user/bookings");

  } catch (err) {
    console.error("Booking error:", err);
    req.flash("error_msg", "Booking failed");
    res.redirect("/user/resorts");
  }
});


// =====================
// View User Bookings
// =====================
router.get("/user/bookings", ensureUser, async (req, res) => {
  const username = req.session.username;

  try {
    const result = await pool.query(
      "SELECT * FROM bookings WHERE username = $1 ORDER BY booking_date DESC",
      [username]
    );

    res.render("myBookings", {
      bookings: result.rows,
      username,
    });
  } catch (err) {
    console.error("Error loading bookings:", err);
    res.status(500).send("Bookings error");
  }
});


module.exports = router;
