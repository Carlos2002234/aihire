import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatTileProps {
  icon?: LucideIcon;
  label: string;
  value: string;
  caption?: string;
  className?: string;
}

function StatTile({ icon: Icon, label, value, caption, className }: StatTileProps) {
  return (
    <Card size="sm" className={className}>
      <CardContent className={cn("flex flex-col gap-1")}>
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {Icon && <Icon className="size-3.5" />}
          {label}
        </div>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
      </CardContent>
    </Card>
  );
}

export { StatTile };
