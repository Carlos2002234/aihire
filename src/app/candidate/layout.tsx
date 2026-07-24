import Link from "next/link";

import { NotificationBell } from "@/components/shared/NotificationBell";

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <Link href="/candidate" className="text-sm font-medium text-foreground">
          HireFlow
        </Link>
        <NotificationBell />
      </header>
      {children}
    </div>
  );
}
