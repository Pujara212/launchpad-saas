const express = require("express");
const { body, query } = require("express-validator");
const { pool } = require("../database/db");
const validate = require("../middleware/validate.middleware");
const { authenticate, requireAdmin } = require("../middleware/auth.middleware");
const { getAvailableSlots } = require("../services/booking.service");
const R = require("../utils/response");

const router = express.Router();

// GET /api/availability/slots?staffId=&serviceId=&date=
router.get("/slots", [
  query("staffId").notEmpty().withMessage("staffId required"),
  query("serviceId").notEmpty().withMessage("serviceId required"),
  query("date").isDate().withMessage("Valid date required (YYYY-MM-DD)"),
], validate, async (req, res) => {
  try {
    const { staffId, serviceId, date } = req.query;
    const today = new Date().toISOString().slice(0, 10);
    if (date < today) return R.badRequest(res, "Cannot query slots for past dates");
    const slots = await getAvailableSlots(staffId, serviceId, date);
    return R.success(res, { date, slots });
  } catch (err) {
    return R.serverError(res, err.message);
  }
});

// GET /api/availability — admin: all windows
router.get("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, s.name AS staff_name
      FROM availability a
      JOIN staff s ON s.id = a.staff_id
      WHERE a.is_active = 1
      ORDER BY s.name, a.day_of_week, a.start_time
    `);
    return R.success(res, rows);
  } catch (err) {
    return R.serverError(res, err.message);
  }
});

// POST /api/availability — admin: add availability window
router.post("/", authenticate, requireAdmin, [
  body("staff_id").notEmpty(),
  body("day_of_week").isInt({ min: 0, max: 6 }),
  body("start_time").matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage("HH:MM format"),
  body("end_time").matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage("HH:MM format"),
], validate, async (req, res) => {
  try {
    const { staff_id, day_of_week, start_time, end_time } = req.body;
    if (start_time >= end_time) return R.badRequest(res, "end_time must be after start_time");
    await pool.query(
      "INSERT INTO availability (staff_id, day_of_week, start_time, end_time) VALUES (?,?,?,?)",
      [staff_id, day_of_week, start_time, end_time]
    );
    return R.created(res, {}, "Availability window added");
  } catch (err) {
    return R.serverError(res, err.message);
  }
});

// DELETE /api/availability/:id — admin
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query("UPDATE availability SET is_active = 0 WHERE id = ?", [req.params.id]);
    return R.success(res, {}, "Availability window removed");
  } catch (err) {
    return R.serverError(res, err.message);
  }
});

module.exports = router;
