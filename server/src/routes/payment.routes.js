const express = require("express");
const { body } = require("express-validator");
const { pool } = require("../database/db");
const validate = require("../middleware/validate.middleware");
const { authenticate } = require("../middleware/auth.middleware");
const { createOrder, verifySignature } = require("../services/razorpay.service");
const {
  sendBookingConfirmation,
  sendAdminNewBookingAlert,
} = require("../services/email.service");
const R = require("../utils/response");

const router = express.Router();

// POST /api/payment/create-order
router.post("/create-order", authenticate, [
  body("booking_id").notEmpty().withMessage("booking_id required"),
], validate, async (req, res) => {
  try {
    const { booking_id } = req.body;
    const [rows] = await pool.query(
      "SELECT * FROM bookings WHERE id = ? AND user_id = ?",
      [booking_id, req.user.id]
    );
    if (!rows.length) return R.notFound(res, "Booking not found");
    const booking = rows[0];
    if (booking.payment_status === "paid") return R.conflict(res, "Already paid");

    const amountPaise = Math.round(parseFloat(booking.amount_paid) * 100);
    const order = await createOrder(booking_id, amountPaise);

    return R.success(res, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    return R.serverError(res, err.message);
  }
});

// POST /api/payment/verify
router.post("/verify", authenticate, [
  body("booking_id").notEmpty(),
  body("razorpay_payment_id").notEmpty(),
  body("razorpay_order_id").notEmpty(),
  body("razorpay_signature").notEmpty(),
], validate, async (req, res) => {
  try {
    const { booking_id, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) return R.badRequest(res, "Payment verification failed. Invalid signature.");

    // Update booking
    await pool.query(
      `UPDATE bookings SET
         status = 'confirmed',
         payment_status = 'paid',
         payment_id = ?,
         razorpay_order_id = ?,
         razorpay_signature = ?
       WHERE id = ? AND user_id = ?`,
      [razorpay_payment_id, razorpay_order_id, razorpay_signature, booking_id, req.user.id]
    );

    // Fetch full booking for emails
    const [rows] = await pool.query(
      `SELECT b.*, u.name AS customer_name, u.email AS customer_email,
              u.phone AS customer_phone,
              sv.name AS service_name, st.name AS staff_name
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       JOIN services sv ON sv.id = b.service_id
       JOIN staff st ON st.id = b.staff_id
       WHERE b.id = ?`, [booking_id]
    );
    const bk = rows[0];
    const dateStr = new Date(bk.booking_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    const timeStr = bk.start_time.slice(0, 5);

    // Send emails (non-blocking)
    sendBookingConfirmation({
      to: bk.customer_email, userName: bk.customer_name,
      service: bk.service_name, staff: bk.staff_name,
      date: dateStr, time: timeStr, amount: bk.amount_paid, bookingId: bk.id,
    }).catch(() => {});

    sendAdminNewBookingAlert({
      service: bk.service_name, userName: bk.customer_name,
      userEmail: bk.customer_email, userPhone: bk.customer_phone,
      staff: bk.staff_name, date: dateStr, time: timeStr, amount: bk.amount_paid,
    }).catch(() => {});

    return R.success(res, { bookingId: booking_id, status: "confirmed" }, "Payment verified and booking confirmed!");
  } catch (err) {
    return R.serverError(res, err.message);
  }
});

module.exports = router;
