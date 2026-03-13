import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  BOOKINGS, SERVICES, STAFF,
  getServiceById, getStaffById, getUserById,
  type Booking, type BookingStatus
} from "@/lib/mockData";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>(BOOKINGS);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = filterStatus === "all"
    ? bookings
    : bookings.filter((b) => b.status === filterStatus);

  const updateStatus = (id: string, status: BookingStatus) => {
    setBookings((prev) =>
      prev.map((b) => b.id === id ? { ...b, status } : b)
    );
  };

  return (
    <AdminLayout title="Bookings" subtitle="Manage all customer bookings">
      <div className="bg-card border border-border rounded-lg shadow-card">
        {/* Filters */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">{filtered.length} bookings</p>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["ID", "Customer", "Service", "Staff", "Date & Time", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const user = getUserById(b.userId);
                const service = getServiceById(b.serviceId);
                const staff = getStaffById(b.staffId);
                const dt = new Date(b.startTime);
                return (
                  <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 text-xs font-mono text-muted-foreground">{b.id}</td>
                    <td className="px-5 py-3 font-medium text-foreground">{user?.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{service?.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{staff?.name}</td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">
                      {dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      {" "}
                      {dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {b.status !== "confirmed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs px-2 border-success/40 text-success hover:bg-success/10"
                            onClick={() => updateStatus(b.id, "confirmed")}
                          >
                            Confirm
                          </Button>
                        )}
                        {b.status !== "cancelled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs px-2 border-destructive/40 text-destructive hover:bg-destructive/10"
                            onClick={() => updateStatus(b.id, "cancelled")}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
