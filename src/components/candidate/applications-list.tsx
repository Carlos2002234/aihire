"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Briefcase, CheckCircle2, ChevronDown, Clock, Search, Users, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Timeline } from "@/components/shared/Timeline";
import { createClient } from "@/lib/supabase/client";
import { STAGE_LABELS, type ApplicationStage } from "@/lib/application-stages";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  to_stage: ApplicationStage;
  note: string | null;
  created_at: string;
}

interface ApplicationFeedback {
  aiMessage: string;
  strengths: string[];
  areasToImprove: string[];
}

interface ApplicationWithEvents {
  id: string;
  stage: ApplicationStage;
  createdAt: string;
  jobTitle: string;
  companyName: string | null;
  employmentType: string | null;
  events: TimelineEvent[];
  feedback: ApplicationFeedback | null;
}

type TabKey = "all" | "review" | "interview" | "offer" | "rejected";

const TAB_STAGES: Record<Exclude<TabKey, "all">, ApplicationStage[]> = {
  review: ["applied", "under_review", "recruiter_review"],
  interview: ["interview", "technical_interview", "final_interview"],
  offer: ["offer"],
  rejected: ["rejected"],
};

const NEXT_STEP_BY_STAGE: Record<ApplicationStage, string> = {
  applied: "Revisión de RRHH",
  under_review: "Revisión de RRHH",
  recruiter_review: "Revisión del recruiter",
  interview: "Entrevista",
  technical_interview: "Entrevista técnica",
  final_interview: "Entrevista final",
  offer: "Esperando tu respuesta",
  rejected: "—",
};

const STAGE_BADGE_VARIANT: Record<ApplicationStage, "outline" | "warning" | "success" | "destructive"> = {
  applied: "outline",
  under_review: "outline",
  recruiter_review: "outline",
  interview: "warning",
  technical_interview: "warning",
  final_interview: "warning",
  offer: "success",
  rejected: "destructive",
};

// Hash determinístico (no criptográfico), solo para simular "vistas" — HireFlow
// no trackea vistas de aplicación todavía.
function mockViews(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return 3 + (hash % 40);
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `hace ${Math.max(1, minutes)}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;
  return new Date(iso).toLocaleDateString();
}

function ApplicationsList({
  initialApplications,
}: {
  initialApplications: ApplicationWithEvents[];
}) {
  const [applications, setApplications] = useState(initialApplications);
  const [tab, setTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    // Realtime evalúa RLS con el JWT del usuario — hay que asegurarse de que
    // la sesión ya esté sincronizada al cliente de realtime antes de unirse
    // al canal, si no el primer evento llega evaluado como anon (401).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled || !session) return;

      supabase.realtime.setAuth(session.access_token);

      channel = supabase
        .channel("candidate-application-events")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "application_events" },
          (payload) => {
            const newEvent = payload.new as {
              id: string;
              application_id: string;
              to_stage: ApplicationStage;
              note: string | null;
              created_at: string;
            };
            setApplications((prev) =>
              prev.map((app) =>
                app.id === newEvent.application_id
                  ? {
                      ...app,
                      stage: newEvent.to_stage,
                      events: [
                        ...app.events,
                        {
                          id: newEvent.id,
                          to_stage: newEvent.to_stage,
                          note: newEvent.note,
                          created_at: newEvent.created_at,
                        },
                      ],
                    }
                  : app
              )
            );
          }
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const counts = useMemo(() => {
    const c = { review: 0, interview: 0, offer: 0, rejected: 0 };
    for (const app of applications) {
      if (TAB_STAGES.review.includes(app.stage)) c.review += 1;
      else if (TAB_STAGES.interview.includes(app.stage)) c.interview += 1;
      else if (app.stage === "offer") c.offer += 1;
      else if (app.stage === "rejected") c.rejected += 1;
    }
    return c;
  }, [applications]);

  const filtered = applications.filter((app) => {
    if (tab !== "all" && !TAB_STAGES[tab].includes(app.stage)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!app.jobTitle.toLowerCase().includes(q) && !app.companyName?.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const tiles = [
    { key: "all" as const, label: "Total", value: applications.length, icon: Briefcase, color: "text-primary" },
    { key: "review" as const, label: "En revisión", value: counts.review, icon: Clock, color: "text-primary" },
    { key: "interview" as const, label: "Entrevistas", value: counts.interview, icon: Users, color: "text-warning" },
    { key: "offer" as const, label: "Ofertas", value: counts.offer, icon: CheckCircle2, color: "text-success" },
    { key: "rejected" as const, label: "Rechazadas", value: counts.rejected, icon: XCircle, color: "text-destructive" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((tile) => (
          <button key={tile.key} onClick={() => setTab(tile.key)} className="text-left">
            <Card
              size="sm"
              className={cn(
                "transition-colors hover:bg-muted/40",
                tab === tile.key && "ring-2 ring-primary"
              )}
            >
              <CardContent className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">{tile.label}</p>
                  <p className="text-2xl font-semibold text-foreground">{tile.value}</p>
                </div>
                <tile.icon className={cn("size-8 shrink-0 rounded-full bg-muted p-1.5", tile.color)} />
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {(["all", "review", "interview", "offer", "rejected"] as TabKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium",
              tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            {key === "all" ? "Todas" : key === "review" ? "En revisión" : key === "interview" ? "Entrevistas" : key === "offer" ? "Ofertas" : "Rechazadas"}
          </button>
        ))}
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar aplicaciones…"
            className="w-full rounded-lg border border-input bg-transparent py-1.5 pr-3 pl-8 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
        </div>
      </div>

      {filtered.length ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Job</th>
                <th className="px-4 py-3 font-medium">Compañía</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Última actualización</th>
                <th className="px-4 py-3 font-medium">Vistas</th>
                <th className="px-4 py-3 font-medium">Siguiente paso</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => {
                const isExpanded = expandedId === app.id;
                const lastUpdate = app.events.length
                  ? app.events[app.events.length - 1].created_at
                  : app.createdAt;
                return (
                  <Fragment key={app.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : app.id)}
                      className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td className="flex items-center gap-2 px-4 py-3">
                        <ChevronDown
                          className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", isExpanded && "rotate-180")}
                        />
                        <span className="font-medium text-foreground">{app.jobTitle}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{app.companyName ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={STAGE_BADGE_VARIANT[app.stage]}>{STAGE_LABELS[app.stage]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{relativeTime(lastUpdate)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{mockViews(app.id)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{NEXT_STEP_BY_STAGE[app.stage]}</td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-border last:border-0 bg-muted/20">
                        <td colSpan={6} className="px-4 py-4">
                          <Timeline events={app.events} />
                          {app.feedback && (
                            <div className="mt-4 rounded-lg border border-border bg-card p-3 text-sm">
                              <p className="font-medium text-foreground">Feedback</p>
                              <p className="mt-1 text-muted-foreground">{app.feedback.aiMessage}</p>
                              {app.feedback.strengths.length ? (
                                <p className="mt-2 text-xs text-muted-foreground">
                                  <span className="font-medium text-foreground">Fortalezas: </span>
                                  {app.feedback.strengths.join(", ")}
                                </p>
                              ) : null}
                              {app.feedback.areasToImprove.length ? (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  <span className="font-medium text-foreground">A mejorar: </span>
                                  {app.feedback.areasToImprove.join(", ")}
                                </p>
                              ) : null}
                              <Link
                                href="/candidate/roadmap"
                                className="mt-2 inline-block text-xs text-primary underline"
                              >
                                Ver tu roadmap personalizado
                              </Link>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Ninguna aplicación coincide con este filtro.
        </p>
      )}
    </div>
  );
}

export { ApplicationsList };
