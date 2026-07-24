"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const COMPANY_PATH = "/recruiter/company";

async function requireRecruiter() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return { supabase, recruiterId: user.id };
}

function optionalText(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  return raw === "" ? null : raw;
}

function csvToArray(value: FormDataEntryValue | null) {
  return (
    optionalText(value)
      ?.split(",")
      .map((v) => v.trim())
      .filter(Boolean) ?? null
  );
}

export async function createCompanyAction(formData: FormData) {
  const { supabase, recruiterId } = await requireRecruiter();

  const { data: company, error } = await supabase
    .from("companies")
    .insert({
      name: String(formData.get("name") ?? ""),
      description: optionalText(formData.get("description")),
      industry: optionalText(formData.get("industry")),
      size: optionalText(formData.get("size")),
      website: optionalText(formData.get("website")),
      logo_url: optionalText(formData.get("logoUrl")),
      benefits: csvToArray(formData.get("benefits")),
      locations: csvToArray(formData.get("locations")),
      created_by: recruiterId,
    })
    .select("id")
    .single();

  if (!error && company) {
    await supabase
      .from("recruiter_profiles")
      .upsert(
        {
          id: recruiterId,
          company_id: company.id,
          position: optionalText(formData.get("position")),
        },
        { onConflict: "id" }
      );
  }

  revalidatePath(COMPANY_PATH);
}

export async function joinCompanyAction(formData: FormData) {
  const { supabase, recruiterId } = await requireRecruiter();

  await supabase.from("recruiter_profiles").upsert(
    {
      id: recruiterId,
      company_id: String(formData.get("companyId")),
      position: optionalText(formData.get("position")),
    },
    { onConflict: "id" }
  );

  revalidatePath(COMPANY_PATH);
}

export async function updateCompanyAction(formData: FormData) {
  const { supabase } = await requireRecruiter();

  await supabase
    .from("companies")
    .update({
      name: String(formData.get("name") ?? ""),
      description: optionalText(formData.get("description")),
      industry: optionalText(formData.get("industry")),
      size: optionalText(formData.get("size")),
      website: optionalText(formData.get("website")),
      logo_url: optionalText(formData.get("logoUrl")),
      benefits: csvToArray(formData.get("benefits")),
      locations: csvToArray(formData.get("locations")),
    })
    .eq("id", String(formData.get("companyId")));

  revalidatePath(COMPANY_PATH);
}
