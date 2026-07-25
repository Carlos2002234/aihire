"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Download, Loader2, Plus, RefreshCw, Sparkles, Trash2, X } from "lucide-react";

import {
  generateTailoredResumeAction,
  getResumeDownloadUrlAction,
  saveGeneratedResumeAction,
} from "@/actions/candidate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ResumeOutput } from "@/lib/ai/prompts";

type Step = "input" | "editing" | "done";

function textareaClassName() {
  return "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
}

function fieldClassName() {
  return "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
}

function ResumeBuilderClient() {
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
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Ajustá tu CV a una posición
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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
    );
  }

  if (step === "done") {
    return (
      <Card className="max-w-2xl">
        <CardContent className="flex flex-col items-start gap-3">
          <p className="font-medium text-foreground">¡Tu CV está listo!</p>
          <p className="text-sm text-muted-foreground">
            Lo guardamos en tu Career Passport{positionTitle ? ` como "CV IA — ${positionTitle}"` : ""}.
          </p>
          <div className="flex flex-wrap gap-2">
            {downloadUrl && (
              <Button render={<a href={downloadUrl} target="_blank" rel="noreferrer" />} nativeButton={false} className="gap-1.5">
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
    );
  }

  if (!resume) return null;

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Revisá y ajustá tu CV</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Headline</label>
            <Input value={resume.headline} onChange={(e) => updateField("headline", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Resumen</label>
            <textarea
              value={resume.summary}
              onChange={(e) => updateField("summary", e.target.value)}
              rows={3}
              className={textareaClassName()}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Experiencia</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {resume.work_experience.map((exp, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="grid flex-1 gap-2 sm:grid-cols-2">
                  <input
                    value={exp.title}
                    onChange={(e) =>
                      updateField(
                        "work_experience",
                        resume.work_experience.map((x, j) => (j === i ? { ...x, title: e.target.value } : x))
                      )
                    }
                    placeholder="Puesto"
                    className={fieldClassName()}
                  />
                  <input
                    value={exp.company}
                    onChange={(e) =>
                      updateField(
                        "work_experience",
                        resume.work_experience.map((x, j) => (j === i ? { ...x, company: e.target.value } : x))
                      )
                    }
                    placeholder="Empresa"
                    className={fieldClassName()}
                  />
                  <input
                    value={exp.date_range}
                    onChange={(e) =>
                      updateField(
                        "work_experience",
                        resume.work_experience.map((x, j) => (j === i ? { ...x, date_range: e.target.value } : x))
                      )
                    }
                    placeholder="Ene 2022 – Presente"
                    className={fieldClassName() + " sm:col-span-2"}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Eliminar experiencia"
                  onClick={() =>
                    updateField(
                      "work_experience",
                      resume.work_experience.filter((_, j) => j !== i)
                    )
                  }
                >
                  <Trash2 />
                </Button>
              </div>
              <div className="flex flex-col gap-1.5">
                {exp.bullets.map((bullet, j) => (
                  <div key={j} className="flex items-center gap-1.5">
                    <input
                      value={bullet}
                      onChange={(e) =>
                        updateField(
                          "work_experience",
                          resume.work_experience.map((x, k) =>
                            k === i
                              ? { ...x, bullets: x.bullets.map((b, l) => (l === j ? e.target.value : b)) }
                              : x
                          )
                        )
                      }
                      className={fieldClassName()}
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
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    updateField(
                      "work_experience",
                      resume.work_experience.map((x, k) => (k === i ? { ...x, bullets: [...x.bullets, ""] } : x))
                    )
                  }
                  className="flex w-fit items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Plus className="size-3" />
                  Agregar bullet
                </button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit gap-1.5"
            onClick={() =>
              updateField("work_experience", [
                ...resume.work_experience,
                { title: "", company: "", date_range: "", bullets: [""] },
              ])
            }
          >
            <Plus className="size-3.5" />
            Agregar experiencia
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Educación</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {resume.education.map((edu, i) => (
            <div key={i} className="flex items-start justify-between gap-2 rounded-lg border border-border p-3">
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                <input
                  value={edu.degree}
                  onChange={(e) =>
                    updateField(
                      "education",
                      resume.education.map((x, j) => (j === i ? { ...x, degree: e.target.value } : x))
                    )
                  }
                  placeholder="Título"
                  className={fieldClassName()}
                />
                <input
                  value={edu.field}
                  onChange={(e) =>
                    updateField(
                      "education",
                      resume.education.map((x, j) => (j === i ? { ...x, field: e.target.value } : x))
                    )
                  }
                  placeholder="Área"
                  className={fieldClassName()}
                />
                <input
                  value={edu.institution}
                  onChange={(e) =>
                    updateField(
                      "education",
                      resume.education.map((x, j) => (j === i ? { ...x, institution: e.target.value } : x))
                    )
                  }
                  placeholder="Institución"
                  className={fieldClassName()}
                />
                <input
                  value={edu.date_range}
                  onChange={(e) =>
                    updateField(
                      "education",
                      resume.education.map((x, j) => (j === i ? { ...x, date_range: e.target.value } : x))
                    )
                  }
                  placeholder="2015 – 2020"
                  className={fieldClassName()}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Eliminar educación"
                onClick={() =>
                  updateField(
                    "education",
                    resume.education.filter((_, j) => j !== i)
                  )
                }
              >
                <Trash2 />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit gap-1.5"
            onClick={() =>
              updateField("education", [
                ...resume.education,
                { institution: "", degree: "", field: "", date_range: "" },
              ])
            }
          >
            <Plus className="size-3.5" />
            Agregar educación
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((skill, i) => (
              <Badge key={i} variant="secondary" className="gap-1.5">
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
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem("newSkill") as HTMLInputElement;
              const value = input.value.trim();
              if (value) updateField("skills", [...resume.skills, value]);
              input.value = "";
            }}
            className="flex items-center gap-2"
          >
            <input name="newSkill" placeholder="Agregar skill" className={fieldClassName() + " w-48"} />
            <Button type="submit" variant="outline" size="sm">
              Agregar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Certificaciones</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {resume.certifications.map((cert, i) => (
            <div key={i} className="flex items-start justify-between gap-2 rounded-lg border border-border p-3">
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                <input
                  value={cert.name}
                  onChange={(e) =>
                    updateField(
                      "certifications",
                      resume.certifications.map((x, j) => (j === i ? { ...x, name: e.target.value } : x))
                    )
                  }
                  placeholder="Nombre"
                  className={fieldClassName()}
                />
                <input
                  value={cert.issuer}
                  onChange={(e) =>
                    updateField(
                      "certifications",
                      resume.certifications.map((x, j) => (j === i ? { ...x, issuer: e.target.value } : x))
                    )
                  }
                  placeholder="Emisor"
                  className={fieldClassName()}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Eliminar certificación"
                onClick={() =>
                  updateField(
                    "certifications",
                    resume.certifications.filter((_, j) => j !== i)
                  )
                }
              >
                <Trash2 />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit gap-1.5"
            onClick={() =>
              updateField("certifications", [...resume.certifications, { name: "", issuer: "" }])
            }
          >
            <Plus className="size-3.5" />
            Agregar certificación
          </Button>
        </CardContent>
      </Card>

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
