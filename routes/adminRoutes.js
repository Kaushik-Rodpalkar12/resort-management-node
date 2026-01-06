const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function isAdmin(req, res, next) {
  if (!req.session || req.session.role !== "admin") {
    return res.redirect("/login");
  }
  next();
}

/* =========================
   ADMIN DASHBOARD
========================= */
router.get("/dashboard", isAdmin, async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM resorts ORDER BY id DESC"
  );

  res.render("adminDashboard", {
    username: req.session.username,
    resorts: result.rows
  });
});

/* =========================
   ADD RESORT PAGE
========================= */
router.get("/resorts/add", isAdmin, (req, res) => {
  res.render("addResort", { error: null });
});

/* =========================
   ADD RESORT POST
========================= */
router.post("/resorts/add", isAdmin, async (req, res) => {
  const { name, image_url, price, address, contact } = req.body;

  if (!name || !image_url || !price) {
    return res.render("addResort", { error: "All fields required" });
  }

  await pool.query(
    `INSERT INTO resorts (name, image_url, price, address, contact)
     VALUES ($1,$2,$3,$4,$5)`,
    [name, image_url, price, address, contact]
  );

  res.redirect("/admin/dashboard");
});
// VIEW ALL RESORTS (ADMIN)
router.get("/resorts", async (req, res) => {
  if (!req.session.userId || req.session.role !== "admin") {
    return res.redirect("/login");
  }

  try {
    const result = await pool.query(
      "SELECT * FROM resorts ORDER BY id DESC"
    );

    res.render("adminResorts", {
      username: req.session.username,
      resorts: result.rows
    });

  } catch (err) {
    console.error("ADMIN VIEW RESORTS ERROR:", err);
    res.send("Error loading resorts");
  }
});


/* =========================
   DELETE RESORT
========================= */
router.get("/resorts/delete/:id", isAdmin, async (req, res) => {
  await pool.query(
    "DELETE FROM resorts WHERE id = $1",
    [req.params.id]
  );

  res.redirect("/admin/dashboard");
});

module.exports = router;
