import Link from "next/link";
import { Eye, MessageSquare, Search, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { AskQuestionModal } from "@/components/community/ask-question-modal";
import { CommunitySubnav } from "@/components/community/community-subnav";
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

export default async function CommunityQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("community_questions")
    .select(
      "id, title, tags, views, created_at, is_anonymous, profiles(full_name, recruiter_profiles(verified)), community_answers(count)"
    )
    .order("created_at", { ascending: false })
    .limit(30);

  if (q) query = query.ilike("title", `%${q}%`);

  const { data: questions } = await query;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-6">
      <PageHeader
        title="Community"
        description="Conocimiento profesional compartido: preguntas, salarios y experiencias de entrevistas reales."
      />
      <CommunitySubnav active="questions" />

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
                    <CardContent className="flex flex-col gap-2">
                      <p className="font-medium text-foreground">{question.title}</p>
                      {question.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {question.tags.map((tag) => (
                            <Badge key={tag} variant="outline">
                              {tag}
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
          title={q ? "No encontramos preguntas con esa búsqueda" : "Todavía no hay preguntas"}
          description="Sé el primero en preguntar algo sobre certificaciones, procesos de contratación o tu próximo paso de carrera."
        />
      )}
    </main>
  );
}
