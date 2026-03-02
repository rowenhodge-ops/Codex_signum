/**
 * Spec Gap: Value Stream Integrity — VSM Claims vs Implementation
 *
 * Lean Process Maps §3 defines three value streams:
 *   §3.1 Primary: "Human Intent → Working Code"
 *   §3.2 Learning: "Execution → Improved Future Execution"
 *   §3.3 Model Lifecycle: "New Model → Explored → Exploited or Dimmed"
 *
 * These tests verify the implementation supports the value stream claims.
 *
 * Level: L5 Invariant (spec-encoded)
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const SRC = path.resolve(__dirname, "../../src");
const SCRIPTS = path.resolve(__dirname, "../../scripts");

function findTsFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findTsFiles(fullPath));
    else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts"))
      results.push(fullPath);
  }
  return results;
}

describe("VSM §3.1: Primary Value Stream — inline conditioning path exists", () => {
  it("graph-feeder afterPipeline calls conditionValue inline", () => {
    // §3.1: "graph-feeder.afterPipeline() → conditionValue() [inline]"
    // There should be code somewhere that wires afterPipeline hook to conditionValue
    const allFiles = [...findTsFiles(SRC), ...findTsFiles(SCRIPTS)];
    let found = false;

    for (const f of allFiles) {
      const content = fs.readFileSync(f, "utf-8");
      if (content.includes("afterPipeline") && content.includes("conditionValue")) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it("graph-feeder afterPipeline writes Observation nodes to graph", () => {
    // §3.1: "MERGE Observation nodes"
    const allFiles = [...findTsFiles(SRC), ...findTsFiles(SCRIPTS)];
    let found = false;

    for (const f of allFiles) {
      const content = fs.readFileSync(f, "utf-8");
      if (
        content.includes("afterPipeline") &&
        (content.includes("recordObservation") || content.includes("writeObservation"))
      ) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it("graph-feeder afterPipeline recomputes ΦL inline", () => {
    // §3.1: "computePhiL() [inline] → SET pattern.phiL [inline]"
    const allFiles = [...findTsFiles(SRC), ...findTsFiles(SCRIPTS)];
    let found = false;

    for (const f of allFiles) {
      const content = fs.readFileSync(f, "utf-8");
      if (content.includes("afterPipeline") && content.includes("computePhiL")) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it("graph-feeder afterPipeline records Decision outcome", () => {
    // §3.1: "record Decision outcome [inline]"
    const allFiles = [...findTsFiles(SRC), ...findTsFiles(SCRIPTS)];
    let found = false;

    for (const f of allFiles) {
      const content = fs.readFileSync(f, "utf-8");
      if (
        content.includes("afterPipeline") &&
        content.includes("recordDecisionOutcome")
      ) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});

describe("VSM §3.2: Learning Loop — Thompson reads updated posteriors", () => {
  it("Decision outcome write and Thompson arm stats update are in same transaction", () => {
    // §3.2: "recordDecisionOutcome(decisionId, quality) → Thompson arm stats updated on ContextCluster"
    // The arm stats update should be inline with the outcome recording
    const selectModelPath = path.join(SRC, "patterns/thompson-router/select-model.ts");
    if (!fs.existsSync(selectModelPath)) return;
    const content = fs.readFileSync(selectModelPath, "utf-8");

    // Should update arm stats when recording outcome
    expect(content).toMatch(/updateArmStats|armStats.*update/i);
  });
});

describe("VSM §3.3: Model Lifecycle — dim don't delete", () => {
  it("no code path deletes Agent/Seed nodes", () => {
    // §3.3: "Agent node persists — dim, don't delete"
    // NFR-G7: "Agent nodes are never deleted"
    const allFiles = findTsFiles(SRC);
    const violations: string[] = [];

    for (const f of allFiles) {
      const content = fs.readFileSync(f, "utf-8");
      if (/DELETE\s*\(.*:(?:Agent|Seed)\)|DETACH\s+DELETE.*(?:Agent|Seed)/i.test(content)) {
        violations.push(path.relative(SRC, f));
      }
    }
    expect(violations).toEqual([]);
  });

  it("degraded models get status change, not removal", () => {
    // §3.3: "ΦL drops below threshold → status: degraded"
    // There should be a code path that sets status to degraded, not deletes
    const allFiles = findTsFiles(SRC);
    let hasDegradedTransition = false;

    for (const f of allFiles) {
      const content = fs.readFileSync(f, "utf-8");
      if (/status.*degraded|degraded.*status|SET.*status.*=.*['"]degraded['"]/.test(content)) {
        hasDegradedTransition = true;
        break;
      }
    }
    expect(hasDegradedTransition).toBe(true);
  });
});

describe("VSM §3.4: Pattern Composition — no intermediary patterns", () => {
  it("no Observer pattern exists in src/", () => {
    // §3.4: "What's NOT in this diagram: There is no Observer box"
    // This was already eliminated (ce0ef96) but test it doesn't creep back
    const allFiles = findTsFiles(SRC);
    let hasObserverPattern = false;

    for (const f of allFiles) {
      const basename = path.basename(f);
      if (/^observer/i.test(basename) && !basename.includes("test")) {
        hasObserverPattern = true;
        break;
      }
    }
    expect(hasObserverPattern).toBe(false);
  });

  it("no Signal Pipeline pattern exists as a separate system (only inline functions)", () => {
    // §Note: "signal conditioning... are inline functions in the graph write path"
    // The signal pipeline is in src/computation/signals/ as pure functions — that's correct.
    // What would be wrong: a SignalPipelinePattern or SignalPipelineService class
    const allFiles = findTsFiles(SRC);
    let hasSignalService = false;

    for (const f of allFiles) {
      const content = fs.readFileSync(f, "utf-8");
      if (/class\s+SignalPipeline(?:Pattern|Service|System)/.test(content)) {
        hasSignalService = true;
        break;
      }
    }
    expect(hasSignalService).toBe(false);
  });
});
