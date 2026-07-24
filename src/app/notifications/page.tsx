import { BellOff } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, body, link, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12">
      <PageHeader title="Notificaciones" description="Todo lo que pasó en tus aplicaciones y jobs." />

      {notifications?.length ? (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={n.link ?? "/notifications"}
              className={cn(
                "flex flex-col gap-1 rounded-lg border border-border p-3 text-sm hover:bg-muted/50",
                !n.read && "bg-muted/30"
              )}
            >
              <p className="font-medium text-foreground">{n.title}</p>
              {n.body && <p className="text-muted-foreground">{n.body}</p>}
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={BellOff} title="Sin notificaciones" description="Acá vas a ver todo lo que pase con tus aplicaciones y jobs." />
      )}
    </main>
  );
}
