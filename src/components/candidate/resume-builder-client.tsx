"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  Check,
  Download,
  Link2,
  Loader2,
  Mail,
  MapPin,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import {
  generateTailoredResumeAction,
  getResumeDownloadUrlAction,
  saveGeneratedResumeAction,
} from "@/actions/candidate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PersonAvatar } from "@/components/shared/person-avatar";
import type { ResumeOutput } from "@/lib/ai/prompts";
import { cn } from "@/lib/utils";

type Step = "input" | "editing" | "done";

interface ResumeBuilderClientProps {
  fullName: string | null;
  avatarUrl: string | null;
  email: string | null;
  location: string | null;
  linkedinUrl: string | null;
}

function textareaClassName() {
  return "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
}

// Inputs "sin bordes" que viven adentro de la hoja blanca de preview — solo
// se revelan como campo editable al hacer foco/hover, para que se lea como
// el documento real que se exporta, no como un formulario.
function paperFieldClassName(extra = "") {
  return cn(
    "w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-neutral-900 outline-none transition-colors hover:bg-neutral-100 focus:border-neutral-300 focus:bg-neutral-50",
    extra
  );
}

// Textarea de una línea que crece con el contenido — los bullets de un CV
// son oraciones completas, un <input> las recorta con scroll horizontal
// en vez de hacer wrap.
function AutoTextarea({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={1}
      className={cn("resize-none overflow-hidden", className)}
    />
  );
}

function StepIndicator({ step }: { step: Step }) {
  const step2Active = step === "editing" || step === "done";
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            step2Active ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"
          )}
        >
          {step2Active ? <Check className="size-3.5" /> : "1"}
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">Posición objetivo</p>
          <p className="text-xs text-muted-foreground">A qué puesto ajustar tu CV</p>
        </div>
      </div>
      <div className="h-px w-10 shrink-0 bg-border" />
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            step2Active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          2
        </span>
        <div>
          <p className={cn("text-sm font-medium", step2Active ? "text-foreground" : "text-muted-foreground")}>
            Revisar y exportar
          </p>
          <p className="text-xs text-muted-foreground">Ajustá el contenido antes de descargar</p>
        </div>
      </div>
    </div>
  );
}

function ResumeBuilderClient({ fullName, avatarUrl, email, location, linkedinUrl }: ResumeBuilderClientProps) {
  const [step, setStep] = useState<Step>("input");
  const [positionTitle, setPositionTitle] = useState("");
  const [positionDescription, setPositionDescription] = useState("");
  const [resume, setResume] = useState<ResumeOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function updateField<K extends keyof ResumeOutput>(key: K, value: ResumeOutput[K]) {
    setResume((r) => (r ? { ...r, [key]: value } : r));
  }

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateTailoredResumeAction(positionTitle, positionDescription);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setResume(result.resume);
      setStep("editing");
    });
  }

  function handleSave() {
    if (!resume) return;
    setError(null);
    startTransition(async () => {
      const result = await saveGeneratedResumeAction(
        resume,
        positionTitle.trim() || null,
        positionDescription.trim() || null
      );
      if (result.error || !result.resumeId) {
        setError(result.error ?? "No pudimos guardar el CV.");
        return;
      }
      const { url } = await getResumeDownloadUrlAction(result.resumeId);
      setDownloadUrl(url);
      setStep("done");
    });
  }

  function startOver() {
    setPositionTitle("");
    setPositionDescription("");
    setResume(null);
    setDownloadUrl(null);
    setError(null);
    setStep("input");
  }

  if (step === "input") {
    return (
      <div className="flex max-w-2xl flex-col gap-6">
        <StepIndicator step={step} />
        <Card>
          <CardContent className="flex flex-col gap-4">
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles className="size-4 text-primary" />
              Ajustá tu CV a una posición
            </p>
            <p className="text-sm text-muted-foreground">
              Pegá el título y la descripción de la posición a la que querés aplicar — de HireFlow o de cualquier
              otro lado — y la IA prioriza y reescribe tu Career Passport para ese puesto, sin inventar nada. Dejalo
              vacío para un CV genérico.
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Título del puesto (opcional)</label>
              <Input
                value={positionTitle}
                onChange={(e) => setPositionTitle(e.target.value)}
                placeholder="ej. Senior Frontend Engineer"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Descripción del puesto (opcional)</label>
              <textarea
                value={positionDescription}
                onChange={(e) => setPositionDescription(e.target.value)}
                placeholder="Pegá acá el texto de la publicación del job..."
                rows={8}
                className={textareaClassName()}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleGenerate} disabled={pending} className="w-fit gap-1.5">
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Generar CV con IA
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="flex max-w-2xl flex-col gap-6">
        <StepIndicator step={step} />
        <Card>
          <CardContent className="flex flex-col items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-success/10 text-success">
              <Check className="size-5" />
            </span>
            <p className="font-medium text-foreground">¡Tu CV está listo!</p>
            <p className="text-sm text-muted-foreground">
              Lo guardamos en tu Career Passport{positionTitle ? ` como "CV IA — ${positionTitle}"` : ""}.
            </p>
            <div className="flex flex-wrap gap-2">
              {downloadUrl && (
                <Button
                  render={<a href={downloadUrl} target="_blank" rel="noreferrer" />}
                  nativeButton={false}
                  className="gap-1.5"
                >
                  <Download className="size-4" />
                  Descargar CV
                </Button>
              )}
              <Button variant="outline" onClick={startOver} className="gap-1.5">
                <RefreshCw className="size-4" />
                Generar otro
              </Button>
              <Button variant="outline" render={<Link href="/candidate/passport?tab=resume" />} nativeButton={false}>
                Ver todos tus CVs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!resume) return null;

  return (
    <div className="flex flex-col gap-4">
      <StepIndicator step={step} />

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="flex w-full shrink-0 flex-col gap-4 xl:w-64">
          <Card>
            <CardContent className="flex flex-col gap-3">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles className="size-4 text-primary" />
                Ajustado a
              </p>
              {positionTitle ? (
                <div>
                  <p className="text-sm font-medium text-foreground">{positionTitle}</p>
                  {positionDescription && (
                    <p className="mt-1 line-clamp-4 text-xs text-muted-foreground">{positionDescription}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">CV genérico, sin posición específica.</p>
              )}
              <button
                type="button"
                onClick={() => setStep("input")}
                className="w-fit text-xs text-primary hover:underline"
              >
                Cambiar posición
              </button>
              <div className="h-px bg-border" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={handleGenerate}
                className="w-fit gap-1.5"
              >
                {pending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                Regenerar con IA
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 flex-1">
          <div className="rounded-2xl bg-white p-8 text-neutral-900 shadow-lg sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 pb-4">
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-semibold">{fullName ?? "Candidato"}</p>
                <input
                  value={resume.headline}
                  onChange={(e) => updateField("headline", e.target.value)}
                  className={paperFieldClassName("-mx-1 mt-0.5 text-base text-neutral-600")}
                />
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                  {location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {location}
                    </span>
                  )}
                  {email && (
                    <span className="flex items-center gap-1">
                      <Mail className="size-3.5" />
                      {email}
                    </span>
                  )}
                  {linkedinUrl && (
                    <a
                      href={linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 hover:underline"
                    >
                      <Link2 className="size-3.5" />
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
              <PersonAvatar name={fullName} avatarUrl={avatarUrl} size="size-16" />
            </div>

            <section className="mt-5">
              <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">Resumen</p>
              <textarea
                value={resume.summary}
                onChange={(e) => updateField("summary", e.target.value)}
                rows={3}
                className={paperFieldClassName("-mx-1 mt-1.5 resize-none text-sm leading-relaxed")}
              />
            </section>

            <section className="mt-5">
              <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">Experiencia</p>
              <div className="mt-2 flex flex-col gap-4">
                {resume.work_experience.map((exp, i) => (
                  <div key={i} className="group/exp relative rounded-lg pr-6">
                    <button
                      type="button"
                      aria-label="Eliminar experiencia"
                      onClick={() =>
                        updateField(
                          "work_experience",
                          resume.work_experience.filter((_, j) => j !== i)
                        )
                      }
                      className="absolute top-0 right-0 text-neutral-300 opacity-0 hover:text-neutral-600 group-hover/exp:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <input
                        value={exp.title}
                        onChange={(e) =>
                          updateField(
                            "work_experience",
                            resume.work_experience.map((x, j) => (j === i ? { ...x, title: e.target.value } : x))
                          )
                        }
                        className={paperFieldClassName("-mx-1 w-auto flex-1 text-sm font-semibold")}
                      />
                      <input
                        value={exp.date_range}
                        onChange={(e) =>
                          updateField(
                            "work_experience",
                            resume.work_experience.map((x, j) =>
                              j === i ? { ...x, date_range: e.target.value } : x
                            )
                          )
                        }
                        className={paperFieldClassName("-mx-1 w-auto shrink-0 text-right text-xs text-neutral-500")}
                      />
                    </div>
                    <input
                      value={exp.company}
                      onChange={(e) =>
                        updateField(
                          "work_experience",
                          resume.work_experience.map((x, j) => (j === i ? { ...x, company: e.target.value } : x))
                        )
                      }
                      className={paperFieldClassName("-mx-1 text-sm text-neutral-600")}
                    />
                    <ul className="mt-1.5 flex flex-col gap-1">
                      {exp.bullets.map((bullet, j) => (
                        <li key={j} className="group/bullet flex items-start gap-1.5">
                          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-neutral-400" />
                          <AutoTextarea
                            value={bullet}
                            onChange={(value) =>
                              updateField(
                                "work_experience",
                                resume.work_experience.map((x, k) =>
                                  k === i
                                    ? { ...x, bullets: x.bullets.map((b, l) => (l === j ? value : b)) }
                                    : x
                                )
                              )
                            }
                            className={paperFieldClassName("-mx-1 flex-1 text-sm leading-relaxed")}
                          />
                          <button
                            type="button"
                            aria-label="Eliminar bullet"
                            onClick={() =>
                              updateField(
                                "work_experience",
                                resume.work_experience.map((x, k) =>
                                  k === i ? { ...x, bullets: x.bullets.filter((_, l) => l !== j) } : x
                                )
                              )
                            }
                            className="mt-1 shrink-0 text-neutral-300 opacity-0 hover:text-neutral-600 group-hover/bullet:opacity-100"
                          >
                            <X className="size-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          "work_experience",
                          resume.work_experience.map((x, k) =>
                            k === i ? { ...x, bullets: [...x.bullets, ""] } : x
                          )
                        )
                      }
                      className="mt-1 flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700"
                    >
                      <Plus className="size-3" />
                      Agregar bullet
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    updateField("work_experience", [
                      ...resume.work_experience,
                      { title: "", company: "", date_range: "", bullets: [""] },
                    ])
                  }
                  className="flex w-fit items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700"
                >
                  <Plus className="size-3" />
                  Agregar experiencia
                </button>
              </div>
            </section>

            <section className="mt-5">
              <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">Educación</p>
              <div className="mt-2 flex flex-col gap-3">
                {resume.education.map((edu, i) => (
                  <div key={i} className="group/edu relative pr-6">
                    <button
                      type="button"
                      aria-label="Eliminar educación"
                      onClick={() =>
                        updateField(
                          "education",
                          resume.education.filter((_, j) => j !== i)
                        )
                      }
                      className="absolute top-0 right-0 text-neutral-300 opacity-0 hover:text-neutral-600 group-hover/edu:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <div className="flex flex-1 flex-wrap items-baseline gap-x-1.5">
                        <input
                          value={edu.degree}
                          onChange={(e) =>
                            updateField(
                              "education",
                              resume.education.map((x, j) => (j === i ? { ...x, degree: e.target.value } : x))
                            )
                          }
                          className={paperFieldClassName("-mx-1 w-auto text-sm font-semibold")}
                        />
                        <input
                          value={edu.field}
                          onChange={(e) =>
                            updateField(
                              "education",
                              resume.education.map((x, j) => (j === i ? { ...x, field: e.target.value } : x))
                            )
                          }
                          className={paperFieldClassName("-mx-1 w-auto text-sm text-neutral-600")}
                        />
                      </div>
                      <input
                        value={edu.date_range}
                        onChange={(e) =>
                          updateField(
                            "education",
                            resume.education.map((x, j) => (j === i ? { ...x, date_range: e.target.value } : x))
                          )
                        }
                        className={paperFieldClassName("-mx-1 w-auto shrink-0 text-right text-xs text-neutral-500")}
                      />
                    </div>
                    <input
                      value={edu.institution}
                      onChange={(e) =>
                        updateField(
                          "education",
                          resume.education.map((x, j) => (j === i ? { ...x, institution: e.target.value } : x))
                        )
                      }
                      className={paperFieldClassName("-mx-1 text-sm text-neutral-600")}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    updateField("education", [
                      ...resume.education,
                      { institution: "", degree: "", field: "", date_range: "" },
                    ])
                  }
                  className="flex w-fit items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700"
                >
                  <Plus className="size-3" />
                  Agregar educación
                </button>
              </div>
            </section>

            <section className="mt-5">
              <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">Skills</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {resume.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="group/skill flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700"
                  >
                    {skill}
                    <button
                      type="button"
                      aria-label="Quitar skill"
                      onClick={() =>
                        updateField(
                          "skills",
                          resume.skills.filter((_, j) => j !== i)
                        )
                      }
                      className="text-neutral-400 opacity-0 hover:text-neutral-700 group-hover/skill:opacity-100"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.elements.namedItem("newSkill") as HTMLInputElement;
                    const value = input.value.trim();
                    if (value) updateField("skills", [...resume.skills, value]);
                    input.value = "";
                  }}
                >
                  <input
                    name="newSkill"
                    placeholder="+ Agregar skill"
                    className="w-32 rounded-full border border-dashed border-neutral-300 bg-transparent px-2.5 py-1 text-xs text-neutral-500 outline-none focus:border-neutral-400"
                  />
                </form>
              </div>
            </section>

            {resume.certifications.length > 0 && (
              <section className="mt-5">
                <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">Certificaciones</p>
                <div className="mt-2 flex flex-col gap-2">
                  {resume.certifications.map((cert, i) => (
                    <div key={i} className="group/cert relative flex items-baseline gap-1.5 pr-6">
                      <input
                        value={cert.name}
                        onChange={(e) =>
                          updateField(
                            "certifications",
                            resume.certifications.map((x, j) => (j === i ? { ...x, name: e.target.value } : x))
                          )
                        }
                        className={paperFieldClassName("-mx-1 w-auto text-sm font-medium")}
                      />
                      <span className="text-neutral-400">—</span>
                      <input
                        value={cert.issuer}
                        onChange={(e) =>
                          updateField(
                            "certifications",
                            resume.certifications.map((x, j) => (j === i ? { ...x, issuer: e.target.value } : x))
                          )
                        }
                        className={paperFieldClassName("-mx-1 flex-1 text-sm text-neutral-600")}
                      />
                      <button
                        type="button"
                        aria-label="Eliminar certificación"
                        onClick={() =>
                          updateField(
                            "certifications",
                            resume.certifications.filter((_, j) => j !== i)
                          )
                        }
                        className="absolute top-0 right-0 text-neutral-300 opacity-0 hover:text-neutral-600 group-hover/cert:opacity-100"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
            <button
              type="button"
              onClick={() => updateField("certifications", [...resume.certifications, { name: "", issuer: "" }])}
              className="mt-2 flex w-fit items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700"
            >
              <Plus className="size-3" />
              Agregar certificación
            </button>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 xl:w-64">
          <Card>
            <CardContent className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">Generado con IA</p>
              <p className="text-xs text-muted-foreground">
                A partir de tu Career Passport, sin inventar experiencia ni fechas. Editá lo que necesites antes de
                exportar.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setStep("input")} disabled={pending}>
          Volver
        </Button>
        <Button onClick={handleSave} disabled={pending} className="gap-1.5">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          Guardar y exportar
        </Button>
      </div>
    </div>
  );
}

export { ResumeBuilderClient };
