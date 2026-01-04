const db = require("./config/db");

app.get("/db-test", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1");
    res.json({
      status: "SUCCESS",
      message: "Database connected",
      result: rows
    });
  } catch (err) {
    res.status(500).json({
      status: "FAILED",
      error: err.message
    });
  }
});
