require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { testConnection } = require("./database/db");
const logger = require("./utils/logger");

// ── Routes ────────────────────────────────────────────────
const authRoutes = require("./routes/auth.routes");
const serviceRoutes = require("./routes/service.routes");
const staffRoutes = require("./routes/staff.routes");
const availabilityRoutes = require("./routes/availability.routes");
const bookingRoutes = require("./routes/booking.routes");
const paymentRoutes = require("./routes/payment.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Global Middlewares ────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:8080",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global rate limiter
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
  max: parseInt(process.env.RATE_LIMIT_MAX || "100"),
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use("/api/", limiter);

// Booking-specific stricter rate limiter
const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { success: false, message: "Too many booking attempts. Wait a minute." },
});

// ── Request Logger ────────────────────────────────────────
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ── Mount Routes ──────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/bookings", bookingLimiter, bookingRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// ── 404 Handler ───────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found" }));

// ── Global Error Handler ──────────────────────────────────
app.use((err, _req, res, _next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ── Start ─────────────────────────────────────────────────
async function start() {
  await testConnection();
  app.listen(PORT, () => logger.info(`🚀  BookEase API running on http://localhost:${PORT}`));
}
start();
