const { pool } = require("../database/db");

/**
 * Core booking validation — all rules in one place.
 * Returns { valid: boolean, code: number, message: string }
 */
async function validateBookingRequest({ serviceId, staffId, bookingDate, startTime }) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // ── Rule 1 & 2: Date must be today or future ──────────
  if (bookingDate < todayStr) {
    return { valid: false, code: 400, message: "Booking cannot be in the past." };
  }

  // ── Rule 3: If today, time must be > now + 30 min ─────
  if (bookingDate === todayStr) {
    const slotDt = new Date(`${bookingDate}T${startTime}`);
    const buffer = new Date(now.getTime() + 30 * 60 * 1000);
    if (slotDt <= buffer) {
      return { valid: false, code: 400, message: "Please select a slot at least 30 minutes from now." };
    }
  }

  // ── Rule 7: Staff must provide the service ────────────
  const [svcRows] = await pool.query(
    `SELECT ss.staff_id FROM staff_services ss WHERE ss.staff_id = ? AND ss.service_id = ?`,
    [staffId, serviceId]
  );
  if (!svcRows.length) {
    return { valid: false, code: 400, message: "Service is not available for the selected staff member." };
  }

  // ── Fetch service duration ─────────────────────────────
  const [svcInfo] = await pool.query(
    "SELECT duration_min, price FROM services WHERE id = ? AND is_active = 1",
    [serviceId]
  );
  if (!svcInfo.length) {
    return { valid: false, code: 404, message: "Service not found or inactive." };
  }
  const { duration_min, price } = svcInfo[0];

  // Compute end time
  const [h, m] = startTime.split(":").map(Number);
  const endDate = new Date(2000, 0, 1, h, m + duration_min);
  const endTime = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}:00`;
  const startTimeFull = `${startTime.length === 5 ? startTime + ":00" : startTime}`;

  // ── Rule 4: Slot must fall within staff availability ──
  const dayOfWeek = new Date(`${bookingDate}T00:00:00`).getDay(); // 0=Sun
  const [availRows] = await pool.query(
    `SELECT * FROM availability
     WHERE staff_id = ? AND day_of_week = ? AND is_active = 1
       AND start_time <= ? AND end_time >= ?`,
    [staffId, dayOfWeek, startTimeFull, endTime]
  );
  if (!availRows.length) {
    return { valid: false, code: 400, message: "Staff is not available during the selected time slot." };
  }

  // ── Rule 5: Prevent overlapping bookings for same staff
  const [overlapRows] = await pool.query(
    `SELECT id FROM bookings
     WHERE staff_id = ? AND booking_date = ?
       AND status NOT IN ('cancelled')
       AND start_time < ? AND end_time > ?`,
    [staffId, bookingDate, endTime, startTimeFull]
  );
  if (overlapRows.length) {
    return { valid: false, code: 409, message: "This time slot is already booked for the selected staff." };
  }

  return { valid: true, endTime, price, duration_min };
}

/**
 * Prevent duplicate booking by same user at same date+time
 */
async function checkDuplicateUserBooking(userId, bookingDate, startTime) {
  const [rows] = await pool.query(
    `SELECT id FROM bookings
     WHERE user_id = ? AND booking_date = ? AND start_time = ?
       AND status NOT IN ('cancelled')`,
    [userId, bookingDate, startTime]
  );
  return rows.length > 0;
}

/**
 * Generate available slots for a staff + date + service.
 * Returns array of "HH:MM" strings.
 */
async function getAvailableSlots(staffId, serviceId, dateStr) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const dayOfWeek = new Date(`${dateStr}T00:00:00`).getDay();

  // Staff availability windows
  const [windows] = await pool.query(
    `SELECT start_time, end_time FROM availability
     WHERE staff_id = ? AND day_of_week = ? AND is_active = 1`,
    [staffId, dayOfWeek]
  );
  if (!windows.length) return [];

  // Service duration
  const [svc] = await pool.query(
    "SELECT duration_min FROM services WHERE id = ? AND is_active = 1",
    [serviceId]
  );
  if (!svc.length) return [];
  const duration = svc[0].duration_min;

  // Existing bookings for that staff+date
  const [existing] = await pool.query(
    `SELECT start_time, end_time FROM bookings
     WHERE staff_id = ? AND booking_date = ? AND status NOT IN ('cancelled')`,
    [staffId, dateStr]
  );

  const slots = [];
  for (const win of windows) {
    const [sh, sm] = win.start_time.split(":").map(Number);
    const [eh, em] = win.end_time.split(":").map(Number);
    let cur = sh * 60 + sm;
    const end = eh * 60 + em;

    while (cur + duration <= end) {
      const slotH = Math.floor(cur / 60);
      const slotM = cur % 60;
      const slotStr = `${String(slotH).padStart(2, "0")}:${String(slotM).padStart(2, "0")}`;
      const slotEnd = cur + duration;
      const slotEndStr = `${String(Math.floor(slotEnd / 60)).padStart(2, "0")}:${String(slotEnd % 60).padStart(2, "0")}:00`;
      const slotStartFull = slotStr + ":00";

      // Filter past slots if today
      if (dateStr === todayStr) {
        const slotDt = new Date(`${dateStr}T${slotStr}:00`);
        const buffer = new Date(now.getTime() + 30 * 60 * 1000);
        if (slotDt <= buffer) { cur += 30; continue; }
      }

      // Check overlap with existing bookings
      const overlaps = existing.some(b => {
        const bStart = b.start_time.slice(0, 8);
        const bEnd = b.end_time.slice(0, 8);
        return slotStartFull < bEnd && slotEndStr > bStart;
      });
      if (!overlaps) slots.push(slotStr);
      cur += 30; // 30-minute step
    }
  }
  return slots;
}

module.exports = { validateBookingRequest, checkDuplicateUserBooking, getAvailableSlots };
