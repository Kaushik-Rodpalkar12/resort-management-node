const express = require("express");
const router = express.Router();

// Dashboard
router.get("/dashboard", (req, res) => {
  res.render("dashboard");
});

module.exports = router;
