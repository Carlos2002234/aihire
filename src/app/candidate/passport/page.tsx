import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Award,
  Briefcase,
  CheckCircle2,
  Circle,
  FileText,
  FolderKanban,
  GraduationCap,
  Languages as LanguagesIcon,
  MapPin,
  Pencil,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";

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
  removeSkillAction,
  updateProfileSummaryAction,
  uploadResumeAction,
} from "@/actions/candidate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { CircularProgress } from "@/components/shared/circular-progress";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { ResumeDownloadButton } from "@/components/candidate/resume-download-button";
import { createClient } from "@/lib/supabase/server";

const WORK_MODES = [
  { value: "remote", label: "Remoto" },
  { value: "hybrid", label: "Híbrido" },
  { value: "onsite", label: "Presencial" },
] as const;

const LANGUAGE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "native"];

type TabKey = "overview" | "experience" | "education" | "skills" | "projects" | "certifications" | "resume";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "experience", label: "Experiencia" },
  { key: "education", label: "Educación" },
  { key: "skills", label: "Skills" },
  { key: "projects", label: "Proyectos" },
  { key: "certifications", label: "Certificaciones" },
  { key: "resume", label: "CV" },
];

function selectClassName() {
  return "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
}

function tabHref(tab: TabKey): string {
  return tab === "overview" ? "/candidate/passport" : `/candidate/passport?tab=${tab}`;
}

export default async function PassportPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const tab: TabKey = TABS.some((t) => t.key === sp.tab) ? (sp.tab as TabKey) : "overview";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: candidateProfile },
    { data: workExperiences },
    { data: educations },
    { data: certifications },
    { data: candidateSkills },
    { data: languages },
    { data: projects },
    { data: resumes },
    { data: skillsCatalog },
    { count: savedJobsCount },
    { count: applicationsCount },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, headline, avatar_url, location_city, location_country")
      .eq("id", user.id)
      .maybeSingle(),
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
      .select("job_id", { count: "exact", head: true })
      .eq("candidate_id", user.id),
    supabase.from("applications").select("id", { count: "exact", head: true }).eq("candidate_id", user.id),
  ]);

  const takenSkillIds = new Set((candidateSkills ?? []).map((cs) => cs.skills?.id));
  const availableSkills = (skillsCatalog ?? []).filter((s) => !takenSkillIds.has(s.id));

  const tips: { done: boolean; label: string; tab: TabKey }[] = [
    { done: !!candidateProfile?.bio, label: "Contá tu historia en Sobre vos", tab: "overview" },
    { done: (workExperiences?.length ?? 0) > 0, label: "Agregá tu experiencia laboral", tab: "experience" },
    { done: (educations?.length ?? 0) > 0, label: "Agregá tu educación", tab: "education" },
    { done: (candidateSkills?.length ?? 0) >= 3, label: "Sumá al menos 3 skills", tab: "skills" },
    { done: (resumes?.length ?? 0) > 0, label: "Subí un CV", tab: "resume" },
  ];
  const pendingTips = tips.filter((t) => !t.done);

  return (
    <main className="flex flex-col gap-6 px-6 py-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <PersonAvatar name={profile?.full_name ?? null} avatarUrl={profile?.avatar_url} size="size-20" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-heading text-2xl font-semibold text-foreground">
                    {profile?.full_name ?? "Candidato"}
                  </h1>
                  <Link
                    href={tabHref("overview")}
                    aria-label="Editar perfil"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="size-4" />
                  </Link>
                  {candidateProfile?.open_to_work && <Badge variant="success">Open to work</Badge>}
                </div>
                {profile?.headline && <p className="text-sm text-muted-foreground">{profile.headline}</p>}
                {(profile?.location_city || profile?.location_country) && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {[profile?.location_city, profile?.location_country].filter(Boolean).join(", ")}
                  </p>
                )}
                {candidateProfile?.bio && (
                  <p className="mt-2 text-sm text-muted-foreground">{candidateProfile.bio}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-6 border-t border-border pt-4">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{applicationsCount ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Aplicaciones</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{savedJobsCount ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Jobs guardados</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{candidateSkills?.length ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Skills</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center gap-1 border-b border-border">
            {TABS.map((t) => (
              <Link
                key={t.key}
                href={tabHref(t.key)}
                className={
                  tab === t.key
                    ? "border-b-2 border-primary px-3 py-2 text-sm font-medium text-foreground"
                    : "px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                }
              >
                {t.label}
              </Link>
            ))}
          </div>

          {tab === "overview" && (
            <div className="flex flex-col gap-4">
              <Card className="bg-gradient-to-br from-primary/10 to-transparent">
                <CardContent className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="size-8 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Analizador de Perfil con IA</p>
                      <p className="text-sm text-muted-foreground">
                        Recibí un análisis honesto de tu Career Passport y qué mejorar primero.
                      </p>
                    </div>
                  </div>
                  <Button render={<Link href="/candidate/profile-analyzer" />} nativeButton={false}>
                    Analizar mi perfil
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sobre vos</CardTitle>
                </CardHeader>
                <CardContent>
                  <form action={updateProfileSummaryAction} className="flex flex-col gap-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input name="fullName" placeholder="Nombre completo" defaultValue={profile?.full_name ?? ""} />
                      <Input
                        name="headline"
                        placeholder="Headline (ej. Full Stack Developer)"
                        defaultValue={profile?.headline ?? ""}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        name="locationCity"
                        placeholder="Ciudad"
                        defaultValue={profile?.location_city ?? ""}
                      />
                      <Input
                        name="locationCountry"
                        placeholder="País"
                        defaultValue={profile?.location_country ?? ""}
                      />
                    </div>
                    <textarea
                      name="bio"
                      placeholder="Contá quién sos, qué buscás y qué te apasiona..."
                      defaultValue={candidateProfile?.bio ?? ""}
                      rows={3}
                      className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    />
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Input name="githubUrl" placeholder="GitHub URL" defaultValue={candidateProfile?.github_url ?? ""} />
                      <Input
                        name="linkedinUrl"
                        placeholder="LinkedIn URL"
                        defaultValue={candidateProfile?.linkedin_url ?? ""}
                      />
                      <Input
                        name="websiteUrl"
                        placeholder="Sitio personal"
                        defaultValue={candidateProfile?.website_url ?? ""}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Input
                        name="salaryMin"
                        type="number"
                        placeholder="Salario mín."
                        defaultValue={candidateProfile?.salary_expectation_min ?? ""}
                      />
                      <Input
                        name="salaryMax"
                        type="number"
                        placeholder="Salario máx."
                        defaultValue={candidateProfile?.salary_expectation_max ?? ""}
                      />
                      <Input
                        name="salaryCurrency"
                        placeholder="Moneda"
                        defaultValue={candidateProfile?.salary_currency ?? "USD"}
                      />
                    </div>
                    <Input
                      name="availability"
                      placeholder="Disponibilidad (ej. immediate, 2_weeks)"
                      defaultValue={candidateProfile?.availability ?? ""}
                    />
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

              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Briefcase className="size-4 text-primary" />
                        Experiencia
                      </span>
                      <Link href={tabHref("experience")} className="text-muted-foreground hover:text-foreground">
                        <Pencil className="size-3.5" />
                      </Link>
                    </div>
                    {workExperiences?.length ? (
                      <div className="flex flex-col gap-2">
                        {workExperiences.slice(0, 2).map((exp) => (
                          <div key={exp.id}>
                            <p className="text-sm font-medium text-foreground">{exp.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {exp.company} · {exp.start_date} — {exp.end_date ?? "actual"}
                            </p>
                          </div>
                        ))}
                        <Link href={tabHref("experience")} className="text-xs text-primary hover:underline">
                          Ver todas ({workExperiences.length})
                        </Link>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin experiencia cargada todavía.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <GraduationCap className="size-4 text-primary" />
                        Educación
                      </span>
                      <Link href={tabHref("education")} className="text-muted-foreground hover:text-foreground">
                        <Pencil className="size-3.5" />
                      </Link>
                    </div>
                    {educations?.length ? (
                      <div className="flex flex-col gap-2">
                        {educations.slice(0, 2).map((edu) => (
                          <div key={edu.id}>
                            <p className="text-sm font-medium text-foreground">{edu.degree}</p>
                            <p className="text-xs text-muted-foreground">
                              {edu.institution} · {edu.start_date} — {edu.end_date ?? "actual"}
                            </p>
                          </div>
                        ))}
                        <Link href={tabHref("education")} className="text-xs text-primary hover:underline">
                          Ver todas ({educations.length})
                        </Link>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin educación cargada todavía.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Sparkles className="size-4 text-primary" />
                        Skills
                      </span>
                      <Link href={tabHref("skills")} className="text-muted-foreground hover:text-foreground">
                        <Pencil className="size-3.5" />
                      </Link>
                    </div>
                    {candidateSkills?.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {candidateSkills.slice(0, 8).map((cs) => (
                          <Badge key={cs.id} variant={cs.inferred ? "outline" : "secondary"}>
                            {cs.skills?.name}
                          </Badge>
                        ))}
                        {candidateSkills.length > 8 && (
                          <Link
                            href={tabHref("skills")}
                            className="self-center text-xs text-primary hover:underline"
                          >
                            Ver todas ({candidateSkills.length})
                          </Link>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin skills cargadas todavía.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <FolderKanban className="size-4 text-primary" />
                        Proyectos
                      </span>
                      <Link href={tabHref("projects")} className="text-muted-foreground hover:text-foreground">
                        <Pencil className="size-3.5" />
                      </Link>
                    </div>
                    {projects?.length ? (
                      <div className="flex flex-col gap-2">
                        {projects.slice(0, 3).map((project) => (
                          <p key={project.id} className="text-sm font-medium text-foreground">
                            {project.name}
                          </p>
                        ))}
                        <Link href={tabHref("projects")} className="text-xs text-primary hover:underline">
                          Ver todos ({projects.length})
                        </Link>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin proyectos cargados todavía.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Award className="size-4 text-primary" />
                        Certificaciones
                      </span>
                      <Link href={tabHref("certifications")} className="text-muted-foreground hover:text-foreground">
                        <Pencil className="size-3.5" />
                      </Link>
                    </div>
                    {certifications?.length ? (
                      <div className="flex flex-col gap-2">
                        {certifications.slice(0, 2).map((cert) => (
                          <div key={cert.id}>
                            <p className="text-sm font-medium text-foreground">{cert.name}</p>
                            <p className="text-xs text-muted-foreground">{cert.issuer}</p>
                          </div>
                        ))}
                        <Link href={tabHref("certifications")} className="text-xs text-primary hover:underline">
                          Ver todas ({certifications.length})
                        </Link>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin certificaciones cargadas todavía.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <FileText className="size-4 text-primary" />
                        CV
                      </span>
                      <Link href={tabHref("resume")} className="text-muted-foreground hover:text-foreground">
                        <Pencil className="size-3.5" />
                      </Link>
                    </div>
                    {resumes?.length ? (
                      <div className="flex flex-col gap-2">
                        <p className="text-sm font-medium text-foreground">{resumes[0].name}</p>
                        <Link href={tabHref("resume")} className="text-xs text-primary hover:underline">
                          Ver todos ({resumes.length})
                        </Link>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin CVs subidos todavía.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {tab === "experience" && (
            <Card>
              <CardHeader>
                <CardTitle>Experiencia laboral</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {workExperiences?.length ? (
                  <ul className="flex flex-col gap-3">
                    {workExperiences.map((exp) => (
                      <li
                        key={exp.id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {exp.title} · {exp.company}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {exp.start_date} — {exp.end_date ?? "actual"}
                          </p>
                          {exp.description ? (
                            <p className="mt-1 text-sm text-muted-foreground">{exp.description}</p>
                          ) : null}
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
          )}

          {tab === "education" && (
            <Card>
              <CardHeader>
                <CardTitle>Educación</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {educations?.length ? (
                  <ul className="flex flex-col gap-3">
                    {educations.map((edu) => (
                      <li
                        key={edu.id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {edu.degree} · {edu.institution}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {edu.field ? `${edu.field} · ` : ""}
                            {edu.start_date} — {edu.end_date ?? "actual"}
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
          )}

          {tab === "certifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Certificaciones</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {certifications?.length ? (
                  <ul className="flex flex-col gap-3">
                    {certifications.map((cert) => (
                      <li
                        key={cert.id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {cert.name} · {cert.issuer}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {cert.issue_date ?? ""}
                            {cert.expiry_date ? ` — vence ${cert.expiry_date}` : ""}
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
          )}

          {tab === "skills" && (
            <>
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LanguagesIcon className="size-4" />
                    Idiomas
                  </CardTitle>
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
            </>
          )}

          {tab === "projects" && (
            <Card>
              <CardHeader>
                <CardTitle>Proyectos</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {projects?.length ? (
                  <ul className="flex flex-col gap-3">
                    {projects.map((project) => (
                      <li
                        key={project.id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{project.name}</p>
                          {project.description ? (
                            <p className="text-sm text-muted-foreground">{project.description}</p>
                          ) : null}
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
          )}

          {tab === "resume" && (
            <>
              <Card className="bg-gradient-to-br from-primary/10 to-transparent">
                <CardContent className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Wand2 className="size-8 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">CV Builder con IA</p>
                      <p className="text-sm text-muted-foreground">
                        Ajustá tu CV a una posición específica y revisalo antes de exportar.
                      </p>
                    </div>
                  </div>
                  <Button render={<Link href="/candidate/resume-builder" />} nativeButton={false}>
                    Abrir CV Builder
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>CVs</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {resumes?.length ? (
                    <ul className="flex flex-col gap-2">
                      {resumes.map((resume) => (
                        <li
                          key={resume.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                        >
                          <span className="text-sm text-foreground">{resume.name}</span>
                          <div className="flex items-center gap-1">
                            <ResumeDownloadButton resumeId={resume.id} />
                            <form action={deleteResumeAction}>
                              <input type="hidden" name="id" value={resume.id} />
                              <input type="hidden" name="storagePath" value={resume.storage_path} />
                              <Button type="submit" variant="ghost" size="icon-sm" aria-label="Eliminar">
                                <Trash2 />
                              </Button>
                            </form>
                          </div>
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
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-72">
          <Card>
            <CardContent className="flex items-center gap-4">
              <CircularProgress value={candidateProfile?.completion_pct ?? 0} color="var(--primary)" />
              <div>
                <p className="text-sm font-medium text-foreground">Completitud del perfil</p>
                <p className="text-xs text-muted-foreground">
                  {(candidateProfile?.completion_pct ?? 0) === 100
                    ? "¡Perfil completo!"
                    : "Completá tu perfil para destacar ante recruiters."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm font-medium text-foreground">Tips para tu Career Passport</p>
              {pendingTips.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {pendingTips.map((t) => (
                    <li key={t.label}>
                      <Link
                        href={tabHref(t.tab)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <Circle className="size-3.5 shrink-0" />
                        {t.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 className="size-4 shrink-0" />
                  ¡Tu perfil está completo!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
