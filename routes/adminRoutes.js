const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ADMIN AUTH MIDDLEWARE
function isAdmin(req, res, next) {
  if (!req.session.userId || req.session.role !== "admin") {
    return res.redirect("/login");
  }
  next();
}

// ADD RESORT PAGE
router.get("/admin/resorts/add", isAdmin, (req, res) => {
  res.render("addResort");
});

// ADD RESORT (POST)
router.post("/admin/resorts/add", isAdmin, async (req, res) => {
  const { name, description, price, address, contact, image_url } = req.body;

  try {
    await db.query(
      `INSERT INTO resorts (name, description, price, address, contact, image_url)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [name, description, price, address, contact, image_url]
    );

    res.redirect("/admin/resorts");
  } catch (err) {
    console.error(err);
    res.send("Error adding resort");
  }
});

// VIEW RESORTS (ADMIN)
router.get("/admin/resorts", isAdmin, async (req, res) => {
  const result = await db.query("SELECT * FROM resorts ORDER BY id DESC");
  res.render("adminResorts", { resorts: result.rows });
});

// DELETE RESORT
router.get("/admin/resorts/delete/:id", isAdmin, async (req, res) => {
  await db.query("DELETE FROM resorts WHERE id=$1", [req.params.id]);
  res.redirect("/admin/resorts");
});

module.exports = router;
