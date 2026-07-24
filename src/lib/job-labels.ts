import type { Database } from "@/types/database";

type WorkMode = Database["public"]["Enums"]["work_mode"];
type EmploymentType = Database["public"]["Enums"]["employment_type"];
type ExperienceLevel = Database["public"]["Enums"]["experience_level"];

const WORK_MODES: WorkMode[] = ["remote", "hybrid", "onsite"];
const EMPLOYMENT_TYPES: EmploymentType[] = ["full_time", "part_time", "contract", "internship"];
const EXPERIENCE_LEVELS: ExperienceLevel[] = ["intern", "junior", "mid", "senior", "staff", "lead"];

const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: "Remoto",
  hybrid: "Híbrido",
  onsite: "Presencial",
};
const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contrato",
  internship: "Pasantía",
};
const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  intern: "Intern",
  junior: "Junior",
  mid: "Mid level",
  senior: "Senior level",
  staff: "Staff",
  lead: "Lead",
};

export {
  WORK_MODES,
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  WORK_MODE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_LABELS,
};
export type { WorkMode, EmploymentType, ExperienceLevel };
