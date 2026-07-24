"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function toggleRoadmapStepAction(stepId: string, completed: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase.from("roadmap_steps").update({ completed }).eq("id", stepId);

  revalidatePath("/candidate/roadmap");

  return { error: error?.message ?? null };
}
