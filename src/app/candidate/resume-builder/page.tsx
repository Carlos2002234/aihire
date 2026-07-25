import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { ResumeBuilderClient } from "@/components/candidate/resume-builder-client";
import { createClient } from "@/lib/supabase/server";

export default async function ResumeBuilderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: candidateProfile }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url, location_city, location_country")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("candidate_profiles").select("linkedin_url").eq("id", user.id).maybeSingle(),
  ]);

  return (
    <main className="flex flex-col gap-6 px-6 py-6">
      <PageHeader
        title="CV Builder"
        description="Generá una versión de tu CV ajustada a una posición específica con IA, revisala y exportala en PDF."
      />
      <ResumeBuilderClient
        fullName={profile?.full_name ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        email={user.email ?? null}
        location={[profile?.location_city, profile?.location_country].filter(Boolean).join(", ") || null}
        linkedinUrl={candidateProfile?.linkedin_url ?? null}
      />
    </main>
  );
}
