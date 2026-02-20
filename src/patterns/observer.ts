/**
 * Codex Signum — Observer (Feedback Loop Integration)
 *
 * The Observer is a Grid morpheme — it watches the system, collects
 * signals, and triggers feedback loops at three scales:
 *
 * 1. Correction Scale (immediate) — within a pipeline execution
 * 2. Learning Scale (session) — across tasks in a session
 * 3. Evolutionary Scale (cross-session) — across sessions over time
 *
 * The Observer bridges the gap between raw observations (Stratum 2)
 * and actionable intelligence (Stratum 3-4).
 *
 * @see codex-signum-v3.0.md §Helix morpheme, §Grid morpheme
 * @see engineering-bridge-v2.0.md §Part 8 "Observer"
 * @module codex-signum-core/patterns/observer
 */

import { computeEpsilonR } from "../computation/index.js";
import {
  createObservation,
  distillObservations,
  shouldDistill,
} from "../memory/index.js";
import type { Decision, Distillation, Observation } from "../types/memory.js";
import type { EpsilonR } from "../types/state-dimensions.js";
import type { PipelineResult } from "./dev-agent.js";

// ============ TYPES ============

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

// ============ OBSERVER ============

/**
 * The Observer — watches, collects, and triggers feedback.
 */
export class Observer {
  private state: ObserverState;

  constructor() {
    this.state = {
      observations: [],
      distillations: [],
      decisionsThisSession: [],
      pipelineResults: [],
      epsilonR: computeEpsilonR(0, 0),
      sessionStartedAt: new Date(),
    };
  }

  // ============ EVENT INGESTION ============

  /**
   * Process a pipeline completion event.
   * This is the primary signal source for the Observer.
   */
  observePipelineResult(result: PipelineResult): void {
    this.state.pipelineResults.push(result);

    // Record quality observation per stage
    for (const stage of result.stages) {
      const obs = createObservation(
        `devagent:${stage.stage}`,
        "execution_outcome",
        {
          success: stage.qualityScore >= 0.5,
          qualityScore: stage.qualityScore,
          durationMs: stage.durationMs,
          modelUsed: stage.modelId,
          context: { correction: stage.correctionIteration },
        },
      );
      this.state.observations.push(obs);
    }

    // Record latency observation
    const latencyObs = createObservation(
      "devagent:pipeline",
      "execution_outcome",
      {
        success: result.overallQuality >= 0.5,
        durationMs: result.totalDurationMs,
      },
    );
    this.state.observations.push(latencyObs);

    // Record correction count
    if (result.correctionCount > 0) {
      const corrObs = createObservation(
        "devagent:pipeline",
        "correction_loop",
        {
          success: result.overallQuality >= 0.5,
          context: { corrections: result.correctionCount },
        },
      );
      this.state.observations.push(corrObs);
    }

    // Record decisions
    this.state.decisionsThisSession.push(...result.decisions);

    // Update εR
    this.updateEpsilonR();

    // Check for distillation triggers
    this.checkDistillationTriggers();
  }

  /**
   * Observe a generic event.
   */
  observe(event: ObservableEvent): void {
    const obs = createObservation(`event:${event.type}`, "feedback_event", {
      success: true,
      context: { eventData: JSON.stringify(event.data).slice(0, 500) },
    });
    this.state.observations.push(obs);
  }

  // ============ FEEDBACK GENERATION ============

  /**
   * Generate feedback recommendations based on accumulated observations.
   */
  generateFeedback(): FeedbackRecommendation[] {
    const recommendations: FeedbackRecommendation[] = [];

    // CORRECTION SCALE — immediate issues
    recommendations.push(...this.checkCorrectionScale());

    // LEARNING SCALE — session-level patterns
    recommendations.push(...this.checkLearningScale());

    // EVOLUTIONARY SCALE — cross-session patterns
    recommendations.push(...this.checkEvolutionaryScale());

    return recommendations;
  }

  /**
   * Correction scale: immediate issues in recent pipeline runs.
   */
  private checkCorrectionScale(): FeedbackRecommendation[] {
    const recs: FeedbackRecommendation[] = [];
    const recent = this.state.pipelineResults.slice(-5);

    // Check for high correction rate
    const avgCorrections =
      recent.reduce((sum, r) => sum + r.correctionCount, 0) /
      Math.max(1, recent.length);

    if (avgCorrections > 2) {
      recs.push({
        scale: "correction",
        action:
          "High correction rate detected. Consider: 1) Improving prompts, 2) Adjusting quality threshold, 3) Routing to stronger models.",
        confidence: 0.8,
        evidence: [
          `Average corrections per pipeline: ${avgCorrections.toFixed(1)}`,
          `Sample size: ${recent.length} recent pipelines`,
        ],
      });
    }

    // Check for specific stage failures
    for (const stage of ["scope", "execute", "review", "validate"] as const) {
      const stageResults = recent.flatMap((r) =>
        r.stages.filter((s) => s.stage === stage),
      );
      const avgQuality =
        stageResults.reduce((sum, s) => sum + s.qualityScore, 0) /
        Math.max(1, stageResults.length);

      if (stageResults.length >= 3 && avgQuality < 0.5) {
        recs.push({
          scale: "correction",
          action: `Stage '${stage}' consistently underperforming (avg quality: ${avgQuality.toFixed(2)}). Route to different model or improve stage prompt.`,
          confidence: 0.7,
          evidence: stageResults.map(
            (s) => `${s.modelId}: q=${s.qualityScore.toFixed(2)}`,
          ),
        });
      }
    }

    return recs;
  }

  /**
   * Learning scale: session-level patterns.
   */
  private checkLearningScale(): FeedbackRecommendation[] {
    const recs: FeedbackRecommendation[] = [];

    // εR check
    if (this.state.epsilonR.range === "rigid") {
      recs.push({
        scale: "learning",
        action:
          "Exploration rate is too low (rigid). Force exploration to discover potentially better model assignments.",
        confidence: 0.9,
        evidence: [
          `εR = ${this.state.epsilonR.value.toFixed(3)}`,
          `Exploratory: ${this.state.epsilonR.exploratoryDecisions}/${this.state.epsilonR.totalDecisions}`,
        ],
      });
    }

    if (this.state.epsilonR.range === "unstable") {
      recs.push({
        scale: "learning",
        action:
          "Exploration rate is too high (unstable). Decisions are inconsistent — allow more exploitation.",
        confidence: 0.8,
        evidence: [
          `εR = ${this.state.epsilonR.value.toFixed(3)}`,
          `Exploratory: ${this.state.epsilonR.exploratoryDecisions}/${this.state.epsilonR.totalDecisions}`,
        ],
      });
    }

    // Model dominance check
    const modelUsage = new Map<string, number>();
    for (const decision of this.state.decisionsThisSession) {
      modelUsage.set(
        decision.selected,
        (modelUsage.get(decision.selected) ?? 0) + 1,
      );
    }

    if (this.state.decisionsThisSession.length >= 10) {
      for (const [modelId, count] of modelUsage) {
        const fraction = count / this.state.decisionsThisSession.length;
        if (fraction > 0.8) {
          recs.push({
            scale: "learning",
            action: `Model '${modelId}' dominates routing (${(fraction * 100).toFixed(0)}% of decisions). Consider forcing exploration of alternatives.`,
            confidence: 0.7,
            evidence: [
              `${modelId}: ${count}/${this.state.decisionsThisSession.length} decisions`,
            ],
          });
        }
      }
    }

    return recs;
  }

  /**
   * Evolutionary scale: cross-session patterns (from distillations).
   */
  private checkEvolutionaryScale(): FeedbackRecommendation[] {
    const recs: FeedbackRecommendation[] = [];

    // Check if we have enough distillations
    if (this.state.distillations.length >= 5) {
      const avgConfidence =
        this.state.distillations.reduce((sum, d) => sum + d.confidence, 0) /
        this.state.distillations.length;

      if (avgConfidence > 0.7) {
        recs.push({
          scale: "evolutionary",
          action: `${this.state.distillations.length} distillations with high confidence (${avgConfidence.toFixed(2)}). Consider promoting to institutional knowledge.`,
          confidence: avgConfidence,
          evidence: this.state.distillations.map(
            (d) => `${d.category}: ${d.insight.slice(0, 80)}...`,
          ),
        });
      }
    }

    return recs;
  }

  // ============ INTERNAL ============

  /**
   * Update εR from accumulated decisions.
   */
  private updateEpsilonR(): void {
    const exploratory = this.state.decisionsThisSession.filter(
      (d) => d.outcome?.wasExploratory === true,
    ).length;
    this.state.epsilonR = computeEpsilonR(
      exploratory,
      this.state.decisionsThisSession.length,
    );
  }

  /**
   * Check if observations should be distilled.
   */
  private checkDistillationTriggers(): void {
    // Group observations by type
    const byType = new Map<string, Observation[]>();
    for (const obs of this.state.observations) {
      const key = obs.observationType;
      if (!byType.has(key)) byType.set(key, []);
      byType.get(key)!.push(obs);
    }

    // Check each type group for distillation readiness
    for (const [obsType, observations] of byType) {
      if (shouldDistill(observations, 10)) {
        const distillation = distillObservations(
          observations,
          "performance_profile",
        );
        this.state.distillations.push(distillation);
      }
    }
  }

  // ============ ACCESSORS ============

  getState(): Readonly<ObserverState> {
    return this.state;
  }

  getObservationCount(): number {
    return this.state.observations.length;
  }

  getDistillationCount(): number {
    return this.state.distillations.length;
  }

  getDecisionCount(): number {
    return this.state.decisionsThisSession.length;
  }

  getEpsilonR(): EpsilonR {
    return this.state.epsilonR;
  }
}
