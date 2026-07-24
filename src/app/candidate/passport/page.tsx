import { redirect } from "next/navigation";
import { Trash2 } from "lucide-react";

import {
  addCertificationAction,
  addEducationAction,
  addLanguageAction,
  addProjectAction,
  addSkillAction,
  addWorkExperienceAction,
  deleteCertificationAction,
  deleteEducationAction,
  deleteLanguageAction,
  deleteProjectAction,
  deleteResumeAction,
  deleteWorkExperienceAction,
  generateResumeAction,
  removeSkillAction,
  updateProfileSummaryAction,
  uploadResumeAction,
} from "@/actions/candidate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { CompletionBar } from "@/components/candidate/completion-bar";
import { createClient } from "@/lib/supabase/server";

const WORK_MODES = [
  { value: "remote", label: "Remoto" },
  { value: "hybrid", label: "Híbrido" },
  { value: "onsite", label: "Presencial" },
] as const;

const LANGUAGE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "native"];

function selectClassName() {
  return "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
}

export default async function PassportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    { data: candidateProfile },
    { data: workExperiences },
    { data: educations },
    { data: certifications },
    { data: candidateSkills },
    { data: languages },
    { data: projects },
    { data: resumes },
    { data: skillsCatalog },
    { data: savedJobs },
  ] = await Promise.all([
    supabase.from("candidate_profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("work_experiences")
      .select("*")
      .eq("candidate_id", user.id)
      .order("start_date", { ascending: false }),
    supabase
      .from("educations")
      .select("*")
      .eq("candidate_id", user.id)
      .order("start_date", { ascending: false }),
    supabase
      .from("certifications")
      .select("*")
      .eq("candidate_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("candidate_skills")
      .select("id, years_experience, inferred, skills(id, name, category)")
      .eq("candidate_id", user.id),
    supabase.from("candidate_languages").select("*").eq("candidate_id", user.id),
    supabase
      .from("projects")
      .select("*")
      .eq("candidate_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("resumes")
      .select("*")
      .eq("candidate_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("skills").select("id, name, category").order("category").order("name"),
    supabase
      .from("saved_jobs")
      .select("job_id, jobs(title)")
      .eq("candidate_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const takenSkillIds = new Set((candidateSkills ?? []).map((cs) => cs.skills?.id));
  const availableSkills = (skillsCatalog ?? []).filter((s) => !takenSkillIds.has(s.id));

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <PageHeader
        title="Career Passport"
        description="Tu perfil completo — mientras más completo, mejor te representa la IA ante los recruiters."
      />

      <CompletionBar pct={candidateProfile?.completion_pct ?? 0} />

      {/* Resumen */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre vos</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateProfileSummaryAction} className="flex flex-col gap-3">
            <textarea
              name="bio"
              placeholder="Contá quién sos, qué buscás y qué te apasiona..."
              defaultValue={candidateProfile?.bio ?? ""}
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <Input name="githubUrl" placeholder="GitHub URL" defaultValue={candidateProfile?.github_url ?? ""} />
              <Input name="linkedinUrl" placeholder="LinkedIn URL" defaultValue={candidateProfile?.linkedin_url ?? ""} />
              <Input name="websiteUrl" placeholder="Sitio personal" defaultValue={candidateProfile?.website_url ?? ""} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input name="salaryMin" type="number" placeholder="Salario mín." defaultValue={candidateProfile?.salary_expectation_min ?? ""} />
              <Input name="salaryMax" type="number" placeholder="Salario máx." defaultValue={candidateProfile?.salary_expectation_max ?? ""} />
              <Input name="salaryCurrency" placeholder="Moneda" defaultValue={candidateProfile?.salary_currency ?? "USD"} />
            </div>
            <Input name="availability" placeholder="Disponibilidad (ej. immediate, 2_weeks)" defaultValue={candidateProfile?.availability ?? ""} />
            <div className="flex flex-wrap gap-4">
              {WORK_MODES.map((mode) => (
                <label key={mode.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="workModes"
                    value={mode.value}
                    defaultChecked={candidateProfile?.preferred_work_modes?.includes(mode.value)}
                  />
                  {mode.label}
                </label>
              ))}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="openToWork"
                  defaultChecked={candidateProfile?.open_to_work ?? true}
                />
                Open to work
              </label>
            </div>
            <Button type="submit" className="w-fit">
              Guardar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Experiencia laboral */}
      <Card>
        <CardHeader>
          <CardTitle>Experiencia laboral</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {workExperiences?.length ? (
            <ul className="flex flex-col gap-3">
              {workExperiences.map((exp) => (
                <li key={exp.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{exp.title} · {exp.company}</p>
                    <p className="text-xs text-muted-foreground">
                      {exp.start_date} — {exp.end_date ?? "actual"}
                    </p>
                    {exp.description ? <p className="mt-1 text-sm text-muted-foreground">{exp.description}</p> : null}
                  </div>
                  <form action={deleteWorkExperienceAction}>
                    <input type="hidden" name="id" value={exp.id} />
                    <Button type="submit" variant="ghost" size="icon-sm" aria-label="Eliminar">
                      <Trash2 />
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Sin experiencia laboral cargada todavía" className="py-8" />
          )}
          <form action={addWorkExperienceAction} className="grid gap-2 border-t border-border pt-4 sm:grid-cols-2">
            <Input name="title" placeholder="Puesto" required />
            <Input name="company" placeholder="Empresa" required />
            <Input name="startDate" type="date" required />
            <Input name="endDate" type="date" placeholder="Vacío = actual" />
            <Input name="technologies" placeholder="Tecnologías (separadas por coma)" className="sm:col-span-2" />
            <textarea
              name="description"
              placeholder="Descripción"
              rows={2}
              className="sm:col-span-2 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
            <Button type="submit" variant="outline" className="w-fit sm:col-span-2">
              Agregar experiencia
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Educación */}
      <Card>
        <CardHeader>
          <CardTitle>Educación</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {educations?.length ? (
            <ul className="flex flex-col gap-3">
              {educations.map((edu) => (
                <li key={edu.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{edu.degree} · {edu.institution}</p>
                    <p className="text-xs text-muted-foreground">
                      {edu.field ? `${edu.field} · ` : ""}{edu.start_date} — {edu.end_date ?? "actual"}
                    </p>
                  </div>
                  <form action={deleteEducationAction}>
                    <input type="hidden" name="id" value={edu.id} />
                    <Button type="submit" variant="ghost" size="icon-sm" aria-label="Eliminar">
                      <Trash2 />
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Sin educación cargada todavía" className="py-8" />
          )}
          <form action={addEducationAction} className="grid gap-2 border-t border-border pt-4 sm:grid-cols-2">
            <Input name="institution" placeholder="Institución" required />
            <Input name="degree" placeholder="Título" required />
            <Input name="field" placeholder="Área de estudio" />
            <Input name="startDate" type="date" required />
            <Input name="endDate" type="date" placeholder="Vacío = actual" />
            <Button type="submit" variant="outline" className="w-fit sm:col-span-2">
              Agregar educación
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Certificaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Certificaciones</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {certifications?.length ? (
            <ul className="flex flex-col gap-3">
              {certifications.map((cert) => (
                <li key={cert.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{cert.name} · {cert.issuer}</p>
                    <p className="text-xs text-muted-foreground">
                      {cert.issue_date ?? ""}{cert.expiry_date ? ` — vence ${cert.expiry_date}` : ""}
                    </p>
                  </div>
                  <form action={deleteCertificationAction}>
                    <input type="hidden" name="id" value={cert.id} />
                    <Button type="submit" variant="ghost" size="icon-sm" aria-label="Eliminar">
                      <Trash2 />
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Sin certificaciones cargadas todavía" className="py-8" />
          )}
          <form action={addCertificationAction} className="grid gap-2 border-t border-border pt-4 sm:grid-cols-2">
            <Input name="name" placeholder="Nombre" required />
            <Input name="issuer" placeholder="Emisor" required />
            <Input name="issueDate" type="date" />
            <Input name="expiryDate" type="date" />
            <Input name="credentialUrl" placeholder="URL de credencial" className="sm:col-span-2" />
            <Button type="submit" variant="outline" className="w-fit sm:col-span-2">
              Agregar certificación
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {candidateSkills?.length ? (
            <div className="flex flex-wrap gap-2">
              {candidateSkills.map((cs) => (
                <form key={cs.id} action={removeSkillAction}>
                  <input type="hidden" name="id" value={cs.id} />
                  <button type="submit">
                    <Badge variant={cs.inferred ? "outline" : "secondary"} className="cursor-pointer gap-1.5">
                      {cs.skills?.name}
                      {cs.years_experience ? ` · ${cs.years_experience}a` : ""}
                      <Trash2 className="size-3" />
                    </Badge>
                  </button>
                </form>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin skills cargadas todavía" className="py-8" />
          )}
          <form action={addSkillAction} className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
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
            <Input name="yearsExperience" type="number" step="0.5" placeholder="Años" className="w-24" />
            <Button type="submit" variant="outline">
              Agregar skill
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Idiomas */}
      <Card>
        <CardHeader>
          <CardTitle>Idiomas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {languages?.length ? (
            <div className="flex flex-wrap gap-2">
              {languages.map((lang) => (
                <form key={lang.id} action={deleteLanguageAction}>
                  <input type="hidden" name="id" value={lang.id} />
                  <button type="submit">
                    <Badge variant="secondary" className="cursor-pointer gap-1.5">
                      {lang.language} · {lang.level}
                      <Trash2 className="size-3" />
                    </Badge>
                  </button>
                </form>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin idiomas cargados todavía" className="py-8" />
          )}
          <form action={addLanguageAction} className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
            <Input name="language" placeholder="Idioma" required className="w-40" />
            <select name="level" required defaultValue="" className={selectClassName() + " w-28"}>
              <option value="" disabled>
                Nivel
              </option>
              {LANGUAGE_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline">
              Agregar idioma
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Proyectos */}
      <Card>
        <CardHeader>
          <CardTitle>Proyectos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {projects?.length ? (
            <ul className="flex flex-col gap-3">
              {projects.map((project) => (
                <li key={project.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{project.name}</p>
                    {project.description ? <p className="text-sm text-muted-foreground">{project.description}</p> : null}
                  </div>
                  <form action={deleteProjectAction}>
                    <input type="hidden" name="id" value={project.id} />
                    <Button type="submit" variant="ghost" size="icon-sm" aria-label="Eliminar">
                      <Trash2 />
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Sin proyectos cargados todavía" className="py-8" />
          )}
          <form action={addProjectAction} className="grid gap-2 border-t border-border pt-4 sm:grid-cols-2">
            <Input name="name" placeholder="Nombre del proyecto" required />
            <Input name="url" placeholder="URL" />
            <Input name="technologies" placeholder="Tecnologías (separadas por coma)" className="sm:col-span-2" />
            <textarea
              name="description"
              placeholder="Descripción"
              rows={2}
              className="sm:col-span-2 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
            <Button type="submit" variant="outline" className="w-fit sm:col-span-2">
              Agregar proyecto
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* CVs */}
      <Card>
        <CardHeader>
          <CardTitle>CVs</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {resumes?.length ? (
            <ul className="flex flex-col gap-2">
              {resumes.map((resume) => (
                <li key={resume.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <span className="text-sm text-foreground">{resume.name}</span>
                  <form action={deleteResumeAction}>
                    <input type="hidden" name="id" value={resume.id} />
                    <input type="hidden" name="storagePath" value={resume.storage_path} />
                    <Button type="submit" variant="ghost" size="icon-sm" aria-label="Eliminar">
                      <Trash2 />
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Sin CVs subidos todavía" className="py-8" />
          )}
          <form action={uploadResumeAction} className="flex items-center gap-2 border-t border-border pt-4">
            <input
              type="file"
              name="file"
              accept=".pdf,.doc,.docx"
              required
              className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border file:border-input file:bg-transparent file:px-2.5 file:py-1 file:text-sm file:font-medium file:text-foreground"
            />
            <Button type="submit" variant="outline">
              Subir CV
            </Button>
          </form>
          <form action={generateResumeAction} className="flex items-center gap-2 border-t border-border pt-4">
            <select name="targetJobId" defaultValue="" className={selectClassName()}>
              <option value="">CV genérico</option>
              {(savedJobs ?? [])
                .filter((sj) => sj.jobs)
                .map((sj) => (
                  <option key={sj.job_id} value={sj.job_id}>
                    Targeteado a: {sj.jobs!.title}
                  </option>
                ))}
            </select>
            <Button type="submit" variant="outline" className="shrink-0">
              Generar CV con IA
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
