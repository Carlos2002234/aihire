import Link from "next/link";
import { DollarSign, Lock, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { CommunitySubnav } from "@/components/community/community-subnav";
import { SalaryHistogram, type SalaryBucket } from "@/components/community/salary-histogram";
import { WORK_MODE_LABELS } from "@/lib/job-labels";
import { createClient } from "@/lib/supabase/server";

const EXPERIENCE_BUCKETS = [
  { value: "0-2", label: "0–2 años", min: 0, max: 2 },
  { value: "2-5", label: "2–5 años", min: 2, max: 5 },
  { value: "5-10", label: "5–10 años", min: 5, max: 10 },
  { value: "10+", label: "10+ años", min: 10, max: Infinity },
] as const;

function selectClassName() {
  return "h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function buildBuckets(values: number[]): SalaryBucket[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [{ label: `$${Math.round(min / 1000)}k`, count: values.length }];

  const bucketCount = Math.min(6, Math.max(4, Math.ceil(Math.sqrt(values.length))));
  const step = (max - min) / bucketCount;
  const buckets: SalaryBucket[] = Array.from({ length: bucketCount }, (_, i) => {
    const from = min + i * step;
    const to = i === bucketCount - 1 ? max : min + (i + 1) * step;
    return { label: `${Math.round(from / 1000)}–${Math.round(to / 1000)}k`, count: 0 };
  });

  for (const value of values) {
    const idx = Math.min(bucketCount - 1, Math.floor((value - min) / step));
    buckets[idx].count += 1;
  }
  return buckets;
}

interface SearchParams {
  country?: string;
  jobTitle?: string;
  experience?: string;
  workMode?: string;
  company?: string;
  shared?: string;
}

export default async function CommunitySalaryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("community_salary_entries")
    .select("id, country, city, company, job_title, years_experience, salary_amount, salary_currency, bonus_amount, work_mode, industry, certifications, created_at")
    .order("created_at", { ascending: false });

  if (sp.country) query = query.ilike("country", `%${sp.country}%`);
  if (sp.jobTitle) query = query.ilike("job_title", `%${sp.jobTitle}%`);
  if (sp.company) query = query.ilike("company", `%${sp.company}%`);
  if (sp.workMode) query = query.eq("work_mode", sp.workMode as "remote" | "hybrid" | "onsite");

  const experienceBucket = EXPERIENCE_BUCKETS.find((b) => b.value === sp.experience);
  if (experienceBucket) {
    query = query.gte("years_experience", experienceBucket.min);
    if (experienceBucket.max !== Infinity) query = query.lt("years_experience", experienceBucket.max);
  }

  const { data: entries } = await query.limit(200);

  const salaries = (entries ?? []).map((e) => e.salary_amount);
  const stats = salaries.length
    ? {
        average: Math.round(salaries.reduce((s, v) => s + v, 0) / salaries.length),
        median: Math.round(median(salaries)),
        highest: Math.round(Math.max(...salaries)),
        lowest: Math.round(Math.min(...salaries)),
      }
    : null;
  const buckets = buildBuckets(salaries);

  const activeFilters = Object.entries(sp).filter(([key, v]) => v && key !== "shared");

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-6">
      <PageHeader
        title="Community"
        description="Conocimiento profesional compartido: preguntas, salarios y experiencias de entrevistas reales."
      />
      <CommunitySubnav active="salary" />

      {sp.shared && (
        <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          ¡Gracias! Tu aporte se publicó de forma anónima.
        </p>
      )}

      <Card className="bg-gradient-to-br from-primary/10 to-transparent">
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <DollarSign className="size-5" />
            </span>
            <div>
              <p className="font-medium text-foreground">Base de datos de salarios de la comunidad</p>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Lock className="size-3.5" />
                100% anónimo — nunca mostramos quién compartió cada dato.
              </p>
            </div>
          </div>
          <Button size="lg" render={<Link href="/candidate/community/salary/share" />} nativeButton={false}>
            Compartir tu salario
          </Button>
        </CardContent>
      </Card>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card size="sm">
            <CardContent>
              <p className="text-xs text-muted-foreground">Promedio</p>
              <p className="text-xl font-semibold text-foreground">${stats.average.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent>
              <p className="text-xs text-muted-foreground">Mediana</p>
              <p className="text-xl font-semibold text-foreground">${stats.median.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="size-3.5" />
                Más alto
              </p>
              <p className="text-xl font-semibold text-success">${stats.highest.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingDown className="size-3.5" />
                Más bajo
              </p>
              <p className="text-xl font-semibold text-foreground">${stats.lowest.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {buckets.length > 1 && (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm font-medium text-foreground">Distribución de salarios</p>
            <SalaryHistogram buckets={buckets} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3">
          <form className="grid gap-2 sm:grid-cols-5">
            <input
              name="country"
              defaultValue={sp.country ?? ""}
              placeholder="País"
              className={selectClassName()}
            />
            <input
              name="jobTitle"
              defaultValue={sp.jobTitle ?? ""}
              placeholder="Puesto"
              className={selectClassName()}
            />
            <select name="experience" defaultValue={sp.experience ?? ""} className={selectClassName()}>
              <option value="">Experiencia</option>
              {EXPERIENCE_BUCKETS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
            <select name="workMode" defaultValue={sp.workMode ?? ""} className={selectClassName()}>
              <option value="">Modalidad</option>
              {(["remote", "hybrid", "onsite"] as const).map((mode) => (
                <option key={mode} value={mode}>
                  {WORK_MODE_LABELS[mode]}
                </option>
              ))}
            </select>
            <input
              name="company"
              defaultValue={sp.company ?? ""}
              placeholder="Compañía"
              className={selectClassName()}
            />
            <Button type="submit" variant="outline" size="sm" className="sm:col-span-5 sm:w-fit">
              Filtrar
            </Button>
          </form>

          {activeFilters.length > 0 && (
            <Link href="/candidate/community/salary" className="w-fit text-xs text-primary hover:underline">
              Limpiar filtros
            </Link>
          )}
        </CardContent>
      </Card>

      {entries?.length ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Puesto</th>
                <th className="px-4 py-3 font-medium">Ubicación</th>
                <th className="px-4 py-3 font-medium">Experiencia</th>
                <th className="px-4 py-3 font-medium">Modalidad</th>
                <th className="px-4 py-3 font-medium">Salario</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{entry.job_title}</p>
                    {entry.company && <p className="text-xs text-muted-foreground">{entry.company}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {[entry.city, entry.country].filter(Boolean).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.years_experience} años</td>
                  <td className="px-4 py-3">
                    {entry.work_mode && <Badge variant="outline">{WORK_MODE_LABELS[entry.work_mode]}</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-success">
                      {entry.salary_currency} {entry.salary_amount.toLocaleString()}
                    </p>
                    {entry.bonus_amount ? (
                      <p className="text-xs text-muted-foreground">
                        +{entry.bonus_amount.toLocaleString()} bono
                      </p>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={DollarSign}
          title="Todavía no hay datos de salario"
          description="Sé el primero en aportar — todo se publica de forma anónima."
          action={
            <Button render={<Link href="/candidate/community/salary/share" />} nativeButton={false}>
              Compartir tu salario
            </Button>
          }
        />
      )}
    </main>
  );
}
