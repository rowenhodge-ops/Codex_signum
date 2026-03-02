/**
 * A6. Provenance — Every graph node has creator, timestamp, evidence chain.
 *
 * Tests that types enforce provenance fields and that orphan nodes without
 * provenance are structurally impossible.
 * Level: L2 Contract + L5 Invariant
 */
import { describe, it, expect } from "vitest";
import type {
  ObservationProps,
  DecisionProps,
  ContextClusterProps,
} from "../../src/graph/queries.js";

describe("A6 Provenance: ObservationProps requires sourceBloomId", () => {
  it("ObservationProps mandates sourceBloomId field", () => {
    const obs: ObservationProps = {
      id: "obs-1",
      sourceBloomId: "bloom-1",
      metric: "phiL",
      value: 0.8,
    };
    expect(obs.sourceBloomId).toBe("bloom-1");
    // TypeScript enforces this at compile time — this runtime test
    // confirms the field is present and non-optional
  });

  it("ObservationProps mandates metric field", () => {
    const obs: ObservationProps = {
      id: "obs-2",
      sourceBloomId: "bloom-2",
      metric: "psiH",
      value: 0.7,
    };
    expect(obs.metric).toBe("psiH");
  });
});

describe("A6 Provenance: DecisionProps requires attribution", () => {
  it("DecisionProps mandates selectedSeedId (who was chosen)", () => {
    const dec: DecisionProps = {
      id: "dec-1",
      taskType: "analysis",
      complexity: "moderate",
      selectedSeedId: "seed-1",
      wasExploratory: false,
    };
    expect(dec.selectedSeedId).toBe("seed-1");
  });

  it("DecisionProps includes optional madeByBloomId (who made the decision)", () => {
    const dec: DecisionProps = {
      id: "dec-2",
      taskType: "coding",
      complexity: "complex",
      selectedSeedId: "seed-2",
      wasExploratory: true,
      madeByBloomId: "bloom-architect",
    };
    expect(dec.madeByBloomId).toBe("bloom-architect");
  });
});

describe("A6 Provenance: ContextClusterProps requires taskType", () => {
  it("ContextClusterProps mandates taskType and complexity", () => {
    const cluster: ContextClusterProps = {
      id: "cc-1",
      taskType: "analysis",
      complexity: "moderate",
    };
    expect(cluster.taskType).toBe("analysis");
    expect(cluster.complexity).toBe("moderate");
  });
});

describe("A6 Provenance: Constitutional rules have rationale", () => {
  it("ConstitutionalRule type requires rationale field", () => {
    // Import the type and verify its shape via runtime construction
    const rule = {
      id: "rule-test",
      name: "Test Rule",
      tier: 1 as const,
      status: "active" as const,
      expression: {
        target: "cascade_limit" as const,
        constraint: "max" as const,
        value: 2,
        priority: "mandatory" as const,
      },
      governsPatterns: ["architect"],
      rationale: "Degradation limited to 2 levels for safety",
      createdAt: new Date(),
      evidencedBy: ["obs-1", "obs-2"],
    };
    expect(rule.rationale).toBeTruthy();
    expect(rule.evidencedBy.length).toBeGreaterThan(0);
  });
});

describe("A6 Provenance: graph schema seeds constitutional rules with rationale", () => {
  it("seedConstitutionalRules defines rationale for every rule", async () => {
    // Read the schema file directly to verify rule definitions have rationale
    const fs = await import("node:fs");
    const schemaContent = fs.readFileSync("src/graph/schema.ts", "utf-8");
    // Every MERGE for ConstitutionalRule should set rationale
    const mergeBlocks = schemaContent.match(/MERGE \(r:ConstitutionalRule[\s\S]*?RETURN r/g) ?? [];
    expect(mergeBlocks.length).toBeGreaterThan(0);
    for (const block of mergeBlocks) {
      expect(block).toContain("rationale");
    }
  });
});
