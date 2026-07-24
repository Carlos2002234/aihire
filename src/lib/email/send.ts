import "server-only";

import { getServiceClient } from "@/lib/supabase/service";
import type { ApplicationStage } from "@/lib/application-stages";
import { APP_URL, EMAIL_FROM, getResendClient } from "./resend";
import {
  buildFeedbackAvailableEmail,
  buildInterviewInvitationEmail,
  buildOfferEmail,
  buildStatusChangeEmail,
} from "./templates";

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const resend = getResendClient();
  await resend.emails.send({ from: EMAIL_FROM, to, subject, html });
}

export async function getUserEmail(userId: string): Promise<string | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data.user) return null;
  return data.user.email ?? null;
}

export async function sendStageChangeEmail(
  applicationId: string,
  toStage: ApplicationStage
): Promise<void> {
  const supabase = getServiceClient();

  const { data: application } = await supabase
    .from("applications")
    .select("candidate_id, jobs(title)")
    .eq("id", applicationId)
    .single();
  if (!application?.jobs) return;

  const email = await getUserEmail(application.candidate_id);
  if (!email) return;

  const jobTitle = application.jobs.title;
  const appUrl = `${APP_URL}/candidate/applications`;

  const content =
    toStage === "interview" || toStage === "technical_interview" || toStage === "final_interview"
      ? buildInterviewInvitationEmail(jobTitle, appUrl)
      : toStage === "offer"
        ? buildOfferEmail(jobTitle, appUrl)
        : buildStatusChangeEmail(jobTitle, appUrl);

  await sendEmail(email, content.subject, content.html);
}

export async function sendFeedbackAvailableEmail(candidateId: string, jobTitle: string): Promise<void> {
  const email = await getUserEmail(candidateId);
  if (!email) return;

  const content = buildFeedbackAvailableEmail(jobTitle, `${APP_URL}/candidate/roadmap`);
  await sendEmail(email, content.subject, content.html);
}
