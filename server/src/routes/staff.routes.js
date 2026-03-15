const express = require("express");
const { body } = require("express-validator");
const { pool } = require("../database/db");
const validate = require("../middleware/validate.middleware");
const { authenticate, requireAdmin } = require("../middleware/auth.middleware");
const R = require("../utils/response");

const router = express.Router();

// GET /api/staff — public list of active staff
router.get("/", async (req, res) => {
  try {
    const { serviceId } = req.query;
    let query = `
      SELECT s.id, s.name, s.specialization, s.bio, s.avatar_url
      FROM staff s WHERE s.is_active = 1`;
    const params = [];
    if (serviceId) {
      query += ` AND EXISTS (
        SELECT 1 FROM staff_services ss WHERE ss.staff_id = s.id AND ss.service_id = ?)`;
      params.push(serviceId);
    }
    query += " ORDER BY s.name";
    const [rows] = await pool.query(query, params);
    return R.success(res, rows);
  } catch (err) {
    return R.serverError(res, err.message);
  }
});

// GET /api/staff/:id/services
router.get("/:id/services", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT sv.id, sv.name, sv.duration_min, sv.price, c.name AS category
      FROM staff_services ss
      JOIN services sv ON sv.id = ss.service_id
      JOIN service_categories c ON c.id = sv.category_id
      WHERE ss.staff_id = ? AND sv.is_active = 1`, [req.params.id]);
    return R.success(res, rows);
  } catch (err) {
    return R.serverError(res, err.message);
  }
});

// POST /api/staff — admin only
router.post("/", authenticate, requireAdmin, [
  body("name").trim().notEmpty().isLength({ min: 2, max: 100 }),
  body("email").trim().isEmail(),
  body("specialization").optional().trim(),
], validate, async (req, res) => {
  try {
    const { name, email, phone, specialization, bio } = req.body;
    const [existing] = await pool.query("SELECT id FROM staff WHERE email = ?", [email]);
    if (existing.length) return R.conflict(res, "Staff email already exists");
    await pool.query(
      "INSERT INTO staff (name, email, phone, specialization, bio) VALUES (?,?,?,?,?)",
      [name, email, phone || null, specialization || null, bio || null]
    );
    return R.created(res, {}, "Staff member added");
  } catch (err) {
    return R.serverError(res, err.message);
  }
});

// PUT /api/staff/:id — admin only
router.put("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, specialization, bio, is_active } = req.body;
    await pool.query(
      `UPDATE staff SET
         name = COALESCE(?, name),
         specialization = COALESCE(?, specialization),
         bio = COALESCE(?, bio),
         is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [name, specialization, bio, is_active, req.params.id]
    );
    return R.success(res, {}, "Staff updated");
  } catch (err) {
    return R.serverError(res, err.message);
  }
});

// POST /api/staff/:id/services — assign service to staff
router.post("/:id/services", authenticate, requireAdmin, async (req, res) => {
  try {
    const { serviceId } = req.body;
    await pool.query(
      "INSERT IGNORE INTO staff_services (staff_id, service_id) VALUES (?,?)",
      [req.params.id, serviceId]
    );
    return R.success(res, {}, "Service assigned to staff");
  } catch (err) {
    return R.serverError(res, err.message);
  }
});

module.exports = router;
