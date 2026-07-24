import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { PipelineBoard } from "@/components/recruiter/pipeline-board";
import { createClient } from "@/lib/supabase/server";

export default async function RecruiterPipelinePage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: job } = await supabase.from("jobs").select("id, title").eq("id", jobId).single();
  if (!job) notFound();

  const { data: applications } = await supabase
    .from("applications")
    .select(
      "id, stage, candidate_profiles(profiles(full_name)), resumes(name), ai_evaluations(match_score, summary)"
    )
    .eq("job_id", jobId);

  const pipelineApplications = (applications ?? []).map((a) => ({
    id: a.id,
    stage: a.stage,
    candidateName: a.candidate_profiles?.profiles?.full_name ?? "Candidato",
    resumeName: a.resumes?.name ?? "CV",
    matchScore: a.ai_evaluations?.match_score ?? null,
    summary: a.ai_evaluations?.summary ?? null,
  }));

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12">
      <PageHeader
        title={job.title}
        description="Arrastrá las tarjetas entre columnas para mover a un candidato de etapa."
      />

      {pipelineApplications.length ? (
        <PipelineBoard jobId={jobId} applications={pipelineApplications} />
      ) : (
        <EmptyState title="Todavía no llegaron aplicaciones para este job" />
      )}
    </main>
  );
}
