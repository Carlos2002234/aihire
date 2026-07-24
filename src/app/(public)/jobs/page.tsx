import { Bell, Bookmark, Briefcase, Search as SearchIcon, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";

import { toggleSaveJobAction } from "@/actions/applications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AppShell } from "@/components/shared/app-shell";
import { CompanyAvatar } from "@/components/shared/company-avatar";
import { Sparkline } from "@/components/shared/sparkline";
import { CANDIDATE_NAV_ITEMS, RECRUITER_NAV_ITEMS } from "@/lib/nav-items";
import { createClient } from "@/lib/supabase/server";

const WORK_MODES = ["remote", "hybrid", "onsite"] as const;
const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "internship"] as const;
const EXPERIENCE_LEVELS = ["intern", "junior", "mid", "senior", "staff", "lead"] as const;
const SALARY_FLOORS = [0, 50000, 100000, 150000] as const;
const PAGE_SIZE = 6;

const WORK_MODE_LABELS: Record<(typeof WORK_MODES)[number], string> = {
  remote: "Remoto",
  hybrid: "Híbrido",
  onsite: "Presencial",
};
const EMPLOYMENT_TYPE_LABELS: Record<(typeof EMPLOYMENT_TYPES)[number], string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contrato",
  internship: "Pasantía",
};
const EXPERIENCE_LABELS: Record<(typeof EXPERIENCE_LEVELS)[number], string> = {
  intern: "Intern",
  junior: "Junior",
  mid: "Mid level",
  senior: "Senior level",
  staff: "Staff",
  lead: "Lead",
};

function selectClassName() {
  return "h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
}

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "hace instantes";
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

interface SearchParams {
  q?: string;
  location?: string;
  work_mode?: string;
  employment_type?: string;
  experience_level?: string;
  company?: string;
  salary_min?: string;
  sort?: string;
  page?: string;
}

function buildHref(current: SearchParams, overrides: Partial<SearchParams>): string {
  const params = new URLSearchParams();
  const merged = { ...current, ...overrides };
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/jobs?${qs}` : "/jobs";
}

export default async function JobsBoardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const { q, location, work_mode, employment_type, experience_level, company, salary_min, sort } = sp;
  const page = Math.max(1, Number(sp.page) || 1);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isCandidate = false;
  let isRecruiter = false;
  let fullName: string | null = null;
  const savedJobIds = new Set<string>();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .maybeSingle();
    isCandidate = profile?.role === "candidate";
    isRecruiter = profile?.role === "recruiter";
    fullName = profile?.full_name ?? null;
    if (isCandidate) {
      const { data: saved } = await supabase.from("saved_jobs").select("job_id").eq("candidate_id", user.id);
      for (const s of saved ?? []) savedJobIds.add(s.job_id);
    }
  }

  let query = supabase
    .from("jobs")
    .select(
      "id, title, location_country, location_city, work_mode, employment_type, experience_level, salary_min, salary_max, salary_currency, published_at, companies(id, name, logo_url)",
      { count: "exact" }
    )
    .eq("status", "open");

  if (q) query = query.ilike("title", `%${q}%`);
  if (location) query = query.or(`location_city.ilike.%${location}%,location_country.ilike.%${location}%`);
  if (work_mode) query = query.eq("work_mode", work_mode as (typeof WORK_MODES)[number]);
  if (employment_type) query = query.eq("employment_type", employment_type as (typeof EMPLOYMENT_TYPES)[number]);
  if (experience_level) query = query.eq("experience_level", experience_level as (typeof EXPERIENCE_LEVELS)[number]);
  if (company) query = query.eq("company_id", company);
  if (salary_min) query = query.gte("salary_min", Number(salary_min));

  query = sort === "salary" ? query.order("salary_max", { ascending: false }) : query.order("published_at", { ascending: false });
  query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data: jobs, count } = await query;

  const { data: companiesWithOpenJobs } = await supabase
    .from("jobs")
    .select("companies(id, name)")
    .eq("status", "open");
  const companyOptions = new Map<string, string>();
  for (const j of companiesWithOpenJobs ?? []) {
    if (j.companies) companyOptions.set(j.companies.id, j.companies.name);
  }

  // Market insights: skills más pedidas y salario promedio, sobre TODOS los
  // jobs abiertos (no solo la página filtrada actual).
  const { data: insightJobs } = await supabase
    .from("jobs")
    .select("salary_min, salary_max, job_required_skills(skills(name))")
    .eq("status", "open");

  const skillCounts = new Map<string, number>();
  const salaries: number[] = [];
  for (const j of insightJobs ?? []) {
    if (j.salary_min && j.salary_max) salaries.push((j.salary_min + j.salary_max) / 2);
    for (const rs of j.job_required_skills ?? []) {
      if (rs.skills) skillCounts.set(rs.skills.name, (skillCounts.get(rs.skills.name) ?? 0) + 1);
    }
  }
  const topSkills = [...skillCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name]) => name);
  const avgSalary = salaries.length ? Math.round(salaries.reduce((s, v) => s + v, 0) / salaries.length) : null;

  interface RecommendedJob {
    id: string;
    title: string;
    companies: { id: string; name: string; logo_url: string | null } | null;
  }
  let recommended: RecommendedJob[] = [];
  if (isCandidate) {
    const shownIds = (jobs ?? []).map((j) => j.id);
    const { data: recs } = await supabase
      .from("jobs")
      .select("id, title, location_country, location_city, published_at, companies(id, name, logo_url)")
      .eq("status", "open")
      .order("published_at", { ascending: false })
      .limit(shownIds.length + 4);
    recommended = (recs ?? []).filter((j) => !shownIds.includes(j.id)).slice(0, 4);
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const activeFilters: Array<{ key: keyof SearchParams; label: string }> = [];
  if (work_mode) activeFilters.push({ key: "work_mode", label: WORK_MODE_LABELS[work_mode as (typeof WORK_MODES)[number]] });
  if (employment_type)
    activeFilters.push({ key: "employment_type", label: EMPLOYMENT_TYPE_LABELS[employment_type as (typeof EMPLOYMENT_TYPES)[number]] });
  if (experience_level)
    activeFilters.push({ key: "experience_level", label: EXPERIENCE_LABELS[experience_level as (typeof EXPERIENCE_LEVELS)[number]] });
  if (company) activeFilters.push({ key: "company", label: companyOptions.get(company) ?? "Compañía" });
  if (salary_min) activeFilters.push({ key: "salary_min", label: `Desde $${Number(salary_min).toLocaleString()}` });

  const content = (
    <div className="mx-auto flex max-w-6xl gap-6 px-6 py-6">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-semibold text-foreground">Jobs</h1>
              <p className="text-sm text-muted-foreground">Descubrí oportunidades que matcheen con tus skills.</p>
            </div>
            {isCandidate && (
              <Button variant="outline" nativeButton={false} render={<Link href="/candidate/passport" />}>
                <Bookmark className="size-4" />
                Ver guardados
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="flex flex-col gap-3">
              <form className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    name="q"
                    defaultValue={q ?? ""}
                    placeholder="ej. Software Engineer, Product Manager…"
                    className="w-full rounded-lg border border-input bg-transparent py-2 pr-3 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  />
                </div>
                <div className="relative flex-1">
                  <Briefcase className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    name="location"
                    defaultValue={location ?? ""}
                    placeholder="ej. Buenos Aires, Remoto…"
                    className="w-full rounded-lg border border-input bg-transparent py-2 pr-3 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  />
                </div>
                <Button type="submit" className="shrink-0">
                  Buscar
                </Button>
              </form>

              <form className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="q" value={q ?? ""} />
                <input type="hidden" name="location" value={location ?? ""} />
                <select name="experience_level" defaultValue={experience_level ?? ""} className={selectClassName()}>
                  <option value="">Nivel de experiencia</option>
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {EXPERIENCE_LABELS[lvl]}
                    </option>
                  ))}
                </select>
                <select name="salary_min" defaultValue={salary_min ?? ""} className={selectClassName()}>
                  <option value="">Salario</option>
                  {SALARY_FLOORS.filter((f) => f > 0).map((floor) => (
                    <option key={floor} value={floor}>
                      Desde ${floor.toLocaleString()}
                    </option>
                  ))}
                </select>
                <select name="company" defaultValue={company ?? ""} className={selectClassName()}>
                  <option value="">Compañía</option>
                  {[...companyOptions.entries()].map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
                <select name="work_mode" defaultValue={work_mode ?? ""} className={selectClassName()}>
                  <option value="">Modalidad</option>
                  {WORK_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {WORK_MODE_LABELS[mode]}
                    </option>
                  ))}
                </select>
                <select name="employment_type" defaultValue={employment_type ?? ""} className={selectClassName()}>
                  <option value="">Tipo de empleo</option>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {EMPLOYMENT_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
                <select name="sort" defaultValue={sort ?? "newest"} className={selectClassName()}>
                  <option value="newest">Más recientes</option>
                  <option value="salary">Mayor salario</option>
                </select>
                <Button type="submit" variant="outline" size="sm">
                  Aplicar filtros
                </Button>
              </form>

              {activeFilters.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {activeFilters.map((f) => (
                    <Link key={f.key} href={buildHref(sp, { [f.key]: undefined, page: undefined })}>
                      <Badge variant="secondary">{f.label} ✕</Badge>
                    </Link>
                  ))}
                  <Link href="/jobs" className="text-xs text-primary hover:underline">
                    Limpiar todo
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{count ?? 0}</span> jobs abiertos
          </p>

          {jobs?.length ? (
            <ul className="flex flex-col gap-3">
              {jobs.map((job) => (
                <li key={job.id}>
                  <Card>
                    <CardContent className="flex items-start gap-4">
                      <Link href={`/jobs/${job.id}`} className="shrink-0">
                        <CompanyAvatar name={job.companies?.name ?? "?"} logoUrl={job.companies?.logo_url} />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/jobs/${job.id}`} className="min-w-0">
                            <p className="truncate font-medium text-foreground hover:underline">{job.title}</p>
                            <p className="text-sm text-muted-foreground">{job.companies?.name}</p>
                          </Link>
                          <div className="shrink-0 text-right">
                            {(job.salary_min || job.salary_max) && (
                              <p className="font-medium text-success">
                                {job.salary_currency} {job.salary_min ? Math.round(job.salary_min / 1000) : "?"}k
                                {job.salary_max ? ` – ${Math.round(job.salary_max / 1000)}k` : ""}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">{relativeTime(job.published_at)}</p>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {[job.location_city, job.location_country].filter(Boolean).join(", ")}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {job.work_mode && <Badge variant="outline">{WORK_MODE_LABELS[job.work_mode]}</Badge>}
                          {job.employment_type && (
                            <Badge variant="outline">{EMPLOYMENT_TYPE_LABELS[job.employment_type]}</Badge>
                          )}
                          {job.experience_level && (
                            <Badge variant="outline">{EXPERIENCE_LABELS[job.experience_level]}</Badge>
                          )}
                        </div>
                      </div>
                      {isCandidate && (
                        <form action={toggleSaveJobAction} className="shrink-0">
                          <input type="hidden" name="jobId" value={job.id} />
                          <Button type="submit" variant="ghost" size="icon-sm" aria-label="Guardar job">
                            <Bookmark
                              className={savedJobIds.has(job.id) ? "fill-primary text-primary" : "text-muted-foreground"}
                            />
                          </Button>
                        </form>
                      )}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No hay jobs abiertos con esos filtros" />
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildHref(sp, { page: p === 1 ? undefined : String(p) })}
                  className={
                    p === page
                      ? "flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground"
                      : "flex size-8 items-center justify-center rounded-lg text-sm text-muted-foreground hover:bg-muted"
                  }
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="hidden w-72 shrink-0 flex-col gap-4 xl:flex">
          {isCandidate && recommended.length > 0 && (
            <Card>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm font-medium text-foreground">Recomendados para vos</p>
                {recommended.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-center gap-2">
                    <CompanyAvatar name={job.companies?.name ?? "?"} logoUrl={job.companies?.logo_url} size="size-8" />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground">{job.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{job.companies?.name}</p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm font-medium text-foreground">Market insights</p>
              {topSkills.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Skills más pedidas</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {topSkills.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {avgSalary != null && (
                <div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="size-3.5" />
                    Salario promedio
                  </div>
                  <p className="text-xl font-semibold text-foreground">${avgSalary.toLocaleString()}</p>
                  <Sparkline data={[avgSalary * 0.85, avgSalary * 0.9, avgSalary * 0.95, avgSalary * 0.92, avgSalary]} color="var(--primary)" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-transparent">
            <CardContent className="flex flex-col gap-2">
              <Sparkles className="size-6 text-primary" />
              <p className="text-sm font-medium text-foreground">Dejá que la IA encuentre tu match</p>
              <p className="text-xs text-muted-foreground">
                Completá tu Career Passport y recibí sugerencias personalizadas.
              </p>
              <Button size="sm" nativeButton={false} render={<Link href={user ? "/candidate/passport" : "/register"} />}>
                {user ? "Completar perfil" : "Crear cuenta"}
              </Button>
            </CardContent>
          </Card>

          {!user && (
            <Card>
              <CardContent className="flex items-center gap-2">
                <Bell className="size-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  <Link href="/register" className="text-primary hover:underline">
                    Registrate
                  </Link>{" "}
                  para guardar jobs y recibir notificaciones.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
  );

  if (user) {
    return (
      <AppShell
        homeHref={isCandidate ? "/candidate" : "/recruiter"}
        navItems={isRecruiter ? RECRUITER_NAV_ITEMS : CANDIDATE_NAV_ITEMS}
        fullName={fullName}
      >
        {content}
      </AppShell>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            H
          </span>
          <span className="font-heading text-sm font-semibold text-foreground">HireFlow</span>
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/login" />}>
            Iniciar sesión
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href="/register" />}>
            Registrarme
          </Button>
        </div>
      </header>
      {content}
    </div>
  );
}
