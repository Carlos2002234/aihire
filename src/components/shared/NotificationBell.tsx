"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

import { markAllNotificationsReadAction, markNotificationReadAction } from "@/actions/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

function NotificationBell() {
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled || !session) return;

      setUserId(session.user.id);

      const { data } = await supabase
        .from("notifications")
        .select("id, title, body, link, read, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!cancelled && data) setNotifications(data);

      supabase.realtime.setAuth(session.access_token);

      channel = supabase
        .channel("user-notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${session.user.id}`,
          },
          (payload) => {
            const notification = payload.new as Notification;
            setNotifications((prev) => [notification, ...prev].slice(0, 10));
          }
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!userId) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleItemClick(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    markNotificationReadAction(id);
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    markAllNotificationsReadAction();
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button variant="ghost" size="icon-sm" onClick={() => setOpen((o) => !o)}>
        <Bell />
        {unreadCount > 0 && (
          <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 min-w-4 px-1">
            {unreadCount}
          </Badge>
        )}
        <span className="sr-only">Notificaciones</span>
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-border bg-popover p-2 text-sm shadow-lg">
          <div className="flex items-center justify-between px-2 py-1">
            <p className="font-medium text-foreground">Notificaciones</p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>
          <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
            {notifications.length ? (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? "/notifications"}
                  onClick={() => handleItemClick(n.id)}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-lg px-2 py-2 hover:bg-muted",
                    !n.read && "bg-muted/50"
                  )}
                >
                  <p className="font-medium text-foreground">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                </Link>
              ))
            ) : (
              <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                Sin notificaciones todavía
              </p>
            )}
          </div>
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-lg px-2 py-2 text-center text-xs text-primary hover:bg-muted"
          >
            Ver todas
          </Link>
        </div>
      )}
    </div>
  );
}

export { NotificationBell };
