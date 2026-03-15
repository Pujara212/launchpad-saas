const express = require("express");
const { body, query, param } = require("express-validator");
const { pool } = require("../database/db");
const validate = require("../middleware/validate.middleware");
const { authenticate, requireAdmin } = require("../middleware/auth.middleware");
const {
  validateBookingRequest,
  checkDuplicateUserBooking,
} = require("../services/booking.service");
const {
  sendBookingConfirmation,
  sendBookingCancellation,
  sendStatusUpdate,
  sendAdminNewBookingAlert,
} = require("../services/email.service");
const R = require("../utils/response");

const router = express.Router();

// ── GET /api/bookings — admin: all; customer: own ──────
router.get("/", authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const isAdmin = req.user.role === "admin";

    let where = isAdmin ? "1=1" : "b.user_id = ?";
    const params = isAdmin ? [] : [req.user.id];

    if (status) { where += " AND b.status = ?"; params.push(status); }
    if (search) {
      where += " AND (u.name LIKE ? OR u.email LIKE ? OR sv.name LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countParams = [...params];
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM bookings b
       JOIN users u  ON u.id  = b.user_id
       JOIN services sv ON sv.id = b.service_id
       WHERE ${where}`, countParams
    );
    const total = countRows[0].total;

    params.push(parseInt(limit), offset);
    const [rows] = await pool.query(
      `SELECT b.id, b.booking_date, b.start_time, b.end_time,
              b.status, b.payment_status, b.payment_id, b.amount_paid,
              b.notes, b.cancelled_reason, b.created_at,
              u.name  AS customer_name,  u.email AS customer_email,
              u.phone AS customer_phone,
              sv.name AS service_name,  sv.duration_min, sv.price,
              st.name AS staff_name
       FROM bookings b
       JOIN users u    ON u.id    = b.user_id
       JOIN services sv ON sv.id  = b.service_id
       JOIN staff st    ON st.id  = b.staff_id
       WHERE ${where}
       ORDER BY b.booking_date DESC, b.start_time DESC
       LIMIT ? OFFSET ?`, params
    );

    return R.success(res, { bookings: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    return R.serverError(res, err.message);
  }
});

// ── GET /api/bookings/:id ─────────────────────────────
router.get("/:id", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, u.name AS customer_name, u.email AS customer_email,
              u.phone AS customer_phone,
              sv.name AS service_name, sv.duration_min, sv.price,
              st.name AS staff_name
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       JOIN services sv ON sv.id = b.service_id
       JOIN staff st ON st.id = b.staff_id
       WHERE b.id = ?`, [req.params.id]
    );
    if (!rows.length) return R.notFound(res, "Booking not found");
    const b = rows[0];
    // Customer can only see own bookings
    if (req.user.role !== "admin" && b.user_id !== req.user.id) {
      return R.forbidden(res);
    }
    return R.success(res, b);
  } catch (err) {
    return R.serverError(res, err.message);
  }
});

// ── POST /api/bookings — create a booking ────────────
router.post("/", authenticate, [
  body("service_id").notEmpty().withMessage("Service is required"),
  body("staff_id").notEmpty().withMessage("Staff is required"),
  body("booking_date").isDate().withMessage("Valid booking date required (YYYY-MM-DD)"),
  body("start_time").matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage("Valid start time required (HH:MM)"),
  body("notes").optional().trim().isLength({ max: 500 }),
], validate, async (req, res) => {
  try {
    const { service_id, staff_id, booking_date, start_time, notes } = req.body;
    const userId = req.user.id;

    // ── Validation service ─────────────────────────────
    const validation = await validateBookingRequest({ serviceId: service_id, staffId: staff_id, bookingDate: booking_date, startTime: start_time });
    if (!validation.valid) {
      return res.status(validation.code).json({ success: false, message: validation.message });
    }

    // ── Duplicate check ────────────────────────────────
    const isDuplicate = await checkDuplicateUserBooking(userId, booking_date, start_time);
    if (isDuplicate) {
      return R.conflict(res, "You already have a booking at this date and time.");
    }

    const { endTime, price } = validation;

    // Insert booking (pending payment)
    const [result] = await pool.query(
      `INSERT INTO bookings
         (user_id, service_id, staff_id, booking_date, start_time, end_time, status, notes, amount_paid)
       VALUES (?,?,?,?,?,?,'pending',?,?)`,
      [userId, service_id, staff_id, booking_date, start_time, endTime, notes || null, price]
    );

    // Fetch the created booking
    const [created] = await pool.query(
      `SELECT b.*, sv.name AS service_name, sv.price,
              st.name AS staff_name
       FROM bookings b
       JOIN services sv ON sv.id = b.service_id
       JOIN staff st ON st.id = b.staff_id
       WHERE b.id = LAST_INSERT_ID()`,
      []
    );
    // Workaround for UUID: fetch by user + date + time
    const [newBooking] = await pool.query(
      `SELECT b.*, sv.name AS service_name, sv.price,
              st.name AS staff_name
       FROM bookings b
       JOIN services sv ON sv.id = b.service_id
       JOIN staff st ON st.id = b.staff_id
       WHERE b.user_id = ? AND b.booking_date = ? AND b.start_time = ?
       ORDER BY b.created_at DESC LIMIT 1`,
      [userId, booking_date, start_time]
    );

    return R.created(res, newBooking[0], "Booking created. Proceed to payment.");
  } catch (err) {
    return R.serverError(res, err.message);
  }
});

// ── PATCH /api/bookings/:id/status — admin: update status
router.patch("/:id/status", authenticate, requireAdmin, [
  body("status").isIn(["pending","confirmed","cancelled","completed","no_show"]).withMessage("Invalid status"),
  body("cancelled_reason").optional().trim(),
], validate, async (req, res) => {
  try {
    const { status, cancelled_reason } = req.body;
    const [rows] = await pool.query(
      `SELECT b.*, u.name AS customer_name, u.email AS customer_email,
              sv.name AS service_name, st.name AS staff_name
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       JOIN services sv ON sv.id = b.service_id
       JOIN staff st ON st.id = b.staff_id
       WHERE b.id = ?`, [req.params.id]
    );
    if (!rows.length) return R.notFound(res, "Booking not found");
    const booking = rows[0];

    const extra = status === "cancelled"
      ? { cancelled_reason: cancelled_reason || null, cancelled_at: new Date() }
      : {};

    await pool.query(
      `UPDATE bookings SET status = ?, cancelled_reason = ?, cancelled_at = ? WHERE id = ?`,
      [status, extra.cancelled_reason || null, extra.cancelled_at || null, req.params.id]
    );

    // Fire-and-forget emails
    const dateStr = new Date(booking.booking_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    const timeStr = booking.start_time.slice(0, 5);

    if (status === "cancelled") {
      sendBookingCancellation({
        to: booking.customer_email, userName: booking.customer_name,
        service: booking.service_name, staff: booking.staff_name,
        date: dateStr, time: timeStr, reason: cancelled_reason,
      }).catch(() => {});
    } else {
      sendStatusUpdate({
        to: booking.customer_email, userName: booking.customer_name,
        service: booking.service_name, date: dateStr, time: timeStr, newStatus: status,
      }).catch(() => {});
    }

    return R.success(res, {}, `Booking ${status}`);
  } catch (err) {
    return R.serverError(res, err.message);
  }
});

// ── DELETE /api/bookings/:id — customer cancel own booking
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, u.email AS customer_email, u.name AS customer_name,
              sv.name AS service_name, st.name AS staff_name
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       JOIN services sv ON sv.id = b.service_id
       JOIN staff st ON st.id = b.staff_id
       WHERE b.id = ?`, [req.params.id]
    );
    if (!rows.length) return R.notFound(res, "Booking not found");
    const b = rows[0];
    if (req.user.role !== "admin" && b.user_id !== req.user.id) return R.forbidden(res);
    if (b.status === "cancelled") return R.badRequest(res, "Already cancelled");

    await pool.query(
      "UPDATE bookings SET status = 'cancelled', cancelled_at = NOW() WHERE id = ?",
      [req.params.id]
    );

    const dateStr = new Date(b.booking_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    sendBookingCancellation({
      to: b.customer_email, userName: b.customer_name,
      service: b.service_name, staff: b.staff_name,
      date: dateStr, time: b.start_time.slice(0, 5),
    }).catch(() => {});

    return R.success(res, {}, "Booking cancelled");
  } catch (err) {
    return R.serverError(res, err.message);
  }
});

module.exports = router;
