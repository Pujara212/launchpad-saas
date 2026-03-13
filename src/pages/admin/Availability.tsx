import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AVAILABILITY as INITIAL_AVAIL, STAFF, type AvailabilitySlot } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Clock } from "lucide-react";

const empty = { staffId: "", date: "", startTime: "", endTime: "" };

export default function AdminAvailability() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(INITIAL_AVAIL);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const save = () => {
    if (!form.staffId || !form.date || !form.startTime || !form.endTime) return;
    setSlots((prev) => [...prev, { ...form, id: `av${Date.now()}` }]);
    setOpen(false);
    setForm(empty);
  };

  const getStaffName = (id: string) => STAFF.find((s) => s.id === id)?.name ?? id;

  return (
    <AdminLayout title="Availability" subtitle="Define staff availability windows">
      <div className="flex justify-end mb-4">
        <Button onClick={() => setOpen(true)} size="sm" className="h-8 text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Slot
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Staff", "Date", "Start Time", "End Time", "Hours", ""].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => {
              const [sh, sm] = slot.startTime.split(":").map(Number);
              const [eh, em] = slot.endTime.split(":").map(Number);
              const hours = ((eh * 60 + em) - (sh * 60 + sm)) / 60;
              return (
                <tr key={slot.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground">{getStaffName(slot.staffId)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{slot.date}</td>
                  <td className="px-5 py-3 text-muted-foreground">{slot.startTime}</td>
                  <td className="px-5 py-3 text-muted-foreground">{slot.endTime}</td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1 text-xs text-accent font-medium">
                      <Clock className="w-3 h-3" />{hours}h
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setSlots((prev) => prev.filter((s) => s.id !== slot.id))}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Add Availability Slot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Staff Member</Label>
              <Select value={form.staffId} onValueChange={(v) => setForm({ ...form, staffId: v })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>
                  {STAFF.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-8 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Start Time</Label>
                <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">End Time</Label>
                <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="h-8 text-sm" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" className="h-8 text-xs" onClick={save}>Save Slot</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
