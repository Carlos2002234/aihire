import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
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

  const { data: requiredSkills } = await supabase
    .from("job_required_skills")
    .select("min_years, required, skills(name)")
    .eq("job_id", id);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-1">
        <PageHeader title={job.title} className="border-none pb-0" />
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
