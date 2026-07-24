import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface AuthFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

function AuthMarketingPanel({
  badge,
  headline,
  headlineAccent,
  subtitle,
  features,
}: {
  badge: string;
  headline: string;
  headlineAccent: string;
  subtitle: string;
  features: AuthFeature[];
}) {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar px-10 py-12 lg:flex">
      <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-chart-2/10 blur-3xl" />

      <div className="relative flex flex-col gap-10">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            H
          </span>
          <span className="font-heading text-base font-semibold text-sidebar-foreground">HireFlow</span>
        </Link>

        <div className="flex flex-col gap-4">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-sidebar-border bg-sidebar-accent px-3 py-1 text-xs font-medium text-sidebar-foreground/80">
            <Sparkles className="size-3.5 text-primary" />
            {badge}
          </span>
          <h1 className="font-heading text-4xl font-semibold text-sidebar-foreground">
            {headline} <span className="text-primary">{headlineAccent}</span>
          </h1>
          <p className="max-w-sm text-sm text-sidebar-foreground/70">{subtitle}</p>
        </div>

        <div className="flex flex-col gap-4">
          {features.map((feature) => (
            <div key={feature.title} className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="size-4.5" />
              </div>
              <div>
                <p className="text-sm font-medium text-sidebar-foreground">{feature.title}</p>
                <p className="text-xs text-sidebar-foreground/70">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="relative text-xs text-sidebar-foreground/60">
        La IA recomienda, vos decidís tu próximo paso.
      </p>
    </div>
  );
}

export { AuthMarketingPanel };
