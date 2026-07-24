import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Trash2 } from "lucide-react";

import {
  addQuestionAction,
  addRequiredSkillAction,
  closeJobAction,
  publishJobAction,
  removeQuestionAction,
  removeRequiredSkillAction,
  updateJobAction,
} from "@/actions/jobs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/server";

const WORK_MODES = ["remote", "hybrid", "onsite"] as const;
const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "internship"] as const;
const EXPERIENCE_LEVELS = ["intern", "junior", "mid", "senior", "staff", "lead"] as const;

function selectClassName() {
  return "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
}

function textareaClassName() {
  return "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
}

export default async function RecruiterJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: job } = await supabase.from("jobs").select("*").eq("id", id).single();
  if (!job) notFound();

  const [{ data: requiredSkills }, { data: questions }, { data: skillsCatalog }] =
    await Promise.all([
      supabase
        .from("job_required_skills")
        .select("id, min_years, required, skills(id, name)")
        .eq("job_id", id),
      supabase.from("job_questions").select("*").eq("job_id", id).order("position"),
      supabase.from("skills").select("id, name").order("name"),
    ]);

  const takenSkillIds = new Set((requiredSkills ?? []).map((rs) => rs.skills?.id));
  const availableSkills = (skillsCatalog ?? []).filter((s) => !takenSkillIds.has(s.id));

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
      <PageHeader
        title={job.title}
        description={
          job.status === "draft"
            ? "Borrador — todavía no es visible en el job board."
            : job.status === "open"
              ? "Publicado — visible en el job board."
              : "Cerrado."
        }
        actions={
          <>
            <Badge variant={job.status === "open" ? "success" : job.status === "closed" ? "outline" : "secondary"}>
              {job.status === "draft" ? "Borrador" : job.status === "open" ? "Publicado" : "Cerrado"}
            </Badge>
            {job.status === "draft" ? (
              <form action={publishJobAction}>
                <input type="hidden" name="jobId" value={job.id} />
                <Button type="submit">Publicar</Button>
              </form>
            ) : null}
            {job.status === "open" ? (
              <>
                <Button variant="outline" nativeButton={false} render={<Link href={`/jobs/${job.id}`} />}>
                  Ver en el job board
                </Button>
                <form action={closeJobAction}>
                  <input type="hidden" name="jobId" value={job.id} />
                  <Button type="submit" variant="outline">
                    Cerrar
                  </Button>
                </form>
              </>
            ) : null}
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Datos del job</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateJobAction} className="flex flex-col gap-3">
            <input type="hidden" name="jobId" value={job.id} />
            <Input name="title" placeholder="Título" defaultValue={job.title} required />
            <textarea
              name="description"
              placeholder="Descripción"
              rows={3}
              defaultValue={job.description ?? ""}
              className={textareaClassName()}
            />
            <textarea
              name="responsibilities"
              placeholder="Responsabilidades"
              rows={3}
              defaultValue={job.responsibilities ?? ""}
              className={textareaClassName()}
            />
            <textarea
              name="benefits"
              placeholder="Beneficios"
              rows={2}
              defaultValue={job.benefits ?? ""}
              className={textareaClassName()}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="locationCountry" placeholder="País" defaultValue={job.location_country ?? ""} />
              <Input name="locationCity" placeholder="Ciudad" defaultValue={job.location_city ?? ""} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <select name="workMode" defaultValue={job.work_mode ?? ""} className={selectClassName()}>
                <option value="">Modalidad</option>
                {WORK_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
              <select name="employmentType" defaultValue={job.employment_type ?? ""} className={selectClassName()}>
                <option value="">Tipo de empleo</option>
                {EMPLOYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select name="experienceLevel" defaultValue={job.experience_level ?? ""} className={selectClassName()}>
                <option value="">Seniority</option>
                {EXPERIENCE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input name="salaryMin" type="number" placeholder="Salario mín." defaultValue={job.salary_min ?? ""} />
              <Input name="salaryMax" type="number" placeholder="Salario máx." defaultValue={job.salary_max ?? ""} />
              <Input name="salaryCurrency" placeholder="Moneda" defaultValue={job.salary_currency} />
            </div>
            <Button type="submit" className="w-fit">
              Guardar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills requeridos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {requiredSkills?.length ? (
            <ul className="flex flex-col gap-2">
              {requiredSkills.map((rs) => (
                <li key={rs.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <span className="text-sm text-foreground">
                    {rs.skills?.name}
                    {rs.min_years ? ` · ${rs.min_years}+ años` : ""}
                    {rs.required ? "" : " · opcional"}
                  </span>
                  <form action={removeRequiredSkillAction}>
                    <input type="hidden" name="id" value={rs.id} />
                    <input type="hidden" name="jobId" value={job.id} />
                    <Button type="submit" variant="ghost" size="icon-sm" aria-label="Eliminar">
                      <Trash2 />
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Sin skills requeridos todavía" className="py-8" />
          )}
          <form action={addRequiredSkillAction} className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
            <input type="hidden" name="jobId" value={job.id} />
            <select name="skillId" required defaultValue="" className={selectClassName() + " sm:w-56"}>
              <option value="" disabled>
                Elegí una skill
              </option>
              {availableSkills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
            <Input name="minYears" type="number" step="0.5" placeholder="Años mín." className="w-28" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="required" defaultChecked />
              Obligatorio
            </label>
            <Button type="submit" variant="outline">
              Agregar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preguntas (máx. 5)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {questions?.length ? (
            <ul className="flex flex-col gap-2">
              {questions.map((q) => (
                <li key={q.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <span className="text-sm text-foreground">{q.question}</span>
                  <form action={removeQuestionAction}>
                    <input type="hidden" name="id" value={q.id} />
                    <input type="hidden" name="jobId" value={job.id} />
                    <Button type="submit" variant="ghost" size="icon-sm" aria-label="Eliminar">
                      <Trash2 />
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Sin preguntas todavía" className="py-8" />
          )}
          {(questions?.length ?? 0) < 5 ? (
            <form action={addQuestionAction} className="flex items-end gap-2 border-t border-border pt-4">
              <input type="hidden" name="jobId" value={job.id} />
              <Input name="question" placeholder="Pregunta para el candidato" required className="flex-1" />
              <Button type="submit" variant="outline">
                Agregar
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
