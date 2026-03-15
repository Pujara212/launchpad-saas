const jwt = require("jsonwebtoken");
const { pool } = require("../database/db");
const { unauthorized, forbidden } = require("../utils/response");

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return unauthorized(res, "No token provided");
  }
  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query(
      "SELECT id, name, email, role, is_active FROM users WHERE id = ?",
      [decoded.id]
    );
    if (!rows.length || !rows[0].is_active) return unauthorized(res, "User not found or inactive");
    req.user = rows[0];
    next();
  } catch {
    return unauthorized(res, "Invalid or expired token");
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return forbidden(res, "Admin access required");
  next();
}

module.exports = { authenticate, requireAdmin };
