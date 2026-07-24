"use client";

import { useState } from "react";

import { toggleRoadmapStepAction } from "@/actions/roadmap";
import { Badge } from "@/components/ui/badge";
import { ROADMAP_STEP_TYPE_LABELS, type RoadmapStepType } from "@/lib/roadmap-step-types";
import { cn } from "@/lib/utils";

interface RoadmapStepItemProps {
  id: string;
  title: string;
  description: string | null;
  type: RoadmapStepType;
  completed: boolean;
}

function RoadmapStepItem({ id, title, description, type, completed }: RoadmapStepItemProps) {
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

  return (
    <li className="flex items-start gap-3 rounded-lg border border-border p-3">
      <input
        type="checkbox"
        checked={isCompleted}
        onChange={handleToggle}
        disabled={pending}
        className="mt-1 size-4 shrink-0 rounded border-input"
      />
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className={cn("text-sm font-medium text-foreground", isCompleted && "line-through opacity-60")}>
            {title}
          </p>
          <Badge variant="outline">{ROADMAP_STEP_TYPE_LABELS[type]}</Badge>
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </li>
  );
}

export { RoadmapStepItem };
