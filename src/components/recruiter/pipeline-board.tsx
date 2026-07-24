"use client";

import { useState } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";

import { moveApplicationStageAction } from "@/actions/pipeline";
import { Badge } from "@/components/ui/badge";
import { RejectApplicationModal } from "@/components/recruiter/reject-application-modal";
import { APPLICATION_STAGES, STAGE_LABELS, type ApplicationStage } from "@/lib/application-stages";
import { cn } from "@/lib/utils";

interface PipelineApplication {
  id: string;
  stage: ApplicationStage;
  candidateName: string;
  resumeName: string;
  matchScore: number | null;
  summary: string | null;
}

function matchScoreVariant(score: number): "success" | "warning" | "destructive" {
  if (score >= 70) return "success";
  if (score >= 40) return "warning";
  return "destructive";
}

function ApplicationCard({ app }: { app: PipelineApplication }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: app.id,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab touch-none rounded-lg border border-border bg-card p-3 text-sm active:cursor-grabbing",
        isDragging && "z-10 opacity-50"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-foreground">{app.candidateName}</p>
        {app.matchScore != null ? (
          <Badge variant={matchScoreVariant(app.matchScore)}>{app.matchScore}%</Badge>
        ) : (
          <Badge variant="outline">Evaluando…</Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{app.resumeName}</p>
      {app.summary && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{app.summary}</p>
      )}
    </div>
  );
}

function StageColumn({
  stage,
  applications,
}: {
  stage: ApplicationStage;
  applications: PipelineApplication[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-64 shrink-0 flex-col gap-2 rounded-xl border border-border p-3",
        isOver && "border-primary bg-primary/5"
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">{STAGE_LABELS[stage]}</h3>
        <Badge variant="outline">{applications.length}</Badge>
      </div>
      <div className="flex flex-col gap-2">
        {applications.map((app) => (
          <ApplicationCard key={app.id} app={app} />
        ))}
      </div>
    </div>
  );
}

function PipelineBoard({
  jobId,
  applications,
}: {
  jobId: string;
  applications: PipelineApplication[];
}) {
  const [items, setItems] = useState(applications);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const applicationId = String(active.id);
    const toStage = over.id as ApplicationStage;
    const current = items.find((a) => a.id === applicationId);
    if (!current || current.stage === toStage) return;

    // Rechazar nunca es un simple cambio de etapa — pasa por el flujo de
    // feedback (docs/api.md: "moveStage nunca permite mover a 'rejected'
    // directamente"). El modal decide si el card se mueve.
    if (toStage === "rejected") {
      setRejectingId(applicationId);
      return;
    }

    const previousStage = current.stage;
    setItems((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, stage: toStage } : a))
    );

    moveApplicationStageAction(applicationId, jobId, toStage).then(({ error }) => {
      if (error) {
        setItems((prev) =>
          prev.map((a) => (a.id === applicationId ? { ...a, stage: previousStage } : a))
        );
      }
    });
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {APPLICATION_STAGES.map((stage) => (
          <StageColumn
            key={stage}
            stage={stage}
            applications={items.filter((a) => a.stage === stage)}
          />
        ))}
      </div>
      {rejectingId && (
        <RejectApplicationModal
          open
          applicationId={rejectingId}
          jobId={jobId}
          onOpenChange={(open) => {
            if (!open) setRejectingId(null);
          }}
          onRejected={() => {
            setItems((prev) =>
              prev.map((a) => (a.id === rejectingId ? { ...a, stage: "rejected" } : a))
            );
          }}
        />
      )}
    </DndContext>
  );
}

export { PipelineBoard };
