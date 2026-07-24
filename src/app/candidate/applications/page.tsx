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
    .select(
      "id, stage, created_at, jobs(title, work_mode, employment_type, companies(name)), application_events(id, to_stage, note, created_at), feedback(ai_message, strengths, areas_to_improve)"
    )
    .eq("candidate_id", user.id)
    .order("created_at", { ascending: false });

  const items = (applications ?? []).map((a) => ({
    id: a.id,
    stage: a.stage,
    createdAt: a.created_at,
    jobTitle: a.jobs?.title ?? "Job",
    companyName: a.jobs?.companies?.name ?? null,
    employmentType: a.jobs?.employment_type ?? null,
    events: a.application_events ?? [],
    feedback: a.feedback
      ? {
          aiMessage: a.feedback.ai_message,
          strengths: a.feedback.strengths,
          areasToImprove: a.feedback.areas_to_improve,
        }
      : null,
  }));

  return (
    <main className="flex flex-col gap-6 px-6 py-6">
      <PageHeader
        title="Aplicaciones"
        description="Seguí y gestioná todas tus aplicaciones en un solo lugar."
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
