"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

async function requireCandidate() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return { supabase, candidateId: user.id };
}

export async function applyToJobAction(formData: FormData) {
  const { supabase, candidateId } = await requireCandidate();
  const jobId = String(formData.get("jobId"));
  const resumeId = String(formData.get("resumeId"));

  const { data: questions } = await supabase
    .from("job_questions")
    .select("id")
    .eq("job_id", jobId);

  const answers: Record<string, string> = {};
  for (const q of questions ?? []) {
    const value = formData.get(`answer_${q.id}`);
    if (value) answers[q.id] = String(value);
  }

  await supabase.from("applications").insert({
    job_id: jobId,
    candidate_id: candidateId,
    resume_id: resumeId,
    answers: Object.keys(answers).length ? answers : null,
  });

  revalidatePath(`/jobs/${jobId}`);
}

export async function toggleSaveJobAction(formData: FormData) {
  const { supabase, candidateId } = await requireCandidate();
  const jobId = String(formData.get("jobId"));

  const { data: existing } = await supabase
    .from("saved_jobs")
    .select("job_id")
    .eq("candidate_id", candidateId)
    .eq("job_id", jobId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("saved_jobs")
      .delete()
      .eq("candidate_id", candidateId)
      .eq("job_id", jobId);
  } else {
    await supabase.from("saved_jobs").insert({ candidate_id: candidateId, job_id: jobId });
  }

  revalidatePath(`/jobs/${jobId}`);
}
