import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useBookings } from "@/context/BookingContext";
import {
  todayString, isDateInPast, filterFutureSlots,
  validateBookingForm, isFormValid, type BookingFormErrors,
} from "@/lib/validation";
import { openRazorpayCheckout, createMockOrder, type RazorpaySuccessResponse } from "@/lib/razorpay";
import { getServices, type Service } from "@/lib/serviceService";
import { getStaff, type Staff } from "@/lib/staffService";
import { getAvailableSlots } from "@/lib/availabilityService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2, Scissors, Clock, IndianRupee, LayoutDashboard,
  AlertCircle, Loader2, CreditCard, ShieldCheck, RefreshCw,
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
  const { addBooking } = useBookings();

  // ── API data ─────────────────────────────────────────────────────────────
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [staffLoading, setStaffLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // ── Wizard state ──────────────────────────────────────────────────────────
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

  // ── Load services on mount ────────────────────────────────────────────────
  useEffect(() => {
    setServicesLoading(true);
    getServices()
      .then(setServices)
      .catch(() => setApiError("Failed to load services. Please refresh."))
      .finally(() => setServicesLoading(false));
  }, []);

  // ── Load staff filtered by selected service ───────────────────────────────
  const loadStaff = useCallback((serviceId: string) => {
    setStaffLoading(true);
    setStaffList([]);
    setSelectedStaff(null);
    setSlots([]);
    setSelectedSlot(null);
    getStaff(serviceId)
      .then(setStaffList)
      .catch(() => setApiError("Failed to load staff. Please try again."))
      .finally(() => setStaffLoading(false));
  }, []);

  // ── Load slots when staff + date + service all chosen ────────────────────
  const loadSlots = useCallback((staffId: string, serviceId: string, date: string) => {
    setSlotsLoading(true);
    setSlots([]);
    setSelectedSlot(null);
    getAvailableSlots(staffId, serviceId, date)
      .then((raw) => {
        const future = filterFutureSlots(raw, date);
        setSlots(future);
        if (future.length === 0) {
          setStaffError(`No available slots for this date. Try another date or staff.`);
        } else {
          setStaffError("");
        }
      })
      .catch(() => {
        setSlots([]);
        setStaffError("Could not load slots. Please try again.");
      })
      .finally(() => setSlotsLoading(false));
  }, []);

  // ── Re-load slots whenever date or staff changes ──────────────────────────
  useEffect(() => {
    if (selectedStaff && selectedService && selectedDate && !dateError) {
      loadSlots(selectedStaff.id, selectedService.id, selectedDate);
    }
  }, [selectedStaff, selectedService, selectedDate, dateError, loadSlots]);

  // ── Revalidate form fields on change ─────────────────────────────────────
  useEffect(() => {
    setFormErrors(validateBookingForm(form));
  }, [form]);

  // ── Service selection ─────────────────────────────────────────────────────
  const handleSelectService = (svc: Service) => {
    setSelectedService(svc);
    setStep("select-slot");
    loadStaff(svc.id);
  };

  // ── Date validation ───────────────────────────────────────────────────────
  const handleDateChange = (val: string) => {
    setSelectedDate(val);
    setSelectedSlot(null);
    setSlots([]);
    if (isDateInPast(val)) {
      setDateError("Booking cannot be in the past. Please select today or a future date.");
    } else {
      setDateError("");
    }
  };

  // ── Staff change ──────────────────────────────────────────────────────────
  const handleStaffChange = (staffId: string) => {
    const staff = staffList.find((s) => s.id === staffId) ?? null;
    setSelectedStaff(staff);
    setSelectedSlot(null);
    setStaffError("");
  };

  // ── Slot selection ────────────────────────────────────────────────────────
  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
    setSlotError("");
  };

  const handleProceedToDetails = () => {
    if (!selectedStaff) { setStaffError("Please select a staff member."); return; }
    if (!selectedSlot) { setSlotError("Please select a valid time slot."); return; }
    if (dateError || staffError) return;
    setStep("fill-details");
  };

  const handleProceedToPayment = () => {
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment failed. Please try again.";
      setPaymentError(msg);
      setPaymentLoading(false);
    }
  };

  // ── Save booking ──────────────────────────────────────────────────────────
  const handleConfirmBooking = (payment: RazorpaySuccessResponse, orderId: string) => {
    if (!selectedService || !selectedStaff || !selectedSlot) return;
    const id = `BK${Date.now().toString().slice(-6)}`;
    const startISO = `${selectedDate}T${selectedSlot}:00`;
    const endDate = new Date(`${selectedDate}T${selectedSlot}:00`);
    endDate.setMinutes(endDate.getMinutes() + (selectedService.duration_min ?? 60));
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
    setStaffList([]);
    setSelectedDate(todayString());
    setSelectedSlot(null);
    setSlots([]);
    setForm({ name: "", email: "", phone: "" });
    setFormErrors({});
    setTouched({ name: false, email: false, phone: false });
    setPaymentInfo(null);
    setPaymentError("");
    setDateError("");
    setSlotError("");
    setStaffError("");
    setApiError("");
  };

  const stepLabels = ["Select Service", "Choose Slot", "Your Details", "Payment"];
  const stepKeys: Step[] = ["select-service", "select-slot", "fill-details", "payment"];
  const currentStepIdx = stepKeys.indexOf(step);

  // ── Helper: get duration label ────────────────────────────────────────────
  const getDuration = (svc: Service) => svc.duration_min ?? (svc as unknown as { duration?: number }).duration ?? 60;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shadow-sm">
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
        {/* Global API error */}
        {apiError && (
          <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-6 text-xs text-destructive">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {apiError}
            <button
              onClick={() => { setApiError(""); window.location.reload(); }}
              className="ml-auto underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Progress steps */}
        {step !== "confirmed" && (
          <div className="flex items-center gap-2 mb-8 flex-wrap">
            {stepLabels.map((label, idx) => {
              const done = idx < currentStepIdx;
              const active = idx === currentStepIdx;
              return (
                <div key={label} className="flex items-center gap-2">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    done
                      ? "bg-success text-success-foreground"
                      : active
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
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
                      "w-8 h-px transition-colors",
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
            <h1 className="text-2xl font-bold text-foreground mb-1">Choose a Service</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Select from our range of premium services
            </p>

            {servicesLoading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading services…</span>
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-sm mb-3">No services available at the moment.</p>
                <Button variant="outline" size="sm" onClick={() => { setServicesLoading(true); getServices().then(setServices).finally(() => setServicesLoading(false)); }}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {services.map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => handleSelectService(svc)}
                    className={cn(
                      "text-left p-4 rounded-xl border-2 transition-all hover:border-accent hover:shadow-elevated group",
                      selectedService?.id === svc.id
                        ? "border-accent bg-accent/5 shadow-elevated"
                        : "border-border bg-card hover:bg-accent/3"
                    )}
                  >
                    <div className={cn(
                      "inline-flex px-2 py-0.5 rounded-full text-xs font-semibold mb-2.5 border",
                      categoryColors[svc.category] ?? "bg-muted border-border text-muted-foreground"
                    )}>
                      {svc.category}
                    </div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                      {svc.name}
                    </p>
                    {svc.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{svc.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />{getDuration(svc)} min
                      </span>
                      <span className="flex items-center gap-1 text-xs font-bold text-accent">
                        <IndianRupee className="w-3 h-3" />{svc.price.toLocaleString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Select Slot ────────────────────────────────────────── */}
        {step === "select-slot" && selectedService && (
          <div>
            <button
              onClick={() => setStep("select-service")}
              className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1 transition-colors"
            >
              ← Back to Services
            </button>

            <h1 className="text-2xl font-bold text-foreground mb-1">Choose a Time Slot</h1>
            <div className="flex items-center gap-3 mb-5">
              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border bg-accent/10 border-accent/20 text-accent">
                {selectedService.name}
              </span>
              <span className="text-xs text-muted-foreground">{getDuration(selectedService)} min · ₹{selectedService.price.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              {/* Date picker */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Date *</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  min={todayString()}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className={cn("h-9 text-sm", dateError && "border-destructive focus-visible:ring-destructive")}
                />
                <FieldError msg={dateError} />
              </div>

              {/* Staff picker */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Staff Member *</Label>
                {staffLoading ? (
                  <div className="h-9 flex items-center gap-2 text-xs text-muted-foreground px-3 border border-border rounded-md bg-muted/30">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading staff…
                  </div>
                ) : (
                  <Select
                    value={selectedStaff?.id ?? ""}
                    onValueChange={handleStaffChange}
                    disabled={staffList.length === 0}
                  >
                    <SelectTrigger className={cn("h-9 text-sm", staffError && "border-destructive")}>
                      <SelectValue placeholder={staffList.length === 0 ? "No staff available" : "Select staff"} />
                    </SelectTrigger>
                    <SelectContent>
                      {staffList.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium text-xs">{s.name}</p>
                              {s.specialization && <p className="text-xs text-muted-foreground">{s.specialization}</p>}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <FieldError msg={staffError} />
              </div>
            </div>

            {/* Slot grid */}
            {selectedStaff && !dateError && (
              <div>
                {slotsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking availability…
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      {slots.length > 0
                        ? `${slots.length} available slot${slots.length !== 1 ? "s" : ""}`
                        : "No available slots for this date"}
                    </p>

                    {slots.length > 0 ? (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-4">
                        {slots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => handleSlotSelect(slot)}
                            className={cn(
                              "py-2.5 px-2 rounded-lg text-xs font-semibold border transition-all",
                              selectedSlot === slot
                                ? "bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20"
                                : "bg-card border-border text-foreground hover:border-accent hover:text-accent hover:bg-accent/5"
                            )}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
                        <AlertCircle className="w-8 h-8 opacity-40" />
                        <p className="text-sm text-center">No availability for this date.<br />Try a different date or staff member.</p>
                      </div>
                    )}

                    <FieldError msg={slotError} />

                    <Button
                      disabled={!selectedSlot}
                      onClick={handleProceedToDetails}
                      className="w-full mt-4 h-10"
                    >
                      Continue {selectedSlot ? `— ${selectedSlot}` : ""}
                    </Button>
                  </>
                )}
              </div>
            )}

            {!selectedStaff && !staffLoading && (
              <p className="text-sm text-muted-foreground mt-3 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
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
              className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1 transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-foreground mb-1">Your Details</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Fill in your contact information to proceed to payment
            </p>

            {/* Booking Summary */}
            <div className="bg-muted/40 border border-border rounded-xl p-4 mb-5 text-xs space-y-2">
              <p className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px] mb-1">Booking Summary</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="font-semibold">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Staff</span>
                <span className="font-semibold">{selectedStaff.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date & Time</span>
                <span className="font-semibold">{selectedDate} at {selectedSlot}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 mt-1">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold text-accent text-sm">₹{selectedService.price.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Full Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  placeholder="e.g. Priya Sharma"
                  className={cn("h-9 text-sm", touched.name && formErrors.name && "border-destructive")}
                />
                {touched.name && <FieldError msg={formErrors.name} />}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Email Address *</Label>
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

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Phone Number *</Label>
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
                className="w-full gap-2 h-10"
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
              className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1 transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-foreground mb-1">Complete Payment</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Your booking will be confirmed after successful payment
            </p>

            <div className="bg-card border border-border rounded-xl p-5 mb-5 space-y-3 shadow-card">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Order Summary</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{selectedService.name}</span>
                  <span className="font-medium">₹{selectedService.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{selectedStaff.name} · {selectedDate} · {selectedSlot}</span>
                  <span>{getDuration(selectedService)} min</span>
                </div>
              </div>
              <div className="border-t border-border pt-3 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-accent text-xl">₹{selectedService.price.toLocaleString()}</span>
              </div>
            </div>

            {paymentError && (
              <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{paymentError}</p>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-5 bg-success/5 border border-success/20 rounded-lg px-3 py-2">
              <ShieldCheck className="w-4 h-4 text-success flex-shrink-0" />
              <span>Secure payment powered by Razorpay · 256-bit SSL encryption</span>
            </div>

            <Button
              className="w-full gap-2 h-12 text-base font-semibold"
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
            <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-6 ring-8 ring-success/10">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Booking Confirmed!</h1>
            <p className="text-sm text-muted-foreground mb-8">
              Your appointment has been scheduled successfully.
            </p>

            <div className="max-w-sm mx-auto bg-card border border-border rounded-xl p-5 text-left text-sm space-y-3 shadow-card mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Booking ID</span>
                <span className="font-mono font-bold text-accent">{bookingId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-semibold">{form.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="font-semibold">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Staff</span>
                <span className="font-semibold">{selectedStaff.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date & Time</span>
                <span className="font-semibold">{selectedDate} · {selectedSlot}</span>
              </div>
              {paymentInfo && (
                <>
                  <div className="flex justify-between border-t border-border pt-3">
                    <span className="text-muted-foreground">Payment ID</span>
                    <span className="font-mono text-xs text-muted-foreground truncate max-w-[140px]">{paymentInfo.razorpay_payment_id}</span>
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
                <span className="font-bold text-accent text-base">₹{selectedService.price.toLocaleString()}</span>
              </div>
            </div>

            <Button variant="outline" onClick={resetAll} className="gap-2">
              <Scissors className="w-3.5 h-3.5" /> Book Another Appointment
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
