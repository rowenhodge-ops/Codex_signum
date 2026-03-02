/**
 * Spec Gap: Memory Model — Stratum Promotion Chain Has No Callers
 *
 * The 4-stratum memory model (Ephemeral → Observation → Distillation →
 * Institutional) is fully implemented as pure functions. But nobody wires
 * them into a live pipeline.
 *
 * Lean Process Maps §3.2: "Memory compaction reads Observation nodes →
 *   compacts old ones. Memory distillation reads compacted data →
 *   produces Stratum 3 profiles."
 *
 * CURRENT VIOLATION:
 *   11 memory functions have ZERO non-test callers:
 *   shouldDistill, distillObservations, createInstitutionalKnowledge,
 *   shouldPromoteToInstitutional, computeUpwardFlow, computeDownwardFlow,
 *   identifyCompactable, distillPerformanceProfile, distillRoutingHints,
 *   distillThresholdCalibration, writeObservation (!)
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

function hasNonTestCaller(funcName: string): boolean {
  const srcFiles = findTsFiles(SRC);
  const scriptFiles = findTsFiles(SCRIPTS);
  const allFiles = [...srcFiles, ...scriptFiles];

  for (const filePath of allFiles) {
    // Skip barrel re-exports and the defining file
    const basename = path.basename(filePath);
    if (basename === "index.ts") continue;

    const content = fs.readFileSync(filePath, "utf-8");
    // Check for actual function call (not just import or export)
    const callPattern = new RegExp(`${funcName}\\s*\\(`);
    const defPattern = new RegExp(
      `export\\s+(function|const|async\\s+function)\\s+${funcName}`,
    );

    if (callPattern.test(content) && !defPattern.test(content)) {
      return true;
    }
  }
  return false;
}

describe("Memory Model Spec Gap: Stratum 2→3 promotion is wired", () => {
  it("shouldDistill() has a non-test caller", () => {
    expect(hasNonTestCaller("shouldDistill")).toBe(true);
  });

  it("distillObservations() has a non-test caller", () => {
    expect(hasNonTestCaller("distillObservations")).toBe(true);
  });
});

describe("Memory Model Spec Gap: Stratum 3→4 promotion is wired", () => {
  it("createInstitutionalKnowledge() has a non-test caller", () => {
    expect(hasNonTestCaller("createInstitutionalKnowledge")).toBe(true);
  });

  it("shouldPromoteToInstitutional() has a non-test caller", () => {
    expect(hasNonTestCaller("shouldPromoteToInstitutional")).toBe(true);
  });
});

describe("Memory Model Spec Gap: Distillation functions are wired", () => {
  it("distillPerformanceProfile() has a non-test caller", () => {
    expect(hasNonTestCaller("distillPerformanceProfile")).toBe(true);
  });

  it("distillRoutingHints() has a non-test caller", () => {
    expect(hasNonTestCaller("distillRoutingHints")).toBe(true);
  });

  it("distillThresholdCalibration() has a non-test caller", () => {
    expect(hasNonTestCaller("distillThresholdCalibration")).toBe(true);
  });
});

describe("Memory Model Spec Gap: Memory flow coordination is wired", () => {
  it("computeUpwardFlow() has a non-test caller", () => {
    expect(hasNonTestCaller("computeUpwardFlow")).toBe(true);
  });

  it("computeDownwardFlow() has a non-test caller", () => {
    expect(hasNonTestCaller("computeDownwardFlow")).toBe(true);
  });
});

describe("Memory Model Spec Gap: Compaction is wired", () => {
  it("identifyCompactable() has a non-test caller", () => {
    // Lean Process Maps §3.2: "Memory compaction reads Observation nodes"
    expect(hasNonTestCaller("identifyCompactable")).toBe(true);
  });
});

describe("Memory Model Spec Gap: writeObservation is called by a pipeline", () => {
  it("writeObservation() has a non-test caller in src/ or scripts/", () => {
    // This is THE critical graph write path for observations.
    // Lean Process Maps §3.1: "graph-feeder calls conditionValue() inline"
    // writeObservation IS that inline path. But nobody calls it.
    expect(hasNonTestCaller("writeObservation")).toBe(true);
  });
});
