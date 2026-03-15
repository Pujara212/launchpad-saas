import api from "./api";

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
export type PaymentStatus = "unpaid" | "pending" | "paid" | "refunded";

export interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_id?: string;
  amount_paid: number;
  notes?: string;
  cancelled_reason?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_name: string;
  duration_min: number;
  price: number;
  staff_name: string;
  created_at: string;
}

export interface BookingListResponse {
  bookings: Booking[];
  total: number;
  page: number;
  limit: number;
}

export async function getBookings(params?: {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}): Promise<BookingListResponse> {
  const { data } = await api.get("/bookings", { params });
  return data.data;
}

export async function getBooking(id: string): Promise<Booking> {
  const { data } = await api.get(`/bookings/${id}`);
  return data.data;
}

export async function createBooking(payload: {
  service_id: string;
  staff_id: string;
  booking_date: string;
  start_time: string;
  notes?: string;
}): Promise<Booking> {
  const { data } = await api.post("/bookings", payload);
  return data.data;
}

export async function updateBookingStatus(id: string, status: BookingStatus, cancelledReason?: string): Promise<void> {
  await api.patch(`/bookings/${id}/status`, { status, cancelled_reason: cancelledReason });
}

export async function cancelBooking(id: string): Promise<void> {
  await api.delete(`/bookings/${id}`);
}

export async function createPaymentOrder(bookingId: string): Promise<{
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}> {
  const { data } = await api.post("/payment/create-order", { booking_id: bookingId });
  return data.data;
}

export async function verifyPayment(payload: {
  booking_id: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}): Promise<void> {
  await api.post("/payment/verify", payload);
}
