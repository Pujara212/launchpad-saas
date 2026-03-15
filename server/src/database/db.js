const mysql = require("mysql2/promise");
const logger = require("../utils/logger");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bookease",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+00:00",
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    logger.info("✅  MySQL connected successfully");
    conn.release();
  } catch (err) {
    logger.error("❌  MySQL connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
