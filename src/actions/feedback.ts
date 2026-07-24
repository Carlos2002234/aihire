"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { generateFeedback } from "@/lib/ai/feedback";
import { generateRoadmap } from "@/lib/ai/roadmap";
import { createClient } from "@/lib/supabase/server";
import type { RejectionReason } from "@/lib/rejection-reasons";
import { REJECTION_REASON_LABELS } from "@/lib/rejection-reasons";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return { supabase };
}

export async function previewRejectionFeedbackAction(
  applicationId: string,
  reason: RejectionReason,
  recruiterComment: string | null
) {
  const { supabase } = await requireUser();

  const { data: application } = await supabase
    .from("applications")
    .select("jobs(title), ai_evaluations(summary, strengths, gaps)")
    .eq("id", applicationId)
    .single();

  if (!application) {
    return { feedback: null, error: "Aplicación no encontrada" };
  }

  const feedback = await generateFeedback({
    jobTitle: application.jobs?.title ?? "",
    rejectionReasonLabel: REJECTION_REASON_LABELS[reason],
    recruiterComment,
    evaluationSummary: application.ai_evaluations?.summary ?? null,
    evaluationStrengths: application.ai_evaluations?.strengths ?? [],
    evaluationGaps: application.ai_evaluations?.gaps ?? [],
  });

  return { feedback, error: null };
}

export async function rejectWithFeedbackAction(input: {
  applicationId: string;
  jobId: string;
  reason: RejectionReason;
  recruiterComment: string | null;
  aiMessage: string;
  strengths: string[];
  areasToImprove: string[];
  missingSkills: string[];
}) {
  const { supabase } = await requireUser();

  const { data: feedbackId, error } = await supabase.rpc("reject_application_with_feedback", {
    p_application_id: input.applicationId,
    p_rejection_reason: input.reason,
    // El codegen de Supabase no refleja que el parámetro SQL acepta NULL.
    p_recruiter_comment: input.recruiterComment as string,
    p_ai_message: input.aiMessage,
    p_strengths: input.strengths,
    p_areas_to_improve: input.areasToImprove,
    p_missing_skills: input.missingSkills,
  });

  if (error || !feedbackId) {
    return { error: error?.message ?? "No se pudo rechazar la aplicación" };
  }

  after(() => generateRoadmap(feedbackId).catch(console.error));

  revalidatePath(`/recruiter/pipeline/${input.jobId}`);
  return { error: null };
}
