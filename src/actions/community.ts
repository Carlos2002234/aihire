"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type WorkMode = Database["public"]["Enums"]["work_mode"];

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return { supabase, userId: user.id };
}

function optionalText(value: FormDataEntryValue | null): string | null {
  const raw = String(value ?? "").trim();
  return raw === "" ? null : raw;
}

function parseTags(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function askQuestionAction(formData: FormData) {
  const { supabase, userId } = await requireUser();

  const { data: question, error } = await supabase
    .from("community_questions")
    .insert({
      author_id: userId,
      is_anonymous: formData.get("isAnonymous") === "on",
      title: String(formData.get("title") ?? "").trim(),
      body: String(formData.get("body") ?? "").trim(),
      tags: parseTags(formData.get("tags")),
    })
    .select("id")
    .single();

  if (error || !question) {
    redirect(`/candidate/community/questions?error=${encodeURIComponent(error?.message ?? "No pudimos publicar tu pregunta")}`);
  }

  revalidatePath("/candidate/community/questions");
  redirect(`/candidate/community/questions/${question.id}`);
}

export async function answerQuestionAction(formData: FormData) {
  const { supabase, userId } = await requireUser();

  const questionId = String(formData.get("questionId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!questionId || !body) return;

  await supabase.from("community_answers").insert({
    question_id: questionId,
    author_id: userId,
    is_anonymous: formData.get("isAnonymous") === "on",
    body,
  });

  revalidatePath(`/candidate/community/questions/${questionId}`);
}

export async function toggleUpvoteAction(
  answerId: string
): Promise<{ upvoted: boolean; count: number; error: string | null }> {
  const { supabase, userId } = await requireUser();

  const { data: existing } = await supabase
    .from("community_answer_votes")
    .select("id")
    .eq("answer_id", answerId)
    .eq("voter_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("community_answer_votes").delete().eq("id", existing.id);
  } else {
    await supabase.from("community_answer_votes").insert({ answer_id: answerId, voter_id: userId });
  }

  const { data: answer } = await supabase
    .from("community_answers")
    .select("upvotes, question_id")
    .eq("id", answerId)
    .single();

  if (answer) revalidatePath(`/candidate/community/questions/${answer.question_id}`);

  return { upvoted: !existing, count: answer?.upvotes ?? 0, error: null };
}

export async function markAnswerHelpfulAction(answerId: string, questionId: string) {
  const { supabase } = await requireUser();

  const { error } = await supabase.rpc("mark_answer_helpful", { p_answer_id: answerId });

  revalidatePath(`/candidate/community/questions/${questionId}`);

  return { error: error?.message ?? null };
}

export async function submitSalaryAction(formData: FormData) {
  const { supabase, userId } = await requireUser();

  const workMode = optionalText(formData.get("workMode")) as WorkMode | null;

  const { error } = await supabase.from("community_salary_entries").insert({
    submitter_id: userId,
    country: String(formData.get("country") ?? "").trim(),
    city: optionalText(formData.get("city")),
    company: optionalText(formData.get("company")),
    job_title: String(formData.get("jobTitle") ?? "").trim(),
    years_experience: Number(formData.get("yearsExperience") ?? 0),
    salary_amount: Number(formData.get("salaryAmount") ?? 0),
    salary_currency: String(formData.get("salaryCurrency") ?? "USD").trim() || "USD",
    bonus_amount: formData.get("bonusAmount") ? Number(formData.get("bonusAmount")) : null,
    work_mode: workMode,
    industry: optionalText(formData.get("industry")),
    certifications: parseTags(formData.get("certifications")),
  });

  if (error) {
    redirect(`/candidate/community/salary/share?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/candidate/community/salary");
  redirect("/candidate/community/salary?shared=1");
}

export async function submitInterviewExperienceAction(formData: FormData) {
  const { supabase, userId } = await requireUser();

  const company = String(formData.get("company") ?? "").trim();

  const { error } = await supabase.from("community_interview_experiences").insert({
    submitter_id: userId,
    company,
    job_title: String(formData.get("jobTitle") ?? "").trim(),
    rounds: Number(formData.get("rounds") ?? 0),
    difficulty: Number(formData.get("difficulty") ?? 5),
    duration: optionalText(formData.get("duration")),
    interview_type: String(formData.get("interviewType") ?? "both"),
    questions_remembered: optionalText(formData.get("questionsRemembered")),
    overall_experience: String(formData.get("overallExperience") ?? "").trim(),
    tips: optionalText(formData.get("tips")),
  });

  if (error) {
    redirect(`/candidate/community/interviews/share?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/candidate/community/interviews");
  redirect(`/candidate/community/interviews/${encodeURIComponent(company)}?shared=1`);
}
