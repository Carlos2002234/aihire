import type { Database } from "@/types/database";

type RejectionReason = Database["public"]["Enums"]["rejection_reason"];

const REJECTION_REASONS: RejectionReason[] = [
  "insufficient_experience",
  "missing_technical_skills",
  "salary_expectations",
  "language_level",
  "better_qualified_candidate",
  "culture_fit",
  "other",
];

const REJECTION_REASON_LABELS: Record<RejectionReason, string> = {
  insufficient_experience: "Experiencia insuficiente",
  missing_technical_skills: "Faltan skills técnicas",
  salary_expectations: "Expectativa salarial",
  language_level: "Nivel de idioma",
  better_qualified_candidate: "Había un candidato más calificado",
  culture_fit: "Fit cultural",
  other: "Otro motivo",
};

export { REJECTION_REASONS, REJECTION_REASON_LABELS };
export type { RejectionReason };
