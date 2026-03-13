import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/lib/mockData";

const variants: Record<BookingStatus, string> = {
  confirmed: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border capitalize",
        variants[status]
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {status}
    </span>
  );
}
