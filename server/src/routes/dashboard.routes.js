const express = require("express");
const { pool } = require("../database/db");
const { authenticate, requireAdmin } = require("../middleware/auth.middleware");
const R = require("../utils/response");

const router = express.Router();

// GET /api/dashboard — admin stats
router.get("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM bookings");
    const [[{ todayCount }]] = await pool.query(
      "SELECT COUNT(*) AS todayCount FROM bookings WHERE booking_date = ?", [today]
    );
    const [[{ confirmed }]] = await pool.query(
      "SELECT COUNT(*) AS confirmed FROM bookings WHERE status = 'confirmed'"
    );
    const [[{ cancelled }]] = await pool.query(
      "SELECT COUNT(*) AS cancelled FROM bookings WHERE status = 'cancelled'"
    );
    const [[{ revenue }]] = await pool.query(
      "SELECT COALESCE(SUM(amount_paid), 0) AS revenue FROM bookings WHERE payment_status = 'paid'"
    );

    const [topServices] = await pool.query(`
      SELECT sv.name, COUNT(b.id) AS count
      FROM bookings b JOIN services sv ON sv.id = b.service_id
      WHERE b.status != 'cancelled'
      GROUP BY sv.id ORDER BY count DESC LIMIT 5
    `);

    const [staffPerf] = await pool.query(`
      SELECT st.name, COUNT(b.id) AS bookings,
             COALESCE(SUM(b.amount_paid), 0) AS revenue
      FROM bookings b JOIN staff st ON st.id = b.staff_id
      WHERE b.status != 'cancelled'
      GROUP BY st.id ORDER BY bookings DESC
    `);

    const [recent] = await pool.query(`
      SELECT b.id, b.booking_date, b.start_time, b.status, b.payment_status, b.amount_paid,
             u.name AS customer_name, sv.name AS service_name, st.name AS staff_name
      FROM bookings b
      JOIN users u ON u.id = b.user_id
      JOIN services sv ON sv.id = b.service_id
      JOIN staff st ON st.id = b.staff_id
      ORDER BY b.created_at DESC LIMIT 10
    `);

    const [monthlyRevenue] = await pool.query(`
      SELECT DATE_FORMAT(booking_date, '%Y-%m') AS month,
             SUM(amount_paid) AS revenue, COUNT(*) AS bookings
      FROM bookings WHERE payment_status = 'paid'
        AND booking_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month ORDER BY month ASC
    `);

    return R.success(res, {
      stats: { total, todayCount, confirmed, cancelled, revenue },
      topServices, staffPerf, recent, monthlyRevenue,
    });
  } catch (err) {
    return R.serverError(res, err.message);
  }
});

module.exports = router;
