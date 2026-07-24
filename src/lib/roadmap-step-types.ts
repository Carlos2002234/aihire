type RoadmapStepType = "learn" | "project" | "certification" | "practice" | "apply";

const ROADMAP_STEP_TYPE_LABELS: Record<RoadmapStepType, string> = {
  learn: "Aprender",
  project: "Proyecto",
  certification: "Certificación",
  practice: "Práctica",
  apply: "Aplicar",
};

export { ROADMAP_STEP_TYPE_LABELS };
export type { RoadmapStepType };
