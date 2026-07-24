import Link from "next/link";
import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ApplicationsList } from "@/components/candidate/applications-list";
import { createClient } from "@/lib/supabase/server";

export default async function CandidateApplicationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: applications } = await supabase
    .from("applications")
    .select("id, jobs(title, companies(name)), application_events(id, to_stage, note, created_at)")
    .eq("candidate_id", user.id)
    .order("created_at", { ascending: false });

  const items = (applications ?? []).map((a) => ({
    id: a.id,
    jobTitle: a.jobs?.title ?? "Job",
    companyName: a.jobs?.companies?.name ?? null,
    events: a.application_events ?? [],
  }));

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
      <PageHeader
        title="Mis aplicaciones"
        description="El estado se actualiza en vivo apenas el recruiter mueve tu aplicación."
      />

      {items.length ? (
        <ApplicationsList initialApplications={items} />
      ) : (
        <EmptyState
          icon={Inbox}
          title="Aún no tienes aplicaciones"
          description="Cuando apliques a un job, vas a poder seguir el estado de tu aplicación acá en tiempo real."
          action={
            <Button render={<Link href="/jobs" />} nativeButton={false}>
              Explorar jobs
            </Button>
          }
        />
      )}
    </main>
  );
}
