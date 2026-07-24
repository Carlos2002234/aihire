import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/server";

const WORK_MODES = ["remote", "hybrid", "onsite"] as const;
const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "internship"] as const;

function selectClassName() {
  return "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
}

export default async function JobsBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; work_mode?: string; employment_type?: string }>;
}) {
  const { q, work_mode, employment_type } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("jobs")
    .select("id, title, location_country, location_city, work_mode, employment_type, companies(name)")
    .eq("status", "open")
    .order("published_at", { ascending: false });

  if (q) query = query.ilike("title", `%${q}%`);
  if (work_mode) query = query.eq("work_mode", work_mode as (typeof WORK_MODES)[number]);
  if (employment_type)
    query = query.eq("employment_type", employment_type as (typeof EMPLOYMENT_TYPES)[number]);

  const { data: jobs } = await query;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
      <PageHeader title="Jobs" description="Todas las oportunidades abiertas ahora mismo." />

      <form className="flex flex-wrap gap-2">
        <Input name="q" placeholder="Buscar por título..." defaultValue={q ?? ""} className="flex-1" />
        <select name="work_mode" defaultValue={work_mode ?? ""} className={selectClassName() + " w-36"}>
          <option value="">Modalidad</option>
          {WORK_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
        <select name="employment_type" defaultValue={employment_type ?? ""} className={selectClassName() + " w-40"}>
          <option value="">Tipo de empleo</option>
          {EMPLOYMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-8 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          Filtrar
        </button>
      </form>

      {jobs?.length ? (
        <ul className="flex flex-col gap-3">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link href={`/jobs/${job.id}`}>
                <Card>
                  <CardContent className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-foreground">{job.title}</span>
                    <span className="text-xs text-muted-foreground">{job.companies?.name}</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {job.work_mode ? <Badge variant="outline">{job.work_mode}</Badge> : null}
                      {job.employment_type ? <Badge variant="outline">{job.employment_type}</Badge> : null}
                      {job.location_city ? <Badge variant="outline">{job.location_city}</Badge> : null}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No hay jobs abiertos con esos filtros" />
      )}
    </main>
  );
}
