import Link from "next/link";
import { Eye, MessageSquare, Search, ShieldCheck, TrendingUp, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { AskQuestionModal } from "@/components/community/ask-question-modal";
import { CommunitySubnav } from "@/components/community/community-subnav";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { createClient } from "@/lib/supabase/server";

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "hace instantes";
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days}d`;
  return new Date(iso).toLocaleDateString("es-419", { day: "numeric", month: "short", year: "numeric" });
}

function buildHref(current: { q?: string; tag?: string }, overrides: { q?: string; tag?: string }): string {
  const merged = { ...current, ...overrides };
  const params = new URLSearchParams();
  if (merged.q) params.set("q", merged.q);
  if (merged.tag) params.set("tag", merged.tag);
  const qs = params.toString();
  return qs ? `/candidate/community/questions?${qs}` : "/candidate/community/questions";
}

export default async function CommunityQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const { q, tag, error } = sp;
  const supabase = await createClient();

  let query = supabase
    .from("community_questions")
    .select(
      "id, title, tags, views, created_at, is_anonymous, profiles(full_name, avatar_url, recruiter_profiles(verified)), community_answers(count)"
    )
    .order("created_at", { ascending: false })
    .limit(30);

  if (q) query = query.ilike("title", `%${q}%`);
  if (tag) query = query.contains("tags", [tag]);

  const [{ data: questions }, { data: tagSource }, counts] = await Promise.all([
    query,
    supabase.from("community_questions").select("tags").order("created_at", { ascending: false }).limit(200),
    Promise.all([
      supabase.from("community_questions").select("id", { count: "exact", head: true }),
      supabase.from("community_answers").select("id", { count: "exact", head: true }),
      supabase.from("community_salary_entries").select("id", { count: "exact", head: true }),
      supabase.from("community_interview_experiences").select("id", { count: "exact", head: true }),
    ]),
  ]);

  const [{ count: questionCount }, { count: answerCount }, { count: salaryCount }, { count: interviewCount }] =
    counts;

  const tagFrequency = new Map<string, number>();
  for (const row of tagSource ?? []) {
    for (const t of row.tags) tagFrequency.set(t, (tagFrequency.get(t) ?? 0) + 1);
  }
  const trendingTags = [...tagFrequency.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-6">
      <PageHeader
        title="Community"
        description="Conocimiento profesional compartido: preguntas, salarios y experiencias de entrevistas reales."
      />
      <CommunitySubnav active="questions" />

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <form className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Buscar preguntas..."
                className="w-full rounded-lg border border-input bg-transparent py-2 pr-3 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              />
            </form>
            <AskQuestionModal />
          </div>

          {trendingTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Link href={buildHref(sp, { tag: undefined })}>
                <Badge variant={!tag ? "default" : "outline"}>Todas</Badge>
              </Link>
              {trendingTags.map(([t]) => (
                <Link key={t} href={buildHref(sp, { tag: t })}>
                  <Badge variant={tag === t ? "default" : "outline"}>{t}</Badge>
                </Link>
              ))}
            </div>
          )}

          {questions?.length ? (
            <ul className="flex flex-col gap-3">
              {questions.map((question) => {
                const authorName = question.is_anonymous ? "Anónimo" : (question.profiles?.full_name ?? "Usuario");
                const isVerified = !question.is_anonymous && question.profiles?.recruiter_profiles?.verified;
                const replyCount = question.community_answers?.[0]?.count ?? 0;
                return (
                  <li key={question.id}>
                    <Link href={`/candidate/community/questions/${question.id}`}>
                      <Card className="transition-colors hover:bg-muted/40">
                        <CardContent className="flex gap-3">
                          <PersonAvatar
                            name={question.is_anonymous ? null : (question.profiles?.full_name ?? null)}
                            avatarUrl={question.is_anonymous ? null : question.profiles?.avatar_url}
                            size="size-9"
                          />
                          <div className="flex min-w-0 flex-1 flex-col gap-2">
                            <p className="font-medium text-foreground">{question.title}</p>
                            {question.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {question.tags.map((t) => (
                                  <Badge key={t} variant="outline">
                                    {t}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MessageSquare className="size-3.5" />
                                {replyCount} {replyCount === 1 ? "respuesta" : "respuestas"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="size-3.5" />
                                {question.views} vistas
                              </span>
                              <span>{relativeTime(question.created_at)}</span>
                              <span className="ml-auto flex items-center gap-1">
                                {authorName}
                                {isVerified && (
                                  <span title="Recruiter verificado">
                                    <ShieldCheck className="size-3.5 text-primary" />
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={MessageSquare}
              title={q || tag ? "No encontramos preguntas con ese filtro" : "Todavía no hay preguntas"}
              description="Sé el primero en preguntar algo sobre certificaciones, procesos de contratación o tu próximo paso de carrera."
            />
          )}
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-64">
          <Card>
            <CardContent className="flex flex-col gap-3">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Users className="size-4 text-primary" />
                Community en números
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-lg font-semibold text-foreground">{questionCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Preguntas</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{answerCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Respuestas</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{salaryCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Salarios</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{interviewCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Entrevistas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {trendingTags.length > 0 && (
            <Card>
              <CardContent className="flex flex-col gap-3">
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <TrendingUp className="size-4 text-primary" />
                  Temas en tendencia
                </p>
                <ul className="flex flex-col gap-2">
                  {trendingTags.map(([t, count], i) => (
                    <li key={t}>
                      <Link
                        href={buildHref(sp, { tag: t })}
                        className="flex items-center justify-between gap-2 text-sm hover:text-primary"
                      >
                        <span className="flex items-center gap-2 truncate text-foreground">
                          <span className="text-xs text-muted-foreground">{i + 1}</span>
                          {t}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {count} {count === 1 ? "pregunta" : "preguntas"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
