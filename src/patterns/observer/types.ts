import type { Distillation, Observation, Decision } from "../../types/memory.js";
import type { EpsilonR } from "../../types/state-dimensions.js";
import type { PipelineResult } from "../dev-agent/index.js";

/** An event that the Observer can process */
export interface ObservableEvent {
  type:
    | "pipeline_complete"
    | "decision_made"
    | "quality_assessed"
    | "error_occurred"
    | "correction_triggered";
  timestamp: Date;
  data: Record<string, unknown>;
}

/** Observer state — accumulated within a session */
export interface ObserverState {
  observations: Observation[];
  distillations: Distillation[];
  decisionsThisSession: Decision[];
  pipelineResults: PipelineResult[];
  epsilonR: EpsilonR;
  sessionStartedAt: Date;
}

/** Feedback recommendation from the Observer */
export interface FeedbackRecommendation {
  scale: "correction" | "learning" | "evolutionary";
  action: string;
  confidence: number;
  evidence: string[];
}