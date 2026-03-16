export type ServiceCategory = "Hair" | "Skin" | "Nails" | "Wellness" | "Consultation";
export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Service {
  id: string;
  name: string;
  duration: number; // minutes
  price: number;
  category: ServiceCategory;
  description?: string;
}

export interface Staff {
  id: string;
  name: string;
  specialization: string;
  avatar: string;
}

// Day-of-week based availability (0=Sun,1=Mon,...,6=Sat)
export interface AvailabilityWindow {
  id: string;
  staffId: string;
  dayOfWeek: number; // 0-6
  startTime: string; // HH:MM
  endTime: string;
}

export interface Booking {
  id: string;
  userId: string;
  serviceId: string;
  staffId: string;
  startTime: string; // ISO
  endTime: string;
  status: BookingStatus;
  createdAt: string;
}

export const USERS: User[] = [
  { id: "u1", name: "Priya Sharma", email: "priya@email.com", phone: "+91 98765 43210" },
  { id: "u2", name: "Rahul Mehta", email: "rahul@email.com", phone: "+91 91234 56789" },
  { id: "u3", name: "Ananya Singh", email: "ananya@email.com", phone: "+91 87654 32109" },
  { id: "u4", name: "Vikram Nair", email: "vikram@email.com", phone: "+91 76543 21098" },
  { id: "u5", name: "Deepika Patel", email: "deepika@email.com", phone: "+91 65432 10987" },
];

export const SERVICES: Service[] = [
  { id: "s1", name: "Haircut & Styling", duration: 60, price: 800, category: "Hair", description: "Professional cut and blow-dry finish" },
  { id: "s2", name: "Keratin Treatment", duration: 120, price: 3500, category: "Hair", description: "Smooth frizz-free finish for 3 months" },
  { id: "s3", name: "Facial - Deep Cleanse", duration: 90, price: 1500, category: "Skin", description: "Deep pore cleansing and hydration" },
  { id: "s4", name: "Manicure & Pedicure", duration: 75, price: 1200, category: "Nails", description: "Complete nail care with polish" },
  { id: "s5", name: "Swedish Massage", duration: 60, price: 2000, category: "Wellness", description: "Full body relaxation massage" },
  { id: "s6", name: "Skin Consultation", duration: 30, price: 500, category: "Consultation", description: "Expert skin analysis and advice" },
];

export const STAFF: Staff[] = [
  { id: "st1", name: "Meena Kapoor", specialization: "Hair Specialist", avatar: "MK" },
  { id: "st2", name: "Suresh Iyer", specialization: "Skin & Wellness", avatar: "SI" },
  { id: "st3", name: "Pooja Verma", specialization: "Nail Artist", avatar: "PV" },
  { id: "st4", name: "Arjun Das", specialization: "Massage Therapist", avatar: "AD" },
];

// Day-of-week windows so ANY future date will show slots (Mon-Sat = 1-6)
export const AVAILABILITY_WINDOWS: AvailabilityWindow[] = [
  // Meena (st1) — Mon to Sat 10:00-18:00
  { id: "aw1", staffId: "st1", dayOfWeek: 1, startTime: "10:00", endTime: "18:00" },
  { id: "aw2", staffId: "st1", dayOfWeek: 2, startTime: "10:00", endTime: "18:00" },
  { id: "aw3", staffId: "st1", dayOfWeek: 3, startTime: "10:00", endTime: "18:00" },
  { id: "aw4", staffId: "st1", dayOfWeek: 4, startTime: "10:00", endTime: "18:00" },
  { id: "aw5", staffId: "st1", dayOfWeek: 5, startTime: "10:00", endTime: "18:00" },
  { id: "aw6", staffId: "st1", dayOfWeek: 6, startTime: "10:00", endTime: "15:00" },
  // Suresh (st2) — Mon to Fri 09:00-17:00
  { id: "aw7",  staffId: "st2", dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
  { id: "aw8",  staffId: "st2", dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
  { id: "aw9",  staffId: "st2", dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
  { id: "aw10", staffId: "st2", dayOfWeek: 4, startTime: "09:00", endTime: "17:00" },
  { id: "aw11", staffId: "st2", dayOfWeek: 5, startTime: "09:00", endTime: "17:00" },
  // Pooja (st3) — Tue to Sat 11:00-19:00
  { id: "aw12", staffId: "st3", dayOfWeek: 2, startTime: "11:00", endTime: "19:00" },
  { id: "aw13", staffId: "st3", dayOfWeek: 3, startTime: "11:00", endTime: "19:00" },
  { id: "aw14", staffId: "st3", dayOfWeek: 4, startTime: "11:00", endTime: "19:00" },
  { id: "aw15", staffId: "st3", dayOfWeek: 5, startTime: "11:00", endTime: "19:00" },
  { id: "aw16", staffId: "st3", dayOfWeek: 6, startTime: "11:00", endTime: "19:00" },
  // Arjun (st4) — Mon/Wed/Fri/Sat 10:00-16:00
  { id: "aw17", staffId: "st4", dayOfWeek: 1, startTime: "10:00", endTime: "16:00" },
  { id: "aw18", staffId: "st4", dayOfWeek: 3, startTime: "10:00", endTime: "16:00" },
  { id: "aw19", staffId: "st4", dayOfWeek: 5, startTime: "10:00", endTime: "16:00" },
  { id: "aw20", staffId: "st4", dayOfWeek: 6, startTime: "10:00", endTime: "16:00" },
];

export const BOOKINGS: Booking[] = [];

/**
 * Generate available time slots for a staff on a given date.
 * Uses day-of-week windows so it works for any future date.
 */
export function generateSlots(
  staffId: string,
  date: string,
  serviceDuration: number,
  existingBookings: Booking[]
): string[] {
  const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
  const windows = AVAILABILITY_WINDOWS.filter(
    (w) => w.staffId === staffId && w.dayOfWeek === dayOfWeek
  );
  if (!windows.length) return [];

  const staffBookings = existingBookings.filter(
    (b) =>
      b.staffId === staffId &&
      b.startTime.startsWith(date) &&
      b.status !== "cancelled"
  );

  const slots: string[] = [];

  for (const win of windows) {
    const [startH, startM] = win.startTime.split(":").map(Number);
    const [endH, endM] = win.endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    for (let min = startMinutes; min + serviceDuration <= endMinutes; min += 30) {
      const slotEnd = min + serviceDuration;

      const isBooked = staffBookings.some((booking) => {
        const bStart = new Date(booking.startTime);
        const bEnd = new Date(booking.endTime);
        const bStartMin = bStart.getHours() * 60 + bStart.getMinutes();
        const bEndMin = bEnd.getHours() * 60 + bEnd.getMinutes();
        return min < bEndMin && slotEnd > bStartMin;
      });

      if (!isBooked) {
        const h = Math.floor(min / 60).toString().padStart(2, "0");
        const m = (min % 60).toString().padStart(2, "0");
        slots.push(`${h}:${m}`);
      }
    }
  }

  return slots;
}

export function getServiceById(id: string) {
  return SERVICES.find((s) => s.id === id);
}

export function getStaffById(id: string) {
  return STAFF.find((s) => s.id === id);
}

export function getUserById(id: string) {
  return USERS.find((u) => u.id === id);
}
