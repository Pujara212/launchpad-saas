import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Briefcase,
  Clock,
  BookOpen,
  Bot,
  Scissors,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Bookings", href: "/admin/bookings", icon: BookOpen },
  { label: "Services", href: "/admin/services", icon: Briefcase },
  { label: "Staff", href: "/admin/staff", icon: Users },
  { label: "Availability", href: "/admin/availability", icon: Clock },
  { label: "AI Assistant", href: "/admin/ai", icon: Bot },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-60 flex flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-2.5 h-14 px-5 border-b border-sidebar-border">
        <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center flex-shrink-0">
          <Scissors className="w-3.5 h-3.5 text-accent-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-sidebar-primary-foreground tracking-tight">BookEase</p>
          <p className="text-[10px] text-sidebar-foreground/50 leading-tight">Admin Console</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
          Navigation
        </p>
        {navItems.map(({ label, href, icon: Icon }) => {
          const active =
            href === "/admin"
              ? location.pathname === "/admin"
              : location.pathname.startsWith(href);
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-100",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <Link
          to="/"
          className="flex items-center gap-2 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          <CalendarDays className="w-3.5 h-3.5" />
          View Booking Page
        </Link>
      </div>
    </aside>
  );
}
