"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { ApplicationStage } from "@/lib/application-stages";

export async function moveApplicationStageAction(
  applicationId: string,
  jobId: string,
  toStage: ApplicationStage
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase.rpc("move_application_stage", {
    p_application_id: applicationId,
    p_to_stage: toStage,
  });

  revalidatePath(`/recruiter/pipeline/${jobId}`);

  return { error: error?.message ?? null };
}
