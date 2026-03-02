// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Conformance Tests: Memory Strata Operations
 *
 * Verifies the four-stratum memory model with correct promotion flows:
 * Ephemeral(1) → Observation(2) → Distillation(3) → Institutional(4)
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
  EphemeralStore,
  attachOutcome,
  createDecision,
  createInstitutionalKnowledge,
  createObservation,
  distillObservations,
  shouldDistill,
  shouldPromoteToInstitutional,
} from "../../src/memory/operations.js";
import type {
  DecisionContext,
  DecisionOutcome,
  Observation,
} from "../../src/types/memory.js";

// ============ STRATUM 1: EPHEMERAL ============

describe("EphemeralStore (Stratum 1)", () => {
  let store: EphemeralStore;

  beforeEach(() => {
    store = new EphemeralStore();
  });

  it("creates entries with unique executionId", () => {
    const a = store.add("router-v1");
    const b = store.add("router-v1");
    expect(a.executionId).not.toBe(b.executionId);
    expect(a.stratum).toBe(1);
  });

  it("stores optional data", () => {
    const e = store.add("router-v1", { model: "gemini-flash", tokens: 1500 });
    expect(e.data.model).toBe("gemini-flash");
    expect(e.data.tokens).toBe(1500);
  });

  it("defaults data to empty object", () => {
    const e = store.add("router-v1");
    expect(e.data).toEqual({});
  });

  it("retrieves by executionId", () => {
    const e = store.add("router-v1");
    const found = store.get(e.executionId);
    expect(found).toBeDefined();
    expect(found!.bloomId).toBe("router-v1");
  });

  it("finds by bloom", () => {
    store.add("router-v1");
    store.add("router-v1");
    store.add("generator-v2");
    expect(store.findByBloom("router-v1")).toHaveLength(2);
    expect(store.findByBloom("generator-v2")).toHaveLength(1);
  });

  it("clears all entries (session end)", () => {
    store.add("a");
    store.add("b");
    expect(store.size).toBe(2);
    store.clear();
    expect(store.size).toBe(0);
  });

  it("tracks correction state (Correction Helix)", () => {
    const e = store.add("router-v1");
    const updated = store.updateCorrectionState(e.executionId, 2, 5, [
      "improve error handling",
      "add type guards",
    ]);
    expect(updated).not.toBeNull();
    expect(updated!.correctionState!.iteration).toBe(2);
    expect(updated!.correctionState!.maxIterations).toBe(5);
    expect(updated!.correctionState!.feedback).toHaveLength(2);
  });

  it("returns null for unknown executionId on update", () => {
    expect(store.updateCorrectionState("nonexistent", 1, 3, [])).toBeNull();
  });
});

describe("EphemeralStore.promote (Stratum 1 → 2)", () => {
  let store: EphemeralStore;

  beforeEach(() => {
    store = new EphemeralStore();
  });

  it("promotes to Observation with correct fields", () => {
    const e = store.add("router-v1");
    const obs = store.promote(e.executionId, "execution_outcome", {
      success: true,
      durationMs: 350,
      qualityScore: 0.85,
    });

    expect(obs).not.toBeNull();
    expect(obs!.stratum).toBe(2);
    expect(obs!.sourceBloomId).toBe("router-v1");
    expect(obs!.observationType).toBe("execution_outcome");
    expect(obs!.data.success).toBe(true);
    expect(obs!.data.durationMs).toBe(350);
  });

  it("removes entry from ephemeral store after promotion", () => {
    const e = store.add("router-v1");
    store.promote(e.executionId, "execution_outcome", { success: true });
    expect(store.get(e.executionId)).toBeUndefined();
    expect(store.size).toBe(0);
  });

  it("returns null for unknown executionId", () => {
    expect(
      store.promote("nonexistent", "execution_outcome", { success: false }),
    ).toBeNull();
  });
});

// ============ STRATUM 2: OBSERVATIONS ============

describe("createObservation (Stratum 2)", () => {
  it("creates observation with 3-param signature", () => {
    const obs = createObservation("router-v1", "execution_outcome", {
      success: true,
      durationMs: 200,
      qualityScore: 0.9,
    });

    expect(obs.stratum).toBe(2);
    expect(obs.sourceBloomId).toBe("router-v1");
    expect(obs.observationType).toBe("execution_outcome");
    expect(obs.data.success).toBe(true);
    expect(obs.id).toBeDefined();
    expect(obs.timestamp).toBeInstanceOf(Date);
  });

  it("supports all observation types", () => {
    const types = [
      "execution_outcome",
      "routing_decision",
      "constitutional_check",
      "feedback_event",
      "degradation_event",
      "recovery_event",
      "cascade_event",
      "correction_loop",
      "exploration_event",
    ] as const;

    for (const t of types) {
      const obs = createObservation("test", t, { success: true });
      expect(obs.observationType).toBe(t);
    }
  });
});

describe("shouldDistill (Stratum 2 → 3 gate)", () => {
  const makeObs = (
    qualityScore: number,
    success: boolean = true,
  ): Observation =>
    createObservation("router-v1", "execution_outcome", {
      success,
      qualityScore,
    });

  it("requires minimum count", () => {
    const few = Array.from({ length: 5 }, () => makeObs(0.8));
    expect(shouldDistill(few, 10)).toBe(false);
  });

  it("triggers on sufficient volume", () => {
    const many = Array.from({ length: 15 }, () => makeObs(0.8));
    expect(shouldDistill(many, 10)).toBe(true);
  });

  it("triggers on clear trend", () => {
    // Steadily improving quality scores
    const improving = Array.from({ length: 12 }, (_, i) =>
      makeObs(0.5 + i * 0.04),
    );
    expect(shouldDistill(improving, 10)).toBe(true);
  });
});

// ============ STRATUM 3: DISTILLATIONS ============

describe("distillObservations (Stratum 3)", () => {
  const makeObs = (
    qualityScore: number,
    success: boolean = true,
  ): Observation =>
    createObservation("router-v1", "execution_outcome", {
      success,
      qualityScore,
    });

  it("creates distillation with correct stratum", () => {
    const obs = Array.from({ length: 10 }, () => makeObs(0.8));
    const distillation = distillObservations(obs, "performance_profile");

    expect(distillation.stratum).toBe(3);
    expect(distillation.category).toBe("performance_profile");
    expect(distillation.sourceObservationIds).toHaveLength(10);
    expect(distillation.id).toBeDefined();
    expect(distillation.insight).toContain("performance_profile");
  });

  it("computes confidence from observations", () => {
    const consistent = Array.from({ length: 20 }, () => makeObs(0.85));
    const d = distillObservations(consistent, "performance_profile");
    expect(d.confidence).toBeGreaterThan(0.5);
  });

  it("derives patternIds from observations when not provided", () => {
    const obs = [
      createObservation("router-v1", "execution_outcome", {
        success: true,
        qualityScore: 0.8,
      }),
      createObservation("router-v2", "execution_outcome", {
        success: true,
        qualityScore: 0.9,
      }),
    ];
    const d = distillObservations(obs, "model_preference");
    expect(d.relatedPatternIds).toContain("router-v1");
    expect(d.relatedPatternIds).toContain("router-v2");
  });

  it("uses explicit patternIds when provided", () => {
    const obs = Array.from({ length: 5 }, () => makeObs(0.8));
    const d = distillObservations(obs, "performance_profile", [
      "explicit-pattern",
    ]);
    expect(d.relatedPatternIds).toEqual(["explicit-pattern"]);
  });

  it("supports all distillation categories", () => {
    const obs = Array.from({ length: 5 }, () => makeObs(0.8));
    const categories = [
      "performance_profile",
      "failure_signature",
      "composition_heuristic",
      "threshold_calibration",
      "model_preference",
      "capability_expectation",
    ] as const;

    for (const cat of categories) {
      const d = distillObservations(obs, cat);
      expect(d.category).toBe(cat);
    }
  });
});

// ============ STRATUM 4: INSTITUTIONAL ============

describe("createInstitutionalKnowledge (Stratum 4)", () => {
  it("creates knowledge with averaged confidence", () => {
    const obs = Array.from({ length: 10 }, () =>
      createObservation("r", "execution_outcome", {
        success: true,
        qualityScore: 0.9,
      }),
    );
    const d1 = distillObservations(obs, "performance_profile");
    const d2 = distillObservations(obs, "model_preference");

    const ik = createInstitutionalKnowledge(
      "Gemini Flash outperforms Mistral for code generation tasks",
      "composition_archetype",
      [d1, d2],
    );

    expect(ik.stratum).toBe(4);
    expect(ik.knowledgeType).toBe("composition_archetype");
    expect(ik.contributingCount).toBe(2);
    expect(ik.confidence).toBe((d1.confidence + d2.confidence) / 2);
    expect(ik.content).toContain("Gemini Flash");
  });

  it("handles empty distillation list", () => {
    const ik = createInstitutionalKnowledge(
      "Baseline knowledge",
      "environment_adaptation",
      [],
    );
    expect(ik.confidence).toBe(0);
    expect(ik.contributingCount).toBe(0);
  });
});

describe("shouldPromoteToInstitutional (Stratum 3 → 4 gate)", () => {
  const makeDist = (confidence: number) => {
    const obs = [
      createObservation("r", "execution_outcome", {
        success: true,
        qualityScore: 0.8,
      }),
    ];
    const d = distillObservations(obs, "performance_profile");
    return { ...d, confidence };
  };

  it("requires minimum distillations", () => {
    const few = Array.from({ length: 3 }, () => makeDist(0.9));
    expect(shouldPromoteToInstitutional(few, 5)).toBe(false);
  });

  it("requires minimum confidence", () => {
    const lowConf = Array.from({ length: 6 }, () => makeDist(0.4));
    expect(shouldPromoteToInstitutional(lowConf, 5, 0.7)).toBe(false);
  });

  it("promotes when both criteria met", () => {
    const good = Array.from({ length: 6 }, () => makeDist(0.85));
    expect(shouldPromoteToInstitutional(good, 5, 0.7)).toBe(true);
  });
});

// ============ DECISIONS ============

describe("createDecision", () => {
  it("creates decision with 6-param signature", () => {
    const context: DecisionContext = {
      taskType: "code_generation",
      complexity: "medium",
    };

    const decision = createDecision(
      context,
      ["gemini-flash", "mistral-medium", "claude-haiku"],
      "gemini-flash",
      "Fastest model for medium complexity code generation",
      "router-v1",
      ["axiom-02-transparency", "axiom-06-provenance"],
    );

    expect(decision.id).toBeDefined();
    expect(decision.context.complexity).toBe("medium");
    expect(decision.alternatives).toHaveLength(3);
    expect(decision.selected).toBe("gemini-flash");
    expect(decision.reason).toContain("Fastest");
    expect(decision.madeByBloomId).toBe("router-v1");
    expect(decision.evaluatedRules).toHaveLength(2);
    expect(decision.outcome).toBeUndefined();
  });

  it("defaults evaluatedRules to empty array", () => {
    const d = createDecision(
      { taskType: "review", complexity: "low" },
      ["a", "b"],
      "a",
      "Simple choice",
      "agent-v1",
    );
    expect(d.evaluatedRules).toEqual([]);
  });
});

describe("attachOutcome", () => {
  it("attaches outcome with recordedAt", () => {
    const decision = createDecision(
      { taskType: "review", complexity: "low" },
      ["a", "b"],
      "a",
      "Simple",
      "agent-v1",
    );

    const outcome: DecisionOutcome = {
      success: true,
      qualityScore: 0.92,
      durationMs: 1200,
      recordedAt: new Date(),
    };

    const withOutcome = attachOutcome(decision, outcome);
    expect(withOutcome.outcome).toBeDefined();
    expect(withOutcome.outcome!.success).toBe(true);
    expect(withOutcome.outcome!.recordedAt).toBeInstanceOf(Date);
    // Original should not be mutated
    expect(decision.outcome).toBeUndefined();
  });
});

// ============ FULL PROMOTION FLOW ============

describe("Full Promotion Flow: Stratum 1 → 2 → 3 → 4", () => {
  it("completes the full memory lifecycle", () => {
    // Stratum 1: Create ephemeral entries
    const store = new EphemeralStore();
    const entries = Array.from({ length: 15 }, (_, i) =>
      store.add("router-v1", { iteration: i }),
    );
    expect(store.size).toBe(15);

    // Stratum 1 → 2: Promote to observations
    const observations: Observation[] = entries.map(
      (e, i) =>
        store.promote(e.executionId, "execution_outcome", {
          success: i % 5 !== 0, // 80% success
          qualityScore: 0.7 + Math.random() * 0.2,
          durationMs: 200 + i * 10,
        })!,
    );
    expect(observations.every((o) => o !== null)).toBe(true);
    expect(store.size).toBe(0); // All promoted

    // Stratum 2 → 3: Check distillation readiness, then distill
    expect(shouldDistill(observations, 10)).toBe(true);
    const distillation = distillObservations(
      observations,
      "performance_profile",
    );
    expect(distillation.stratum).toBe(3);
    expect(distillation.sourceObservationIds).toHaveLength(15);

    // Create additional distillations for institutional threshold
    // Use full observation set so confidence stays above 0.7 (sample size factor)
    const extraDistillations = Array.from({ length: 5 }, () =>
      distillObservations(observations, "model_preference"),
    );

    // Stratum 3 → 4: Promote to institutional knowledge
    const allDistillations = [distillation, ...extraDistillations];
    expect(shouldPromoteToInstitutional(allDistillations, 5)).toBe(true);

    const knowledge = createInstitutionalKnowledge(
      "Router-v1 achieves 80% success rate with consistent latency profile",
      "composition_archetype",
      allDistillations,
    );
    expect(knowledge.stratum).toBe(4);
    expect(knowledge.contributingCount).toBe(6);
    expect(knowledge.confidence).toBeGreaterThan(0);
  });
});
