import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";

import { toggleSaveJobAction } from "@/actions/applications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EasyApplyModal } from "@/components/candidate/easy-apply-modal";
import { createClient } from "@/lib/supabase/server";

export default async function PublicJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*, companies(id, name)")
    .eq("id", id)
    .single();

  if (!job) notFound();

  const [{ data: requiredSkills }, { data: questions }] = await Promise.all([
    supabase
      .from("job_required_skills")
      .select("min_years, required, skills(name)")
      .eq("job_id", id),
    supabase.from("job_questions").select("id, question").eq("job_id", id).order("position"),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let candidateApplyState: {
    isCandidate: boolean;
    alreadyApplied: boolean;
    isSaved: boolean;
    resumes: { id: string; name: string }[];
  } | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "candidate") {
      const [{ data: application }, { data: savedJob }, { data: resumes }] = await Promise.all([
        supabase
          .from("applications")
          .select("id")
          .eq("job_id", id)
          .eq("candidate_id", user.id)
          .maybeSingle(),
        supabase
          .from("saved_jobs")
          .select("job_id")
          .eq("job_id", id)
          .eq("candidate_id", user.id)
          .maybeSingle(),
        supabase.from("resumes").select("id, name").eq("candidate_id", user.id),
      ]);

      candidateApplyState = {
        isCandidate: true,
        alreadyApplied: !!application,
        isSaved: !!savedJob,
        resumes: resumes ?? [],
      };
    }
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-1">
        <PageHeader
          title={job.title}
          className="border-none pb-0"
          actions={
            candidateApplyState ? (
              <div className="flex items-center gap-2">
                {candidateApplyState.alreadyApplied ? (
                  <Badge variant="success">Ya aplicaste</Badge>
                ) : (
                  <EasyApplyModal
                    jobId={job.id}
                    resumes={candidateApplyState.resumes}
                    questions={questions ?? []}
                  />
                )}
                <form action={toggleSaveJobAction}>
                  <input type="hidden" name="jobId" value={job.id} />
                  <Button
                    type="submit"
                    variant="outline"
                    size="icon"
                    aria-label={candidateApplyState.isSaved ? "Quitar de guardados" : "Guardar job"}
                  >
                    {candidateApplyState.isSaved ? <BookmarkCheck /> : <Bookmark />}
                  </Button>
                </form>
              </div>
            ) : !user ? (
              <Button variant="outline" render={<Link href="/login" />} nativeButton={false}>
                Iniciá sesión para aplicar
              </Button>
            ) : null
          }
        />
        {job.companies ? (
          <Link
            href={`/companies/${job.companies.id}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            {job.companies.name}
          </Link>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {job.work_mode ? <Badge variant="outline">{job.work_mode}</Badge> : null}
        {job.employment_type ? <Badge variant="outline">{job.employment_type}</Badge> : null}
        {job.experience_level ? <Badge variant="outline">{job.experience_level}</Badge> : null}
        {job.location_city ? <Badge variant="outline">{job.location_city}</Badge> : null}
        {job.salary_min || job.salary_max ? (
          <Badge variant="outline">
            {job.salary_currency} {job.salary_min ?? "?"} – {job.salary_max ?? "?"}
          </Badge>
        ) : null}
      </div>

      {job.description ? (
        <section className="flex flex-col gap-1">
          <h2 className="text-sm font-medium text-foreground">Descripción</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{job.description}</p>
        </section>
      ) : null}

      {job.responsibilities ? (
        <section className="flex flex-col gap-1">
          <h2 className="text-sm font-medium text-foreground">Responsabilidades</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{job.responsibilities}</p>
        </section>
      ) : null}

      {job.benefits ? (
        <section className="flex flex-col gap-1">
          <h2 className="text-sm font-medium text-foreground">Beneficios</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{job.benefits}</p>
        </section>
      ) : null}

      {requiredSkills?.length ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-foreground">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {requiredSkills.map((rs, i) => (
              <Badge key={i} variant={rs.required ? "secondary" : "outline"}>
                {rs.skills?.name}
                {rs.min_years ? ` · ${rs.min_years}+ años` : ""}
              </Badge>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
