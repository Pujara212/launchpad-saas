const express = require("express");
const { body } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../database/db");
const validate = require("../middleware/validate.middleware");
const { authenticate } = require("../middleware/auth.middleware");
const R = require("../utils/response");

const router = express.Router();

// ── Register ──────────────────────────────────────────────
router.post("/register", [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2, max: 100 }),
  body("email").trim().isEmail().withMessage("Valid email required").normalizeEmail(),
  body("phone").trim().matches(/^[+]?[\d\s\-().]{7,15}$/).withMessage("Valid phone required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
], validate, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length) return R.conflict(res, "Email already registered");

    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, phone, password) VALUES (?,?,?,?)",
      [name, email, phone, hash]
    );
    const [user] = await pool.query(
      "SELECT id, name, email, phone, role FROM users WHERE id = LAST_INSERT_ID()",
      []
    );
    // Fetch by email instead (UUID primary keys don't use LAST_INSERT_ID)
    const [u] = await pool.query("SELECT id, name, email, phone, role FROM users WHERE email = ?", [email]);
    const token = jwt.sign({ id: u[0].id, role: u[0].role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
    return R.created(res, { user: u[0], token }, "Registration successful");
  } catch (err) {
    return R.serverError(res, err.message);
  }
});

// ── Login ─────────────────────────────────────────────────
router.post("/login", [
  body("email").trim().isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password required"),
], validate, async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ? AND is_active = 1", [email]);
    if (!rows.length) return R.unauthorized(res, "Invalid credentials");

    const ok = await bcrypt.compare(password, rows[0].password);
    if (!ok) return R.unauthorized(res, "Invalid credentials");

    const user = rows[0];
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
    const { password: _pw, ...safe } = user;
    return R.success(res, { user: safe, token }, "Login successful");
  } catch (err) {
    return R.serverError(res, err.message);
  }
});

// ── Me ────────────────────────────────────────────────────
router.get("/me", authenticate, async (req, res) => {
  return R.success(res, { user: req.user });
});

module.exports = router;
