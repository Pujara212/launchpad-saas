import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useBookings } from "@/context/BookingContext";
import { getServiceById, getStaffById, type BookingStatus } from "@/lib/mockData";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, IndianRupee, ShieldCheck } from "lucide-react";

const PAGE_SIZE = 8;

export default function AdminBookings() {
  const { bookings, updateStatus } = useBookings();

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Filter
  const filtered = bookings.filter((b) => {
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      b.customerName.toLowerCase().includes(q) ||
      b.customerEmail.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      (getServiceById(b.serviceId)?.name ?? "").toLowerCase().includes(q) ||
      (getStaffById(b.staffId)?.name ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (val: string) => {
    setFilterStatus(val);
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  // Stats
  const total = bookings.length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const pending = bookings.filter((b) => b.status === "pending").length;
  const totalRevenue = bookings
    .filter((b) => b.payment?.paymentStatus === "paid")
    .reduce((sum, b) => sum + (b.payment?.amountPaid ?? 0), 0);

  return (
    <AdminLayout title="Bookings" subtitle="Manage all customer bookings">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Bookings", value: total },
          { label: "Confirmed", value: confirmed, color: "text-success" },
          { label: "Pending", value: pending, color: "text-warning" },
          { label: "Revenue Collected", value: `₹${totalRevenue.toLocaleString()}`, color: "text-accent" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-lg px-4 py-3 shadow-card">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-xl font-bold mt-0.5 ${color ?? "text-foreground"}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg shadow-card">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search name, email, service…"
              className="h-8 pl-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">{filtered.length} bookings</p>
            <Select value={filterStatus} onValueChange={handleFilterChange}>
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
                {[
                  "ID", "Customer", "Service", "Staff",
                  "Date & Time", "Amount", "Payment", "Status", "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No bookings found.
                  </td>
                </tr>
              )}
              {paginated.map((b) => {
                const service = getServiceById(b.serviceId);
                const staff = getStaffById(b.staffId);
                const dt = new Date(b.startTime);
                return (
                  <tr
                    key={b.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {b.id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-medium text-foreground text-xs">{b.customerName}</p>
                      <p className="text-muted-foreground text-xs">{b.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {service?.name ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {staff?.name ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
                      {" "}
                      {dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {b.payment ? (
                        <span className="flex items-center gap-1 text-accent font-semibold">
                          <IndianRupee className="w-3 h-3" />
                          {b.payment.amountPaid.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {b.payment?.paymentStatus === "paid" ? (
                        <span className="flex items-center gap-1 text-success font-medium">
                          <ShieldCheck className="w-3 h-3" /> Paid
                        </span>
                      ) : b.payment?.paymentStatus === "failed" ? (
                        <span className="text-destructive">Failed</span>
                      ) : (
                        <span className="text-muted-foreground">Unpaid</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3">
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  className="h-7 w-7 text-xs p-0"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
