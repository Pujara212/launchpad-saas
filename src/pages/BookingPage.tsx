import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  SERVICES, STAFF, AVAILABILITY, generateSlots,
  type Service, type Staff,
} from "@/lib/mockData";
import { useBookings } from "@/context/BookingContext";
import {
  todayString, isDateInPast, filterFutureSlots,
  validateBookingForm, isFormValid, type BookingFormErrors,
} from "@/lib/validation";
import { openRazorpayCheckout, createMockOrder, type RazorpaySuccessResponse } from "@/lib/razorpay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2, Scissors, Clock, IndianRupee, LayoutDashboard,
  AlertCircle, Loader2, CreditCard, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "select-service" | "select-slot" | "fill-details" | "payment" | "confirmed";

const categoryColors: Record<string, string> = {
  Hair: "bg-violet-50 border-violet-200 text-violet-700",
  Skin: "bg-pink-50 border-pink-200 text-pink-700",
  Nails: "bg-orange-50 border-orange-200 text-orange-700",
  Wellness: "bg-green-50 border-green-200 text-green-700",
  Consultation: "bg-blue-50 border-blue-200 text-blue-700",
};

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-destructive mt-1">
      <AlertCircle className="w-3 h-3 flex-shrink-0" />
      {msg}
    </p>
  );
}

export default function BookingPage() {
  const { addBooking, bookings } = useBookings();

  const [step, setStep] = useState<Step>("select-service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [dateError, setDateError] = useState("");
  const [slotError, setSlotError] = useState("");
  const [staffError, setStaffError] = useState("");

  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [formErrors, setFormErrors] = useState<BookingFormErrors>({});
  const [touched, setTouched] = useState({ name: false, email: false, phone: false });

  const [bookingId, setBookingId] = useState("");
  const [paymentInfo, setPaymentInfo] = useState<RazorpaySuccessResponse | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // ── Slot generation with past-time filtering ─────────────────────────────
  const rawSlots = selectedService && selectedStaff
    ? generateSlots(selectedStaff.id, selectedDate, selectedService.duration, bookings)
    : [];
  const slots = filterFutureSlots(rawSlots, selectedDate);

  // Revalidate whenever form fields change
  useEffect(() => {
    const errs = validateBookingForm(form);
    setFormErrors(errs);
  }, [form]);

  // ── Date validation ───────────────────────────────────────────────────────
  const handleDateChange = (val: string) => {
    setSelectedDate(val);
    setSelectedSlot(null);
    if (isDateInPast(val)) {
      setDateError("Booking cannot be in the past. Please select today or a future date.");
    } else {
      setDateError("");
    }
  };

  // ── Staff validation ──────────────────────────────────────────────────────
  const handleStaffChange = (staffId: string) => {
    const staff = STAFF.find((s) => s.id === staffId) ?? null;
    setSelectedStaff(staff);
    setSelectedSlot(null);
    setStaffError("");
    // Check if staff has availability for chosen date
    const hasAvail = AVAILABILITY.some((a) => a.staffId === staffId && a.date === selectedDate);
    if (!hasAvail) {
      setStaffError(`${staff?.name} is not available on this date.`);
    }
  };

  // ── Slot selection ────────────────────────────────────────────────────────
  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
    setSlotError("");
  };

  // ── Proceed to details ────────────────────────────────────────────────────
  const handleProceedToDetails = () => {
    if (!selectedStaff) { setStaffError("Please select a staff member."); return; }
    if (!selectedSlot) { setSlotError("Please select a valid time slot."); return; }
    if (dateError || staffError) return;
    setStep("fill-details");
  };

  // ── Proceed to payment ────────────────────────────────────────────────────
  const handleProceedToPayment = () => {
    // Touch all fields
    setTouched({ name: true, email: true, phone: true });
    const errs = validateBookingForm(form);
    setFormErrors(errs);
    if (!isFormValid(errs, form)) return;
    setStep("payment");
  };

  // ── Razorpay checkout ─────────────────────────────────────────────────────
  const handlePayNow = async () => {
    if (!selectedService) return;
    setPaymentLoading(true);
    setPaymentError("");
    try {
      const order = createMockOrder(selectedService.price);
      await openRazorpayCheckout({
        amount: order.amount,
        orderId: order.orderId,
        currency: order.currency,
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
        description: `${selectedService.name} with ${selectedStaff?.name}`,
        onSuccess: (response) => {
          setPaymentInfo(response);
          handleConfirmBooking(response, order.orderId);
        },
        onDismiss: () => {
          setPaymentLoading(false);
          setPaymentError("Payment was cancelled. Please try again to confirm your booking.");
        },
      });
    } catch (err: any) {
      setPaymentError(err.message ?? "Payment failed. Please try again.");
      setPaymentLoading(false);
    }
  };

  // ── Save booking ──────────────────────────────────────────────────────────
  const handleConfirmBooking = (
    payment: RazorpaySuccessResponse,
    orderId: string,
  ) => {
    if (!selectedService || !selectedStaff || !selectedSlot) return;
    const id = `BK${Date.now().toString().slice(-6)}`;
    const startISO = `${selectedDate}T${selectedSlot}:00`;
    const endDate = new Date(`${selectedDate}T${selectedSlot}:00`);
    endDate.setMinutes(endDate.getMinutes() + selectedService.duration);
    const endISO = endDate.toISOString().slice(0, 19);

    addBooking({
      id,
      userId: `guest_${Date.now()}`,
      serviceId: selectedService.id,
      staffId: selectedStaff.id,
      startTime: startISO,
      endTime: endISO,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      customerName: form.name,
      customerEmail: form.email,
      customerPhone: form.phone,
      payment: {
        paymentId: payment.razorpay_payment_id,
        orderId,
        paymentStatus: "paid",
        amountPaid: selectedService.price,
      },
    });

    setBookingId(id);
    setPaymentLoading(false);
    setStep("confirmed");
  };

  const resetAll = () => {
    setStep("select-service");
    setSelectedService(null);
    setSelectedStaff(null);
    setSelectedDate(todayString());
    setSelectedSlot(null);
    setForm({ name: "", email: "", phone: "" });
    setFormErrors({});
    setTouched({ name: false, email: false, phone: false });
    setPaymentInfo(null);
    setPaymentError("");
    setDateError("");
    setSlotError("");
    setStaffError("");
  };

  const stepLabels = ["Select Service", "Choose Slot", "Your Details", "Payment"];
  const stepKeys: Step[] = ["select-service", "select-slot", "fill-details", "payment"];
  const currentStepIdx = stepKeys.indexOf(step);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Scissors className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <p className="text-sm font-semibold tracking-tight">BookEase</p>
        </div>
        <Link
          to="/admin"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <LayoutDashboard className="w-3.5 h-3.5" /> Admin Dashboard
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Progress steps */}
        {step !== "confirmed" && (
          <div className="flex items-center gap-2 mb-8 flex-wrap">
            {stepLabels.map((label, idx) => {
              const done = idx < currentStepIdx;
              const active = idx === currentStepIdx;
              return (
                <div key={label} className="flex items-center gap-2">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                    done
                      ? "bg-success text-success-foreground"
                      : active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {done ? "✓" : idx + 1}
                  </div>
                  <span className={cn(
                    "text-xs font-medium",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {label}
                  </span>
                  {idx < stepLabels.length - 1 && (
                    <div className={cn(
                      "w-8 h-px",
                      done ? "bg-success" : "bg-border"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Step 1: Select Service ─────────────────────────────────────── */}
        {step === "select-service" && (
          <div>
            <h1 className="text-xl font-bold text-foreground mb-1">Choose a Service</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Select from our range of premium services
            </p>
            <div className="grid grid-cols-2 gap-3">
              {SERVICES.map((service) => (
                <button
                  key={service.id}
                  onClick={() => { setSelectedService(service); setStep("select-slot"); }}
                  className={cn(
                    "text-left p-4 rounded-lg border-2 transition-all hover:border-accent hover:shadow-elevated",
                    selectedService?.id === service.id
                      ? "border-accent bg-accent/5"
                      : "border-border bg-card"
                  )}
                >
                  <div className={cn(
                    "inline-flex px-2 py-0.5 rounded text-xs font-medium mb-2 border",
                    categoryColors[service.category]
                  )}>
                    {service.category}
                  </div>
                  <p className="text-sm font-semibold text-foreground">{service.name}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />{service.duration} min
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-accent">
                      <IndianRupee className="w-3 h-3" />{service.price.toLocaleString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Select Slot ────────────────────────────────────────── */}
        {step === "select-slot" && selectedService && (
          <div>
            <button
              onClick={() => setStep("select-service")}
              className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold text-foreground mb-1">Choose a Time Slot</h1>
            <p className="text-sm text-muted-foreground mb-5">
              {selectedService.name} · {selectedService.duration} min · ₹{selectedService.price.toLocaleString()}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-5">
              {/* Date picker */}
              <div className="space-y-1.5">
                <Label className="text-xs">Date *</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  min={todayString()}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className={cn("h-9 text-sm", dateError && "border-destructive")}
                />
                <FieldError msg={dateError} />
              </div>

              {/* Staff picker */}
              <div className="space-y-1.5">
                <Label className="text-xs">Staff Member *</Label>
                <Select
                  value={selectedStaff?.id ?? ""}
                  onValueChange={handleStaffChange}
                >
                  <SelectTrigger className={cn("h-9 text-sm", staffError && "border-destructive")}>
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} · {s.specialization}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError msg={staffError} />
              </div>
            </div>

            {selectedStaff && !dateError && !staffError && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {slots.length > 0
                    ? `${slots.length} available slots`
                    : "No available slots for this date"}
                </p>

                {slots.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => handleSlotSelect(slot)}
                        className={cn(
                          "py-2 px-3 rounded-md text-xs font-semibold border transition-all",
                          selectedSlot === slot
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card border-border text-foreground hover:border-accent hover:text-accent"
                        )}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}

                <FieldError msg={slotError} />

                {slots.length === 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                    <AlertCircle className="w-4 h-4" />
                    No availability for this date. Try another date or staff member.
                  </div>
                )}

                <Button
                  disabled={!selectedSlot || !!slotError}
                  onClick={handleProceedToDetails}
                  className="w-full mt-4"
                >
                  Continue with {selectedSlot ? selectedSlot : "a slot"}
                </Button>
              </div>
            )}

            {/* Prompt when staff not yet chosen */}
            {!selectedStaff && (
              <p className="text-sm text-muted-foreground mt-2">
                Please select a staff member to view available slots.
              </p>
            )}
          </div>
        )}

        {/* ── Step 3: Fill Details ───────────────────────────────────────── */}
        {step === "fill-details" && selectedService && selectedStaff && (
          <div>
            <button
              onClick={() => setStep("select-slot")}
              className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold text-foreground mb-1">Your Details</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Fill in your contact information to proceed to payment
            </p>

            {/* Summary */}
            <div className="bg-muted/50 border border-border rounded-lg p-4 mb-5 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Staff</span>
                <span className="font-medium">{selectedStaff.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date & Time</span>
                <span className="font-medium">{selectedDate} at {selectedSlot}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1.5 mt-1.5">
                <span className="text-muted-foreground">Total Payable</span>
                <span className="font-bold text-accent">₹{selectedService.price.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label className="text-xs">Full Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  placeholder="Priya Sharma"
                  className={cn("h-9 text-sm", touched.name && formErrors.name && "border-destructive")}
                />
                {touched.name && <FieldError msg={formErrors.name} />}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-xs">Email Address *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  placeholder="priya@email.com"
                  className={cn("h-9 text-sm", touched.email && formErrors.email && "border-destructive")}
                />
                {touched.email && <FieldError msg={formErrors.email} />}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label className="text-xs">Phone Number *</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                  placeholder="+91 98765 43210"
                  className={cn("h-9 text-sm", touched.phone && formErrors.phone && "border-destructive")}
                />
                {touched.phone && <FieldError msg={formErrors.phone} />}
              </div>

              <Button
                className="w-full gap-2"
                onClick={handleProceedToPayment}
                disabled={!isFormValid(formErrors, form)}
              >
                <CreditCard className="w-4 h-4" />
                Proceed to Payment · ₹{selectedService.price.toLocaleString()}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 4: Payment ────────────────────────────────────────────── */}
        {step === "payment" && selectedService && selectedStaff && (
          <div>
            <button
              onClick={() => setStep("fill-details")}
              className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold text-foreground mb-1">Complete Payment</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Your booking will be confirmed after successful payment
            </p>

            {/* Order summary card */}
            <div className="bg-card border border-border rounded-lg p-5 mb-5 space-y-3 shadow-card">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Order Summary
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{selectedService.name}</span>
                  <span className="font-medium">₹{selectedService.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{selectedStaff.name} · {selectedDate} · {selectedSlot}</span>
                  <span>{selectedService.duration} min</span>
                </div>
              </div>
              <div className="border-t border-border pt-3 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-accent text-lg">₹{selectedService.price.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment error */}
            {paymentError && (
              <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{paymentError}</p>
              </div>
            )}

            {/* Trust badges */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
              <ShieldCheck className="w-4 h-4 text-success" />
              <span>Secure payment powered by Razorpay · 256-bit SSL encryption</span>
            </div>

            <Button
              className="w-full gap-2 h-11 text-base"
              onClick={handlePayNow}
              disabled={paymentLoading}
            >
              {paymentLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
              ) : (
                <><CreditCard className="w-4 h-4" /> Pay ₹{selectedService.price.toLocaleString()} & Confirm</>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-3">
              Accepted: UPI · Cards · Net Banking · Wallets
            </p>
          </div>
        )}

        {/* ── Step 5: Confirmed ──────────────────────────────────────────── */}
        {step === "confirmed" && selectedService && selectedStaff && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Booking Confirmed!</h1>
            <p className="text-sm text-muted-foreground mb-6">
              A confirmation has been recorded. Your appointment is scheduled.
            </p>

            <div className="max-w-sm mx-auto bg-card border border-border rounded-lg p-5 text-left text-sm space-y-3 shadow-card mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Booking ID</span>
                <span className="font-mono font-bold text-accent">{bookingId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium">{form.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Staff</span>
                <span className="font-medium">{selectedStaff.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date & Time</span>
                <span className="font-medium">{selectedDate} · {selectedSlot}</span>
              </div>
              {paymentInfo && (
                <>
                  <div className="flex justify-between border-t border-border pt-3">
                    <span className="text-muted-foreground">Payment ID</span>
                    <span className="font-mono text-xs text-muted-foreground">{paymentInfo.razorpay_payment_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Status</span>
                    <span className="text-success font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Paid
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t border-border pt-3">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-bold text-accent">₹{selectedService.price.toLocaleString()}</span>
              </div>
            </div>

            <Button variant="outline" onClick={resetAll}>
              Book Another Appointment
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
