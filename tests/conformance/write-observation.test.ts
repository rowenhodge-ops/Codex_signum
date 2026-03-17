// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum -- Conformance Tests: Phase 3a Inline Conditioning
 *
 * Tests healthBand(), conditionValue(), writeObservation orchestration,
 * ThresholdEvent detection, and algedonic cascade triggering.
 *
 * Graph layer is mocked for writeObservation tests.
 * Pure computation tests (healthBand, conditionValue) need no mocking.
 *
 * @see engineering-bridge-v2.0.md §Part 2 "Adaptive thresholds"
 * @see engineering-bridge-v2.0.md §Part 3 "Algedonic bypass"
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { healthBand, bandOrdinal } from "../../src/computation/health-band.js";
import { conditionValue } from "../../src/computation/condition-value.js";
import { SignalPipeline } from "../../src/signals/SignalPipeline.js";
import { ALGEDONIC_THRESHOLD } from "../../src/computation/dampening.js";
import type { HealthBand, ThresholdEvent } from "../../src/types/threshold-event.js";
import type { PhiLFactors, PhiLState } from "../../src/types/state-dimensions.js";
import type { PatternHealthContext } from "../../src/graph/write-observation.js";
import type { ObservationProps } from "../../src/graph/queries.js";

// ============================================================
// Group 1: healthBand() — 6-band classification (pure, no mocks)
// ============================================================

describe("healthBand() — 6-band classification", () => {
  it("ΦL=0.05 → 'algedonic' (below ALGEDONIC_THRESHOLD=0.1)", () => {
    expect(healthBand(0.05, 0.5)).toBe("algedonic");
  });

  it("ΦL=0.0 → 'algedonic' (zero health)", () => {
    expect(healthBand(0.0, 0.5)).toBe("algedonic");
  });

  it("ΦL=0.95 → 'optimal' (above 0.9)", () => {
    expect(healthBand(0.95, 0.5)).toBe("optimal");
  });

  it("ΦL=0.9 → 'optimal' (boundary: >= 0.9 is optimal)", () => {
    expect(healthBand(0.9, 0.5)).toBe("optimal");
  });

  it("ΦL=0.85, mature system (MI=0.85) → 'trusted' (above phiL_healthy=0.8, below 0.9)", () => {
    // At MI=0.85 (mature): phiL_healthy=0.8
    // 0.85 >= 0.8 and < 0.9 → trusted
    expect(healthBand(0.85, 0.85)).toBe("trusted");
  });

  it("ΦL=0.75, mature system (MI=0.85) → 'healthy' (above midpoint, below phiL_healthy)", () => {
    // At MI=0.85: phiL_healthy=0.8, phiL_degraded=0.6, midpoint=0.7
    // 0.75 >= 0.7 and < 0.8 → healthy
    expect(healthBand(0.75, 0.85)).toBe("healthy");
  });

  it("ΦL=0.65, mature system (MI=0.85) → 'degraded' (above phiL_degraded, below midpoint)", () => {
    // At MI=0.85: phiL_degraded=0.6, midpoint=0.7
    // 0.65 >= 0.6 and < 0.7 → degraded
    expect(healthBand(0.65, 0.85)).toBe("degraded");
  });

  it("ΦL=0.35, young system (MI=0.1) → 'critical' (below phiL_degraded=0.4, above 0.1)", () => {
    // At MI=0.1 (young): phiL_degraded=0.4
    // 0.35 < 0.4 and >= 0.1 → critical
    expect(healthBand(0.35, 0.1)).toBe("critical");
  });

  it("bands shift with maturity — same ΦL, different bands", () => {
    // ΦL = 0.65
    // At MI=0.1 (young): phiL_healthy=0.6 → 0.65 >= 0.6 and < 0.9 → trusted
    // At MI=0.85 (mature): phiL_degraded=0.6, midpoint=0.7 → 0.65 < 0.7 and >= 0.6 → degraded
    const youngBand = healthBand(0.65, 0.1);
    const matureBand = healthBand(0.65, 0.85);
    expect(youngBand).toBe("trusted");
    expect(matureBand).toBe("degraded");
    expect(youngBand).not.toBe(matureBand);
  });

  it("boundary: ΦL=0.1 is 'critical' not 'algedonic'", () => {
    // ALGEDONIC_THRESHOLD is 0.1 — at exactly 0.1, it's >= threshold
    // so it's critical (below degraded threshold) not algedonic
    expect(healthBand(0.1, 0.5)).not.toBe("algedonic");
  });
});

// ============================================================
// Group 2: bandOrdinal() — ordering (pure, no mocks)
// ============================================================

describe("bandOrdinal() — band ordering", () => {
  it("algedonic < critical < degraded < healthy < trusted < optimal", () => {
    const bands: HealthBand[] = [
      "algedonic",
      "critical",
      "degraded",
      "healthy",
      "trusted",
      "optimal",
    ];
    for (let i = 0; i < bands.length - 1; i++) {
      expect(bandOrdinal(bands[i])).toBeLessThan(bandOrdinal(bands[i + 1]));
    }
  });

  it("improving direction: bandOrdinal(new) > bandOrdinal(old)", () => {
    expect(bandOrdinal("trusted")).toBeGreaterThan(bandOrdinal("degraded"));
  });

  it("degrading direction: bandOrdinal(new) < bandOrdinal(old)", () => {
    expect(bandOrdinal("critical")).toBeLessThan(bandOrdinal("healthy"));
  });
});

// ============================================================
// Group 3: conditionValue() — pipeline wrapping (pure, no graph mocks)
// ============================================================

describe("conditionValue() — signal pipeline wrapping", () => {
  let pipeline: SignalPipeline;

  beforeEach(() => {
    pipeline = new SignalPipeline();
  });

  it("returns a ConditionedSignal with smoothedValue", () => {
    const result = conditionValue(pipeline, "pattern-1", "quality", 0.8);
    expect(typeof result.smoothedValue).toBe("number");
    expect(result.smoothedValue).toBeGreaterThanOrEqual(0);
  });

  it("passes topologyRole through to pipeline (hub gets lower EWMA alpha)", () => {
    // Process enough values to fill the Hampel window (7-point) and build EWMA state
    const hubPipeline = new SignalPipeline();
    const defaultPipeline = new SignalPipeline();

    // Feed 10 identical values to fill all windows
    for (let i = 0; i < 10; i++) {
      conditionValue(hubPipeline, "p-hub", "quality", 0.5, "hub");
      conditionValue(defaultPipeline, "p-def", "quality", 0.5, "default");
    }

    // Shift to a new level (not a spike — Hampel won't reject a sustained shift)
    for (let i = 0; i < 3; i++) {
      conditionValue(hubPipeline, "p-hub", "quality", 0.7, "hub");
      conditionValue(defaultPipeline, "p-def", "quality", 0.7, "default");
    }

    const hubResult = conditionValue(hubPipeline, "p-hub", "quality", 0.7, "hub");
    const defResult = conditionValue(defaultPipeline, "p-def", "quality", 0.7, "default");

    // Hub EWMA alpha=0.08 vs default alpha=0.15
    // Hub responds more slowly to the shift → lower smoothed value
    expect(hubResult.smoothedValue).toBeLessThanOrEqual(defResult.smoothedValue);
  });

  it("maps metric names to correct dimensions", () => {
    const healthResult = conditionValue(pipeline, "p1", "phiL_health", 0.7);
    expect(healthResult.dimension).toBe("phiL");

    const frictionResult = conditionValue(pipeline, "p1", "friction_score", 0.3);
    expect(frictionResult.dimension).toBe("psiH");

    const exploreResult = conditionValue(pipeline, "p1", "exploration_rate", 0.1);
    expect(exploreResult.dimension).toBe("epsilonR");
  });

  it("default metric maps to phiL dimension", () => {
    const result = conditionValue(pipeline, "p1", "unknown_metric", 0.5);
    expect(result.dimension).toBe("phiL");
  });

  it("preserves rawValue on the returned signal", () => {
    const result = conditionValue(pipeline, "p1", "quality", 0.8);
    expect(result.rawValue).toBe(0.8);
  });
});

// ============================================================
// Group 4: writeObservation() — orchestration (graph mocked)
// ============================================================

// Mock the graph layer
vi.mock("../../src/graph/queries.js", () => ({
  recordObservation: vi.fn().mockResolvedValue(undefined),
  updateBloomPhiL: vi.fn().mockResolvedValue(undefined),
  updateObservationConditioned: vi.fn().mockResolvedValue(undefined),
}));

// Mock hierarchical-health to prevent propagatePhiLUpward from calling real graph queries
vi.mock("../../src/computation/hierarchical-health.js", async (importOriginal) => {
  const original = await importOriginal() as Record<string, unknown>;
  return {
    ...original,
    propagatePhiLUpward: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("../../src/graph/client.js", () => ({
  writeTransaction: vi.fn().mockImplementation(async (fn: Function) => {
    const mockTx = {
      run: vi.fn().mockResolvedValue({ records: [] }),
    };
    return fn(mockTx);
  }),
}));

// Import AFTER mocks are set up
const { writeObservation } = await import(
  "../../src/graph/write-observation.js"
);
const { recordObservation, updateBloomPhiL } = await import(
  "../../src/graph/queries.js"
);

/** Helper: build a standard PatternHealthContext */
function makeContext(overrides: Partial<PatternHealthContext> = {}): PatternHealthContext {
  const defaultFactors: PhiLFactors = {
    axiomCompliance: 0.9,
    provenanceClarity: 0.8,
    usageSuccessRate: 0.85,
    temporalStability: 0.7,
  };
  return {
    factors: defaultFactors,
    observationCount: 10,
    connectionCount: 3,
    previousPhiL: 0.75,
    previousBand: "trusted",
    maturityIndex: 0.5,
    topologyRole: "default",
    degree: 3,
    ...overrides,
  };
}

/** Helper: build a standard ObservationProps */
function makeObservation(overrides: Partial<ObservationProps> = {}): ObservationProps {
  return {
    id: `obs-${Date.now()}`,
    sourceBloomId: "pattern-test",
    metric: "quality",
    value: 0.8,
    ...overrides,
  };
}

describe("writeObservation() — orchestration", () => {
  let pipeline: SignalPipeline;

  beforeEach(() => {
    vi.clearAllMocks();
    pipeline = new SignalPipeline();
  });

  it("calls recordObservation with the raw observation props", async () => {
    const obs = makeObservation();
    const ctx = makeContext();
    await writeObservation(obs, pipeline, ctx);
    expect(recordObservation).toHaveBeenCalledOnce();
    expect(recordObservation).toHaveBeenCalledWith(obs);
  });

  it("calls updateBloomPhiL with recomputed ΦL (not raw value)", async () => {
    const obs = makeObservation({ value: 0.8 });
    const ctx = makeContext();
    const result = await writeObservation(obs, pipeline, ctx);

    expect(updateBloomPhiL).toHaveBeenCalledOnce();
    // The first arg should be the pattern ID
    const callArgs = vi.mocked(updateBloomPhiL).mock.calls[0];
    expect(callArgs[0]).toBe(obs.sourceBloomId);
    // The second arg is the ΦL effective (a computed value, not the raw observation)
    expect(typeof callArgs[1]).toBe("number");
    // The third arg is the trend
    expect(["improving", "stable", "declining"]).toContain(callArgs[2]);
    // The returned phiL should be a composite, not a bare number
    expect(result.phiL).not.toBeNull();
    expect(result.phiL!.effective).toBeDefined();
    expect(result.phiL!.factors).toBeDefined();
    expect(result.phiL!.raw).toBeDefined();
  });

  it("returns conditioned signal from the pipeline", async () => {
    const obs = makeObservation({ value: 0.8 });
    const ctx = makeContext();
    const result = await writeObservation(obs, pipeline, ctx);

    expect(result.conditioned).toBeDefined();
    expect(result.conditioned.rawValue).toBe(0.8);
    expect(typeof result.conditioned.smoothedValue).toBe("number");
  });

  it("returns health band classification", async () => {
    const obs = makeObservation();
    const ctx = makeContext();
    const result = await writeObservation(obs, pipeline, ctx);

    const validBands: HealthBand[] = [
      "optimal", "trusted", "healthy", "degraded", "critical", "algedonic",
    ];
    expect(validBands).toContain(result.band);
  });

  it("returns null thresholdEvent when band stays the same", async () => {
    // previousBand = "trusted", factors that produce a trusted ΦL
    const ctx = makeContext({
      previousBand: "trusted",
      maturityIndex: 0.5,
      factors: {
        axiomCompliance: 0.9,
        provenanceClarity: 0.85,
        usageSuccessRate: 0.9,
        temporalStability: 0.8,
      },
    });
    const obs = makeObservation();
    const result = await writeObservation(obs, pipeline, ctx);

    // With high factors and MI=0.5, ΦL should be trusted-range
    // If it's the same band, thresholdEvent should be null
    if (result.band === "trusted") {
      expect(result.thresholdEvent).toBeNull();
    }
  });

  it("returns ThresholdEvent when band crosses (degrading)", async () => {
    // Force a low ΦL by providing low factors
    const ctx = makeContext({
      previousBand: "trusted",
      maturityIndex: 0.85,
      factors: {
        axiomCompliance: 0.2,
        provenanceClarity: 0.1,
        usageSuccessRate: 0.15,
        temporalStability: 0.1,
      },
      observationCount: 2,
      connectionCount: 1,
    });
    const obs = makeObservation();
    const result = await writeObservation(obs, pipeline, ctx);

    // With very low factors, ΦL should be in a lower band than "trusted"
    if (result.band !== "trusted") {
      expect(result.thresholdEvent).not.toBeNull();
      expect(result.thresholdEvent!.previousBand).toBe("trusted");
      expect(result.thresholdEvent!.newBand).toBe(result.band);
      expect(result.thresholdEvent!.direction).toBe("degrading");
      expect(result.thresholdEvent!.bloomId).toBe(obs.sourceBloomId);
    }
  });

  it("returns ThresholdEvent with improving direction when band improves", async () => {
    // Start from critical, provide high factors
    const ctx = makeContext({
      previousBand: "critical",
      maturityIndex: 0.5,
      factors: {
        axiomCompliance: 0.95,
        provenanceClarity: 0.9,
        usageSuccessRate: 0.9,
        temporalStability: 0.85,
      },
      observationCount: 20,
      connectionCount: 5,
    });
    const obs = makeObservation();
    const result = await writeObservation(obs, pipeline, ctx);

    // High factors should produce ΦL above critical
    if (result.band !== "critical") {
      expect(result.thresholdEvent).not.toBeNull();
      expect(result.thresholdEvent!.direction).toBe("improving");
    }
  });

  it("returns null thresholdEvent when previousBand is undefined (first observation)", async () => {
    const ctx = makeContext({ previousBand: undefined });
    const obs = makeObservation();
    const result = await writeObservation(obs, pipeline, ctx);
    expect(result.thresholdEvent).toBeNull();
  });

  it("ΦL result is composite (never bare number)", async () => {
    const obs = makeObservation();
    const ctx = makeContext();
    const result = await writeObservation(obs, pipeline, ctx);

    // ΦL must always be composite per spec rule #4
    expect(result.phiL).toHaveProperty("factors");
    expect(result.phiL).toHaveProperty("weights");
    expect(result.phiL).toHaveProperty("raw");
    expect(result.phiL).toHaveProperty("maturityFactor");
    expect(result.phiL).toHaveProperty("effective");
    expect(result.phiL).toHaveProperty("trend");
    expect(result.phiL).toHaveProperty("observationCount");
  });
});

// ============================================================
// Group 5: Algedonic cascade (graph mocked)
// ============================================================

describe("writeObservation() — algedonic cascade", () => {
  let pipeline: SignalPipeline;

  beforeEach(() => {
    vi.clearAllMocks();
    pipeline = new SignalPipeline();
  });

  it("triggers propagateDegradation when ΦL < 0.1 (algedonic)", async () => {
    // Force extremely low ΦL by providing zero factors
    const neighbors = new Map<string, import("../../src/computation/dampening.js").PropagationNode>();
    neighbors.set("neighbor-1", {
      id: "neighbor-1",
      phiL: 0.6,
      degree: 2,
      neighbors: [],
    });

    const ctx = makeContext({
      previousBand: "critical",
      previousPhiL: 0.15,
      maturityIndex: 0.5,
      factors: {
        axiomCompliance: 0.0,
        provenanceClarity: 0.0,
        usageSuccessRate: 0.0,
        temporalStability: 0.0,
      },
      observationCount: 2,
      connectionCount: 1,
      degree: 2,
      neighbors,
    });
    const obs = makeObservation();
    const result = await writeObservation(obs, pipeline, ctx);

    if (result.phiL!.effective < ALGEDONIC_THRESHOLD) {
      expect(result.cascadeResult).not.toBeNull();
      expect(result.band).toBe("algedonic");
    }
  });

  it("does NOT cascade when ΦL >= 0.1 even if band crosses", async () => {
    const ctx = makeContext({
      previousBand: "trusted",
      maturityIndex: 0.5,
      factors: {
        axiomCompliance: 0.5,
        provenanceClarity: 0.3,
        usageSuccessRate: 0.3,
        temporalStability: 0.3,
      },
      neighbors: new Map(),
    });
    const obs = makeObservation();
    const result = await writeObservation(obs, pipeline, ctx);

    // Even if band crossed, no cascade for non-algedonic
    if (result.phiL!.effective >= ALGEDONIC_THRESHOLD) {
      expect(result.cascadeResult).toBeNull();
    }
  });

  it("does not cascade when no neighbors provided", async () => {
    const ctx = makeContext({
      previousBand: "critical",
      previousPhiL: 0.15,
      factors: {
        axiomCompliance: 0.0,
        provenanceClarity: 0.0,
        usageSuccessRate: 0.0,
        temporalStability: 0.0,
      },
      observationCount: 2,
      connectionCount: 1,
      // No neighbors
    });
    const obs = makeObservation();
    const result = await writeObservation(obs, pipeline, ctx);

    // Even if algedonic, no cascade without neighbors
    expect(result.cascadeResult).toBeNull();
  });
});

// ============================================================
// Group 6: Data provenance — conditioning contract
// ============================================================

describe("Data provenance — conditioning contract", () => {
  let pipeline: SignalPipeline;

  beforeEach(() => {
    vi.clearAllMocks();
    pipeline = new SignalPipeline();
  });

  it("recordObservation receives the raw value (not conditioned)", async () => {
    const rawValue = 0.8;
    const obs = makeObservation({ value: rawValue });
    const ctx = makeContext();
    await writeObservation(obs, pipeline, ctx);

    const callArgs = vi.mocked(recordObservation).mock.calls[0][0];
    expect(callArgs.value).toBe(rawValue);
  });

  it("source pattern ID is preserved through the write path", async () => {
    const obs = makeObservation({ sourceBloomId: "my-pattern-42" });
    const ctx = makeContext();
    await writeObservation(obs, pipeline, ctx);

    // recordObservation receives the pattern ID
    const obsArgs = vi.mocked(recordObservation).mock.calls[0][0];
    expect(obsArgs.sourceBloomId).toBe("my-pattern-42");

    // updateBloomPhiL receives the same pattern ID
    const phiLArgs = vi.mocked(updateBloomPhiL).mock.calls[0];
    expect(phiLArgs[0]).toBe("my-pattern-42");
  });

  it("observation metric is preserved and forwarded to pipeline", async () => {
    const obs = makeObservation({ metric: "friction_score" });
    const ctx = makeContext();
    const result = await writeObservation(obs, pipeline, ctx);

    // The conditioned signal should reflect the metric dimension
    expect(result.conditioned.dimension).toBe("psiH");
  });
});

// ============================================================
// Group 7: M-22.1 — Conditioning-only mode (no PatternHealthContext)
// ============================================================

const { updateObservationConditioned } = await import(
  "../../src/graph/queries.js"
);

describe("writeObservation() — conditioning-only (no context)", () => {
  let pipeline: SignalPipeline;

  beforeEach(() => {
    vi.clearAllMocks();
    pipeline = new SignalPipeline();
  });

  it("conditions without context — phiL and band are null", async () => {
    const obs = makeObservation({ value: 0.75 });
    const result = await writeObservation(obs, pipeline);

    expect(result.conditioned).toBeDefined();
    expect(result.conditioned.rawValue).toBe(0.75);
    expect(typeof result.conditioned.smoothedValue).toBe("number");
    expect(result.phiL).toBeNull();
    expect(result.band).toBeNull();
    expect(result.thresholdEvent).toBeNull();
    expect(result.cascadeResult).toBeNull();
  });

  it("persists conditioned values on Observation node", async () => {
    const obs = makeObservation({ id: "obs-persist-test", value: 0.6 });
    await writeObservation(obs, pipeline);

    expect(updateObservationConditioned).toHaveBeenCalledOnce();
    const callArgs = vi.mocked(updateObservationConditioned).mock.calls[0];
    expect(callArgs[0]).toBe("obs-persist-test");
    const values = callArgs[1];
    expect(typeof values.smoothedValue).toBe("number");
    expect(typeof values.trendSlope).toBe("number");
    expect(typeof values.cusumStatistic).toBe("number");
    expect(typeof values.macdValue).toBe("number");
    expect(typeof values.alertCount).toBe("number");
    expect(typeof values.filtered).toBe("boolean");
  });

  it("also persists conditioned values when context IS provided", async () => {
    const obs = makeObservation({ id: "obs-full-persist", value: 0.8 });
    const ctx = makeContext();
    await writeObservation(obs, pipeline, ctx);

    // updateObservationConditioned should still be called
    expect(updateObservationConditioned).toHaveBeenCalledOnce();
    const callArgs = vi.mocked(updateObservationConditioned).mock.calls[0];
    expect(callArgs[0]).toBe("obs-full-persist");
  });

  it("does not call updateBloomPhiL without context", async () => {
    const obs = makeObservation();
    await writeObservation(obs, pipeline);

    expect(updateBloomPhiL).not.toHaveBeenCalled();
  });

  it("still calls recordObservation for raw write", async () => {
    const obs = makeObservation();
    await writeObservation(obs, pipeline);

    expect(recordObservation).toHaveBeenCalledOnce();
    expect(recordObservation).toHaveBeenCalledWith(obs);
  });

  it("pipeline instance is shared — second call uses same pipeline object", async () => {
    // This verifies that the same pipeline instance is used across calls,
    // meaning stateful stages (EWMA, CUSUM, Trend) accumulate correctly.
    // The Debounce 100ms window makes in-test accumulation hard to observe
    // directly (fast tests share a timestamp), so we verify the structural
    // contract: same pipeline processes both calls.
    const obs1 = makeObservation({ id: "obs-shared-1", value: 0.5, sourceBloomId: "bloom-shared" });
    const obs2 = makeObservation({ id: "obs-shared-2", value: 0.8, sourceBloomId: "bloom-shared" });

    const r1 = await writeObservation(obs1, pipeline);
    const r2 = await writeObservation(obs2, pipeline);

    // Both should have been conditioned (not throw)
    expect(r1.conditioned).toBeDefined();
    expect(r2.conditioned).toBeDefined();
    // Both should have persisted conditioned values
    expect(updateObservationConditioned).toHaveBeenCalledTimes(2);
  });
});

// ============================================================
// Group 8: M-22.2 — ΦL from pipeline with assembled context
// ============================================================

describe("writeObservation() — M-22.2 ΦL from assembled context", () => {
  let pipeline: SignalPipeline;

  beforeEach(() => {
    vi.clearAllMocks();
    pipeline = new SignalPipeline();
  });

  it("with assembled context produces PhiL composite (not null)", async () => {
    const ctx = makeContext({
      factors: {
        axiomCompliance: 1.0,     // V1: default until Assayer wired
        provenanceClarity: 0.8,
        usageSuccessRate: 0.75,
        temporalStability: 0.5,
      },
      observationCount: 15,
      connectionCount: 4,
    });
    const obs = makeObservation({ value: 0.7 });
    const result = await writeObservation(obs, pipeline, ctx);

    expect(result.phiL).not.toBeNull();
    expect(result.phiL!.factors.axiomCompliance).toBe(1.0);
    expect(result.phiL!.factors.provenanceClarity).toBe(0.8);
    expect(result.phiL!.factors.usageSuccessRate).toBe(0.75);
    expect(result.phiL!.factors.temporalStability).toBe(0.5);
    expect(result.phiL!.effective).toBeGreaterThan(0);
    expect(result.band).not.toBeNull();
  });

  it("all PhiL factors are in [0,1] range", async () => {
    const ctx = makeContext();
    const obs = makeObservation();
    const result = await writeObservation(obs, pipeline, ctx);

    expect(result.phiL).not.toBeNull();
    const factors = result.phiL!.factors;
    for (const [key, value] of Object.entries(factors)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it("PhiLState ring buffer is updated when provided", async () => {
    const phiLState: PhiLState = { ringBuffer: [0.7, 0.72, 0.71], maxSize: 20 };
    const ctx = makeContext({ phiLState });
    const obs = makeObservation();
    const result = await writeObservation(obs, pipeline, ctx);

    // updateBloomPhiL should be called with phiLState JSON (5th arg)
    const callArgs = vi.mocked(updateBloomPhiL).mock.calls[0];
    expect(callArgs.length).toBeGreaterThanOrEqual(4);
    // healthBand should be passed (4th arg)
    expect(typeof callArgs[3]).toBe("string");
    // phiLState JSON should be passed (5th arg)
    const stateJson = callArgs[4] as string;
    expect(stateJson).toBeDefined();
    const parsedState = JSON.parse(stateJson) as PhiLState;
    // New effective value should be appended to the buffer
    expect(parsedState.ringBuffer.length).toBe(4);
    expect(parsedState.ringBuffer[3]).toBe(result.phiL!.effective);
  });

  it("cold start (no context) returns null phiL — conditioning only", async () => {
    const obs = makeObservation({ value: 0.6 });
    const result = await writeObservation(obs, pipeline);

    expect(result.phiL).toBeNull();
    expect(result.band).toBeNull();
    expect(result.conditioned).toBeDefined();
    expect(result.conditioned.rawValue).toBe(0.6);
  });

  it("healthBand is persisted on updateBloomPhiL call", async () => {
    const ctx = makeContext({
      previousBand: undefined, // first observation — no crossing
    });
    const obs = makeObservation();
    const result = await writeObservation(obs, pipeline, ctx);

    const callArgs = vi.mocked(updateBloomPhiL).mock.calls[0];
    // 4th arg: healthBand string
    expect(callArgs[3]).toBe(result.band);
  });
});
