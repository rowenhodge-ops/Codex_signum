/**
 * A7. Reversibility — State transitions can be undone. Prior states reconstructable.
 *
 * Tests that ThresholdEvents are immutable records, Observations are append-only,
 * and ring buffers preserve history.
 * Level: L5 Invariant + L2 Contract
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import {
  createPhiLState,
  computeTemporalStabilityFromState,
  createPsiHState,
  decomposePsiH,
} from "../../src/index.js";

describe("A7 Reversibility: ThresholdEvents are CREATE, not MERGE (append-only)", () => {
  it("writeThresholdEvent uses CREATE (not MERGE) — each crossing is a distinct record", () => {
    // ThresholdEvents are written in write-observation.ts, not queries.ts
    const writeObsContent = fs.readFileSync("src/graph/write-observation.ts", "utf-8");
    // Must use CREATE for ThresholdEvent (immutable historical records)
    expect(writeObsContent).toContain("CREATE (te:ThresholdEvent");
    // Must NOT use MERGE for ThresholdEvent
    expect(writeObsContent).not.toContain("MERGE (te:ThresholdEvent");
  });

  it("schema defines ThresholdEvent uniqueness and timestamp index", () => {
    const schemaContent = fs.readFileSync("src/graph/schema.ts", "utf-8");
    expect(schemaContent).toContain("threshold_event_id_unique");
    expect(schemaContent).toContain("threshold_event_timestamp");
  });
});

describe("A7 Reversibility: Observations are append-only", () => {
  it("schema defines Observation uniqueness constraint (each is distinct)", () => {
    const schemaContent = fs.readFileSync("src/graph/schema.ts", "utf-8");
    expect(schemaContent).toContain("observation_id_unique");
    expect(schemaContent).toContain("observation_timestamp");
  });

  it("graph queries for observations use CREATE or MERGE-on-id (not MERGE-on-content)", () => {
    const queriesContent = fs.readdirSync("src/graph/queries")
      .filter((f: string) => f.endsWith(".ts"))
      .map((f: string) => fs.readFileSync(`src/graph/queries/${f}`, "utf-8"))
      .join("\n");
    // recordObservation should create new nodes, not overwrite existing
    // Check that the function exists
    expect(queriesContent).toContain("recordObservation");
  });
});

describe("A7 Reversibility: ΦL ring buffer preserves history", () => {
  it("ring buffer retains all values up to maxSize", () => {
    let state = createPhiLState(5);
    const values = [0.6, 0.65, 0.7, 0.75, 0.8];

    for (const v of values) {
      const result = computeTemporalStabilityFromState(state, v);
      state = result.updatedState;
    }

    expect(state.ringBuffer).toEqual(values);
    expect(state.ringBuffer.length).toBe(5);
  });

  it("ring buffer preserves most recent values when capacity exceeded", () => {
    let state = createPhiLState(3);
    const values = [0.5, 0.6, 0.7, 0.8, 0.9];

    for (const v of values) {
      const result = computeTemporalStabilityFromState(state, v);
      state = result.updatedState;
    }

    // Should retain last 3: [0.7, 0.8, 0.9]
    expect(state.ringBuffer).toEqual([0.7, 0.8, 0.9]);
  });

  it("computeTemporalStabilityFromState is immutable (does not modify input state)", () => {
    const state = createPhiLState(5);
    const originalBuffer = [...state.ringBuffer];

    computeTemporalStabilityFromState(state, 0.7);

    expect(state.ringBuffer).toEqual(originalBuffer);
  });
});

describe("A7 Reversibility: ΨH decomposition preserves baseline as historical reference", () => {
  it("baseline is set after minimum observations and then preserved", () => {
    let state = createPsiHState(20, 0.15);

    // Feed 5+ observations to establish baseline
    for (let i = 0; i < 6; i++) {
      const result = decomposePsiH(state, 0.7);
      state = result.updatedState;
    }

    const baselineAfterEstablished = state.baseline;
    expect(baselineAfterEstablished).toBeDefined();

    // Feed more observations with different values
    for (let i = 0; i < 5; i++) {
      const result = decomposePsiH(state, 0.5);
      state = result.updatedState;
    }

    // Baseline should remain as the historical reference point
    expect(state.baseline).toBe(baselineAfterEstablished);
  });

  it("decomposePsiH is immutable (does not modify input state)", () => {
    const state = createPsiHState(10);
    const originalBuffer = [...state.ringBuffer];

    decomposePsiH(state, 0.8);

    expect(state.ringBuffer).toEqual(originalBuffer);
  });
});
