import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col ml-60 min-w-0 overflow-hidden">
        <TopBar title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
