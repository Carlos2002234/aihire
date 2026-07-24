import type { Database } from "@/types/database";

type ApplicationStage = Database["public"]["Enums"]["application_stage"];

const APPLICATION_STAGES: ApplicationStage[] = [
  "applied",
  "under_review",
  "recruiter_review",
  "interview",
  "technical_interview",
  "final_interview",
  "offer",
  "rejected",
];

const STAGE_LABELS: Record<ApplicationStage, string> = {
  applied: "Aplicado",
  under_review: "En revisión",
  recruiter_review: "Revisión del recruiter",
  interview: "Entrevista",
  technical_interview: "Entrevista técnica",
  final_interview: "Entrevista final",
  offer: "Oferta",
  rejected: "Rechazado",
};

export { APPLICATION_STAGES, STAGE_LABELS };
export type { ApplicationStage };
