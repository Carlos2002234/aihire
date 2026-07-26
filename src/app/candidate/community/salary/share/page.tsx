import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";

import { submitSalaryAction } from "@/actions/community";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { TagInput } from "@/components/community/tag-input";
import { WORK_MODE_LABELS } from "@/lib/job-labels";
import { createClient } from "@/lib/supabase/server";

function selectClassName() {
  return "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
}

export default async function ShareSalaryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-6">
      <Link
        href="/candidate/community/salary"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <PageHeader
        title="Compartir tu salario"
        description="Ayudá a la comunidad con información real sobre compensación."
      />

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Card>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0 text-primary" />
          Este aporte se publica de forma anónima. Nunca mostramos quién lo compartió.
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <form action={submitSalaryAction} className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">País</label>
                <Input name="country" placeholder="ej. Argentina" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Ciudad (opcional)</label>
                <Input name="city" placeholder="ej. Buenos Aires" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Puesto</label>
              <Input name="jobTitle" placeholder="ej. Senior Frontend Engineer" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Compañía (opcional)</label>
              <Input name="company" placeholder="ej. Nimbus Cloud" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Años de experiencia</label>
                <Input name="yearsExperience" type="number" step="0.5" min="0" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Salario anual</label>
                <Input name="salaryAmount" type="number" min="0" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Moneda</label>
                <Input name="salaryCurrency" defaultValue="USD" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Bono anual (opcional)</label>
                <Input name="bonusAmount" type="number" min="0" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Modalidad</label>
                <select name="workMode" defaultValue="" className={selectClassName()}>
                  <option value="">Sin especificar</option>
                  {(["remote", "hybrid", "onsite"] as const).map((mode) => (
                    <option key={mode} value={mode}>
                      {WORK_MODE_LABELS[mode]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Industria (opcional)</label>
              <Input name="industry" placeholder="ej. Fintech" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Certificaciones (opcional)</label>
              <TagInput name="certifications" placeholder="ej. AWS Solutions Architect" />
            </div>

            <Button type="submit" className="w-fit">
              Publicar de forma anónima
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
