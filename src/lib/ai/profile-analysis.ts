import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import {
  buildProfileAnalysisUserPrompt,
  PROFILE_ANALYSIS_OUTPUT_SCHEMA,
  PROFILE_ANALYSIS_SYSTEM_PROMPT,
  type CandidateForEvaluation,
  type ProfileAnalysisOutput,
} from "./prompts";

const PROFILE_ANALYSIS_MODEL = "claude-opus-4-8";

export async function analyzeProfile(candidate: CandidateForEvaluation): Promise<ProfileAnalysisOutput> {
  const anthropic = new Anthropic();
  const response = await anthropic.messages.parse({
    model: PROFILE_ANALYSIS_MODEL,
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: PROFILE_ANALYSIS_OUTPUT_SCHEMA },
    },
    system: PROFILE_ANALYSIS_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildProfileAnalysisUserPrompt(candidate) }],
  });

  if (!response.parsed_output) {
    throw new Error("El análisis de perfil no produjo output estructurado");
  }
  return response.parsed_output;
}
