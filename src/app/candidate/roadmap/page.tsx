import { Map } from "lucide-react";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { RoadmapStepItem } from "@/components/candidate/roadmap-step-item";
import { createClient } from "@/lib/supabase/server";
import type { RoadmapStepType } from "@/lib/roadmap-step-types";

export default async function CandidateRoadmapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: roadmaps } = await supabase
    .from("roadmaps")
    .select("id, title, created_at, roadmap_steps(id, position, title, description, type, completed)")
    .eq("candidate_id", user.id)
    .order("created_at", { ascending: false })
    .order("position", { referencedTable: "roadmap_steps" });

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
      <PageHeader
        title="Tu roadmap"
        description="Pasos concretos para mejorar y volver a aplicar, generados a partir del feedback que recibiste."
      />

      {roadmaps?.length ? (
        <div className="flex flex-col gap-6">
          {roadmaps.map((roadmap) => (
            <Card key={roadmap.id}>
              <CardHeader>
                <CardTitle>{roadmap.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2">
                  {(roadmap.roadmap_steps ?? []).map((step) => (
                    <RoadmapStepItem
                      key={step.id}
                      id={step.id}
                      title={step.title}
                      description={step.description}
                      type={step.type as RoadmapStepType}
                      completed={step.completed}
                    />
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Map}
          title="Todavía no tenés un roadmap"
          description="Cuando recibas feedback de un rechazo, vamos a generar acá un plan personalizado para tu próxima aplicación."
        />
      )}
    </main>
  );
}
