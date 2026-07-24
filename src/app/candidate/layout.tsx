import { AppShell } from "@/components/shared/app-shell";
import type { NavItem } from "@/components/shared/app-sidebar";
import { createClient } from "@/lib/supabase/server";

const NAV_ITEMS: NavItem[] = [
  { href: "/candidate", label: "Dashboard", icon: "dashboard" },
  { href: "/jobs", label: "Jobs", icon: "jobs" },
  { href: "/candidate/applications", label: "Aplicaciones", icon: "applications" },
  { href: "/candidate/coach", label: "Career Coach", icon: "coach", badge: "Nuevo" },
  { href: "/candidate/passport", label: "Career Passport", icon: "passport" },
  { href: "/candidate/roadmap", label: "Roadmap", icon: "roadmap" },
];

export default async function CandidateLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
    : { data: null };

  return (
    <AppShell homeHref="/candidate" navItems={NAV_ITEMS} fullName={profile?.full_name ?? null}>
      {children}
    </AppShell>
  );
}
