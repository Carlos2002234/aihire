import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";

import { submitInterviewExperienceAction } from "@/actions/community";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/server";

function selectClassName() {
  return "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
}

function textareaClassName() {
  return "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
}

export default async function ShareInterviewExperiencePage({
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
        href="/candidate/community/interviews"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <PageHeader
        title="Compartir tu experiencia de entrevista"
        description="Ayudá a otros candidatos a prepararse mejor."
      />

      <Card>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0 text-primary" />
          Este aporte se publica de forma anónima. Nunca mostramos quién lo compartió.
        </CardContent>
      </Card>

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Card>
        <CardContent>
          <form action={submitInterviewExperienceAction} className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Compañía</label>
                <Input name="company" placeholder="ej. Google" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Puesto</label>
                <Input name="jobTitle" placeholder="ej. Software Engineer" required />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Rondas</label>
                <Input name="rounds" type="number" min="1" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Dificultad (1-10)</label>
                <Input name="difficulty" type="number" min="1" max="10" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Duración (opcional)</label>
                <Input name="duration" placeholder="ej. 3 semanas" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Tipo de entrevista</label>
              <select name="interviewType" defaultValue="both" className={selectClassName()}>
                <option value="technical">Técnica</option>
                <option value="behavioral">Comportamental</option>
                <option value="both">Técnica + comportamental</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Preguntas que recordás (opcional)</label>
              <textarea
                name="questionsRemembered"
                placeholder={"Una por línea, ej.:\n¿Por qué querés trabajar acá?\nDiseñá un rate limiter"}
                rows={4}
                className={textareaClassName()}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Experiencia general</label>
              <textarea name="overallExperience" placeholder="¿Cómo fue el proceso en general?" rows={3} required className={textareaClassName()} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Tips para futuros candidatos (opcional)</label>
              <textarea name="tips" placeholder="¿Qué le recomendarías a alguien que va a pasar por esto?" rows={3} className={textareaClassName()} />
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
