import { AppShell } from "@/components/shared/app-shell";
import type { NavItem } from "@/components/shared/app-sidebar";
import { createClient } from "@/lib/supabase/server";

const NAV_ITEMS: NavItem[] = [
  { href: "/recruiter", label: "Dashboard", icon: "dashboard" },
  { href: "/recruiter/jobs", label: "Jobs", icon: "jobs" },
  { href: "/recruiter/company", label: "Mi compañía", icon: "company" },
];

export default async function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
    : { data: null };

  return (
    <AppShell homeHref="/recruiter" navItems={NAV_ITEMS} fullName={profile?.full_name ?? null}>
      {children}
    </AppShell>
  );
}
