// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Tests for M-9.4: Graph-Backed Memory Operations
 *
 * Tests the bridge layer that wires pure memory functions to Neo4j.
 * These are structural/type-level tests — they do NOT require a Neo4j connection.
 * They verify:
 * - Function signatures and export completeness
 * - Pure function integration (identifyCompactable, shouldDistill, etc.)
 * - Result type shapes
 * - Non-fatal error handling patterns
 */
import { describe, it, expect, vi } from "vitest";

// ============ Graph query functions (Task 1+2) ============
import {
  getCompactableObservations,
  deleteObservations,
  getActiveDistillationIds,
  getObservationsForDistillation,
  createStructuredDistillation,
  getDistillationsForBloom,
  supersededDistillation,
} from "../../src/graph/queries.js";
import type { StructuredDistillationProps } from "../../src/graph/queries.js";

// ============ Graph-backed memory operations (Task 3) ============
import {
  runCompaction,
  checkAndDistill,
  processMemoryAfterExecution,
} from "../../src/memory/graph-operations.js";
import type {
  CompactionResult,
  DistillationResult,
  MemoryProcessingResult,
} from "../../src/memory/graph-operations.js";

// ============ Pure functions (verify they're still accessible) ============
import {
  identifyCompactable,
  computeObservationWeight,
  DEFAULT_COMPACTION_CONFIG,
} from "../../src/memory/compaction.js";
import {
  distillPerformanceProfile,
  distillRoutingHints,
  shouldDistill,
} from "../../src/memory/index.js";

// ============ GRAPH QUERY EXPORT TESTS ============

describe("M-9.4 graph query exports", () => {
  it("getCompactableObservations is exported as async function", () => {
    expect(typeof getCompactableObservations).toBe("function");
  });

  it("deleteObservations is exported as async function", () => {
    expect(typeof deleteObservations).toBe("function");
  });

  it("getActiveDistillationIds is exported as async function", () => {
    expect(typeof getActiveDistillationIds).toBe("function");
  });

  it("getObservationsForDistillation is exported as async function", () => {
    expect(typeof getObservationsForDistillation).toBe("function");
  });

  it("createStructuredDistillation is exported as async function", () => {
    expect(typeof createStructuredDistillation).toBe("function");
  });

  it("getDistillationsForBloom is exported as async function", () => {
    expect(typeof getDistillationsForBloom).toBe("function");
  });

  it("supersededDistillation is exported as async function", () => {
    expect(typeof supersededDistillation).toBe("function");
  });
});

// ============ GRAPH-BACKED MEMORY OPERATION EXPORT TESTS ============

describe("M-9.4 graph-backed memory operation exports", () => {
  it("runCompaction is exported as async function", () => {
    expect(typeof runCompaction).toBe("function");
  });

  it("checkAndDistill is exported as async function", () => {
    expect(typeof checkAndDistill).toBe("function");
  });

  it("processMemoryAfterExecution is exported as async function", () => {
    expect(typeof processMemoryAfterExecution).toBe("function");
  });

  // _resetExecutionCounter removed in M-10 (deprecated functions now throw)
});

// ============ BARREL EXPORT VERIFICATION ============

describe("M-9.4 barrel export verification", () => {
  it("memory/index.ts re-exports runCompaction", async () => {
    const memModule = await import("../../src/memory/index.js");
    expect(typeof memModule.runCompaction).toBe("function");
  });

  it("memory/index.ts re-exports checkAndDistill", async () => {
    const memModule = await import("../../src/memory/index.js");
    expect(typeof memModule.checkAndDistill).toBe("function");
  });

  it("memory/index.ts re-exports processMemoryAfterExecution", async () => {
    const memModule = await import("../../src/memory/index.js");
    expect(typeof memModule.processMemoryAfterExecution).toBe("function");
  });

  it("graph/index.ts re-exports getCompactableObservations", async () => {
    const graphModule = await import("../../src/graph/index.js");
    expect(typeof graphModule.getCompactableObservations).toBe("function");
  });

  it("graph/index.ts re-exports deleteObservations", async () => {
    const graphModule = await import("../../src/graph/index.js");
    expect(typeof graphModule.deleteObservations).toBe("function");
  });

  it("graph/index.ts re-exports getActiveDistillationIds", async () => {
    const graphModule = await import("../../src/graph/index.js");
    expect(typeof graphModule.getActiveDistillationIds).toBe("function");
  });

  it("graph/index.ts re-exports createStructuredDistillation", async () => {
    const graphModule = await import("../../src/graph/index.js");
    expect(typeof graphModule.createStructuredDistillation).toBe("function");
  });

  it("graph/index.ts re-exports getDistillationsForBloom", async () => {
    const graphModule = await import("../../src/graph/index.js");
    expect(typeof graphModule.getDistillationsForBloom).toBe("function");
  });

  it("graph/index.ts re-exports supersededDistillation", async () => {
    const graphModule = await import("../../src/graph/index.js");
    expect(typeof graphModule.supersededDistillation).toBe("function");
  });
});

// ============ StructuredDistillationProps TYPE TESTS ============

describe("StructuredDistillationProps shape", () => {
  it("accepts all required fields", () => {
    const props: StructuredDistillationProps = {
      id: "dist-001",
      bloomId: "bloom-001",
      confidence: 0.85,
      observationCount: 15,
      sourceObservationIds: ["obs-1", "obs-2", "obs-3"],
      insight: "Performance: ΦL=0.750 (stable), success=80%, n=15",
      meanPhiL: 0.75,
      phiLTrend: "stable",
      phiLVariance: 0.02,
      successRate: 0.8,
      windowStart: "2026-01-01T00:00:00.000Z",
      windowEnd: "2026-03-01T00:00:00.000Z",
      preferredModels: JSON.stringify([{ modelId: "claude-opus-4-6", successRate: 0.9 }]),
      avoidModels: JSON.stringify([]),
    };
    expect(props.bloomId).toBe("bloom-001");
    expect(props.meanPhiL).toBe(0.75);
  });
});

// ============ COMPACTION LOGIC TESTS (pure function integration) ============

describe("runCompaction — pure function integration", () => {
  it("identifyCompactable returns empty for recent observations", () => {
    const now = new Date();
    const observations = [
      {
        id: "obs-1",
        timestamp: new Date(now.getTime() - 1000), // 1 second ago
        signalProcessed: true,
        includedInDistillationIds: ["dist-1"],
      },
    ];
    const result = identifyCompactable(observations, new Set(), now);
    expect(result).toHaveLength(0);
  });

  it("identifyCompactable returns IDs for old, processed, distilled observations", () => {
    const now = new Date();
    const oldAge = 100 * 24 * 60 * 60 * 1000; // 100 days — past practical window (~93 days)
    const observations = [
      {
        id: "obs-old",
        timestamp: new Date(now.getTime() - oldAge),
        signalProcessed: true,
        includedInDistillationIds: ["dist-1"],
      },
    ];
    const result = identifyCompactable(observations, new Set(), now);
    expect(result).toContain("obs-old");
  });

  it("identifyCompactable preserves unprocessed signals", () => {
    const now = new Date();
    const oldAge = 100 * 24 * 60 * 60 * 1000;
    const observations = [
      {
        id: "obs-unprocessed",
        timestamp: new Date(now.getTime() - oldAge),
        signalProcessed: false, // NOT processed
        includedInDistillationIds: ["dist-1"],
      },
    ];
    const result = identifyCompactable(observations, new Set(), now);
    expect(result).not.toContain("obs-unprocessed");
  });

  it("identifyCompactable preserves observations never distilled", () => {
    const now = new Date();
    const oldAge = 100 * 24 * 60 * 60 * 1000;
    const observations = [
      {
        id: "obs-undistilled",
        timestamp: new Date(now.getTime() - oldAge),
        signalProcessed: true,
        includedInDistillationIds: [], // never distilled
      },
    ];
    const result = identifyCompactable(observations, new Set(), now);
    expect(result).not.toContain("obs-undistilled");
  });

  it("identifyCompactable respects batch size limit", () => {
    const now = new Date();
    const oldAge = 100 * 24 * 60 * 60 * 1000;
    const observations = Array.from({ length: 10 }, (_, i) => ({
      id: `obs-${i}`,
      timestamp: new Date(now.getTime() - oldAge),
      signalProcessed: true,
      includedInDistillationIds: ["dist-1"],
    }));
    const result = identifyCompactable(observations, new Set(), now, { batchSize: 5 });
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("computeObservationWeight returns 1.0 for zero age", () => {
    expect(computeObservationWeight(0, DEFAULT_COMPACTION_CONFIG.decayConstant)).toBe(1.0);
  });

  it("computeObservationWeight decays over 14-day half-life", () => {
    const halfLifeMs = 14 * 24 * 60 * 60 * 1000;
    const weight = computeObservationWeight(halfLifeMs, DEFAULT_COMPACTION_CONFIG.decayConstant);
    expect(weight).toBeCloseTo(0.5, 2);
  });
});

// ============ DISTILLATION LOGIC TESTS (pure function integration) ============

describe("checkAndDistill — pure function integration", () => {
  it("shouldDistill returns false when observation count < threshold", () => {
    const observations = Array.from({ length: 5 }, (_, i) => ({
      id: `obs-${i}`,
      stratum: 2 as const,
      timestamp: new Date(),
      sourceBloomId: "bloom-1",
      observationType: "execution_outcome" as const,
      data: { success: true, qualityScore: 0.8 },
    }));
    expect(shouldDistill(observations)).toBe(false);
  });

  it("shouldDistill returns true when observation count >= threshold", () => {
    const observations = Array.from({ length: 10 }, (_, i) => ({
      id: `obs-${i}`,
      stratum: 2 as const,
      timestamp: new Date(),
      sourceBloomId: "bloom-1",
      observationType: "execution_outcome" as const,
      data: { success: true, qualityScore: 0.8 },
    }));
    expect(shouldDistill(observations)).toBe(true);
  });

  it("distillPerformanceProfile produces valid profile from observations", () => {
    const observations = Array.from({ length: 10 }, (_, i) => ({
      timestamp: new Date(Date.now() - (10 - i) * 60000),
      phiL: 0.7 + i * 0.01,
      success: i < 8, // 80% success
      qualityScore: 0.7 + i * 0.02,
    }));
    const profile = distillPerformanceProfile("bloom-1", observations);
    expect(profile.componentId).toBe("bloom-1");
    expect(profile.observationCount).toBe(10);
    expect(profile.meanPhiL).toBeGreaterThan(0);
    expect(profile.successRate).toBeCloseTo(0.8, 1);
    expect(["improving", "stable", "declining"]).toContain(profile.phiLTrend);
  });

  it("distillRoutingHints produces model attribution from observations", () => {
    const observations = Array.from({ length: 10 }, (_, i) => ({
      modelId: i < 7 ? "claude-opus-4-6" : "claude-sonnet-4-6",
      success: true,
      qualityScore: 0.8,
    }));
    const hints = distillRoutingHints("bloom-1", observations);
    expect(hints.componentId).toBe("bloom-1");
    expect(hints.preferredModels.length).toBeGreaterThanOrEqual(0);
  });

  it("distillRoutingHints identifies avoid models with high failure rate", () => {
    const observations = [
      ...Array.from({ length: 8 }, () => ({
        modelId: "bad-model",
        success: false,
        qualityScore: 0.1,
      })),
      ...Array.from({ length: 2 }, () => ({
        modelId: "bad-model",
        success: true,
        qualityScore: 0.5,
      })),
    ];
    const hints = distillRoutingHints("bloom-1", observations, 5);
    expect(hints.avoidModels.some((m) => m.modelId === "bad-model")).toBe(true);
  });
});

// ============ RESULT TYPE SHAPE TESTS ============

describe("CompactionResult shape", () => {
  it("has required fields", () => {
    const result: CompactionResult = {
      observationsEvaluated: 50,
      observationsDeleted: 3,
    };
    expect(result.observationsEvaluated).toBe(50);
    expect(result.observationsDeleted).toBe(3);
    expect(result.error).toBeUndefined();
  });

  it("has optional error field", () => {
    const result: CompactionResult = {
      observationsEvaluated: 0,
      observationsDeleted: 0,
      error: "Neo4j connection failed",
    };
    expect(result.error).toBeDefined();
  });
});

describe("DistillationResult shape", () => {
  it("has all required fields", () => {
    const result: DistillationResult = {
      distillationId: "dist-001",
      observationCount: 15,
      performanceProfile: {
        componentId: "bloom-1",
        meanPhiL: 0.75,
        phiLTrend: "stable",
        phiLVariance: 0.02,
        commonFailureModes: [],
        successRate: 0.8,
        observationCount: 15,
        windowStart: new Date(),
        windowEnd: new Date(),
      },
      routingHints: {
        componentId: "bloom-1",
        preferredModels: [],
        avoidModels: [],
        contextSensitivities: [],
      },
      supersededDistillationIds: ["dist-old-1"],
    };
    expect(result.distillationId).toBe("dist-001");
    expect(result.performanceProfile.meanPhiL).toBe(0.75);
  });
});

describe("MemoryProcessingResult shape", () => {
  it("accepts null compaction and distillation", () => {
    const result: MemoryProcessingResult = {
      compaction: null,
      distillation: null,
    };
    expect(result.compaction).toBeNull();
    expect(result.distillation).toBeNull();
  });

  it("accepts populated compaction and null distillation", () => {
    const result: MemoryProcessingResult = {
      compaction: { observationsEvaluated: 10, observationsDeleted: 2 },
      distillation: null,
    };
    expect(result.compaction!.observationsDeleted).toBe(2);
  });

  it("accepts optional error field", () => {
    const result: MemoryProcessingResult = {
      compaction: null,
      distillation: null,
      error: "Graph unavailable",
    };
    expect(result.error).toBe("Graph unavailable");
  });
});

// ============ NON-FATAL ERROR HANDLING TESTS ============

describe("non-fatal error handling", () => {
  // These tests verify that the graph-backed functions handle errors gracefully
  // by mocking the underlying graph query functions to throw.

  // M-10: These functions are now deprecated and throw at runtime.
  // Tests verify the deprecated guards work correctly.

  it("runCompaction throws with deprecation message", async () => {
    await expect(runCompaction("bloom-nonexistent")).rejects.toThrow("[DEPRECATED]");
  });

  it("checkAndDistill throws with deprecation message", async () => {
    await expect(checkAndDistill("bloom-nonexistent")).rejects.toThrow("[DEPRECATED]");
  });

  it("processMemoryAfterExecution throws with deprecation message", async () => {
    await expect(
      processMemoryAfterExecution("bloom-nonexistent", {
        modelId: "test-model",
        success: true,
        durationMs: 1000,
      }),
    ).rejects.toThrow("[DEPRECATED]");
  });
});
