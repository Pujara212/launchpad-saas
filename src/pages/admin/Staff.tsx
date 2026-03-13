import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { STAFF as INITIAL_STAFF, type Staff } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";

const empty: Omit<Staff, "id"> = { name: "", specialization: "", avatar: "" };

export default function AdminStaff() {
  const [staff, setStaff] = useState<Staff[]>(INITIAL_STAFF);
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Staff | null>(null);
  const [form, setForm] = useState<Omit<Staff, "id">>(empty);

  const openCreate = () => { setEditTarget(null); setForm(empty); setOpen(true); };
  const openEdit = (s: Staff) => { setEditTarget(s); setForm({ name: s.name, specialization: s.specialization, avatar: s.avatar }); setOpen(true); };

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const save = () => {
    const avatar = getInitials(form.name);
    if (editTarget) {
      setStaff((prev) => prev.map((s) => s.id === editTarget.id ? { ...editTarget, ...form, avatar } : s));
    } else {
      setStaff((prev) => [...prev, { ...form, avatar, id: `st${Date.now()}` }]);
    }
    setOpen(false);
  };

  return (
    <AdminLayout title="Staff" subtitle="Manage your team members">
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate} size="sm" className="h-8 text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Staff
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {staff.map((s) => (
          <div key={s.id} className="bg-card border border-border rounded-lg p-4 shadow-card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary-foreground">{s.avatar}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.specialization}</p>
              <p className="text-xs text-accent font-mono mt-0.5">{s.id}</p>
            </div>
            <div className="flex flex-col gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEdit(s)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setStaff((prev) => prev.filter((x) => x.id !== s.id))}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">{editTarget ? "Edit Staff" : "Add Staff Member"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Full Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Meena Kapoor" className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Specialization</Label>
              <Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="e.g. Hair Specialist" className="h-8 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" className="h-8 text-xs" onClick={save} disabled={!form.name}>
              {editTarget ? "Save Changes" : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
