require("dotenv").config();
const express = require("express");
const db = require("./config/db");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Resort Management System is running 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
