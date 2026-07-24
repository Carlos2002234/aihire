import { redirect } from "next/navigation";

import { signOutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/server";

export default async function RecruiterDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHeader
        title={`Hola, ${profile?.full_name ?? "recruiter"}`}
        description="Dashboard de recruiter — placeholder de Módulo 2. El contenido real llega en módulos futuros."
        actions={
          <form action={signOutAction}>
            <Button type="submit" variant="outline">
              Cerrar sesión
            </Button>
          </form>
        }
      />
    </main>
  );
}
