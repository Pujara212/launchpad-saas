const express = require("express");
const { body, query, param } = require("express-validator");
const { pool } = require("../database/db");
const validate = require("../middleware/validate.middleware");
const { authenticate, requireAdmin } = require("../middleware/auth.middleware");
const R = require("../utils/response");

const router = express.Router();

// GET /api/services — list all active services (public)
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.id, s.name, s.description, s.duration_min, s.price,
             c.name AS category
      FROM services s
      JOIN service_categories c ON c.id = s.category_id
      WHERE s.is_active = 1
      ORDER BY c.name, s.name
    `);
    return R.success(res, rows);
  } catch (err) {
    return R.serverError(res, err.message);
  }
});

// GET /api/services/:id
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, c.name AS category
      FROM services s JOIN service_categories c ON c.id = s.category_id
      WHERE s.id = ? AND s.is_active = 1`, [req.params.id]);
    if (!rows.length) return R.notFound(res, "Service not found");
    return R.success(res, rows[0]);
  } catch (err) {
    return R.serverError(res, err.message);
  }
});

// POST /api/services — admin only
router.post("/", authenticate, requireAdmin, [
  body("name").trim().notEmpty().isLength({ max: 150 }),
  body("category_id").isInt({ min: 1 }),
  body("duration_min").isInt({ min: 5 }),
  body("price").isFloat({ min: 0 }),
], validate, async (req, res) => {
  try {
    const { name, description, category_id, duration_min, price } = req.body;
    await pool.query(
      "INSERT INTO services (name, description, category_id, duration_min, price) VALUES (?,?,?,?,?)",
      [name, description || null, category_id, duration_min, price]
    );
    return R.created(res, {}, "Service created");
  } catch (err) {
    return R.serverError(res, err.message);
  }
});

// PUT /api/services/:id — admin only
router.put("/:id", authenticate, requireAdmin, [
  body("name").optional().trim().notEmpty(),
  body("duration_min").optional().isInt({ min: 5 }),
  body("price").optional().isFloat({ min: 0 }),
], validate, async (req, res) => {
  try {
    const { name, description, duration_min, price, is_active } = req.body;
    await pool.query(
      `UPDATE services SET
         name = COALESCE(?, name),
         description = COALESCE(?, description),
         duration_min = COALESCE(?, duration_min),
         price = COALESCE(?, price),
         is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [name, description, duration_min, price, is_active, req.params.id]
    );
    return R.success(res, {}, "Service updated");
  } catch (err) {
    return R.serverError(res, err.message);
  }
});

// DELETE /api/services/:id — admin only
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query("UPDATE services SET is_active = 0 WHERE id = ?", [req.params.id]);
    return R.success(res, {}, "Service deactivated");
  } catch (err) {
    return R.serverError(res, err.message);
  }
});

module.exports = router;
