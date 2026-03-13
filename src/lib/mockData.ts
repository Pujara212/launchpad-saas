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
}

export interface Staff {
  id: string;
  name: string;
  specialization: string;
  avatar: string;
}

export interface AvailabilitySlot {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD
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
  { id: "s1", name: "Haircut & Styling", duration: 60, price: 800, category: "Hair" },
  { id: "s2", name: "Keratin Treatment", duration: 120, price: 3500, category: "Hair" },
  { id: "s3", name: "Facial - Deep Cleanse", duration: 90, price: 1500, category: "Skin" },
  { id: "s4", name: "Manicure & Pedicure", duration: 75, price: 1200, category: "Nails" },
  { id: "s5", name: "Swedish Massage", duration: 60, price: 2000, category: "Wellness" },
  { id: "s6", name: "Skin Consultation", duration: 30, price: 500, category: "Consultation" },
];

export const STAFF: Staff[] = [
  { id: "st1", name: "Meena Kapoor", specialization: "Hair Specialist", avatar: "MK" },
  { id: "st2", name: "Suresh Iyer", specialization: "Skin & Wellness", avatar: "SI" },
  { id: "st3", name: "Pooja Verma", specialization: "Nail Artist", avatar: "PV" },
  { id: "st4", name: "Arjun Das", specialization: "Massage Therapist", avatar: "AD" },
];

export const AVAILABILITY: AvailabilitySlot[] = [
  { id: "av1", staffId: "st1", date: "2025-06-15", startTime: "10:00", endTime: "18:00" },
  { id: "av2", staffId: "st2", date: "2025-06-15", startTime: "09:00", endTime: "17:00" },
  { id: "av3", staffId: "st3", date: "2025-06-15", startTime: "11:00", endTime: "19:00" },
  { id: "av4", staffId: "st4", date: "2025-06-15", startTime: "10:00", endTime: "16:00" },
  { id: "av5", staffId: "st1", date: "2025-06-16", startTime: "10:00", endTime: "18:00" },
  { id: "av6", staffId: "st2", date: "2025-06-16", startTime: "09:00", endTime: "17:00" },
];

export const BOOKINGS: Booking[] = [
  {
    id: "b1", userId: "u1", serviceId: "s1", staffId: "st1",
    startTime: "2025-06-15T10:00:00", endTime: "2025-06-15T11:00:00",
    status: "confirmed", createdAt: "2025-06-10T08:00:00"
  },
  {
    id: "b2", userId: "u2", serviceId: "s3", staffId: "st2",
    startTime: "2025-06-15T09:00:00", endTime: "2025-06-15T10:30:00",
    status: "confirmed", createdAt: "2025-06-11T09:00:00"
  },
  {
    id: "b3", userId: "u3", serviceId: "s4", staffId: "st3",
    startTime: "2025-06-15T11:00:00", endTime: "2025-06-15T12:15:00",
    status: "pending", createdAt: "2025-06-12T10:00:00"
  },
  {
    id: "b4", userId: "u4", serviceId: "s5", staffId: "st4",
    startTime: "2025-06-15T10:00:00", endTime: "2025-06-15T11:00:00",
    status: "cancelled", createdAt: "2025-06-13T11:00:00"
  },
  {
    id: "b5", userId: "u5", serviceId: "s2", staffId: "st1",
    startTime: "2025-06-15T12:00:00", endTime: "2025-06-15T14:00:00",
    status: "confirmed", createdAt: "2025-06-13T12:00:00"
  },
  {
    id: "b6", userId: "u1", serviceId: "s6", staffId: "st2",
    startTime: "2025-06-16T10:00:00", endTime: "2025-06-16T10:30:00",
    status: "confirmed", createdAt: "2025-06-14T08:00:00"
  },
  {
    id: "b7", userId: "u2", serviceId: "s1", staffId: "st1",
    startTime: "2025-06-16T11:00:00", endTime: "2025-06-16T12:00:00",
    status: "pending", createdAt: "2025-06-14T09:00:00"
  },
  {
    id: "b8", userId: "u3", serviceId: "s5", staffId: "st4",
    startTime: "2025-06-16T11:00:00", endTime: "2025-06-16T12:00:00",
    status: "confirmed", createdAt: "2025-06-14T10:00:00"
  },
];

// Generate available time slots dynamically
export function generateSlots(
  staffId: string,
  date: string,
  serviceDuration: number,
  existingBookings: Booking[]
): string[] {
  const availability = AVAILABILITY.find(
    (a) => a.staffId === staffId && a.date === date
  );
  if (!availability) return [];

  const slots: string[] = [];
  const [startH, startM] = availability.startTime.split(":").map(Number);
  const [endH, endM] = availability.endTime.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  const staffBookings = existingBookings.filter(
    (b) =>
      b.staffId === staffId &&
      b.startTime.startsWith(date) &&
      b.status !== "cancelled"
  );

  for (let min = startMinutes; min + serviceDuration <= endMinutes; min += 30) {
    const slotStart = min;
    const slotEnd = min + serviceDuration;

    const isBooked = staffBookings.some((booking) => {
      const bStart = new Date(booking.startTime);
      const bEnd = new Date(booking.endTime);
      const bStartMin = bStart.getHours() * 60 + bStart.getMinutes();
      const bEndMin = bEnd.getHours() * 60 + bEnd.getMinutes();
      return slotStart < bEndMin && slotEnd > bStartMin;
    });

    if (!isBooked) {
      const h = Math.floor(min / 60).toString().padStart(2, "0");
      const m = (min % 60).toString().padStart(2, "0");
      slots.push(`${h}:${m}`);
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
