import { useState } from "react";
import { Link } from "react-router-dom";
import { SERVICES, STAFF, BOOKINGS, AVAILABILITY, generateSlots, type Service, type Staff } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { CheckCircle2, Scissors, Clock, IndianRupee, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "select-service" | "select-slot" | "fill-details" | "confirmed";

const categoryColors: Record<string, string> = {
  Hair: "bg-violet-50 border-violet-200 text-violet-700",
  Skin: "bg-pink-50 border-pink-200 text-pink-700",
  Nails: "bg-orange-50 border-orange-200 text-orange-700",
  Wellness: "bg-green-50 border-green-200 text-green-700",
  Consultation: "bg-blue-50 border-blue-200 text-blue-700",
};

export default function BookingPage() {
  const [step, setStep] = useState<Step>("select-service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState("2025-06-15");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [bookingId, setBookingId] = useState("");

  const staffForService = STAFF; // All staff can do all services in mock
  const slots = selectedService && selectedStaff
    ? generateSlots(selectedStaff.id, selectedDate, selectedService.duration, BOOKINGS)
    : [];

  const handleConfirm = () => {
    setBookingId(`BK${Date.now().toString().slice(-6)}`);
    setStep("confirmed");
  };

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
        <Link to="/admin" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <LayoutDashboard className="w-3.5 h-3.5" /> Admin Dashboard
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Progress */}
        {step !== "confirmed" && (
          <div className="flex items-center gap-3 mb-8">
            {(["select-service", "select-slot", "fill-details"] as const).map((s, idx) => {
              const stepIdx = ["select-service", "select-slot", "fill-details"].indexOf(step);
              const done = idx < stepIdx;
              const active = idx === stepIdx;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    done ? "bg-success text-success-foreground" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {done ? "✓" : idx + 1}
                  </div>
                  <span className={cn("text-xs font-medium", active ? "text-foreground" : "text-muted-foreground")}>
                    {["Select Service", "Choose Slot", "Your Details"][idx]}
                  </span>
                  {idx < 2 && <div className="w-12 h-px bg-border" />}
                </div>
              );
            })}
          </div>
        )}

        {/* Step 1: Select Service */}
        {step === "select-service" && (
          <div>
            <h1 className="text-xl font-bold text-foreground mb-1">Choose a Service</h1>
            <p className="text-sm text-muted-foreground mb-6">Select from our range of premium services</p>
            <div className="grid grid-cols-2 gap-3">
              {SERVICES.map((service) => (
                <button
                  key={service.id}
                  onClick={() => { setSelectedService(service); setStep("select-slot"); }}
                  className={cn(
                    "text-left p-4 rounded-lg border-2 transition-all hover:border-accent hover:shadow-elevated",
                    selectedService?.id === service.id ? "border-accent bg-accent/5" : "border-border bg-card"
                  )}
                >
                  <div className={cn("inline-flex px-2 py-0.5 rounded text-xs font-medium mb-2 border", categoryColors[service.category])}>
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

        {/* Step 2: Select Slot */}
        {step === "select-slot" && selectedService && (
          <div>
            <button onClick={() => setStep("select-service")} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">
              ← Back
            </button>
            <h1 className="text-xl font-bold text-foreground mb-1">Choose a Time Slot</h1>
            <p className="text-sm text-muted-foreground mb-5">
              {selectedService.name} · {selectedService.duration} min · ₹{selectedService.price.toLocaleString()}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(null); }}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Staff Member</Label>
                <Select
                  value={selectedStaff?.id ?? ""}
                  onValueChange={(v) => { setSelectedStaff(staffForService.find((s) => s.id === v) ?? null); setSelectedSlot(null); }}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffForService.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} · {s.specialization}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedStaff && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {slots.length > 0 ? `${slots.length} slots available` : "No slots available"}
                </p>
                <div className="grid grid-cols-5 gap-2 mb-6">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
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
                  {slots.length === 0 && (
                    <p className="col-span-5 text-sm text-muted-foreground py-8 text-center">
                      No availability for this date. Try another date or staff member.
                    </p>
                  )}
                </div>
                <Button
                  disabled={!selectedSlot}
                  onClick={() => setStep("fill-details")}
                  className="w-full"
                >
                  Continue with {selectedSlot ?? "selected slot"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Fill Details */}
        {step === "fill-details" && selectedService && selectedStaff && (
          <div>
            <button onClick={() => setStep("select-slot")} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">
              ← Back
            </button>
            <h1 className="text-xl font-bold text-foreground mb-1">Your Details</h1>
            <p className="text-sm text-muted-foreground mb-6">Fill in your contact information to confirm the booking</p>

            {/* Booking summary */}
            <div className="bg-muted/50 border border-border rounded-lg p-4 mb-5 text-xs space-y-1.5">
              <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="font-medium">{selectedService.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Staff</span><span className="font-medium">{selectedStaff.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date & Time</span><span className="font-medium">{selectedDate} at {selectedSlot}</span></div>
              <div className="flex justify-between border-t border-border pt-1.5 mt-1.5"><span className="text-muted-foreground">Total</span><span className="font-bold text-accent">₹{selectedService.price.toLocaleString()}</span></div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Full Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Priya Sharma" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email Address</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="priya@email.com" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone Number</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" className="h-9 text-sm" />
              </div>
              <Button
                className="w-full"
                disabled={!form.name || !form.email || !form.phone}
                onClick={handleConfirm}
              >
                Confirm Booking
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmed */}
        {step === "confirmed" && selectedService && selectedStaff && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Booking Confirmed!</h1>
            <p className="text-sm text-muted-foreground mb-6">Your appointment has been successfully scheduled.</p>

            <div className="max-w-sm mx-auto bg-card border border-border rounded-lg p-5 text-left text-sm space-y-3 shadow-card mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Booking ID</span>
                <span className="font-mono font-bold text-accent">{bookingId}</span>
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
              <div className="flex justify-between border-t border-border pt-3">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-accent">₹{selectedService.price.toLocaleString()}</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setStep("select-service");
                setSelectedService(null);
                setSelectedStaff(null);
                setSelectedSlot(null);
                setForm({ name: "", email: "", phone: "" });
              }}
            >
              Book Another Appointment
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
