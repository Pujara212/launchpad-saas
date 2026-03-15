/**
 * Run: node src/database/seed.js
 * Seeds initial categories, services, staff, availability, and admin user.
 */
require("dotenv").config();
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  // Categories
  await conn.query(`INSERT IGNORE INTO service_categories (name) VALUES
    ('Hair'), ('Skin'), ('Nails'), ('Massage'), ('Beauty')`);

  const [cats] = await conn.query("SELECT id, name FROM service_categories");
  const catMap = Object.fromEntries(cats.map(c => [c.name, c.id]));

  // Services
  const services = [
    { id: uuidv4(), name: "Haircut & Styling", category: "Hair", duration_min: 45, price: 500.00 },
    { id: uuidv4(), name: "Hair Coloring", category: "Hair", duration_min: 120, price: 2500.00 },
    { id: uuidv4(), name: "Facial Treatment", category: "Skin", duration_min: 60, price: 1200.00 },
    { id: uuidv4(), name: "Manicure", category: "Nails", duration_min: 30, price: 400.00 },
    { id: uuidv4(), name: "Swedish Massage", category: "Massage", duration_min: 60, price: 1800.00 },
    { id: uuidv4(), name: "Bridal Makeup", category: "Beauty", duration_min: 180, price: 8000.00 },
  ];

  for (const s of services) {
    await conn.query(
      `INSERT IGNORE INTO services (id, name, category_id, duration_min, price) VALUES (?,?,?,?,?)`,
      [s.id, s.name, catMap[s.category], s.duration_min, s.price]
    );
  }
  const [dbServices] = await conn.query("SELECT id, name FROM services");

  // Staff
  const staffList = [
    { id: uuidv4(), name: "Priya Sharma",   email: "priya@bookease.com",   specialization: "Hair Specialist" },
    { id: uuidv4(), name: "Rahul Mehta",    email: "rahul@bookease.com",    specialization: "Skin & Massage Expert" },
    { id: uuidv4(), name: "Ananya Singh",   email: "ananya@bookease.com",   specialization: "Nail Artist" },
    { id: uuidv4(), name: "Vikram Nair",    email: "vikram@bookease.com",   specialization: "Makeup Artist" },
  ];

  for (const s of staffList) {
    await conn.query(
      `INSERT IGNORE INTO staff (id, name, email, specialization) VALUES (?,?,?,?)`,
      [s.id, s.name, s.email, s.specialization]
    );
  }
  const [dbStaff] = await conn.query("SELECT id, name FROM staff");

  // Assign all services to all staff
  for (const st of dbStaff) {
    for (const sv of dbServices) {
      await conn.query(
        `INSERT IGNORE INTO staff_services (staff_id, service_id) VALUES (?,?)`,
        [st.id, sv.id]
      );
    }
  }

  // Availability: Mon–Sat 09:00–18:00 for each staff
  const days = [1, 2, 3, 4, 5, 6];
  for (const st of dbStaff) {
    for (const day of days) {
      await conn.query(
        `INSERT IGNORE INTO availability (id, staff_id, day_of_week, start_time, end_time)
         VALUES (?, ?, ?, '09:00:00', '18:00:00')`,
        [uuidv4(), st.id, day]
      );
    }
  }

  // Admin user
  const adminPass = await bcrypt.hash("Admin@123", 12);
  await conn.query(
    `INSERT IGNORE INTO users (id, name, email, phone, password, role) VALUES (?,?,?,?,?,?)`,
    [uuidv4(), "Admin User", "admin@bookease.com", "+91 9000000000", adminPass, "admin"]
  );

  console.log("✅  Database seeded successfully.");
  console.log("    Admin: admin@bookease.com / Admin@123");
  await conn.end();
}

seed().catch(err => { console.error(err); process.exit(1); });
