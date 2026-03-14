import { AdminLayout } from "@/components/layout/AdminLayout";
import { useBookings } from "@/context/BookingContext";
import { SERVICES, STAFF, getServiceById, getStaffById } from "@/lib/mockData";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  CalendarDays, TrendingUp, Users, CheckCircle2, XCircle, IndianRupee,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export default function AdminDashboard() {
  const { bookings } = useBookings();

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayBookings = bookings.filter((b) => b.startTime.startsWith(todayStr));
  const totalConfirmed = bookings.filter((b) => b.status === "confirmed").length;
  const totalCancelled = bookings.filter((b) => b.status === "cancelled").length;
  const totalRevenue = bookings
    .filter((b) => b.payment?.paymentStatus === "paid")
    .reduce((sum, b) => sum + (b.payment?.amountPaid ?? 0), 0);

  // Top services chart data
  const serviceCount: Record<string, number> = {};
  bookings.forEach((b) => {
    serviceCount[b.serviceId] = (serviceCount[b.serviceId] || 0) + 1;
  });
  const topServices = Object.entries(serviceCount)
    .map(([id, count]) => ({ name: getServiceById(id)?.name ?? id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Staff performance
  const staffCount: Record<string, number> = {};
  bookings
    .filter((b) => b.status !== "cancelled")
    .forEach((b) => {
      staffCount[b.staffId] = (staffCount[b.staffId] || 0) + 1;
    });

  const statCards = [
    {
      label: "Total Bookings",
      value: bookings.length,
      icon: CalendarDays,
      change: "All time",
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Today's Bookings",
      value: todayBookings.length,
      icon: TrendingUp,
      change: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Confirmed",
      value: totalConfirmed,
      icon: CheckCircle2,
      change: bookings.length ? `${Math.round((totalConfirmed / bookings.length) * 100)}% completion rate` : "—",
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Revenue Collected",
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: IndianRupee,
      change: `${bookings.filter((b) => b.payment?.paymentStatus === "paid").length} paid bookings`,
      color: "text-accent",
      bg: "bg-accent/10",
    },
  ];

  return (
    <AdminLayout title="Dashboard" subtitle="Live overview of your booking platform">
      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-lg p-4 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {card.label}
              </p>
              <div className={`w-8 h-8 rounded-md ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Most Booked Services Chart */}
        <div className="col-span-2 bg-card border border-border rounded-lg p-5 shadow-card">
          <h2 className="text-sm font-semibold text-foreground mb-4">Most Booked Services</h2>
          {topServices.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topServices} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: 12,
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No booking data yet.</p>
          )}
        </div>

        {/* Staff Performance */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-card">
          <h2 className="text-sm font-semibold text-foreground mb-4">Staff Performance</h2>
          <div className="space-y-3">
            {STAFF.map((staff) => {
              const count = staffCount[staff.id] || 0;
              const maxCount = Math.max(...Object.values(staffCount), 1);
              return (
                <div key={staff.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-primary-foreground">{staff.avatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-foreground truncate">{staff.name}</p>
                      <span className="text-xs font-bold text-accent ml-2">{count}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-card border border-border rounded-lg shadow-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Recent Bookings</h2>
          <span className="text-xs text-muted-foreground">
            {bookings.slice(0, 8).length} shown
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Customer", "Service", "Staff", "Date & Time", "Payment", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 8).map((b) => {
                const service = getServiceById(b.serviceId);
                const staff = getStaffById(b.staffId);
                const time = new Date(b.startTime).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const dateStr = new Date(b.startTime).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                });
                return (
                  <tr
                    key={b.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground text-xs">{b.customerName}</p>
                      <p className="text-muted-foreground text-xs">{b.customerEmail}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{service?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{staff?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{dateStr} · {time}</td>
                    <td className="px-5 py-3 text-xs">
                      {b.payment?.paymentStatus === "paid" ? (
                        <span className="text-success font-medium">
                          ₹{b.payment.amountPaid.toLocaleString()} ✓
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={b.status} />
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
