import { Briefcase, Percent, TrendingDown, UserX, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { CountBarChart } from "@/components/shared/CountBarChart";
import { StatTile } from "@/components/shared/StatTile";
import { APPLICATION_STAGES, STAGE_LABELS } from "@/lib/application-stages";
import { REJECTION_REASON_LABELS } from "@/lib/rejection-reasons";
import { createClient } from "@/lib/supabase/server";

export default async function RecruiterDashboardPage() {
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

  const { data: recruiterProfile } = await supabase
    .from("recruiter_profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!recruiterProfile?.company_id) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <PageHeader title={`Hola, ${profile?.full_name ?? "recruiter"}`} />
        <EmptyState
          title="Todavía no tenés una compañía"
          description="Creá o unite a una compañía para empezar a publicar jobs."
          action={
            <Button render={<Link href="/recruiter/company" />} nativeButton={false}>
              Configurar compañía
            </Button>
          }
        />
      </main>
    );
  }

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id")
    .eq("company_id", recruiterProfile.company_id);

  const jobIds = (jobs ?? []).map((j) => j.id);

  const { count: openJobsCount } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("company_id", recruiterProfile.company_id)
    .eq("status", "open");

  const { data: applications } = jobIds.length
    ? await supabase
        .from("applications")
        .select(
          "id, stage, created_at, application_events(to_stage, created_at), feedback(rejection_reason)"
        )
        .in("job_id", jobIds)
        .order("created_at", { referencedTable: "application_events" })
    : { data: [] };

  const funnelStages = APPLICATION_STAGES.filter((s) => s !== "rejected");
  const reachedCounts = new Map<string, number>(funnelStages.map((s) => [s, 0]));
  const rejectionReasonCounts = new Map<string, number>();
  const decisionDurationsDays: number[] = [];

  for (const app of applications ?? []) {
    const reachedStages = new Set((app.application_events ?? []).map((e) => e.to_stage));
    for (const stage of funnelStages) {
      if (reachedStages.has(stage)) {
        reachedCounts.set(stage, (reachedCounts.get(stage) ?? 0) + 1);
      }
    }

    const reason = app.feedback?.rejection_reason;
    if (reason) {
      rejectionReasonCounts.set(reason, (rejectionReasonCounts.get(reason) ?? 0) + 1);
    }

    if (app.stage === "offer" || app.stage === "rejected") {
      const events = app.application_events ?? [];
      if (events.length) {
        const lastEvent = events[events.length - 1];
        const days =
          (new Date(lastEvent.created_at).getTime() - new Date(app.created_at).getTime()) /
          (1000 * 60 * 60 * 24);
        decisionDurationsDays.push(days);
      }
    }
  }

  const totalApplications = applications?.length ?? 0;
  const offerCount = reachedCounts.get("offer") ?? 0;
  const conversionRate = totalApplications > 0 ? (offerCount / totalApplications) * 100 : null;
  const avgDecisionDays = decisionDurationsDays.length
    ? decisionDurationsDays.reduce((sum, d) => sum + d, 0) / decisionDurationsDays.length
    : null;

  const funnelChartData = funnelStages
    .map((stage) => ({ label: STAGE_LABELS[stage], value: reachedCounts.get(stage) ?? 0 }))
    .filter((d) => d.value > 0);

  const rejectionChartData = [...rejectionReasonCounts.entries()]
    .map(([reason, value]) => ({ label: REJECTION_REASON_LABELS[reason as keyof typeof REJECTION_REASON_LABELS], value }))
    .sort((a, b) => b.value - a.value);

  return (
    <main className="flex flex-col gap-8 px-6 py-6">
      <PageHeader
        title={`Hola, ${profile?.full_name ?? "recruiter"}`}
        description="El funnel y los números de tu proceso de contratación."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile icon={Briefcase} label="Jobs publicados" value={String(openJobsCount ?? 0)} />
        <StatTile icon={Users} label="Aplicaciones" value={String(totalApplications)} />
        <StatTile
          icon={Percent}
          label="Conversión a oferta"
          value={conversionRate != null ? `${conversionRate.toFixed(0)}%` : "—"}
        />
        <StatTile
          icon={TrendingDown}
          label="Tiempo a decisión"
          value={avgDecisionDays != null ? `${avgDecisionDays.toFixed(1)}d` : "—"}
          caption="promedio hasta oferta o rechazo"
        />
        <StatTile
          icon={UserX}
          label="Rechazos"
          value={String([...rejectionReasonCounts.values()].reduce((sum, v) => sum + v, 0))}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {funnelChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Funnel de aplicaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <CountBarChart data={funnelChartData} height={Math.max(120, funnelChartData.length * 40)} />
            </CardContent>
          </Card>
        )}

        {rejectionChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Razones de rechazo más comunes</CardTitle>
            </CardHeader>
            <CardContent>
              <CountBarChart
                data={rejectionChartData}
                height={Math.max(120, rejectionChartData.length * 40)}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
