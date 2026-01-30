const bcrypt = require("bcrypt");

// LOGIN
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE username=$1", [username]);

    if (result.rows.length === 0) {
      req.flash("error_msg", "Invalid credentials");
      return res.redirect("/login");
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      req.flash("error_msg", "Invalid credentials");
      return res.redirect("/login");
    }

    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.username = user.username;

    req.flash("success_msg", "Login successful!");
    user.role === "admin"
      ? res.redirect("/admin/dashboard")
      : res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Server error");
    res.redirect("/login");
  }
});

// REGISTER
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const exists = await pool.query("SELECT id FROM users WHERE username=$1", [username]);

    if (exists.rows.length > 0) {
      req.flash("error_msg", "User already exists");
      return res.redirect("/register");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (username, password, role) VALUES ($1, $2, 'user')",
      [username, hashedPassword]
    );

    req.flash("success_msg", "Registration successful! Please login.");
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Server error");
    res.redirect("/register");
  }
});