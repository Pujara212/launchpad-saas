import { Bell, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <h1 className="text-sm font-semibold text-foreground tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-8 h-8 w-52 text-xs bg-background border-border"
          />
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Bell className="w-4 h-4" />
        </Button>
        <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-accent-foreground" />
        </div>
      </div>
    </header>
  );
}
