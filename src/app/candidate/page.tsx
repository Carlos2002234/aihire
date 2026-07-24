import { Bookmark, CircleCheck, Clock, Inbox, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signOutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { CountBarChart } from "@/components/shared/CountBarChart";
import { StatTile } from "@/components/shared/StatTile";
import { APPLICATION_STAGES, STAGE_LABELS } from "@/lib/application-stages";
import { createClient } from "@/lib/supabase/server";

export default async function CandidateDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: candidateProfile } = await supabase
    .from("candidate_profiles")
    .select("completion_pct")
    .eq("id", user.id)
    .single();

  const { data: applications } = await supabase
    .from("applications")
    .select("id, stage, created_at, application_events(created_at)")
    .eq("candidate_id", user.id)
    .order("created_at", { referencedTable: "application_events" });

  const { count: feedbackCount } = await supabase
    .from("feedback")
    .select("id", { count: "exact", head: true });

  const { count: savedJobsCount } = await supabase
    .from("saved_jobs")
    .select("job_id", { count: "exact", head: true })
    .eq("candidate_id", user.id);

  const stageCounts = new Map<string, number>();
  const responseTimesDays: number[] = [];

  for (const app of applications ?? []) {
    stageCounts.set(app.stage, (stageCounts.get(app.stage) ?? 0) + 1);

    const events = app.application_events ?? [];
    if (events.length >= 2) {
      const appliedAt = new Date(events[0].created_at).getTime();
      const firstResponseAt = new Date(events[1].created_at).getTime();
      responseTimesDays.push((firstResponseAt - appliedAt) / (1000 * 60 * 60 * 24));
    }
  }

  const avgResponseDays = responseTimesDays.length
    ? responseTimesDays.reduce((sum, d) => sum + d, 0) / responseTimesDays.length
    : null;

  const stageChartData = APPLICATION_STAGES.map((stage) => ({
    label: STAGE_LABELS[stage],
    value: stageCounts.get(stage) ?? 0,
  })).filter((d) => d.value > 0);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
      <PageHeader
        title={`Hola, ${profile?.full_name ?? "candidato"}`}
        description="Tu actividad y progreso en HireFlow."
        actions={
          <>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/candidate/applications" />}
            >
              Mis aplicaciones
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/candidate/passport" />}
            >
              Mi Career Passport
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/candidate/coach" />}
            >
              Career Coach
            </Button>
            <form action={signOutAction}>
              <Button type="submit" variant="outline">
                Cerrar sesión
              </Button>
            </form>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile icon={Inbox} label="Aplicaciones" value={String(applications?.length ?? 0)} />
        <StatTile
          icon={Clock}
          label="Tiempo de respuesta"
          value={avgResponseDays != null ? `${avgResponseDays.toFixed(1)}d` : "—"}
          caption="promedio hasta la primera respuesta"
        />
        <StatTile icon={MessageSquareText} label="Feedback recibido" value={String(feedbackCount ?? 0)} />
        <StatTile icon={Bookmark} label="Jobs guardados" value={String(savedJobsCount ?? 0)} />
        <StatTile
          icon={CircleCheck}
          label="Completitud del passport"
          value={`${candidateProfile?.completion_pct ?? 0}%`}
        />
      </div>

      {stageChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tus aplicaciones por etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <CountBarChart data={stageChartData} height={Math.max(120, stageChartData.length * 40)} />
          </CardContent>
        </Card>
      )}
    </main>
  );
}
