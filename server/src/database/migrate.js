/**
 * Run: node src/database/migrate.js
 * Creates all tables in order.
 */
require("dotenv").config();
const mysql = require("mysql2/promise");

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
  await conn.query(`USE \`${process.env.DB_NAME}\``);

  // ── users ─────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
      name        VARCHAR(100) NOT NULL,
      email       VARCHAR(255) NOT NULL UNIQUE,
      phone       VARCHAR(20)  NOT NULL,
      password    VARCHAR(255) NOT NULL,
      role        ENUM('customer','admin') NOT NULL DEFAULT 'customer',
      is_active   TINYINT(1) NOT NULL DEFAULT 1,
      created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // ── service_categories ────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS service_categories (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(100) NOT NULL UNIQUE,
      created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // ── services ──────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS services (
      id           VARCHAR(36)    PRIMARY KEY DEFAULT (UUID()),
      name         VARCHAR(150)   NOT NULL,
      description  TEXT,
      category_id  INT UNSIGNED   NOT NULL,
      duration_min INT UNSIGNED   NOT NULL COMMENT 'duration in minutes',
      price        DECIMAL(10,2)  NOT NULL,
      is_active    TINYINT(1)     NOT NULL DEFAULT 1,
      created_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_service_category FOREIGN KEY (category_id)
        REFERENCES service_categories(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // ── staff ─────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS staff (
      id              VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
      name            VARCHAR(100) NOT NULL,
      email           VARCHAR(255) NOT NULL UNIQUE,
      phone           VARCHAR(20),
      specialization  VARCHAR(200),
      bio             TEXT,
      avatar_url      VARCHAR(500),
      is_active       TINYINT(1)   NOT NULL DEFAULT 1,
      created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // ── staff_services (many-to-many) ─────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS staff_services (
      staff_id    VARCHAR(36) NOT NULL,
      service_id  VARCHAR(36) NOT NULL,
      PRIMARY KEY (staff_id, service_id),
      CONSTRAINT fk_ss_staff   FOREIGN KEY (staff_id)   REFERENCES staff(id)    ON DELETE CASCADE,
      CONSTRAINT fk_ss_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // ── availability ──────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS availability (
      id           VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
      staff_id     VARCHAR(36)  NOT NULL,
      day_of_week  TINYINT UNSIGNED NOT NULL COMMENT '0=Sun,1=Mon,...,6=Sat',
      start_time   TIME         NOT NULL,
      end_time     TIME         NOT NULL,
      is_active    TINYINT(1)   NOT NULL DEFAULT 1,
      created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_avail_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // ── bookings ──────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id                  VARCHAR(36)   PRIMARY KEY DEFAULT (UUID()),
      user_id             VARCHAR(36)   NOT NULL,
      service_id          VARCHAR(36)   NOT NULL,
      staff_id            VARCHAR(36)   NOT NULL,
      booking_date        DATE          NOT NULL,
      start_time          TIME          NOT NULL,
      end_time            TIME          NOT NULL,
      status              ENUM('pending','confirmed','cancelled','completed','no_show')
                          NOT NULL DEFAULT 'pending',
      notes               TEXT,
      -- Payment fields
      payment_status      ENUM('unpaid','pending','paid','refunded') NOT NULL DEFAULT 'unpaid',
      payment_id          VARCHAR(100),
      razorpay_order_id   VARCHAR(100),
      razorpay_signature  VARCHAR(300),
      amount_paid         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      -- Metadata
      cancelled_reason    TEXT,
      cancelled_at        DATETIME,
      created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_booking_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
      CONSTRAINT fk_booking_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
      CONSTRAINT fk_booking_staff   FOREIGN KEY (staff_id)   REFERENCES staff(id)    ON DELETE RESTRICT,
      INDEX idx_booking_date    (booking_date),
      INDEX idx_booking_status  (status),
      INDEX idx_booking_user    (user_id),
      INDEX idx_booking_staff   (staff_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log("✅  All tables created successfully.");
  await conn.end();
}

migrate().catch(err => { console.error(err); process.exit(1); });
