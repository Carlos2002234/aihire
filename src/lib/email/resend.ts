import "server-only";

import { Resend } from "resend";

export function getResendClient(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

export const EMAIL_FROM = process.env.RESEND_FROM_EMAIL ?? "HireFlow <notificaciones@hireflow.app>";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
