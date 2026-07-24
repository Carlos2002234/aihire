import { Search } from "lucide-react";

import { NotificationBell } from "@/components/shared/NotificationBell";
import { UserMenu } from "@/components/shared/user-menu";
import { AppSidebar, type NavItem } from "./app-sidebar";

function AppShell({
  homeHref,
  navItems,
  fullName,
  sidebarFooter,
  children,
}: {
  homeHref: string;
  navItems: NavItem[];
  fullName: string | null;
  sidebarFooter?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar homeHref={homeHref} navItems={navItems} footer={sidebarFooter} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-4 border-b border-border px-6 py-3">
          <form action="/jobs" className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              name="q"
              placeholder="Buscar jobs, compañías o skills…"
              className="w-full rounded-lg border border-input bg-transparent py-2 pr-3 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </form>
          <div className="ml-auto flex items-center gap-3">
            <NotificationBell />
            <UserMenu fullName={fullName} />
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

export { AppShell };
