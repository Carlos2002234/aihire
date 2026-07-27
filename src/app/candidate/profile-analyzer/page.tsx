import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { ProfileAnalyzerClient } from "@/components/candidate/profile-analyzer-client";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileAnalyzerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="flex flex-col gap-6 px-6 py-6">
      <PageHeader
        title="Analizador de Perfil"
        description="Analizá tu Career Passport con IA y recibí sugerencias concretas para mejorarlo."
      />
      <ProfileAnalyzerClient />
    </main>
  );
}
