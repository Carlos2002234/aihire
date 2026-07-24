import { Bot, Map, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { CircularProgress } from "@/components/shared/circular-progress";
import { RoadmapStepItem } from "@/components/candidate/roadmap-step-item";
import { REJECTION_REASON_LABELS } from "@/lib/rejection-reasons";
import { createClient } from "@/lib/supabase/server";
import type { RoadmapStepType } from "@/lib/roadmap-step-types";

interface SearchParams {
  roadmap?: string;
  tab?: string;
}

function buildHref(sp: SearchParams, overrides: Partial<SearchParams>): string {
  const merged = { ...sp, ...overrides };
  const params = new URLSearchParams();
  if (merged.roadmap) params.set("roadmap", merged.roadmap);
  if (merged.tab) params.set("tab", merged.tab);
  const qs = params.toString();
  return qs ? `/candidate/roadmap?${qs}` : "/candidate/roadmap";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-419", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function CandidateRoadmapPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: roadmaps } = await supabase
    .from("roadmaps")
    .select(
      `id, title, created_at,
       roadmap_steps(id, position, title, description, type, completed),
       feedback(rejection_reason, areas_to_improve, missing_skills,
         applications(jobs(title, companies(name))))`
    )
    .eq("candidate_id", user.id)
    .order("created_at", { ascending: false })
    .order("position", { referencedTable: "roadmap_steps" });

  if (!roadmaps?.length) {
    return (
      <main className="flex flex-col gap-6 px-6 py-6">
        <PageHeader
          title="Roadmap"
          description="Tu plan personalizado con IA para mejorar y conseguir tu próxima oportunidad."
        />
        <EmptyState
          icon={Map}
          title="Todavía no tenés un roadmap"
          description="Cuando recibas feedback de un rechazo, vamos a generar acá un plan personalizado para tu próxima aplicación."
        />
      </main>
    );
  }

  const active = roadmaps.find((r) => r.id === sp.roadmap) ?? roadmaps[0];
  const tab = sp.tab === "historial" ? "historial" : "plan";

  const steps = active.roadmap_steps ?? [];
  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const currentIndex = steps.findIndex((s) => !s.completed);

  const feedback = active.feedback;
  const job = feedback?.applications?.jobs;
  const companyName = job?.companies?.name;

  const keyFeedbackTags = [
    ...new Set([...(feedback?.areas_to_improve ?? []), ...(feedback?.missing_skills ?? [])]),
  ].slice(0, 6);

  return (
    <main className="flex flex-col gap-6 px-6 py-6">
      <PageHeader
        title="Roadmap"
        description="Tu plan personalizado con IA para mejorar y conseguir tu próxima oportunidad."
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="size-6" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Personalizado para vos</p>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Este roadmap se generó a partir del feedback que recibiste
                    {job?.title ? (
                      <>
                        {" "}
                        en tu aplicación a{" "}
                        <span className="font-medium text-foreground">{job.title}</span>
                        {companyName ? (
                          <>
                            {" "}
                            en <span className="font-medium text-foreground">{companyName}</span>
                          </>
                        ) : null}
                        .
                      </>
                    ) : (
                      "."
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CircularProgress
                  value={progressPct}
                  color={progressPct === 100 ? "var(--success)" : "var(--primary)"}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">Progreso general</p>
                  <p className="text-xs text-muted-foreground">
                    {completedCount} de {totalCount} pasos completados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {roadmaps.length > 1 && (
            <div className="flex items-center gap-1 border-b border-border">
              <Link
                href={buildHref(sp, { tab: undefined })}
                className={
                  tab === "plan"
                    ? "border-b-2 border-primary px-3 py-2 text-sm font-medium text-foreground"
                    : "px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                }
              >
                Plan
              </Link>
              <Link
                href={buildHref(sp, { tab: "historial" })}
                className={
                  tab === "historial"
                    ? "border-b-2 border-primary px-3 py-2 text-sm font-medium text-foreground"
                    : "px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                }
              >
                Historial
              </Link>
            </div>
          )}

          {tab === "historial" ? (
            <div className="flex flex-col gap-3">
              {roadmaps.map((r) => {
                const rTotal = r.roadmap_steps?.length ?? 0;
                const rCompleted = r.roadmap_steps?.filter((s) => s.completed).length ?? 0;
                const isActive = r.id === active.id;
                return (
                  <Card key={r.id}>
                    <CardContent className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{r.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(r.created_at)} · {rCompleted} de {rTotal} pasos completados
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={isActive ? "default" : "outline"}
                        nativeButton={false}
                        render={<Link href={buildHref(sp, { roadmap: r.id, tab: undefined })} />}
                      >
                        {isActive ? "Viendo" : "Ver plan"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{active.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="flex flex-col">
                  {steps.map((step, i) => (
                    <RoadmapStepItem
                      key={step.id}
                      id={step.id}
                      position={i + 1}
                      title={step.title}
                      description={step.description}
                      type={step.type as RoadmapStepType}
                      completed={step.completed}
                      isCurrent={i === currentIndex}
                      isLast={i === steps.length - 1}
                    />
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-72">
          <Card>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm font-medium text-foreground">Sobre este roadmap</p>
              <div>
                <p className="text-xs text-muted-foreground">Generado el</p>
                <p className="text-sm text-foreground">{formatDate(active.created_at)}</p>
              </div>
              {job?.title && (
                <div>
                  <p className="text-xs text-muted-foreground">Basado en</p>
                  <p className="text-sm text-foreground">
                    {job.title}
                    {companyName ? ` en ${companyName}` : ""}
                  </p>
                </div>
              )}
              {feedback?.rejection_reason && (
                <Badge variant="outline" className="w-fit">
                  {REJECTION_REASON_LABELS[feedback.rejection_reason]}
                </Badge>
              )}
              {keyFeedbackTags.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Feedback clave</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {keyFeedbackTags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-transparent">
            <CardContent className="flex flex-col gap-2">
              <Bot className="size-6 text-primary" />
              <p className="text-sm font-medium text-foreground">¿Necesitás ayuda?</p>
              <p className="text-xs text-muted-foreground">
                Recibí guía personalizada de tu Career Coach con IA para avanzar en tu roadmap.
              </p>
              <Button size="sm" nativeButton={false} render={<Link href="/candidate/coach" />}>
                Abrir Career Coach
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
