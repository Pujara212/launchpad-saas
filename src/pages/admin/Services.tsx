import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { SERVICES as INITIAL_SERVICES, type Service, type ServiceCategory } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus } from "lucide-react";

const CATEGORIES: ServiceCategory[] = ["Hair", "Skin", "Nails", "Wellness", "Consultation"];

const categoryColors: Record<ServiceCategory, string> = {
  Hair: "bg-violet-100 text-violet-700",
  Skin: "bg-pink-100 text-pink-700",
  Nails: "bg-orange-100 text-orange-700",
  Wellness: "bg-green-100 text-green-700",
  Consultation: "bg-blue-100 text-blue-700",
};

const empty: Omit<Service, "id"> = { name: "", duration: 30, price: 0, category: "Hair" };

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Service | null>(null);
  const [form, setForm] = useState<Omit<Service, "id">>(empty);

  const openCreate = () => { setEditTarget(null); setForm(empty); setOpen(true); };
  const openEdit = (s: Service) => { setEditTarget(s); setForm({ name: s.name, duration: s.duration, price: s.price, category: s.category }); setOpen(true); };

  const save = () => {
    if (editTarget) {
      setServices((prev) => prev.map((s) => s.id === editTarget.id ? { ...editTarget, ...form } : s));
    } else {
      setServices((prev) => [...prev, { ...form, id: `s${Date.now()}` }]);
    }
    setOpen(false);
  };

  const del = (id: string) => setServices((prev) => prev.filter((s) => s.id !== id));

  return (
    <AdminLayout title="Services" subtitle="Add, edit, and delete services">
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate} className="h-8 text-xs gap-1.5" size="sm">
          <Plus className="w-3.5 h-3.5" /> Add Service
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Name", "Category", "Duration", "Price", "Actions"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3 font-medium text-foreground">{s.name}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${categoryColors[s.category]}`}>
                    {s.category}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{s.duration} min</td>
                <td className="px-5 py-3 text-muted-foreground font-medium">₹{s.price.toLocaleString()}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEdit(s)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => del(s.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">{editTarget ? "Edit Service" : "Add New Service"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Service Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Haircut & Styling" className="h-8 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Duration (min)</Label>
                <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Price (₹)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="h-8 text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ServiceCategory })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" className="h-8 text-xs" onClick={save} disabled={!form.name}>
              {editTarget ? "Save Changes" : "Create Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
