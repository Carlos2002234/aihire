import { AppShell } from "@/components/shared/app-shell";
import { CANDIDATE_NAV_ITEMS as NAV_ITEMS } from "@/lib/nav-items";
import { createClient } from "@/lib/supabase/server";

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
