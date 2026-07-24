"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Timeline } from "@/components/shared/Timeline";
import { createClient } from "@/lib/supabase/client";
import type { ApplicationStage } from "@/lib/application-stages";

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
  jobTitle: string;
  companyName: string | null;
  events: TimelineEvent[];
  feedback: ApplicationFeedback | null;
}

function ApplicationsList({
  initialApplications,
}: {
  initialApplications: ApplicationWithEvents[];
}) {
  const [applications, setApplications] = useState(initialApplications);

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

  return (
    <div className="flex flex-col gap-6">
      {applications.map((app) => (
        <Card key={app.id}>
          <CardHeader>
            <CardTitle>{app.jobTitle}</CardTitle>
            {app.companyName ? <CardDescription>{app.companyName}</CardDescription> : null}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Timeline events={app.events} />
            {app.feedback && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
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
                <Link href="/candidate/roadmap" className="mt-2 inline-block text-xs text-primary underline">
                  Ver tu roadmap personalizado
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export { ApplicationsList };
