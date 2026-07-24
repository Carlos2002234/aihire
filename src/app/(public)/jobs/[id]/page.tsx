import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Circle,
  DollarSign,
  MapPin,
  Users,
} from "lucide-react";

import { toggleSaveJobAction } from "@/actions/applications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppShell } from "@/components/shared/app-shell";
import { CompanyAvatar } from "@/components/shared/company-avatar";
import { ShareJobButtons } from "@/components/shared/share-job-buttons";
import { EasyApplyModal } from "@/components/candidate/easy-apply-modal";
import { CANDIDATE_NAV_ITEMS, RECRUITER_NAV_ITEMS } from "@/lib/nav-items";
import { EMPLOYMENT_TYPE_LABELS, EXPERIENCE_LABELS, WORK_MODE_LABELS } from "@/lib/job-labels";
import { createClient } from "@/lib/supabase/server";

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "hace instantes";
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days}d`;
  return new Date(iso).toLocaleDateString("es-419", { day: "numeric", month: "long", year: "numeric" });
}

function textLines(text: string | null): string[] {
  if (!text) return [];
  return text
    .split("\n")
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}

export default async function PublicJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*, companies(id, name, logo_url, description, industry, size, locations, benefits)")
    .eq("id", id)
    .single();

  if (!job) notFound();

  const [{ data: requiredSkills }, { data: questions }, { data: similarJobs }] = await Promise.all([
    supabase
      .from("job_required_skills")
      .select("min_years, required, skills(name)")
      .eq("job_id", id),
    supabase.from("job_questions").select("id, question").eq("job_id", id).order("position"),
    supabase
      .from("jobs")
      .select("id, title, work_mode, salary_min, salary_max, salary_currency, location_city, companies(id, name, logo_url)")
      .eq("status", "open")
      .eq("company_id", job.company_id)
      .neq("id", id)
      .limit(3),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isRecruiter = false;
  let fullName: string | null = null;
  let candidateApplyState: {
    isCandidate: boolean;
    alreadyApplied: boolean;
    isSaved: boolean;
    resumes: { id: string; name: string }[];
  } | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    isRecruiter = profile?.role === "recruiter";
    fullName = profile?.full_name ?? null;

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

  const requiredSkillsList = (requiredSkills ?? []).filter((rs) => rs.required);
  const niceToHaveSkillsList = (requiredSkills ?? []).filter((rs) => !rs.required);
  const responsibilityLines = textLines(job.responsibilities);
  const jobUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/jobs/${job.id}`;

  const content = (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Volver a la búsqueda
        </Link>
        <div className="flex items-center gap-2">
          {candidateApplyState ? (
            <>
              <form action={toggleSaveJobAction}>
                <input type="hidden" name="jobId" value={job.id} />
                <Button type="submit" variant="outline" className="gap-1.5">
                  {candidateApplyState.isSaved ? (
                    <BookmarkCheck className="size-4" />
                  ) : (
                    <Bookmark className="size-4" />
                  )}
                  {candidateApplyState.isSaved ? "Guardado" : "Guardar"}
                </Button>
              </form>
              {candidateApplyState.alreadyApplied ? (
                <Badge variant="success" className="h-8 px-3">
                  Ya aplicaste
                </Badge>
              ) : (
                <EasyApplyModal jobId={job.id} resumes={candidateApplyState.resumes} questions={questions ?? []} />
              )}
            </>
          ) : !user ? (
            <Button render={<Link href="/login" />} nativeButton={false}>
              Iniciá sesión para aplicar
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <CompanyAvatar name={job.companies?.name ?? "?"} logoUrl={job.companies?.logo_url} size="size-16" />
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-2xl font-semibold text-foreground">{job.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {job.companies ? (
                <Link href={`/companies/${job.companies.id}`} className="hover:underline">
                  {job.companies.name}
                </Link>
              ) : null}
              {job.location_city ? ` · ${[job.location_city, job.location_country].filter(Boolean).join(", ")}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {job.employment_type && <Badge variant="outline">{EMPLOYMENT_TYPE_LABELS[job.employment_type]}</Badge>}
              {job.work_mode && <Badge variant="outline">{WORK_MODE_LABELS[job.work_mode]}</Badge>}
              {(job.salary_min || job.salary_max) && (
                <Badge variant="success">
                  {job.salary_currency} {job.salary_min?.toLocaleString()}
                  {job.salary_max ? ` – ${job.salary_max.toLocaleString()}` : ""} / año
                </Badge>
              )}
              {job.published_at && <Badge variant="outline">Publicado {relativeTime(job.published_at)}</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {job.description && (
            <Card>
              <CardContent className="flex flex-col gap-2">
                <h2 className="font-heading text-base font-semibold text-foreground">Descripción del puesto</h2>
                <p className="text-sm whitespace-pre-line text-muted-foreground">{job.description}</p>
              </CardContent>
            </Card>
          )}

          {responsibilityLines.length > 0 && (
            <Card>
              <CardContent className="flex flex-col gap-3">
                <h2 className="font-heading text-base font-semibold text-foreground">Responsabilidades</h2>
                <ul className="flex flex-col gap-2">
                  {responsibilityLines.map((line, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                      {line}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {requiredSkillsList.length > 0 && (
            <Card>
              <CardContent className="flex flex-col gap-3">
                <h2 className="font-heading text-base font-semibold text-foreground">Requisitos</h2>
                <ul className="flex flex-col gap-2">
                  {requiredSkillsList.map((rs, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                      {rs.skills?.name}
                      {rs.min_years ? ` — ${rs.min_years}+ años de experiencia` : ""}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {niceToHaveSkillsList.length > 0 && (
            <Card>
              <CardContent className="flex flex-col gap-3">
                <h2 className="font-heading text-base font-semibold text-foreground">Deseables</h2>
                <ul className="flex flex-col gap-2">
                  {niceToHaveSkillsList.map((rs, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Circle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      {rs.skills?.name}
                      {rs.min_years ? ` — ${rs.min_years}+ años de experiencia` : ""}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {job.benefits && (
            <Card>
              <CardContent className="flex flex-col gap-2">
                <h2 className="font-heading text-base font-semibold text-foreground">Beneficios del puesto</h2>
                <p className="text-sm whitespace-pre-line text-muted-foreground">{job.benefits}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-72">
          {job.companies && (
            <Card>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-muted-foreground" />
                  <h2 className="text-sm font-medium text-foreground">Sobre la compañía</h2>
                </div>
                <div className="flex items-center gap-3">
                  <CompanyAvatar name={job.companies.name} logoUrl={job.companies.logo_url} size="size-10" />
                  <p className="font-medium text-foreground">{job.companies.name}</p>
                </div>
                {job.companies.description && (
                  <p className="line-clamp-3 text-xs text-muted-foreground">{job.companies.description}</p>
                )}
                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                  {job.companies.industry && (
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="size-3.5 shrink-0" />
                      {job.companies.industry}
                    </span>
                  )}
                  {job.companies.size && (
                    <span className="flex items-center gap-1.5">
                      <Users className="size-3.5 shrink-0" />
                      {job.companies.size}
                    </span>
                  )}
                  {job.companies.locations?.[0] && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 shrink-0" />
                      {job.companies.locations[0]}
                    </span>
                  )}
                </div>
                <Link
                  href={`/companies/${job.companies.id}`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Ver perfil de la compañía →
                </Link>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-foreground">Detalles del puesto</h2>
              <dl className="flex flex-col gap-2.5 text-xs">
                {job.employment_type && (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-1.5 text-muted-foreground">
                      <Briefcase className="size-3.5 shrink-0" />
                      Tipo de empleo
                    </dt>
                    <dd className="font-medium text-foreground">{EMPLOYMENT_TYPE_LABELS[job.employment_type]}</dd>
                  </div>
                )}
                {job.work_mode && (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0" />
                      Modalidad
                    </dt>
                    <dd className="font-medium text-foreground">{WORK_MODE_LABELS[job.work_mode]}</dd>
                  </div>
                )}
                {job.experience_level && (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="size-3.5 shrink-0" />
                      Experiencia
                    </dt>
                    <dd className="font-medium text-foreground">{EXPERIENCE_LABELS[job.experience_level]}</dd>
                  </div>
                )}
                {(job.salary_min || job.salary_max) && (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-1.5 text-muted-foreground">
                      <DollarSign className="size-3.5 shrink-0" />
                      Salario
                    </dt>
                    <dd className="font-medium text-foreground">
                      {job.salary_currency} {job.salary_min?.toLocaleString()}
                      {job.salary_max ? ` – ${job.salary_max.toLocaleString()}` : ""}
                    </dd>
                  </div>
                )}
                {job.published_at && (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="size-3.5 shrink-0" />
                      Publicado
                    </dt>
                    <dd className="font-medium text-foreground">{relativeTime(job.published_at)}</dd>
                  </div>
                )}
              </dl>

              {job.companies?.benefits?.length ? (
                <>
                  <div className="h-px bg-border" />
                  <p className="text-xs font-medium text-foreground">Beneficios de la compañía</p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.companies.benefits.map((benefit) => (
                      <Badge key={benefit} variant="secondary">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-foreground">Compartir este job</h2>
              <ShareJobButtons jobUrl={jobUrl} jobTitle={job.title} />
            </CardContent>
          </Card>
        </div>
      </div>

      {similarJobs?.length ? (
        <div>
          <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">Jobs similares</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {similarJobs.map((sj) => (
              <Link key={sj.id} href={`/jobs/${sj.id}`}>
                <Card className="h-full transition-colors hover:bg-muted/40">
                  <CardContent className="flex flex-col gap-2">
                    <CompanyAvatar name={sj.companies?.name ?? "?"} logoUrl={sj.companies?.logo_url} size="size-9" />
                    <div>
                      <p className="truncate text-sm font-medium text-foreground">{sj.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{sj.companies?.name}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {sj.work_mode && <Badge variant="outline">{WORK_MODE_LABELS[sj.work_mode]}</Badge>}
                      {(sj.salary_min || sj.salary_max) && (
                        <Badge variant="success">
                          {sj.salary_currency} {sj.salary_min ? Math.round(sj.salary_min / 1000) : "?"}k
                          {sj.salary_max ? `–${Math.round(sj.salary_max / 1000)}k` : ""}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );

  if (user) {
    return (
      <AppShell
        homeHref={isRecruiter ? "/recruiter" : "/candidate"}
        navItems={isRecruiter ? RECRUITER_NAV_ITEMS : CANDIDATE_NAV_ITEMS}
        fullName={fullName}
      >
        {content}
      </AppShell>
    );
  }

  return <div className="min-h-screen bg-background">{content}</div>;
}
