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
