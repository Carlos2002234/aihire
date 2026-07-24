"use client";

import { Menu } from "@base-ui/react/menu";
import { ChevronDown, LogOut } from "lucide-react";

import { signOutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";

function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

function UserMenu({ fullName }: { fullName: string | null }) {
  return (
    <Menu.Root>
      <Menu.Trigger
        className={cn(
          "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none hover:bg-muted",
          "focus-visible:ring-3 focus-visible:ring-ring/50"
        )}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initials(fullName).toUpperCase()}
        </span>
        <span className="hidden text-sm font-medium text-foreground sm:inline">
          {fullName ?? "Usuario"}
        </span>
        <ChevronDown className="hidden size-3.5 text-muted-foreground sm:inline" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="end">
          <Menu.Popup className="min-w-40 rounded-xl border border-border bg-popover p-1 text-sm text-popover-foreground shadow-lg outline-none">
            <Menu.Item
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 outline-none data-[highlighted]:bg-muted"
              onClick={() => {
                signOutAction();
              }}
            >
              <LogOut className="size-4" />
              Cerrar sesión
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

export { UserMenu };
