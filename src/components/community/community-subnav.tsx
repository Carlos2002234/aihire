import Link from "next/link";

import { cn } from "@/lib/utils";

type CommunitySection = "questions" | "salary" | "interviews";

const SECTIONS: { key: CommunitySection; label: string; href: string }[] = [
  { key: "questions", label: "Preguntas", href: "/candidate/community/questions" },
  { key: "salary", label: "Salarios", href: "/candidate/community/salary" },
  { key: "interviews", label: "Entrevistas", href: "/candidate/community/interviews" },
];

function CommunitySubnav({ active }: { active: CommunitySection }) {
  return (
    <div className="flex items-center gap-1 border-b border-border">
      {SECTIONS.map((section) => (
        <Link
          key={section.key}
          href={section.href}
          className={cn(
            "px-3 py-2 text-sm font-medium",
            active === section.key
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {section.label}
        </Link>
      ))}
    </div>
  );
}

export { CommunitySubnav };
export type { CommunitySection };
