import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, Eye, MessageSquare, ShieldCheck } from "lucide-react";

import { answerQuestionAction, markAnswerHelpfulAction } from "@/actions/community";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CommunitySubnav } from "@/components/community/community-subnav";
import { UpvoteButton } from "@/components/community/upvote-button";
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

function textareaClassName() {
  return "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
}

async function markHelpful(formData: FormData) {
  "use server";
  const answerId = String(formData.get("answerId"));
  const questionId = String(formData.get("questionId"));
  await markAnswerHelpfulAction(answerId, questionId);
}

export default async function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: question } = await supabase
    .from("community_questions")
    .select("id, title, body, tags, views, created_at, is_anonymous, author_id, profiles(full_name, recruiter_profiles(verified))")
    .eq("id", id)
    .maybeSingle();

  if (!question) notFound();

  await supabase.rpc("increment_question_views", { p_question_id: id });

  const [{ data: answers }, { data: myVotes }] = await Promise.all([
    supabase
      .from("community_answers")
      .select("id, body, upvotes, is_helpful, created_at, is_anonymous, profiles(full_name, recruiter_profiles(verified))")
      .eq("question_id", id)
      .order("is_helpful", { ascending: false })
      .order("upvotes", { ascending: false })
      .order("created_at", { ascending: true }),
    supabase.from("community_answer_votes").select("answer_id").eq("voter_id", user.id),
  ]);

  const votedAnswerIds = new Set((myVotes ?? []).map((v) => v.answer_id));
  const isQuestionAuthor = question.author_id === user.id;
  const authorName = question.is_anonymous ? "Anónimo" : (question.profiles?.full_name ?? "Usuario");
  const isAuthorVerified = !question.is_anonymous && question.profiles?.recruiter_profiles?.verified;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-6">
      <CommunitySubnav active="questions" />

      <Link
        href="/candidate/community/questions"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a preguntas
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <h1 className="font-heading text-xl font-semibold text-foreground">{question.title}</h1>
          {question.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {question.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <p className="text-sm whitespace-pre-line text-muted-foreground">{question.body}</p>
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="size-3.5" />
              {question.views} vistas
            </span>
            <span>{relativeTime(question.created_at)}</span>
            <span className="ml-auto flex items-center gap-1">
              {authorName}
              {isAuthorVerified && (
                <span title="Recruiter verificado">
                  <ShieldCheck className="size-3.5 text-primary" />
                </span>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 flex items-center gap-2 font-heading text-base font-semibold text-foreground">
          <MessageSquare className="size-4" />
          {answers?.length ?? 0} {answers?.length === 1 ? "respuesta" : "respuestas"}
        </h2>

        {answers?.length ? (
          <ul className="flex flex-col gap-3">
            {answers.map((answer) => {
              const answerAuthorName = answer.is_anonymous ? "Anónimo" : (answer.profiles?.full_name ?? "Usuario");
              const answerIsVerified = !answer.is_anonymous && answer.profiles?.recruiter_profiles?.verified;
              return (
                <li key={answer.id}>
                  <Card className={answer.is_helpful ? "ring-1 ring-success/40" : undefined}>
                    <CardContent className="flex gap-3">
                      <UpvoteButton
                        answerId={answer.id}
                        initialCount={answer.upvotes}
                        initialUpvoted={votedAnswerIds.has(answer.id)}
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        {answer.is_helpful && (
                          <Badge variant="success" className="w-fit gap-1">
                            <CheckCircle2 className="size-3" />
                            Marcada como útil
                          </Badge>
                        )}
                        <p className="text-sm whitespace-pre-line text-foreground">{answer.body}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            {answerAuthorName}
                            {answerIsVerified && (
                              <span title="Recruiter verificado">
                                <ShieldCheck className="size-3.5 text-primary" />
                              </span>
                            )}
                          </span>
                          <span>{relativeTime(answer.created_at)}</span>
                          {isQuestionAuthor && !answer.is_helpful && (
                            <form action={markHelpful} className="ml-auto">
                              <input type="hidden" name="answerId" value={answer.id} />
                              <input type="hidden" name="questionId" value={question.id} />
                              <button type="submit" className="text-primary hover:underline">
                                Marcar como útil
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState title="Sin respuestas todavía" description="Sé el primero en ayudar." className="py-8" />
        )}
      </div>

      <Card>
        <CardContent>
          <form action={answerQuestionAction} className="flex flex-col gap-3">
            <input type="hidden" name="questionId" value={question.id} />
            <label className="text-sm font-medium text-foreground">Tu respuesta</label>
            <textarea name="body" placeholder="Compartí tu experiencia o consejo..." rows={4} required className={textareaClassName()} />
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" name="isAnonymous" />
                Responder como anónimo
              </label>
              <Button type="submit">Responder</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
