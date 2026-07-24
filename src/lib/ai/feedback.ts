import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import {
  buildFeedbackUserPrompt,
  FEEDBACK_OUTPUT_SCHEMA,
  FEEDBACK_SYSTEM_PROMPT,
  type FeedbackInput,
  type FeedbackOutput,
} from "./prompts";

const FEEDBACK_MODEL = "claude-opus-4-8";

export async function generateFeedback(input: FeedbackInput): Promise<FeedbackOutput> {
  const anthropic = new Anthropic();
  const response = await anthropic.messages.parse({
    model: FEEDBACK_MODEL,
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: FEEDBACK_OUTPUT_SCHEMA },
    },
    system: FEEDBACK_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildFeedbackUserPrompt(input) }],
  });

  if (!response.parsed_output) {
    throw new Error("La generación de feedback no produjo output estructurado");
  }
  return response.parsed_output;
}
