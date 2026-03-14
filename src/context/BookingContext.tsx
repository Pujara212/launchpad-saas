import React, { createContext, useContext, useState, useCallback } from "react";
import { BOOKINGS, type Booking, type BookingStatus } from "@/lib/mockData";

export interface PaymentInfo {
  paymentId: string;
  orderId: string;
  paymentStatus: "pending" | "paid" | "failed";
  amountPaid: number;
}

export interface EnrichedBooking extends Booking {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  payment?: PaymentInfo;
}

interface BookingContextValue {
  bookings: EnrichedBooking[];
  addBooking: (b: EnrichedBooking) => void;
  updateStatus: (id: string, status: BookingStatus) => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

// Seed existing mock bookings with placeholder customer info
const seedBookings: EnrichedBooking[] = BOOKINGS.map((b) => {
  const names: Record<string, { name: string; email: string; phone: string }> = {
    u1: { name: "Priya Sharma", email: "priya@email.com", phone: "+91 98765 43210" },
    u2: { name: "Rahul Mehta", email: "rahul@email.com", phone: "+91 91234 56789" },
    u3: { name: "Ananya Singh", email: "ananya@email.com", phone: "+91 87654 32109" },
    u4: { name: "Vikram Nair", email: "vikram@email.com", phone: "+91 76543 21098" },
    u5: { name: "Deepika Patel", email: "deepika@email.com", phone: "+91 65432 10987" },
  };
  const info = names[b.userId] ?? { name: "Guest User", email: "-", phone: "-" };
  return {
    ...b,
    customerName: info.name,
    customerEmail: info.email,
    customerPhone: info.phone,
    payment: b.status === "confirmed"
      ? { paymentId: `pay_mock${b.id}`, orderId: `order_mock${b.id}`, paymentStatus: "paid", amountPaid: 0 }
      : undefined,
  };
});

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [bookings, setBookings] = useState<EnrichedBooking[]>(seedBookings);

  const addBooking = useCallback((b: EnrichedBooking) => {
    setBookings((prev) => [b, ...prev]);
  }, []);

  const updateStatus = useCallback((id: string, status: BookingStatus) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  }, []);

  return (
    <BookingContext.Provider value={{ bookings, addBooking, updateStatus }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBookings() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBookings must be used inside BookingProvider");
  return ctx;
}
