import {
  Bookmark,
  Mic,
  Search as SearchIcon,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CircularProgress } from "@/components/shared/circular-progress";
import { DonutChart } from "@/components/shared/donut-chart";
import { Sparkline } from "@/components/shared/sparkline";
import { createClient } from "@/lib/supabase/server";

// Hash determinístico (no criptográfico) solo para variar el "match %" mock
// por job de forma estable entre renders, sin persistir nada.
function mockMatchPercent(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return 80 + (hash % 16);
}

function CompanyAvatar({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={name} className="size-11 rounded-lg object-cover" />;
  }
  return (
    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-foreground">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default async function CandidateDashboardPage() {
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

  const { data: candidateProfile } = await supabase
    .from("candidate_profiles")
    .select("completion_pct")
    .eq("id", user.id)
    .single();

  const { data: applications } = await supabase
    .from("applications")
    .select("id, stage, created_at, application_events(created_at)")
    .eq("candidate_id", user.id)
    .order("created_at", { referencedTable: "application_events" });

  const { count: feedbackCount } = await supabase
    .from("feedback")
    .select("id", { count: "exact", head: true });

  const { count: savedJobsCount } = await supabase
    .from("saved_jobs")
    .select("job_id", { count: "exact", head: true })
    .eq("candidate_id", user.id);

  const { data: featuredJobs } = await supabase
    .from("jobs")
    .select(
      "id, title, salary_min, salary_max, salary_currency, location_city, location_country, work_mode, experience_level, companies(name, logo_url)"
    )
    .eq("status", "open")
    .order("published_at", { ascending: false })
    .limit(3);

  const { data: openJobsForCompanies } = await supabase
    .from("jobs")
    .select("company_id, companies(name, logo_url)")
    .eq("status", "open");

  const stageCounts = new Map<string, number>();
  let interviewOrBetter = 0;
  for (const app of applications ?? []) {
    stageCounts.set(app.stage, (stageCounts.get(app.stage) ?? 0) + 1);
    if (app.stage !== "applied" && app.stage !== "rejected") interviewOrBetter += 1;
  }
  const totalApplications = applications?.length ?? 0;
  const offerCount = stageCounts.get("offer") ?? 0;
  const rejectedCount = stageCounts.get("rejected") ?? 0;
  const interviewCount =
    (stageCounts.get("interview") ?? 0) +
    (stageCounts.get("technical_interview") ?? 0) +
    (stageCounts.get("final_interview") ?? 0);
  const appliedOnlyCount = totalApplications - offerCount - rejectedCount - interviewCount;
  const interviewRate = totalApplications > 0 ? Math.round((interviewOrBetter / totalApplications) * 100) : 0;

  const companyCounts = new Map<string, { name: string; logoUrl: string | null; count: number }>();
  for (const job of openJobsForCompanies ?? []) {
    if (!job.companies) continue;
    const key = job.company_id;
    const existing = companyCounts.get(key);
    if (existing) existing.count += 1;
    else companyCounts.set(key, { name: job.companies.name, logoUrl: job.companies.logo_url, count: 1 });
  }
  const topCompanies = [...companyCounts.values()].sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="flex gap-6 px-6 py-6">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8">
          <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-primary/20 blur-3xl" />
          <p className="text-lg">Hola de nuevo, {profile?.full_name?.split(" ")[0] ?? "candidato"} 👋</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold text-foreground">
            Encontrá tu próxima <span className="text-primary">oportunidad</span>
          </h1>

          <form action="/jobs" className="relative mt-6 flex max-w-xl gap-2">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                name="q"
                placeholder="Buscar jobs, roles o compañías…"
                className="w-full rounded-lg border border-input bg-background py-2.5 pr-3 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <Button type="submit">Buscar</Button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {["remote", "hybrid", "onsite"].map((mode) => (
              <Button
                key={mode}
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={`/jobs?work_mode=${mode}`} />}
              >
                {mode === "remote" ? "Remoto" : mode === "hybrid" ? "Híbrido" : "Presencial"}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-foreground">Jobs destacados</h2>
            <Link href="/jobs" className="text-sm text-primary hover:underline">
              Ver todos los jobs →
            </Link>
          </div>
          {featuredJobs?.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featuredJobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <CompanyAvatar name={job.companies?.name ?? "?"} logoUrl={job.companies?.logo_url} />
                      <Badge variant="success">{mockMatchPercent(job.id)}% Match</Badge>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{job.title}</p>
                      <p className="text-sm text-muted-foreground">{job.companies?.name}</p>
                    </div>
                    {(job.salary_min || job.salary_max) && (
                      <p className="text-sm text-foreground">
                        {job.salary_currency} {job.salary_min?.toLocaleString()}
                        {job.salary_max ? ` – ${job.salary_max.toLocaleString()}` : ""}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                      {job.location_city && <Badge variant="outline">{job.location_city}</Badge>}
                      {job.work_mode && <Badge variant="outline">{job.work_mode}</Badge>}
                    </div>
                    <Button size="sm" nativeButton={false} render={<Link href={`/jobs/${job.id}`} />}>
                      Ver job
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Todavía no hay jobs publicados.</p>
          )}
        </div>

        {topCompanies.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-foreground">Compañías contratando</h2>
              <Link href="/jobs" className="text-sm text-primary hover:underline">
                Ver todas →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {topCompanies.map((company) => (
                <Card key={company.name} size="sm">
                  <CardContent className="flex flex-col items-center gap-2 text-center">
                    <CompanyAvatar name={company.name} logoUrl={company.logoUrl} />
                    <p className="text-sm font-medium text-foreground">{company.name}</p>
                    <p className="text-xs text-muted-foreground">{company.count} jobs abiertos</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Card className="bg-gradient-to-br from-primary/10 to-transparent">
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="size-8 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-foreground">Dejá que la IA encuentre tus mejores matches</p>
                <p className="text-sm text-muted-foreground">
                  Basado en tu Career Passport y tus skills.
                </p>
              </div>
            </div>
            <Button nativeButton={false} render={<Link href="/jobs" />}>
              Ver matches
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="hidden w-72 shrink-0 flex-col gap-4 xl:flex">
        <Card>
          <CardContent className="flex items-center gap-4">
            <CircularProgress value={candidateProfile?.completion_pct ?? 0} color="var(--primary)" />
            <div>
              <p className="text-sm font-medium text-foreground">Completitud del perfil</p>
              <p className="text-xs text-muted-foreground">
                Completá tu Career Passport para mejores matches.
              </p>
              <Link href="/candidate/passport" className="mt-1 inline-block text-xs text-primary hover:underline">
                Completar perfil →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm font-medium text-foreground">Seguimiento de aplicaciones</p>
            <DonutChart
              data={[
                { label: "Aplicado", value: appliedOnlyCount, color: "var(--chart-1)" },
                { label: "Entrevista", value: interviewCount, color: "var(--chart-2)" },
                { label: "Oferta", value: offerCount, color: "var(--success)" },
                { label: "Rechazado", value: rejectedCount, color: "var(--destructive)" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Mic className="size-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Preparación de entrevistas</p>
            </div>
            <p className="text-xs text-muted-foreground">Practicá según el job al que querés aplicar.</p>
            <Button variant="outline" size="sm" disabled>
              Próximamente
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm font-medium text-foreground">Feedback recibido</p>
            <p className="text-2xl font-semibold text-foreground">{feedbackCount ?? 0}</p>
            <div className="h-px bg-border" />
            <p className="text-sm font-medium text-foreground">Jobs guardados</p>
            <div className="flex items-center gap-2">
              <Bookmark className="size-4 text-muted-foreground" />
              <p className="text-2xl font-semibold text-foreground">{savedJobsCount ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm font-medium text-foreground">Tu actividad</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Aplicaciones</p>
                <p className="text-lg font-semibold text-foreground">{totalApplications}</p>
                <Sparkline data={[2, 3, 2, 4, totalApplications || 1]} color="var(--chart-1)" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tasa de entrevista</p>
                <p className="text-lg font-semibold text-foreground">{interviewRate}%</p>
                <Sparkline data={[10, 15, 12, 20, interviewRate || 1]} color="var(--success)" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
