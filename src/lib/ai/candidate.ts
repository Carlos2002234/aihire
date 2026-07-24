import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { CandidateForEvaluation, CandidateSkillForEvaluation, WorkExperienceForEvaluation } from "./prompts";

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

  const catalogByName = new Map((catalogSkills ?? []).map((s) => [s.name.toLowerCase(), s.id]));

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

// Trae el Career Passport completo de un candidato, infiere años por skill
// a partir del historial laboral, y persiste esas skills inferidas
// (inferred=true) que el candidato no había cargado manualmente.
export async function fetchCandidatePassport(
  supabase: SupabaseClient<Database>,
  candidateId: string
): Promise<CandidateForEvaluation> {
  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select(
      "bio, profiles(headline), work_experiences(title, company, description, technologies, start_date, end_date), educations(institution, degree, field), certifications(name, issuer), candidate_skills(years_experience, inferred, skills(name))"
    )
    .eq("id", candidateId)
    .single();
  if (!profile) {
    throw new Error(`Candidate profile not found: ${candidateId}`);
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
  await upsertInferredSkills(supabase, candidateId, existingSkills, inferredYears);

  const allSkills: CandidateSkillForEvaluation[] = [
    ...existingSkills,
    ...[...inferredYears.entries()]
      .filter(([name]) => !existingSkills.some((s) => s.name.toLowerCase() === name.toLowerCase()))
      .map(([name, yearsExperience]) => ({ name, yearsExperience, inferred: true })),
  ];

  return {
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
}
