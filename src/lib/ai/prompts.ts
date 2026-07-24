export interface RequiredSkillForEvaluation {
  name: string;
  minYears: number | null;
  required: boolean;
  languageLevel: string | null;
}

export interface JobForEvaluation {
  title: string;
  description: string;
  responsibilities: string | null;
  experienceLevel: string;
  requiredSkills: RequiredSkillForEvaluation[];
}

export interface CandidateSkillForEvaluation {
  name: string;
  yearsExperience: number | null;
  inferred: boolean;
}

export interface WorkExperienceForEvaluation {
  title: string;
  company: string;
  description: string | null;
  technologies: string[];
  startDate: string;
  endDate: string | null;
}

export interface EducationForEvaluation {
  institution: string;
  degree: string;
  field: string;
}

export interface CertificationForEvaluation {
  name: string;
  issuer: string;
}

export interface CandidateForEvaluation {
  headline: string | null;
  bio: string | null;
  skills: CandidateSkillForEvaluation[];
  workExperiences: WorkExperienceForEvaluation[];
  educations: EducationForEvaluation[];
  certifications: CertificationForEvaluation[];
}

export const EVALUATION_SYSTEM_PROMPT = `Sos el asistente de ATS de HireFlow. Evaluás qué tan bien encaja un candidato con un puesto, a partir de su Career Passport (historial laboral, educación, certificaciones y skills declaradas o inferidas del historial).

Reglas:
- Nunca recomendás rechazo automático ni tomás la decisión final: solo das información para que el recruiter decida.
- Explicá siempre tu razonamiento (reasoning) citando evidencia concreta del historial del candidato, no supuestos genéricos.
- Para cada skill requerida del job, comparás los años detectados (si los hay) contra los años mínimos pedidos y decís si se cumple o no, con evidencia (ej. "3 años como Backend Engineer en Empresa X usando Go").
- strengths y gaps deben ser específicos al candidato y al job, no genéricos.
- match_score es un entero de 0 a 100 que refleja el ajuste global, no solo el promedio de skills.`;

function formatRequiredSkill(skill: RequiredSkillForEvaluation): string {
  const parts = [skill.name];
  if (skill.minYears != null) parts.push(`mínimo ${skill.minYears} años`);
  if (skill.languageLevel) parts.push(`nivel ${skill.languageLevel}`);
  parts.push(skill.required ? "obligatorio" : "opcional");
  return `- ${parts.join(", ")}`;
}

function formatCandidateSkill(skill: CandidateSkillForEvaluation): string {
  const years = skill.yearsExperience != null ? `${skill.yearsExperience} años` : "años no determinados";
  return `- ${skill.name}: ${years}${skill.inferred ? " (inferido del historial laboral)" : ""}`;
}

function formatWorkExperience(exp: WorkExperienceForEvaluation): string {
  const range = `${exp.startDate} – ${exp.endDate ?? "actualidad"}`;
  const tech = exp.technologies.length ? ` [${exp.technologies.join(", ")}]` : "";
  const description = exp.description ? `\n  ${exp.description}` : "";
  return `- ${exp.title} en ${exp.company} (${range})${tech}${description}`;
}

export function buildEvaluationUserPrompt(
  job: JobForEvaluation,
  candidate: CandidateForEvaluation
): string {
  const sections: string[] = [];

  sections.push(`## Job: ${job.title} (nivel ${job.experienceLevel})\n\n${job.description}`);
  if (job.responsibilities) {
    sections.push(`## Responsabilidades\n\n${job.responsibilities}`);
  }
  sections.push(
    `## Skills requeridas\n\n${job.requiredSkills.map(formatRequiredSkill).join("\n") || "(sin skills específicas)"}`
  );

  sections.push(
    `## Candidato\n\n${candidate.headline ?? ""}\n${candidate.bio ?? ""}`.trim()
  );
  sections.push(
    `## Skills del candidato\n\n${candidate.skills.map(formatCandidateSkill).join("\n") || "(sin skills cargadas)"}`
  );
  sections.push(
    `## Historial laboral\n\n${candidate.workExperiences.map(formatWorkExperience).join("\n") || "(sin experiencia cargada)"}`
  );
  if (candidate.educations.length) {
    sections.push(
      `## Educación\n\n${candidate.educations
        .map((e) => `- ${e.degree} en ${e.field}, ${e.institution}`)
        .join("\n")}`
    );
  }
  if (candidate.certifications.length) {
    sections.push(
      `## Certificaciones\n\n${candidate.certifications.map((c) => `- ${c.name} (${c.issuer})`).join("\n")}`
    );
  }

  sections.push(
    "Evaluá el ajuste de este candidato con este job siguiendo las reglas del system prompt."
  );

  return sections.join("\n\n");
}

export const EVALUATION_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    match_score: { type: "integer" },
    summary: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    gaps: { type: "array", items: { type: "string" } },
    skill_analysis: {
      type: "array",
      items: {
        type: "object",
        properties: {
          skill: { type: "string" },
          required_years: { anyOf: [{ type: "number" }, { type: "null" }] },
          detected_years: { anyOf: [{ type: "number" }, { type: "null" }] },
          meets_requirement: { type: "boolean" },
          evidence: { type: "string" },
        },
        required: ["skill", "required_years", "detected_years", "meets_requirement", "evidence"],
        additionalProperties: false,
      },
    },
    reasoning: { type: "string" },
  },
  required: ["match_score", "summary", "strengths", "gaps", "skill_analysis", "reasoning"],
  additionalProperties: false,
} as const;

export interface EvaluationOutput {
  match_score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  skill_analysis: Array<{
    skill: string;
    required_years: number | null;
    detected_years: number | null;
    meets_requirement: boolean;
    evidence: string;
  }>;
  reasoning: string;
}

export interface FeedbackInput {
  jobTitle: string;
  rejectionReasonLabel: string;
  recruiterComment: string | null;
  evaluationSummary: string | null;
  evaluationStrengths: string[];
  evaluationGaps: string[];
}

export const FEEDBACK_SYSTEM_PROMPT = `Sos el asistente de ATS de HireFlow. Redactás el feedback que un candidato recibe cuando lo rechazan de un puesto.

Reglas:
- Nunca debe sentirse como un portazo: tono constructivo, honesto y respetuoso.
- Basate en evidencia concreta (el resumen y los gaps de la evaluación IA, y el comentario del recruiter si existe), nunca inventes razones nuevas fuera de la razón de rechazo indicada.
- strengths reconoce genuinamente lo bueno del perfil, aunque no haya alcanzado para este puesto.
- areas_to_improve son accionables, no genéricas ("profundizar en X" en vez de "mejorar skills").
- missing_skills lista solo skills técnicas concretas ausentes o insuficientes, en el mismo formato que aparecen en el catálogo de skills (nombres cortos, ej. "Kubernetes", no frases).`;

export function buildFeedbackUserPrompt(input: FeedbackInput): string {
  const sections: string[] = [
    `## Job\n\n${input.jobTitle}`,
    `## Razón de rechazo\n\n${input.rejectionReasonLabel}`,
  ];
  if (input.recruiterComment) {
    sections.push(`## Comentario del recruiter\n\n${input.recruiterComment}`);
  }
  if (input.evaluationSummary) {
    sections.push(`## Resumen de la evaluación IA\n\n${input.evaluationSummary}`);
  }
  if (input.evaluationGaps.length) {
    sections.push(`## Gaps detectados en la evaluación\n\n${input.evaluationGaps.map((g) => `- ${g}`).join("\n")}`);
  }
  if (input.evaluationStrengths.length) {
    sections.push(
      `## Fortalezas detectadas en la evaluación\n\n${input.evaluationStrengths.map((s) => `- ${s}`).join("\n")}`
    );
  }
  sections.push("Redactá el feedback para este candidato siguiendo las reglas del system prompt.");
  return sections.join("\n\n");
}

export const FEEDBACK_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    ai_message: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    areas_to_improve: { type: "array", items: { type: "string" } },
    missing_skills: { type: "array", items: { type: "string" } },
  },
  required: ["ai_message", "strengths", "areas_to_improve", "missing_skills"],
  additionalProperties: false,
} as const;

export interface FeedbackOutput {
  ai_message: string;
  strengths: string[];
  areas_to_improve: string[];
  missing_skills: string[];
}

export interface RoadmapInput {
  jobTitle: string;
  aiMessage: string;
  areasToImprove: string[];
  missingSkills: string[];
  candidate: CandidateForEvaluation;
}

export const ROADMAP_SYSTEM_PROMPT = `Sos el career coach de HireFlow. A partir del feedback de un rechazo, generás un plan de carrera concreto para que el candidato mejore y pueda volver a aplicar.

Reglas:
- Entre 4 y 8 pasos, ordenados de forma lógica (primero aprender, después practicar/certificar, por último volver a aplicar).
- Cada paso ataca directamente un gap o skill faltante mencionado en el feedback — nada genérico.
- Usá el historial y las skills existentes del candidato como base: no le pidas aprender algo que ya sabe.
- type de cada paso: 'learn' (estudiar/curso), 'project' (proyecto práctico), 'certification', 'practice' (ejercicios/repaso) o 'apply' (volver a aplicar a jobs similares).
- title breve y accionable; description con el detalle de qué hacer y por qué ayuda.`;

export function buildRoadmapUserPrompt(input: RoadmapInput): string {
  const sections: string[] = [
    `## Job al que aplicó\n\n${input.jobTitle}`,
    `## Feedback recibido\n\n${input.aiMessage}`,
  ];
  if (input.areasToImprove.length) {
    sections.push(`## Áreas a mejorar\n\n${input.areasToImprove.map((a) => `- ${a}`).join("\n")}`);
  }
  if (input.missingSkills.length) {
    sections.push(`## Skills faltantes\n\n${input.missingSkills.map((s) => `- ${s}`).join("\n")}`);
  }
  sections.push(
    `## Skills actuales del candidato\n\n${input.candidate.skills.map(formatCandidateSkill).join("\n") || "(sin skills cargadas)"}`
  );
  sections.push(
    `## Historial laboral\n\n${input.candidate.workExperiences.map(formatWorkExperience).join("\n") || "(sin experiencia cargada)"}`
  );
  sections.push("Generá el roadmap para este candidato siguiendo las reglas del system prompt.");
  return sections.join("\n\n");
}

export const ROADMAP_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { anyOf: [{ type: "string" }, { type: "null" }] },
          type: {
            type: "string",
            enum: ["learn", "project", "certification", "practice", "apply"],
          },
        },
        required: ["title", "description", "type"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "steps"],
  additionalProperties: false,
} as const;

export interface RoadmapOutput {
  title: string;
  steps: Array<{
    title: string;
    description: string | null;
    type: "learn" | "project" | "certification" | "practice" | "apply";
  }>;
}

export interface TargetJobForResume {
  title: string;
  description: string;
  requiredSkills: RequiredSkillForEvaluation[];
}

export interface ResumeInput {
  candidate: CandidateForEvaluation;
  targetJob: TargetJobForResume | null;
}

export const RESUME_SYSTEM_PROMPT = `Sos un redactor experto de CVs. A partir del Career Passport de un candidato, generás el contenido de un CV profesional en español, listo para exportar a PDF.

Reglas:
- Nunca inventes experiencia, títulos, empresas o fechas que no estén en el historial del candidato. Podés reformular y priorizar, no inventar.
- Si hay un job objetivo, priorizá y resaltá la experiencia y skills más relevantes para ese puesto (sin inventar nada), y adaptá el summary a esa búsqueda. Si no hay job objetivo, hacé un CV genérico que resuma bien el perfil completo.
- Los bullets de cada experiencia laboral son logros concretos y accionables (qué hizo, con qué tecnología, qué impacto tuvo si se puede inferir), no descripciones genéricas de puesto.
- date_range en formato corto ("Ene 2022 – Presente" o "Mar 2020 – Dic 2021"), a partir de las fechas reales provistas.
- skills: lista priorizada, las más relevantes primero.
- summary: 2-3 oraciones, en primera persona implícita (sin "yo"), sin frases genéricas de relleno.`;

function formatRequiredSkillForResume(skill: RequiredSkillForEvaluation): string {
  const parts = [skill.name];
  if (skill.minYears != null) parts.push(`mínimo ${skill.minYears} años`);
  return `- ${parts.join(", ")}`;
}

export function buildResumeUserPrompt(input: ResumeInput): string {
  const sections: string[] = [];

  if (input.targetJob) {
    sections.push(`## Job objetivo\n\n${input.targetJob.title}\n\n${input.targetJob.description}`);
    sections.push(
      `## Skills requeridas por el job objetivo\n\n${input.targetJob.requiredSkills.map(formatRequiredSkillForResume).join("\n") || "(sin skills específicas)"}`
    );
  }

  sections.push(
    `## Candidato\n\n${input.candidate.headline ?? ""}\n${input.candidate.bio ?? ""}`.trim()
  );
  sections.push(
    `## Skills del candidato\n\n${input.candidate.skills.map(formatCandidateSkill).join("\n") || "(sin skills cargadas)"}`
  );
  sections.push(
    `## Historial laboral\n\n${input.candidate.workExperiences.map(formatWorkExperience).join("\n") || "(sin experiencia cargada)"}`
  );
  if (input.candidate.educations.length) {
    sections.push(
      `## Educación\n\n${input.candidate.educations
        .map((e) => `- ${e.degree} en ${e.field}, ${e.institution}`)
        .join("\n")}`
    );
  }
  if (input.candidate.certifications.length) {
    sections.push(
      `## Certificaciones\n\n${input.candidate.certifications.map((c) => `- ${c.name} (${c.issuer})`).join("\n")}`
    );
  }

  sections.push("Generá el contenido del CV para este candidato siguiendo las reglas del system prompt.");
  return sections.join("\n\n");
}

export const RESUME_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string" },
    summary: { type: "string" },
    work_experience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          company: { type: "string" },
          date_range: { type: "string" },
          bullets: { type: "array", items: { type: "string" } },
        },
        required: ["title", "company", "date_range", "bullets"],
        additionalProperties: false,
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          institution: { type: "string" },
          degree: { type: "string" },
          field: { type: "string" },
          date_range: { type: "string" },
        },
        required: ["institution", "degree", "field", "date_range"],
        additionalProperties: false,
      },
    },
    skills: { type: "array", items: { type: "string" } },
    certifications: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          issuer: { type: "string" },
        },
        required: ["name", "issuer"],
        additionalProperties: false,
      },
    },
  },
  required: ["headline", "summary", "work_experience", "education", "skills", "certifications"],
  additionalProperties: false,
} as const;

export interface ResumeOutput {
  headline: string;
  summary: string;
  work_experience: Array<{ title: string; company: string; date_range: string; bullets: string[] }>;
  education: Array<{ institution: string; degree: string; field: string; date_range: string }>;
  skills: string[];
  certifications: Array<{ name: string; issuer: string }>;
}

export const CAREER_COACH_SYSTEM_PROMPT = `Sos el Career Coach de HireFlow, un asistente que ayuda a candidatos a mejorar su perfil, prepararse para procesos de contratación y pensar su estrategia de carrera.

Reglas:
- Basá tus consejos en el Career Passport del candidato (historial, skills, educación) que se te provee a continuación — no des consejos genéricos que ignoren su contexto real.
- Sé concreto y accionable: en vez de "mejorá tus skills de backend", decí qué skill puntual y por qué, referenciando su historial.
- Si el candidato pregunta algo fuera de lo laboral/career, redirigí amablemente la conversación a temas de carrera.
- Nunca inventes datos sobre el candidato que no estén en su Career Passport.
- Tono cercano y honesto, como un mentor, no como un formulario.`;

export function buildCareerCoachContext(candidate: CandidateForEvaluation): string {
  const sections: string[] = [
    `## Career Passport del candidato\n\n${candidate.headline ?? ""}\n${candidate.bio ?? ""}`.trim(),
    `## Skills\n\n${candidate.skills.map(formatCandidateSkill).join("\n") || "(sin skills cargadas)"}`,
    `## Historial laboral\n\n${candidate.workExperiences.map(formatWorkExperience).join("\n") || "(sin experiencia cargada)"}`,
  ];
  if (candidate.educations.length) {
    sections.push(
      `## Educación\n\n${candidate.educations.map((e) => `- ${e.degree} en ${e.field}, ${e.institution}`).join("\n")}`
    );
  }
  return sections.join("\n\n");
}
