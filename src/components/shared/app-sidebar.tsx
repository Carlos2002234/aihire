"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bot,
  Briefcase,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  LayoutDashboard,
  Map,
  UserRound,
  Wand2,
} from "lucide-react";

import { cn } from "@/lib/utils";

const ICONS = {
  dashboard: LayoutDashboard,
  jobs: Briefcase,
  applications: FileText,
  coach: Bot,
  passport: UserRound,
  roadmap: Map,
  company: Building2,
  resumeBuilder: Wand2,
} as const;

type IconName = keyof typeof ICONS;

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  badge?: string;
}

function AppSidebar({
  homeHref,
  navItems,
  footer,
}: {
  homeHref: string;
  navItems: NavItem[];
  footer?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width]",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex items-center justify-between px-4 py-4">
        <Link href={homeHref} className="flex items-center gap-2 overflow-hidden">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            H
          </span>
          {!collapsed && <span className="font-heading text-sm font-semibold">HireFlow</span>}
        </Link>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {navItems.map((item) => {
          const isActive =
            item.href === homeHref ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = ICONS[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && (
                <span className="flex flex-1 items-center justify-between gap-2 truncate">
                  {item.label}
                  {item.badge && (
                    <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      {item.badge}
                    </span>
                  )}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {footer && !collapsed && <div className="px-3 pb-4">{footer}</div>}
    </aside>
  );
}

export { AppSidebar };
export type { IconName, NavItem };
