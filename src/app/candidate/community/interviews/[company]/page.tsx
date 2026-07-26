import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers, ListChecks, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  technical: "Técnica",
  behavioral: "Comportamental",
  both: "Técnica + comportamental",
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days < 1) return "hoy";
  if (days < 30) return `hace ${days}d`;
  return new Date(iso).toLocaleDateString("es-419", { day: "numeric", month: "short", year: "numeric" });
}

// Preguntas "más mencionadas": conteo exacto (normalizado) de líneas
// repetidas entre distintos reportes — no es NLP/clustering, solo
// coincidencias textuales reales entre reportes distintos.
function mostMentionedQuestions(texts: (string | null)[]): { question: string; count: number }[] {
  const counts = new Map<string, { original: string; reporters: Set<number> }>();
  texts.forEach((text, reporterIdx) => {
    if (!text) return;
    const lines = text
      .split("\n")
      .map((l) => l.replace(/^[-•*\d.]\s*/, "").trim())
      .filter(Boolean);
    for (const line of lines) {
      const key = line.toLowerCase();
      const existing = counts.get(key);
      if (existing) existing.reporters.add(reporterIdx);
      else counts.set(key, { original: line, reporters: new Set([reporterIdx]) });
    }
  });
  return [...counts.values()]
    .filter((v) => v.reporters.size > 1)
    .map((v) => ({ question: v.original, count: v.reporters.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export default async function CompanyInterviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ company: string }>;
  searchParams: Promise<{ shared?: string }>;
}) {
  const { company: companyParam } = await params;
  const { shared } = await searchParams;
  const company = decodeURIComponent(companyParam);
  const supabase = await createClient();

  const { data: experiences } = await supabase
    .from("community_interview_experiences")
    .select("*")
    .ilike("company", company)
    .order("created_at", { ascending: false });

  if (!experiences?.length) notFound();

  const displayCompany = experiences[0].company;
  const avgDifficulty = experiences.reduce((s, e) => s + e.difficulty, 0) / experiences.length;
  const avgRounds = experiences.reduce((s, e) => s + e.rounds, 0) / experiences.length;
  const mentioned = mostMentionedQuestions(experiences.map((e) => e.questions_remembered));

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-6">
      <Link
        href="/candidate/community/interviews"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a compañías
      </Link>

      {shared && (
        <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          ¡Gracias! Tu experiencia se publicó de forma anónima.
        </p>
      )}

      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-base font-semibold text-foreground">
          {displayCompany.slice(0, 2).toUpperCase()}
        </span>
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">{displayCompany}</h1>
          <p className="text-sm text-muted-foreground">
            {experiences.length} {experiences.length === 1 ? "experiencia compartida" : "experiencias compartidas"}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <Layers className="size-5 shrink-0 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Dificultad promedio</p>
              <p className="text-xl font-semibold text-foreground">{avgDifficulty.toFixed(1)}/10</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <Timer className="size-5 shrink-0 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Rondas promedio</p>
              <p className="text-xl font-semibold text-foreground">{avgRounds.toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <ListChecks className="size-4" />
            Preguntas más mencionadas
          </p>
          {mentioned.length ? (
            <ul className="flex flex-col gap-2">
              {mentioned.map((m) => (
                <li key={m.question} className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-foreground">{m.question}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {m.count} reportes
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Todavía no hay preguntas repetidas entre distintos reportes.
            </p>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 font-heading text-base font-semibold text-foreground">Experiencias recientes</h2>
        <ul className="flex flex-col gap-3">
          {experiences.map((exp) => (
            <li key={exp.id}>
              <Card>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-foreground">{exp.job_title}</p>
                    <span className="text-xs text-muted-foreground">{relativeTime(exp.created_at)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline">{exp.difficulty}/10 dificultad</Badge>
                    <Badge variant="outline">{exp.rounds} rondas</Badge>
                    <Badge variant="outline">{INTERVIEW_TYPE_LABELS[exp.interview_type]}</Badge>
                    {exp.duration && <Badge variant="outline">{exp.duration}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{exp.overall_experience}</p>
                  {exp.questions_remembered && (
                    <div>
                      <p className="text-xs font-medium text-foreground">Preguntas que recuerda</p>
                      <p className="text-sm whitespace-pre-line text-muted-foreground">{exp.questions_remembered}</p>
                    </div>
                  )}
                  {exp.tips && (
                    <div>
                      <p className="text-xs font-medium text-foreground">Tips</p>
                      <p className="text-sm whitespace-pre-line text-muted-foreground">{exp.tips}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
