import { Check } from "lucide-react";

import { STAGE_LABELS, type ApplicationStage } from "@/lib/application-stages";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  to_stage: ApplicationStage;
  note: string | null;
  created_at: string;
}

function Timeline({ events }: { events: TimelineEvent[] }) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const lastIndex = sorted.length - 1;

  return (
    <ol className="flex flex-col">
      {sorted.map((event, i) => {
        const isCurrent = i === lastIndex;
        const isRejected = event.to_stage === "rejected";
        return (
          <li key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full",
                  isCurrent
                    ? isRejected
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isCurrent ? (
                  <span className="size-2 rounded-full bg-current" />
                ) : (
                  <Check className="size-3.5" />
                )}
              </div>
              {i < lastIndex ? <div className="w-px flex-1 bg-border" /> : null}
            </div>
            <div className={cn("flex flex-col gap-0.5", i < lastIndex ? "pb-6" : "")}>
              <p
                className={cn(
                  "text-sm font-medium",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {STAGE_LABELS[event.to_stage]}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(event.created_at).toLocaleString("es-419", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
              {event.note ? (
                <p className="text-xs text-muted-foreground italic">{event.note}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export { Timeline };
