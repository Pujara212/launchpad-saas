const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || "587"),
  secure: false,
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

// ── Template helpers ──────────────────────────────────────
function baseTemplate(content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f7fa; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 12px;
                 overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 40px; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px; }
    .body { padding: 32px 40px; color: #374151; font-size: 15px; line-height: 1.6; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .card-row { display: flex; justify-content: space-between; padding: 6px 0;
                border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .card-row:last-child { border-bottom: none; }
    .label { color: #6b7280; font-weight: 500; }
    .value { color: #111827; font-weight: 600; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px;
             font-size: 13px; font-weight: 600; }
    .badge-green { background: #dcfce7; color: #16a34a; }
    .badge-red   { background: #fee2e2; color: #dc2626; }
    .badge-blue  { background: #dbeafe; color: #2563eb; }
    .footer { background: #f8fafc; padding: 20px 40px; text-align: center;
              color: #9ca3af; font-size: 13px; border-top: 1px solid #e2e8f0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6);
           color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px;
           font-weight: 600; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ BookEase</h1>
      <p>Your premium booking platform</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">© ${new Date().getFullYear()} BookEase · All rights reserved</div>
  </div>
</body>
</html>`;
}

// ── Email senders ─────────────────────────────────────────

async function sendBookingConfirmation({ to, userName, service, staff, date, time, amount, bookingId }) {
  const html = baseTemplate(`
    <p>Hello <strong>${userName}</strong>,</p>
    <p>🎉 Your appointment has been <span class="badge badge-green">Confirmed</span></p>
    <div class="card">
      <div class="card-row"><span class="label">Booking ID</span><span class="value">#${bookingId.slice(0,8).toUpperCase()}</span></div>
      <div class="card-row"><span class="label">Service</span><span class="value">${service}</span></div>
      <div class="card-row"><span class="label">Staff</span><span class="value">${staff}</span></div>
      <div class="card-row"><span class="label">Date</span><span class="value">${date}</span></div>
      <div class="card-row"><span class="label">Time</span><span class="value">${time}</span></div>
      <div class="card-row"><span class="label">Amount Paid</span><span class="value">₹${amount}</span></div>
    </div>
    <p>Please arrive 5 minutes early. We look forward to serving you!</p>
  `);
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: "✅ Booking Confirmed — BookEase",
    html,
  });
  logger.info(`Confirmation email sent to ${to}`);
}

async function sendBookingCancellation({ to, userName, service, staff, date, time, reason }) {
  const html = baseTemplate(`
    <p>Hello <strong>${userName}</strong>,</p>
    <p>Your booking has been <span class="badge badge-red">Cancelled</span></p>
    <div class="card">
      <div class="card-row"><span class="label">Service</span><span class="value">${service}</span></div>
      <div class="card-row"><span class="label">Staff</span><span class="value">${staff}</span></div>
      <div class="card-row"><span class="label">Date</span><span class="value">${date}</span></div>
      <div class="card-row"><span class="label">Time</span><span class="value">${time}</span></div>
      ${reason ? `<div class="card-row"><span class="label">Reason</span><span class="value">${reason}</span></div>` : ""}
    </div>
    <p>If this was unexpected, please contact us or book a new appointment.</p>
  `);
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: "❌ Booking Cancelled — BookEase",
    html,
  });
  logger.info(`Cancellation email sent to ${to}`);
}

async function sendStatusUpdate({ to, userName, service, date, time, newStatus }) {
  const statusText = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
  const badgeClass = newStatus === "completed" ? "badge-green" : "badge-blue";
  const html = baseTemplate(`
    <p>Hello <strong>${userName}</strong>,</p>
    <p>Your booking status has been updated to <span class="badge ${badgeClass}">${statusText}</span></p>
    <div class="card">
      <div class="card-row"><span class="label">Service</span><span class="value">${service}</span></div>
      <div class="card-row"><span class="label">Date</span><span class="value">${date}</span></div>
      <div class="card-row"><span class="label">Time</span><span class="value">${time}</span></div>
    </div>
  `);
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: `📋 Booking Status Updated: ${statusText} — BookEase`,
    html,
  });
}

async function sendAdminNewBookingAlert({ service, userName, userEmail, userPhone, staff, date, time, amount }) {
  const html = baseTemplate(`
    <p>🔔 A new booking has been received on <strong>BookEase</strong>.</p>
    <div class="card">
      <div class="card-row"><span class="label">Customer</span><span class="value">${userName}</span></div>
      <div class="card-row"><span class="label">Email</span><span class="value">${userEmail}</span></div>
      <div class="card-row"><span class="label">Phone</span><span class="value">${userPhone}</span></div>
      <div class="card-row"><span class="label">Service</span><span class="value">${service}</span></div>
      <div class="card-row"><span class="label">Staff</span><span class="value">${staff}</span></div>
      <div class="card-row"><span class="label">Date</span><span class="value">${date}</span></div>
      <div class="card-row"><span class="label">Time</span><span class="value">${time}</span></div>
      <div class="card-row"><span class="label">Amount</span><span class="value">₹${amount}</span></div>
    </div>
  `);
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: process.env.ADMIN_EMAIL,
    subject: "🆕 New Booking Received — BookEase Admin",
    html,
  });
  logger.info("Admin alert email sent for new booking");
}

module.exports = {
  sendBookingConfirmation,
  sendBookingCancellation,
  sendStatusUpdate,
  sendAdminNewBookingAlert,
};
