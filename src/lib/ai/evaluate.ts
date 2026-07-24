import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { getServiceClient } from "@/lib/supabase/service";
import { fetchCandidatePassport } from "./candidate";
import {
  buildEvaluationUserPrompt,
  EVALUATION_OUTPUT_SCHEMA,
  EVALUATION_SYSTEM_PROMPT,
  type EvaluationOutput,
  type JobForEvaluation,
} from "./prompts";

const EVALUATION_MODEL = "claude-opus-4-8";

export { inferYearsFromHistory } from "./candidate";

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

  const candidateForEvaluation = await fetchCandidatePassport(supabase, application.candidate_id);

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
      {
        role: "user",
        content: buildEvaluationUserPrompt(jobForEvaluation, candidateForEvaluation),
      },
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
