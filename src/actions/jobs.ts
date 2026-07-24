"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type WorkMode = Database["public"]["Enums"]["work_mode"];
type EmploymentType = Database["public"]["Enums"]["employment_type"];
type ExperienceLevel = Database["public"]["Enums"]["experience_level"];

const MAX_QUESTIONS = 5;

async function requireRecruiterWithCompany() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: recruiterProfile } = await supabase
    .from("recruiter_profiles")
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!recruiterProfile?.company_id) redirect("/recruiter/company");

  return {
    supabase,
    recruiterId: user.id,
    companyId: recruiterProfile.company_id,
  };
}

function optionalText(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  return raw === "" ? null : raw;
}

function optionalInt(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  return raw === "" ? null : Number(raw);
}

function optionalEnum<T extends string>(value: FormDataEntryValue | null): T | null {
  const raw = optionalText(value);
  return (raw as T) ?? null;
}

export async function createJobAction(formData: FormData) {
  const { supabase, recruiterId, companyId } = await requireRecruiterWithCompany();

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      company_id: companyId,
      recruiter_id: recruiterId,
      title: String(formData.get("title") ?? ""),
    })
    .select("id")
    .single();

  if (error || !job) redirect("/recruiter/jobs");

  redirect(`/recruiter/jobs/${job.id}`);
}

export async function updateJobAction(formData: FormData) {
  const { supabase } = await requireRecruiterWithCompany();
  const jobId = String(formData.get("jobId"));

  await supabase
    .from("jobs")
    .update({
      title: String(formData.get("title") ?? ""),
      description: optionalText(formData.get("description")),
      responsibilities: optionalText(formData.get("responsibilities")),
      benefits: optionalText(formData.get("benefits")),
      location_country: optionalText(formData.get("locationCountry")),
      location_city: optionalText(formData.get("locationCity")),
      work_mode: optionalEnum<WorkMode>(formData.get("workMode")),
      employment_type: optionalEnum<EmploymentType>(formData.get("employmentType")),
      experience_level: optionalEnum<ExperienceLevel>(formData.get("experienceLevel")),
      salary_min: optionalInt(formData.get("salaryMin")),
      salary_max: optionalInt(formData.get("salaryMax")),
      salary_currency: String(formData.get("salaryCurrency") ?? "USD"),
    })
    .eq("id", jobId);

  revalidatePath(`/recruiter/jobs/${jobId}`);
}

export async function publishJobAction(formData: FormData) {
  const { supabase } = await requireRecruiterWithCompany();
  const jobId = String(formData.get("jobId"));

  await supabase
    .from("jobs")
    .update({ status: "open", published_at: new Date().toISOString() })
    .eq("id", jobId);

  revalidatePath(`/recruiter/jobs/${jobId}`);
  revalidatePath("/recruiter/jobs");
}

export async function closeJobAction(formData: FormData) {
  const { supabase } = await requireRecruiterWithCompany();
  const jobId = String(formData.get("jobId"));

  await supabase.from("jobs").update({ status: "closed" }).eq("id", jobId);

  revalidatePath(`/recruiter/jobs/${jobId}`);
  revalidatePath("/recruiter/jobs");
}

export async function addRequiredSkillAction(formData: FormData) {
  const { supabase } = await requireRecruiterWithCompany();
  const jobId = String(formData.get("jobId"));

  await supabase.from("job_required_skills").upsert(
    {
      job_id: jobId,
      skill_id: String(formData.get("skillId")),
      min_years: optionalInt(formData.get("minYears")),
      required: formData.get("required") === "on",
    },
    { onConflict: "job_id,skill_id" }
  );

  revalidatePath(`/recruiter/jobs/${jobId}`);
}

export async function removeRequiredSkillAction(formData: FormData) {
  const { supabase } = await requireRecruiterWithCompany();
  const jobId = String(formData.get("jobId"));

  await supabase
    .from("job_required_skills")
    .delete()
    .eq("id", String(formData.get("id")));

  revalidatePath(`/recruiter/jobs/${jobId}`);
}

export async function addQuestionAction(formData: FormData) {
  const { supabase } = await requireRecruiterWithCompany();
  const jobId = String(formData.get("jobId"));

  const { count } = await supabase
    .from("job_questions")
    .select("id", { count: "exact", head: true })
    .eq("job_id", jobId);

  if ((count ?? 0) >= MAX_QUESTIONS) {
    revalidatePath(`/recruiter/jobs/${jobId}`);
    return;
  }

  await supabase.from("job_questions").insert({
    job_id: jobId,
    question: String(formData.get("question") ?? ""),
    position: count ?? 0,
  });

  revalidatePath(`/recruiter/jobs/${jobId}`);
}

export async function removeQuestionAction(formData: FormData) {
  const { supabase } = await requireRecruiterWithCompany();
  const jobId = String(formData.get("jobId"));

  await supabase.from("job_questions").delete().eq("id", String(formData.get("id")));

  revalidatePath(`/recruiter/jobs/${jobId}`);
}
