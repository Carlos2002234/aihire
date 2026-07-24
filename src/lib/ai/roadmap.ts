import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { sendFeedbackAvailableEmail } from "@/lib/email/send";
import { getServiceClient } from "@/lib/supabase/service";
import { fetchCandidatePassport } from "./candidate";
import {
  buildRoadmapUserPrompt,
  ROADMAP_OUTPUT_SCHEMA,
  ROADMAP_SYSTEM_PROMPT,
  type RoadmapInput,
  type RoadmapOutput,
} from "./prompts";

const ROADMAP_MODEL = "claude-opus-4-8";

export async function generateRoadmap(feedbackId: string): Promise<void> {
  const supabase = getServiceClient();

  const { data: feedback, error: feedbackError } = await supabase
    .from("feedback")
    .select("ai_message, areas_to_improve, missing_skills, applications(candidate_id, jobs(title))")
    .eq("id", feedbackId)
    .single();
  if (feedbackError || !feedback) {
    throw new Error(`Feedback not found: ${feedbackId}`);
  }

  const candidateId = feedback.applications?.candidate_id;
  if (!candidateId) {
    throw new Error(`Feedback ${feedbackId} has no associated candidate`);
  }

  const candidate = await fetchCandidatePassport(supabase, candidateId);

  const roadmapInput: RoadmapInput = {
    jobTitle: feedback.applications?.jobs?.title ?? "",
    aiMessage: feedback.ai_message,
    areasToImprove: feedback.areas_to_improve,
    missingSkills: feedback.missing_skills,
    candidate,
  };

  const anthropic = new Anthropic();
  const response = await anthropic.messages.parse({
    model: ROADMAP_MODEL,
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: ROADMAP_OUTPUT_SCHEMA },
    },
    system: ROADMAP_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildRoadmapUserPrompt(roadmapInput) }],
  });

  if (!response.parsed_output) {
    throw new Error(`Roadmap generation failed to produce structured output for feedback: ${feedbackId}`);
  }
  const roadmap: RoadmapOutput = response.parsed_output;

  const { data: insertedRoadmap, error: insertError } = await supabase
    .from("roadmaps")
    .insert({ candidate_id: candidateId, feedback_id: feedbackId, title: roadmap.title })
    .select("id")
    .single();
  if (insertError || !insertedRoadmap) {
    throw new Error(`Failed to insert roadmap for feedback: ${feedbackId}`);
  }

  await supabase.from("roadmap_steps").insert(
    roadmap.steps.map((step, index) => ({
      roadmap_id: insertedRoadmap.id,
      position: index,
      title: step.title,
      description: step.description,
      type: step.type,
    }))
  );

  const jobTitle = roadmapInput.jobTitle;
  await supabase.from("notifications").insert({
    user_id: candidateId,
    type: "feedback_available",
    title: "Tu feedback ya está listo",
    body: `Preparamos tu feedback y un roadmap personalizado para tu aplicación a ${jobTitle}.`,
    link: "/candidate/roadmap",
  });

  await sendFeedbackAvailableEmail(candidateId, jobTitle);
}
