import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import {
  buildEvaluationUserPrompt,
  EVALUATION_OUTPUT_SCHEMA,
  EVALUATION_SYSTEM_PROMPT,
  type CandidateForEvaluation,
  type CandidateSkillForEvaluation,
  type EvaluationOutput,
  type JobForEvaluation,
  type WorkExperienceForEvaluation,
} from "./prompts";

const EVALUATION_MODEL = "claude-opus-4-8";

function getServiceClient(): SupabaseClient<Database> {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function yearsBetween(startDate: string, endDate: string | null): number {
  const start = new Date(startDate).getTime();
  const end = endDate ? new Date(endDate).getTime() : Date.now();
  return Math.max(0, (end - start) / (1000 * 60 * 60 * 24 * 365.25));
}

// Suma la duración de cada experiencia laboral por tecnología. No dedupea
// períodos superpuestos (ej. dos jobs part-time en simultáneo suman años
// dos veces) — aceptable para una primera inferencia que el recruiter
// después contrasta con la evidencia citada.
export function inferYearsFromHistory(
  workExperiences: WorkExperienceForEvaluation[]
): Map<string, number> {
  const years = new Map<string, number>();

  for (const exp of workExperiences) {
    const duration = yearsBetween(exp.startDate, exp.endDate);
    for (const technology of exp.technologies) {
      years.set(technology, (years.get(technology) ?? 0) + duration);
    }
  }

  for (const [technology, total] of years) {
    years.set(technology, Math.round(total * 10) / 10);
  }

  return years;
}

async function upsertInferredSkills(
  supabase: SupabaseClient<Database>,
  candidateId: string,
  existingSkills: CandidateSkillForEvaluation[],
  inferredYears: Map<string, number>
): Promise<void> {
  const existingNames = new Set(existingSkills.map((s) => s.name.toLowerCase()));
  const missing = [...inferredYears.entries()].filter(
    ([name]) => !existingNames.has(name.toLowerCase())
  );
  if (!missing.length) return;

  const { data: catalogSkills } = await supabase
    .from("skills")
    .select("id, name")
    .in(
      "name",
      missing.map(([name]) => name)
    );

  const catalogByName = new Map(
    (catalogSkills ?? []).map((s) => [s.name.toLowerCase(), s.id])
  );

  const rows = missing
    .map(([name, yearsExperience]) => {
      const skillId = catalogByName.get(name.toLowerCase());
      if (!skillId) return null;
      return {
        candidate_id: candidateId,
        skill_id: skillId,
        years_experience: yearsExperience,
        inferred: true,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (rows.length) {
    await supabase.from("candidate_skills").upsert(rows, { onConflict: "candidate_id,skill_id" });
  }
}

export async function evaluateApplication(applicationId: string): Promise<void> {
  const supabase = getServiceClient();

  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .select("id, candidate_id, job_id")
    .eq("id", applicationId)
    .single();
  if (applicationError || !application) {
    throw new Error(`Application not found: ${applicationId}`);
  }

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select(
      "title, description, responsibilities, experience_level, job_required_skills(min_years, required, language_level, skills(name))"
    )
    .eq("id", application.job_id)
    .single();
  if (jobError || !job) {
    throw new Error(`Job not found for application: ${applicationId}`);
  }

  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select(
      "bio, profiles(headline), work_experiences(title, company, description, technologies, start_date, end_date), educations(institution, degree, field), certifications(name, issuer), candidate_skills(years_experience, inferred, skills(name))"
    )
    .eq("id", application.candidate_id)
    .single();
  if (!profile) {
    throw new Error(`Candidate profile not found for application: ${applicationId}`);
  }

  const workExperiences: WorkExperienceForEvaluation[] = (profile.work_experiences ?? []).map(
    (exp) => ({
      title: exp.title,
      company: exp.company,
      description: exp.description,
      technologies: exp.technologies ?? [],
      startDate: exp.start_date,
      endDate: exp.end_date,
    })
  );

  const existingSkills: CandidateSkillForEvaluation[] = (profile.candidate_skills ?? [])
    .filter((s) => s.skills)
    .map((s) => ({
      name: s.skills!.name,
      yearsExperience: s.years_experience,
      inferred: s.inferred,
    }));

  const inferredYears = inferYearsFromHistory(workExperiences);
  await upsertInferredSkills(supabase, application.candidate_id, existingSkills, inferredYears);

  const allSkills: CandidateSkillForEvaluation[] = [
    ...existingSkills,
    ...[...inferredYears.entries()]
      .filter(([name]) => !existingSkills.some((s) => s.name.toLowerCase() === name.toLowerCase()))
      .map(([name, yearsExperience]) => ({ name, yearsExperience, inferred: true })),
  ];

  const jobForEvaluation: JobForEvaluation = {
    title: job.title,
    description: job.description ?? "",
    responsibilities: job.responsibilities,
    experienceLevel: job.experience_level ?? "no especificado",
    requiredSkills: (job.job_required_skills ?? [])
      .filter((rs) => rs.skills)
      .map((rs) => ({
        name: rs.skills!.name,
        minYears: rs.min_years,
        required: rs.required,
        languageLevel: rs.language_level,
      })),
  };

  const candidateForEvaluation: CandidateForEvaluation = {
    headline: profile.profiles?.headline ?? null,
    bio: profile.bio,
    skills: allSkills,
    workExperiences,
    educations: (profile.educations ?? []).map((e) => ({
      institution: e.institution,
      degree: e.degree,
      field: e.field ?? "",
    })),
    certifications: (profile.certifications ?? []).map((c) => ({
      name: c.name,
      issuer: c.issuer,
    })),
  };

  const anthropic = new Anthropic();
  const response = await anthropic.messages.parse({
    model: EVALUATION_MODEL,
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: EVALUATION_OUTPUT_SCHEMA },
    },
    system: EVALUATION_SYSTEM_PROMPT,
    messages: [
      { role: "user", content: buildEvaluationUserPrompt(jobForEvaluation, candidateForEvaluation) },
    ],
  });

  if (!response.parsed_output) {
    throw new Error(`Evaluation failed to produce structured output for application: ${applicationId}`);
  }
  const evaluation: EvaluationOutput = response.parsed_output;

  await supabase.from("ai_evaluations").upsert(
    {
      application_id: applicationId,
      match_score: evaluation.match_score,
      summary: evaluation.summary,
      strengths: evaluation.strengths,
      gaps: evaluation.gaps,
      skill_analysis: evaluation.skill_analysis,
      reasoning: evaluation.reasoning,
      model: EVALUATION_MODEL,
    },
    { onConflict: "application_id" }
  );
}
