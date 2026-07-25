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

  return (
    <main className="flex flex-col gap-6 px-6 py-6">
      <PageHeader
        title="CV Builder"
        description="Generá una versión de tu CV ajustada a una posición específica con IA, revisala y exportala en PDF."
      />
      <ResumeBuilderClient />
    </main>
  );
}
