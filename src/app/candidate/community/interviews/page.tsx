import Link from "next/link";
import { Building2, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { CommunitySubnav } from "@/components/community/community-subnav";
import { createClient } from "@/lib/supabase/server";

function difficultyLabel(avg: number): { label: string; variant: "success" | "warning" | "destructive" } {
  if (avg <= 3.5) return { label: "Accesible", variant: "success" };
  if (avg <= 7) return { label: "Moderada", variant: "warning" };
  return { label: "Exigente", variant: "destructive" };
}

export default async function CommunityInterviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("community_interview_experiences")
    .select("company, difficulty, rounds, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (q) query = query.ilike("company", `%${q}%`);

  const { data: experiences } = await query;

  const companyMap = new Map<
    string,
    { company: string; count: number; totalDifficulty: number; totalRounds: number; lastReported: string }
  >();
  for (const exp of experiences ?? []) {
    const key = exp.company.toLowerCase();
    const existing = companyMap.get(key);
    if (existing) {
      existing.count += 1;
      existing.totalDifficulty += exp.difficulty;
      existing.totalRounds += exp.rounds;
      if (exp.created_at > existing.lastReported) existing.lastReported = exp.created_at;
    } else {
      companyMap.set(key, {
        company: exp.company,
        count: 1,
        totalDifficulty: exp.difficulty,
        totalRounds: exp.rounds,
        lastReported: exp.created_at,
      });
    }
  }
  const companies = [...companyMap.values()].sort((a, b) => b.count - a.count);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-6">
      <PageHeader
        title="Community"
        description="Conocimiento profesional compartido: preguntas, salarios y experiencias de entrevistas reales."
      />
      <CommunitySubnav active="interviews" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por compañía..."
            className="w-full rounded-lg border border-input bg-transparent py-2 pr-3 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
        </form>
        <Button render={<Link href="/candidate/community/interviews/share" />} nativeButton={false}>
          Compartir tu experiencia
        </Button>
      </div>

      {companies.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {companies.map((c) => {
            const avgDifficulty = c.totalDifficulty / c.count;
            const difficulty = difficultyLabel(avgDifficulty);
            return (
              <Link key={c.company} href={`/candidate/community/interviews/${encodeURIComponent(c.company)}`}>
                <Card className="h-full transition-colors hover:bg-muted/40">
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-foreground">
                        {c.company.slice(0, 2).toUpperCase()}
                      </span>
                      <p className="font-medium text-foreground">{c.company}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant={difficulty.variant}>{difficulty.label}</Badge>
                      <span>{avgDifficulty.toFixed(1)}/10 dificultad</span>
                      <span>·</span>
                      <span>{(c.totalRounds / c.count).toFixed(1)} rondas prom.</span>
                      <span>·</span>
                      <span>
                        {c.count} {c.count === 1 ? "experiencia" : "experiencias"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title={q ? "No encontramos experiencias con esa búsqueda" : "Todavía no hay experiencias compartidas"}
          description="Compartí tu proceso de entrevista y ayudá a otros a prepararse."
          action={
            <Button render={<Link href="/candidate/community/interviews/share" />} nativeButton={false}>
              Compartir tu experiencia
            </Button>
          }
        />
      )}
    </main>
  );
}
