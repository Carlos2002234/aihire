"use client";

import { useState } from "react";
import { Award, BookOpen, Check, Code2, Puzzle, Send } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { toggleRoadmapStepAction } from "@/actions/roadmap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROADMAP_STEP_TYPE_LABELS, type RoadmapStepType } from "@/lib/roadmap-step-types";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<RoadmapStepType, LucideIcon> = {
  learn: BookOpen,
  project: Code2,
  certification: Award,
  practice: Puzzle,
  apply: Send,
};

const TYPE_COLOR: Record<RoadmapStepType, string> = {
  learn: "bg-primary/10 text-primary",
  project: "bg-chart-2/10 text-chart-2",
  certification: "bg-warning/10 text-warning",
  practice: "bg-success/10 text-success",
  apply: "bg-primary/10 text-primary",
};

interface RoadmapStepItemProps {
  id: string;
  position: number;
  title: string;
  description: string | null;
  type: RoadmapStepType;
  completed: boolean;
  isCurrent: boolean;
  isLast: boolean;
}

function RoadmapStepItem({
  id,
  position,
  title,
  description,
  type,
  completed,
  isCurrent,
  isLast,
}: RoadmapStepItemProps) {
  const [isCompleted, setIsCompleted] = useState(completed);
  const [pending, setPending] = useState(false);

  async function handleToggle() {
    const next = !isCompleted;
    setIsCompleted(next);
    setPending(true);
    const { error } = await toggleRoadmapStepAction(id, next);
    setPending(false);
    if (error) setIsCompleted(!next);
  }

  const Icon = TYPE_ICON[type];

  return (
    <li className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            isCompleted
              ? "bg-success text-success-foreground"
              : isCurrent
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
          )}
        >
          {isCompleted ? <Check className="size-4" /> : position}
        </div>
        {!isLast && <div className="w-px flex-1 bg-border" />}
      </div>

      <div
        className={cn(
          "flex flex-1 flex-wrap items-start gap-4 rounded-xl border border-border p-4 sm:flex-nowrap",
          !isLast && "mb-4",
          isCurrent && !isCompleted && "border-primary/40 bg-primary/5"
        )}
      >
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-lg", TYPE_COLOR[type])}>
          <Icon className="size-5" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Badge variant="outline" className="w-fit">
            {ROADMAP_STEP_TYPE_LABELS[type]}
          </Badge>
          <p
            className={cn(
              "font-medium text-foreground",
              isCompleted && "text-muted-foreground line-through"
            )}
          >
            {title}
          </p>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <Badge variant={isCompleted ? "success" : isCurrent ? "default" : "outline"}>
            {isCompleted ? "Completado" : isCurrent ? "En curso" : "Pendiente"}
          </Badge>
          <Button size="sm" variant={isCompleted ? "outline" : "default"} onClick={handleToggle} disabled={pending}>
            {isCompleted ? "Reabrir" : "Marcar completado"}
          </Button>
        </div>
      </div>
    </li>
  );
}

export { RoadmapStepItem };
