// ── Validation helpers ────────────────────────────────────────────────────────

export interface BookingFormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

/** Returns today's date string in YYYY-MM-DD (local time) */
export function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** True when the selected date is strictly in the past */
export function isDateInPast(dateStr: string): boolean {
  return dateStr < todayString();
}

/**
 * Given a date string and a time slot (HH:MM), returns true when that
 * date-time combination is in the past or within the next 30 minutes.
 */
export function isSlotInPast(dateStr: string, slot: string): boolean {
  const now = new Date();
  const [h, m] = slot.split(":").map(Number);
  const slotDate = new Date(`${dateStr}T${slot}:00`);
  // Add 30-min buffer: slots starting < now+30min are blocked
  return slotDate.getTime() <= now.getTime() + 30 * 60 * 1000;
}

/** Filter out past / too-soon slots for today */
export function filterFutureSlots(slots: string[], dateStr: string): string[] {
  if (dateStr > todayString()) return slots; // future date → all slots valid
  return slots.filter((s) => !isSlotInPast(dateStr, s));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s\-().]{7,15}$/;

export function validateBookingForm(form: {
  name: string;
  email: string;
  phone: string;
}): BookingFormErrors {
  const errors: BookingFormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Full name is required.";
  } else if (form.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters.";
  }

  if (!form.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!EMAIL_RE.test(form.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (!form.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (!PHONE_RE.test(form.phone.trim())) {
    errors.phone = "Please enter a valid phone number (7–15 digits).";
  }

  return errors;
}

export function isFormValid(errors: BookingFormErrors, form: { name: string; email: string; phone: string }): boolean {
  return (
    Object.keys(errors).length === 0 &&
    form.name.trim().length >= 2 &&
    EMAIL_RE.test(form.email.trim()) &&
    PHONE_RE.test(form.phone.trim())
  );
}
