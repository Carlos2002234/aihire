"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { fetchCandidatePassport } from "@/lib/ai/candidate";
import { analyzeProfile } from "@/lib/ai/profile-analysis";
import { generateResumeContent, renderResumePdf } from "@/lib/ai/resume";
import type { ProfileAnalysisOutput, ResumeOutput, TargetJobForResume } from "@/lib/ai/prompts";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type WorkMode = Database["public"]["Enums"]["work_mode"];

const PASSPORT_PATH = "/candidate/passport";
const RESUME_BUILDER_PATH = "/candidate/resume-builder";

async function requireCandidate() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase
    .from("candidate_profiles")
    .upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });

  return { supabase, candidateId: user.id };
}

function optionalInt(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  return raw === "" ? null : Number(raw);
}

function optionalText(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  return raw === "" ? null : raw;
}

export async function updateProfileSummaryAction(formData: FormData) {
  const { supabase, candidateId } = await requireCandidate();

  await supabase
    .from("profiles")
    .update({
      full_name: optionalText(formData.get("fullName")),
      headline: optionalText(formData.get("headline")),
      location_city: optionalText(formData.get("locationCity")),
      location_country: optionalText(formData.get("locationCountry")),
    })
    .eq("id", candidateId);

  await supabase
    .from("candidate_profiles")
    .update({
      bio: optionalText(formData.get("bio")),
      github_url: optionalText(formData.get("githubUrl")),
      linkedin_url: optionalText(formData.get("linkedinUrl")),
      website_url: optionalText(formData.get("websiteUrl")),
      salary_expectation_min: optionalInt(formData.get("salaryMin")),
      salary_expectation_max: optionalInt(formData.get("salaryMax")),
      salary_currency: String(formData.get("salaryCurrency") ?? "USD"),
      preferred_work_modes: formData.getAll("workModes") as WorkMode[],
      availability: optionalText(formData.get("availability")),
      open_to_work: formData.get("openToWork") === "on",
    })
    .eq("id", candidateId);

  revalidatePath(PASSPORT_PATH);
}

export async function addWorkExperienceAction(formData: FormData) {
  const { supabase, candidateId } = await requireCandidate();

  await supabase.from("work_experiences").insert({
    candidate_id: candidateId,
    title: String(formData.get("title") ?? ""),
    company: String(formData.get("company") ?? ""),
    description: optionalText(formData.get("description")),
    technologies: optionalText(formData.get("technologies"))
      ?.split(",")
      .map((t) => t.trim())
      .filter(Boolean) ?? null,
    start_date: String(formData.get("startDate") ?? ""),
    end_date: optionalText(formData.get("endDate")),
  });

  revalidatePath(PASSPORT_PATH);
}

export async function deleteWorkExperienceAction(formData: FormData) {
  const { supabase, candidateId } = await requireCandidate();
  await supabase
    .from("work_experiences")
    .delete()
    .eq("id", String(formData.get("id")))
    .eq("candidate_id", candidateId);
  revalidatePath(PASSPORT_PATH);
}

export async function addEducationAction(formData: FormData) {
  const { supabase, candidateId } = await requireCandidate();

  await supabase.from("educations").insert({
    candidate_id: candidateId,
    institution: String(formData.get("institution") ?? ""),
    degree: String(formData.get("degree") ?? ""),
    field: optionalText(formData.get("field")),
    start_date: String(formData.get("startDate") ?? ""),
    end_date: optionalText(formData.get("endDate")),
  });

  revalidatePath(PASSPORT_PATH);
}

export async function deleteEducationAction(formData: FormData) {
  const { supabase, candidateId } = await requireCandidate();
  await supabase
    .from("educations")
    .delete()
    .eq("id", String(formData.get("id")))
    .eq("candidate_id", candidateId);
  revalidatePath(PASSPORT_PATH);
}

export async function addCertificationAction(formData: FormData) {
  const { supabase, candidateId } = await requireCandidate();

  await supabase.from("certifications").insert({
    candidate_id: candidateId,
    name: String(formData.get("name") ?? ""),
    issuer: String(formData.get("issuer") ?? ""),
    issue_date: optionalText(formData.get("issueDate")),
    expiry_date: optionalText(formData.get("expiryDate")),
    credential_url: optionalText(formData.get("credentialUrl")),
  });

  revalidatePath(PASSPORT_PATH);
}

export async function deleteCertificationAction(formData: FormData) {
  const { supabase, candidateId } = await requireCandidate();
  await supabase
    .from("certifications")
    .delete()
    .eq("id", String(formData.get("id")))
    .eq("candidate_id", candidateId);
  revalidatePath(PASSPORT_PATH);
}

export async function addSkillAction(formData: FormData) {
  const { supabase, candidateId } = await requireCandidate();

  await supabase.from("candidate_skills").upsert(
    {
      candidate_id: candidateId,
      skill_id: String(formData.get("skillId")),
      years_experience: optionalInt(formData.get("yearsExperience")),
    },
    { onConflict: "candidate_id,skill_id" }
  );

  revalidatePath(PASSPORT_PATH);
}

export async function removeSkillAction(formData: FormData) {
  const { supabase, candidateId } = await requireCandidate();
  await supabase
    .from("candidate_skills")
    .delete()
    .eq("id", String(formData.get("id")))
    .eq("candidate_id", candidateId);
  revalidatePath(PASSPORT_PATH);
}

export async function addLanguageAction(formData: FormData) {
  const { supabase, candidateId } = await requireCandidate();

  await supabase.from("candidate_languages").insert({
    candidate_id: candidateId,
    language: String(formData.get("language") ?? ""),
    level: String(formData.get("level") ?? ""),
  });

  revalidatePath(PASSPORT_PATH);
}

export async function deleteLanguageAction(formData: FormData) {
  const { supabase, candidateId } = await requireCandidate();
  await supabase
    .from("candidate_languages")
    .delete()
    .eq("id", String(formData.get("id")))
    .eq("candidate_id", candidateId);
  revalidatePath(PASSPORT_PATH);
}

export async function addProjectAction(formData: FormData) {
  const { supabase, candidateId } = await requireCandidate();

  await supabase.from("projects").insert({
    candidate_id: candidateId,
    name: String(formData.get("name") ?? ""),
    description: optionalText(formData.get("description")),
    url: optionalText(formData.get("url")),
    technologies: optionalText(formData.get("technologies"))
      ?.split(",")
      .map((t) => t.trim())
      .filter(Boolean) ?? null,
  });

  revalidatePath(PASSPORT_PATH);
}

export async function deleteProjectAction(formData: FormData) {
  const { supabase, candidateId } = await requireCandidate();
  await supabase
    .from("projects")
    .delete()
    .eq("id", String(formData.get("id")))
    .eq("candidate_id", candidateId);
  revalidatePath(PASSPORT_PATH);
}

export async function uploadResumeAction(formData: FormData) {
  const { supabase, candidateId } = await requireCandidate();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return;

  const path = `${candidateId}/${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(path, file);

  if (!uploadError) {
    await supabase.from("resumes").insert({
      candidate_id: candidateId,
      name: file.name,
      storage_path: path,
    });
  }

  revalidatePath(PASSPORT_PATH);
}

export async function generateTailoredResumeAction(
  positionTitle: string,
  positionDescription: string
): Promise<{ resume: ResumeOutput } | { error: string }> {
  const { supabase, candidateId } = await requireCandidate();

  const title = positionTitle.trim();
  const description = positionDescription.trim();
  const targetJob: TargetJobForResume | null = title ? { title, description, requiredSkills: [] } : null;

  try {
    const candidate = await fetchCandidatePassport(supabase, candidateId);
    const resume = await generateResumeContent({ candidate, targetJob });
    return { resume };
  } catch {
    return { error: "No pudimos generar el CV. Probá de nuevo en unos segundos." };
  }
}

export async function saveGeneratedResumeAction(
  resume: ResumeOutput,
  positionTitle: string | null,
  positionDescription: string | null
): Promise<{ error: string | null; resumeId?: string }> {
  const { supabase, candidateId } = await requireCandidate();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", candidateId)
    .single();

  const pdfBuffer = await renderResumePdf(profile?.full_name ?? "Candidato", resume);

  const path = `${candidateId}/${crypto.randomUUID()}-cv-ia.pdf`;
  const { error: uploadError } = await supabase.storage.from("resumes").upload(path, pdfBuffer, {
    contentType: "application/pdf",
  });
  if (uploadError) return { error: uploadError.message };

  const { data: inserted, error: insertError } = await supabase
    .from("resumes")
    .insert({
      candidate_id: candidateId,
      name: positionTitle ? `CV IA — ${positionTitle}` : "CV generado con IA",
      storage_path: path,
      is_ai_generated: true,
      target_position_title: positionTitle,
      target_position_description: positionDescription,
    })
    .select("id")
    .single();

  if (insertError || !inserted) return { error: insertError?.message ?? "No pudimos guardar el CV." };

  revalidatePath(PASSPORT_PATH);
  revalidatePath(RESUME_BUILDER_PATH);

  return { error: null, resumeId: inserted.id };
}

export async function getResumeDownloadUrlAction(
  resumeId: string
): Promise<{ url: string | null; error: string | null }> {
  const { supabase, candidateId } = await requireCandidate();

  const { data: resume } = await supabase
    .from("resumes")
    .select("storage_path")
    .eq("id", resumeId)
    .eq("candidate_id", candidateId)
    .single();

  if (!resume) return { url: null, error: "CV no encontrado." };

  const { data, error } = await supabase.storage.from("resumes").createSignedUrl(resume.storage_path, 60);
  if (error || !data) return { url: null, error: error?.message ?? "No pudimos generar el link de descarga." };

  return { url: data.signedUrl, error: null };
}

export async function deleteResumeAction(formData: FormData) {
  const { supabase, candidateId } = await requireCandidate();
  const id = String(formData.get("id"));
  const storagePath = String(formData.get("storagePath"));

  await supabase.storage.from("resumes").remove([storagePath]);
  await supabase
    .from("resumes")
    .delete()
    .eq("id", id)
    .eq("candidate_id", candidateId);

  revalidatePath(PASSPORT_PATH);
}

export async function analyzeProfileAction(): Promise<
  { analysis: ProfileAnalysisOutput } | { error: string }
> {
  const { supabase, candidateId } = await requireCandidate();

  try {
    const candidate = await fetchCandidatePassport(supabase, candidateId);
    const analysis = await analyzeProfile(candidate);
    return { analysis };
  } catch {
    return { error: "No pudimos analizar tu perfil. Probá de nuevo en unos segundos." };
  }
}
