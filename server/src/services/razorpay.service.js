const Razorpay = require("razorpay");
const crypto = require("crypto");
const { pool } = require("../database/db");
const logger = require("../utils/logger");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/** Create a Razorpay order for a booking */
async function createOrder(bookingId, amountInPaise) {
  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `booking_${bookingId.slice(0, 8)}`,
    notes: { booking_id: bookingId },
  });
  // Store order id against booking
  await pool.query(
    "UPDATE bookings SET razorpay_order_id = ?, payment_status = 'pending' WHERE id = ?",
    [order.id, bookingId]
  );
  logger.info(`Razorpay order created: ${order.id} for booking ${bookingId}`);
  return order;
}

/** Verify Razorpay payment signature */
function verifySignature(orderId, paymentId, signature) {
  const body = orderId + "|" + paymentId;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  return expected === signature;
}

module.exports = { createOrder, verifySignature };
