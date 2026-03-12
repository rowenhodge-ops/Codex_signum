// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * L2 Contract — Instantiation Protocol (M-16.4)
 *
 * Tests the three governance Resonator functions:
 * - instantiateMorpheme() — morpheme creation with CONTAINS + INSTANTIATES
 * - updateMorpheme()      — morpheme mutation with property preservation
 * - createLine()          — Line creation with endpoint validation
 *
 * Graph layer is mocked. These verify protocol logic, not Neo4j connectivity.
 *
 * @see docs/specs/instantiation-mutation-resonator-design.md
 * @see docs/specs/cs-v5.0.md §Constitutional Coupling
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

// ── Mock the graph client ──────────────────────────────────────────

const mockRun = vi.fn().mockResolvedValue({ records: [] });
const mockWriteTransaction = vi.fn(async (work: (tx: { run: typeof mockRun }) => Promise<void>) => {
  await work({ run: mockRun });
});
const mockReadTransaction = vi.fn(async (work: (tx: { run: typeof mockRun }) => Promise<unknown>) => {
  return work({ run: mockRun });
});

vi.mock("../../src/graph/client.js", () => ({
  writeTransaction: (...args: unknown[]) => mockWriteTransaction(...args as [any]),
  readTransaction: (...args: unknown[]) => mockReadTransaction(...args as [any]),
}));

import {
  instantiateMorpheme,
  updateMorpheme,
  createLine,
} from "../../src/graph/instantiation.js";
import type {
  MorphemeType,
  LineType,
} from "../../src/graph/instantiation.js";

// ── Helpers ────────────────────────────────────────────────────────

/** Configure mockRun to simulate node existence with labels */
function mockNodeLabels(nodeId: string, labels: string[]) {
  mockRun.mockImplementation(async (query: string, params?: Record<string, unknown>) => {
    // labels(n) query
    if (query.includes("labels(n)") && params?.nodeId === nodeId) {
      return { records: [{ get: () => labels }] };
    }
    // count(n) query (nodeExists)
    if (query.includes("count(n)") && params?.nodeId === nodeId) {
      return { records: [{ get: () => 1 }] };
    }
    return { records: [] };
  });
}

/** Configure mockRun for a Bloom parent + target existence */
function mockBloomParentAndNodeExists(parentId: string, nodeId?: string) {
  mockRun.mockImplementation(async (query: string, params?: Record<string, unknown>) => {
    // Parent type query
    if (query.includes("labels(n)") && params?.nodeId === parentId) {
      return { records: [{ get: () => ["Bloom"] }] };
    }
    // Node existence for target
    if (nodeId && query.includes("labels(n)") && params?.nodeId === nodeId) {
      return { records: [{ get: () => ["Seed"] }] };
    }
    if (nodeId && query.includes("count(n)") && params?.nodeId === nodeId) {
      return { records: [{ get: () => 1 }] };
    }
    // Count query for parent
    if (query.includes("count(n)") && params?.nodeId === parentId) {
      return { records: [{ get: () => 1 }] };
    }
    return { records: [] };
  });
}

// ════════════════════════════════════════════════════════════════════
// instantiateMorpheme()
// ════════════════════════════════════════════════════════════════════

describe("instantiateMorpheme()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("morpheme hygiene (required properties)", () => {
    it("rejects Seed missing 'content'", async () => {
      const result = await instantiateMorpheme("seed", {
        id: "test-seed",
        name: "Test",
        seedType: "test",
        status: "active",
        // content is missing
      }, "parent-bloom");

      expect(result.success).toBe(false);
      expect(result.error).toContain("missing required property 'content'");
    });

    it("rejects Seed with empty content", async () => {
      const result = await instantiateMorpheme("seed", {
        id: "test-seed",
        name: "Test",
        seedType: "test",
        content: "",
        status: "active",
      }, "parent-bloom");

      expect(result.success).toBe(false);
      expect(result.error).toContain("missing required property 'content'");
    });

    it("rejects Seed with whitespace-only content", async () => {
      const result = await instantiateMorpheme("seed", {
        id: "test-seed",
        name: "Test",
        seedType: "test",
        content: "   ",
        status: "active",
      }, "parent-bloom");

      expect(result.success).toBe(false);
      expect(result.error).toContain("empty content");
    });

    it("rejects Bloom missing 'type'", async () => {
      const result = await instantiateMorpheme("bloom", {
        id: "test-bloom",
        name: "Test",
        content: "A bloom",
        status: "active",
        // type is missing
      }, "parent-bloom");

      expect(result.success).toBe(false);
      expect(result.error).toContain("missing required property 'type'");
    });

    it("rejects Resonator missing 'content'", async () => {
      const result = await instantiateMorpheme("resonator", {
        id: "test-res",
        name: "Test",
        type: "computation",
        status: "active",
        // content is missing
      }, "parent-bloom");

      expect(result.success).toBe(false);
      expect(result.error).toContain("missing required property 'content'");
    });

    it("rejects Grid missing 'content'", async () => {
      const result = await instantiateMorpheme("grid", {
        id: "test-grid",
        name: "Test",
        type: "observation",
        status: "active",
        // content is missing
      }, "parent-bloom");

      expect(result.success).toBe(false);
      expect(result.error).toContain("missing required property 'content'");
    });

    it("rejects Helix missing 'mode'", async () => {
      const result = await instantiateMorpheme("helix", {
        id: "test-helix",
        name: "Test",
        content: "A helix",
        status: "active",
        // mode is missing
      }, "parent-bloom");

      expect(result.success).toBe(false);
      expect(result.error).toContain("missing required property 'mode'");
    });
  });

  describe("grammatical shape (containment rules)", () => {
    it("rejects when parent does not exist", async () => {
      // Default mock returns empty records (no node found)
      const result = await instantiateMorpheme("seed", {
        id: "test-seed",
        name: "Test",
        seedType: "test",
        content: "Test content",
        status: "active",
      }, "nonexistent-parent");

      expect(result.success).toBe(false);
      expect(result.error).toContain("does not exist");
    });

    it("rejects Resonator inside Grid (Grids contain Seeds only)", async () => {
      mockNodeLabels("parent-grid", ["Grid"]);

      const result = await instantiateMorpheme("resonator", {
        id: "test-res",
        name: "Test",
        type: "computation",
        content: "A resonator",
        status: "active",
      }, "parent-grid");

      expect(result.success).toBe(false);
      expect(result.error).toContain("cannot contain 'resonator'");
    });

    it("rejects Bloom inside Grid", async () => {
      mockNodeLabels("parent-grid", ["Grid"]);

      const result = await instantiateMorpheme("bloom", {
        id: "test-bloom",
        name: "Test",
        type: "milestone",
        content: "A bloom",
        status: "active",
      }, "parent-grid");

      expect(result.success).toBe(false);
      expect(result.error).toContain("cannot contain 'bloom'");
    });

    it("rejects containment inside a Seed (Seeds are atomic)", async () => {
      mockNodeLabels("parent-seed", ["Seed"]);

      const result = await instantiateMorpheme("seed", {
        id: "test-child",
        name: "Test",
        seedType: "test",
        content: "Child content",
        status: "active",
      }, "parent-seed");

      expect(result.success).toBe(false);
      expect(result.error).toContain("cannot contain any morphemes");
    });

    it("rejects containment inside a Resonator", async () => {
      mockNodeLabels("parent-res", ["Resonator"]);

      const result = await instantiateMorpheme("seed", {
        id: "test-child",
        name: "Test",
        seedType: "test",
        content: "Child content",
        status: "active",
      }, "parent-res");

      expect(result.success).toBe(false);
      expect(result.error).toContain("cannot contain any morphemes");
    });

    it("allows Seed inside Bloom", async () => {
      mockBloomParentAndNodeExists("parent-bloom");

      const result = await instantiateMorpheme("seed", {
        id: "test-seed",
        name: "Test",
        seedType: "test",
        content: "Test content",
        status: "active",
      }, "parent-bloom");

      expect(result.success).toBe(true);
      expect(result.nodeId).toBe("test-seed");
    });

    it("allows Seed inside Grid", async () => {
      mockNodeLabels("parent-grid", ["Grid"]);

      const result = await instantiateMorpheme("seed", {
        id: "test-seed",
        name: "Test",
        seedType: "observation",
        content: "An observation",
        status: "active",
      }, "parent-grid");

      expect(result.success).toBe(true);
    });

    it("allows Bloom inside Bloom (nested containment)", async () => {
      mockBloomParentAndNodeExists("parent-bloom");

      const result = await instantiateMorpheme("bloom", {
        id: "child-bloom",
        name: "Sub-milestone",
        type: "milestone",
        content: "A sub-milestone",
        status: "planned",
      }, "parent-bloom");

      expect(result.success).toBe(true);
    });

    it("allows Resonator inside Bloom", async () => {
      mockBloomParentAndNodeExists("parent-bloom");

      const result = await instantiateMorpheme("resonator", {
        id: "test-resonator",
        name: "ΦL Computation",
        type: "computation",
        content: "Computes ΦL from four factors",
        status: "active",
      }, "parent-bloom");

      expect(result.success).toBe(true);
    });

    it("allows Grid inside Bloom", async () => {
      mockBloomParentAndNodeExists("parent-bloom");

      const result = await instantiateMorpheme("grid", {
        id: "test-grid",
        name: "Observations",
        type: "observation",
        content: "Stores observation Seeds",
        status: "active",
      }, "parent-bloom");

      expect(result.success).toBe(true);
    });

    it("allows Helix inside Bloom", async () => {
      mockBloomParentAndNodeExists("parent-bloom");

      const result = await instantiateMorpheme("helix", {
        id: "test-helix",
        name: "Learning Loop",
        mode: "learning",
        content: "Thompson posterior learning across executions",
        status: "active",
      }, "parent-bloom");

      expect(result.success).toBe(true);
    });
  });

  describe("atomic creation (CONTAINS + INSTANTIATES)", () => {
    it("calls writeTransaction with MERGE, CONTAINS, and INSTANTIATES", async () => {
      mockBloomParentAndNodeExists("parent-bloom");

      await instantiateMorpheme("seed", {
        id: "new-seed",
        name: "New",
        seedType: "datum",
        content: "Some content",
        status: "active",
      }, "parent-bloom");

      // writeTransaction called for creation + observation
      expect(mockWriteTransaction).toHaveBeenCalled();

      // Check the cypher calls within the transaction
      const calls = mockRun.mock.calls;
      const cyphers = calls.map(c => c[0] as string);

      // Should have MERGE for the node
      expect(cyphers.some(c => c.includes("MERGE") && c.includes("Seed"))).toBe(true);
      // Should have CONTAINS wiring
      expect(cyphers.some(c => c.includes("CONTAINS"))).toBe(true);
      // Should have INSTANTIATES wiring
      expect(cyphers.some(c => c.includes("INSTANTIATES"))).toBe(true);
    });

    it("wires INSTANTIATES to correct definition", async () => {
      mockBloomParentAndNodeExists("parent-bloom");

      await instantiateMorpheme("resonator", {
        id: "new-res",
        name: "New",
        type: "governance",
        content: "A resonator",
        status: "active",
      }, "parent-bloom");

      // Find the INSTANTIATES call
      const instantiatesCall = mockRun.mock.calls.find(
        c => (c[0] as string).includes("INSTANTIATES"),
      );
      expect(instantiatesCall).toBeDefined();
      expect(instantiatesCall![1]).toEqual(
        expect.objectContaining({ definitionId: "def:morpheme:resonator" }),
      );
    });
  });

  describe("idempotency via MERGE", () => {
    it("uses MERGE (not CREATE) for node creation", async () => {
      mockBloomParentAndNodeExists("parent-bloom");

      await instantiateMorpheme("seed", {
        id: "idempotent-seed",
        name: "Test",
        seedType: "test",
        content: "Idempotent",
        status: "active",
      }, "parent-bloom");

      const createCalls = mockRun.mock.calls.filter(
        c => (c[0] as string).includes("Seed") && (c[0] as string).includes("MERGE"),
      );
      expect(createCalls.length).toBeGreaterThan(0);
    });
  });

  describe("observation recording", () => {
    it("records success observation in instantiation Grid", async () => {
      mockBloomParentAndNodeExists("parent-bloom");

      await instantiateMorpheme("seed", {
        id: "observed-seed",
        name: "Test",
        seedType: "test",
        content: "Will be observed",
        status: "active",
      }, "parent-bloom");

      // Find observation write
      const obsCalls = mockRun.mock.calls.filter(
        c => (c[0] as string).includes("grid:instantiation-observations"),
      );
      expect(obsCalls.length).toBeGreaterThan(0);
    });

    it("records rejection observation on failure", async () => {
      // Will fail because parent doesn't exist
      await instantiateMorpheme("seed", {
        id: "rejected-seed",
        name: "Test",
        seedType: "test",
        content: "Will be rejected",
        status: "active",
      }, "nonexistent-parent");

      // Find observation write
      const obsCalls = mockRun.mock.calls.filter(
        c => (c[0] as string).includes("grid:instantiation-observations"),
      );
      expect(obsCalls.length).toBeGreaterThan(0);
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// updateMorpheme()
// ════════════════════════════════════════════════════════════════════

describe("updateMorpheme()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects update to non-existent node", async () => {
    // Default mock returns empty — node not found
    const result = await updateMorpheme("nonexistent", { name: "New Name" });

    expect(result.success).toBe(false);
    expect(result.error).toContain("does not exist");
  });

  it("rejects setting content to empty string", async () => {
    mockNodeLabels("existing-seed", ["Seed"]);

    const result = await updateMorpheme("existing-seed", { content: "" });

    expect(result.success).toBe(false);
    expect(result.error).toContain("cannot remove required property 'content'");
  });

  it("rejects setting content to whitespace", async () => {
    mockNodeLabels("existing-seed", ["Seed"]);

    const result = await updateMorpheme("existing-seed", { content: "   " });

    expect(result.success).toBe(false);
    expect(result.error).toContain("empty content");
  });

  it("rejects removing required property (setting to null)", async () => {
    mockNodeLabels("existing-seed", ["Seed"]);

    const result = await updateMorpheme("existing-seed", { name: null as unknown as string });

    expect(result.success).toBe(false);
    expect(result.error).toContain("cannot remove required property 'name'");
  });

  it("rejects removing required property (setting to empty)", async () => {
    mockNodeLabels("existing-seed", ["Seed"]);

    const result = await updateMorpheme("existing-seed", { seedType: "" });

    expect(result.success).toBe(false);
    expect(result.error).toContain("cannot remove required property 'seedType'");
  });

  it("allows updating non-required properties", async () => {
    mockNodeLabels("existing-seed", ["Seed"]);

    const result = await updateMorpheme("existing-seed", {
      description: "Updated description",
      phiL: 0.85,
    });

    expect(result.success).toBe(true);
    expect(result.nodeId).toBe("existing-seed");
  });

  it("allows updating content to a new non-empty value", async () => {
    mockNodeLabels("existing-seed", ["Seed"]);

    const result = await updateMorpheme("existing-seed", {
      content: "New meaningful content",
    });

    expect(result.success).toBe(true);
  });

  describe("reparenting", () => {
    it("rejects reparent when new parent doesn't exist", async () => {
      mockNodeLabels("existing-seed", ["Seed"]);

      const result = await updateMorpheme("existing-seed", {}, "nonexistent");

      expect(result.success).toBe(false);
      expect(result.error).toContain("does not exist");
    });

    it("rejects reparent to invalid container type", async () => {
      // Set up: node is a Bloom, new parent is a Grid (Grid can't contain Bloom)
      mockRun.mockImplementation(async (query: string, params?: Record<string, unknown>) => {
        if (query.includes("labels(n)") && params?.nodeId === "existing-bloom") {
          return { records: [{ get: () => ["Bloom"] }] };
        }
        if (query.includes("labels(n)") && params?.nodeId === "new-parent-grid") {
          return { records: [{ get: () => ["Grid"] }] };
        }
        return { records: [] };
      });

      const result = await updateMorpheme("existing-bloom", {}, "new-parent-grid");

      expect(result.success).toBe(false);
      expect(result.error).toContain("cannot contain");
    });

    it("wires new CONTAINS before removing old (never orphan)", async () => {
      // Set up both nodes exist with correct types
      mockRun.mockImplementation(async (query: string, params?: Record<string, unknown>) => {
        if (query.includes("labels(n)") && params?.nodeId === "movable-seed") {
          return { records: [{ get: () => ["Seed"] }] };
        }
        if (query.includes("labels(n)") && params?.nodeId === "new-bloom") {
          return { records: [{ get: () => ["Bloom"] }] };
        }
        return { records: [] };
      });

      await updateMorpheme("movable-seed", {}, "new-bloom");

      const txCalls = mockRun.mock.calls.map(c => c[0] as string);
      const containsNewIndex = txCalls.findIndex(c => c.includes("MERGE") && c.includes("CONTAINS"));
      const deleteOldIndex = txCalls.findIndex(c => c.includes("DELETE"));

      // New CONTAINS must come before DELETE of old
      if (containsNewIndex >= 0 && deleteOldIndex >= 0) {
        expect(containsNewIndex).toBeLessThan(deleteOldIndex);
      }
    });
  });

  describe("parent status propagation", () => {
    it("triggers parent status recalculation after update", async () => {
      mockNodeLabels("existing-seed", ["Seed"]);

      await updateMorpheme("existing-seed", { status: "complete" });

      // Check that parent recalculation query was issued
      const txCalls = mockRun.mock.calls.map(c => c[0] as string);
      const recalcCall = txCalls.find(c =>
        c.includes("parent") && c.includes("CONTAINS") && c.includes("CASE"),
      );
      expect(recalcCall).toBeDefined();
    });
  });
});

// ════════════════════════════════════════════════════════════════════
// createLine()
// ════════════════════════════════════════════════════════════════════

describe("createLine()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when source doesn't exist", async () => {
    const result = await createLine("nonexistent", "target", "FLOWS_TO");

    expect(result.success).toBe(false);
    expect(result.error).toContain("source");
    expect(result.error).toContain("does not exist");
  });

  it("rejects when target doesn't exist", async () => {
    // Source exists, target doesn't
    mockRun.mockImplementation(async (query: string, params?: Record<string, unknown>) => {
      if (query.includes("count(n)") && params?.nodeId === "source") {
        return { records: [{ get: () => 1 }] };
      }
      return { records: [] };
    });

    const result = await createLine("source", "nonexistent", "FLOWS_TO");

    expect(result.success).toBe(false);
    expect(result.error).toContain("target");
    expect(result.error).toContain("does not exist");
  });

  it("rejects invalid line type", async () => {
    // Both endpoints exist
    mockRun.mockImplementation(async (query: string) => {
      if (query.includes("count(n)")) {
        return { records: [{ get: () => 1 }] };
      }
      return { records: [] };
    });

    const result = await createLine("source", "target", "INVALID_TYPE" as LineType);

    expect(result.success).toBe(false);
    expect(result.error).toContain("unknown line type");
  });

  it("rejects CONTAINS from Grid to Resonator", async () => {
    mockRun.mockImplementation(async (query: string, params?: Record<string, unknown>) => {
      if (query.includes("count(n)")) {
        return { records: [{ get: () => 1 }] };
      }
      if (query.includes("labels(n)") && params?.nodeId === "grid-1") {
        return { records: [{ get: () => ["Grid"] }] };
      }
      if (query.includes("labels(n)") && params?.nodeId === "res-1") {
        return { records: [{ get: () => ["Resonator"] }] };
      }
      return { records: [] };
    });

    const result = await createLine("grid-1", "res-1", "CONTAINS");

    expect(result.success).toBe(false);
    expect(result.error).toContain("cannot CONTAIN");
  });

  it("allows FLOWS_TO between valid endpoints", async () => {
    mockRun.mockImplementation(async (query: string) => {
      if (query.includes("count(n)")) {
        return { records: [{ get: () => 1 }] };
      }
      return { records: [] };
    });

    const result = await createLine("res-1", "res-2", "FLOWS_TO");

    expect(result.success).toBe(true);
    expect(result.sourceId).toBe("res-1");
    expect(result.targetId).toBe("res-2");
    expect(result.lineType).toBe("FLOWS_TO");
  });

  it("allows DEPENDS_ON between valid endpoints", async () => {
    mockRun.mockImplementation(async (query: string) => {
      if (query.includes("count(n)")) {
        return { records: [{ get: () => 1 }] };
      }
      return { records: [] };
    });

    const result = await createLine("seed-1", "seed-2", "DEPENDS_ON");

    expect(result.success).toBe(true);
  });

  it("passes properties to the relationship", async () => {
    mockRun.mockImplementation(async (query: string) => {
      if (query.includes("count(n)")) {
        return { records: [{ get: () => 1 }] };
      }
      return { records: [] };
    });

    await createLine("source", "target", "FLOWS_TO", { weight: 0.8, label: "data" });

    // Find the MERGE call
    const mergeCalls = mockRun.mock.calls.filter(
      c => (c[0] as string).includes("MERGE") && (c[0] as string).includes("FLOWS_TO"),
    );
    expect(mergeCalls.length).toBeGreaterThan(0);
  });

  it("records observation in line-creation Grid", async () => {
    mockRun.mockImplementation(async (query: string) => {
      if (query.includes("count(n)")) {
        return { records: [{ get: () => 1 }] };
      }
      return { records: [] };
    });

    await createLine("source", "target", "FLOWS_TO");

    const obsCalls = mockRun.mock.calls.filter(
      c => (c[0] as string).includes("grid:line-creation-observations"),
    );
    expect(obsCalls.length).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════════
// Cross-cutting: Morpheme type coverage
// ════════════════════════════════════════════════════════════════════

describe("all morpheme types accepted", () => {
  const allTypes: MorphemeType[] = ["seed", "bloom", "resonator", "grid", "helix"];

  for (const type of allTypes) {
    it(`accepts ${type} with all required properties`, async () => {
      vi.clearAllMocks();
      mockBloomParentAndNodeExists("parent-bloom");

      const props: Record<string, unknown> = {
        id: `test-${type}`,
        name: `Test ${type}`,
        content: `A valid ${type}`,
        status: "active",
      };

      // Add type-specific required properties
      if (type === "seed") props.seedType = "test";
      if (type === "bloom") props.type = "test";
      if (type === "resonator") props.type = "computation";
      if (type === "grid") props.type = "observation";
      if (type === "helix") props.mode = "learning";

      const result = await instantiateMorpheme(type, props, "parent-bloom");
      expect(result.success).toBe(true);
      expect(result.nodeId).toBe(`test-${type}`);
    });
  }
});

// ════════════════════════════════════════════════════════════════════
// Delegation: higher-level functions delegate to protocol
// ════════════════════════════════════════════════════════════════════

describe("createContainedBloom delegation", () => {
  // Import the function under test (uses same mocked graph client)
  let createContainedBloom: typeof import("../../src/graph/queries/bloom.js").createContainedBloom;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("../../src/graph/queries/bloom.js");
    createContainedBloom = mod.createContainedBloom;
  });

  it("delegates to instantiateMorpheme with morphemeType bloom", async () => {
    mockBloomParentAndNodeExists("parent-bloom");

    await createContainedBloom(
      { id: "b-1", name: "Test Bloom", type: "test", status: "planned", content: "Test content" },
      "parent-bloom",
    );

    // Should have run MERGE with Bloom label (from instantiateMorpheme)
    const mergeCalls = mockRun.mock.calls.filter(
      c => (c[0] as string).includes("MERGE") && (c[0] as string).includes(":Bloom"),
    );
    expect(mergeCalls.length).toBeGreaterThan(0);

    // Should wire INSTANTIATES (definitionId is a parameter, not inline in query)
    const instCalls = mockRun.mock.calls.filter(
      c => (c[0] as string).includes("INSTANTIATES"),
    );
    expect(instCalls.length).toBeGreaterThan(0);
    // Verify the definition target is bloom
    const instParams = instCalls[0][1] as Record<string, unknown>;
    expect(instParams.definitionId).toBe("def:morpheme:bloom");
  });

  it("falls back description → content for backward compatibility", async () => {
    mockBloomParentAndNodeExists("parent-bloom");

    await createContainedBloom(
      { id: "b-2", name: "Desc Bloom", type: "test", status: "planned", description: "From description" },
      "parent-bloom",
    );

    // Should succeed (content derived from description)
    const mergeCalls = mockRun.mock.calls.filter(
      c => (c[0] as string).includes("MERGE") && (c[0] as string).includes(":Bloom"),
    );
    expect(mergeCalls.length).toBeGreaterThan(0);
  });

  it("records observation in instantiation Grid", async () => {
    mockBloomParentAndNodeExists("parent-bloom");

    await createContainedBloom(
      { id: "b-3", name: "Obs Bloom", type: "test", status: "planned", content: "Observed" },
      "parent-bloom",
    );

    const obsCalls = mockRun.mock.calls.filter(
      c => (c[0] as string).includes("grid:instantiation-observations"),
    );
    expect(obsCalls.length).toBeGreaterThan(0);
  });
});

describe("createContainedResonator delegation", () => {
  let createContainedResonator: typeof import("../../src/graph/queries/resonator.js").createContainedResonator;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("../../src/graph/queries/resonator.js");
    createContainedResonator = mod.createContainedResonator;
  });

  it("delegates to instantiateMorpheme with morphemeType resonator", async () => {
    mockBloomParentAndNodeExists("parent-bloom");

    await createContainedResonator(
      { id: "r-1", name: "Test Resonator", content: "Transforms input", type: "test", status: "active" },
      "parent-bloom",
    );

    // Should MERGE with Resonator label
    const mergeCalls = mockRun.mock.calls.filter(
      c => (c[0] as string).includes("MERGE") && (c[0] as string).includes(":Resonator"),
    );
    expect(mergeCalls.length).toBeGreaterThan(0);

    // Should wire INSTANTIATES (definitionId is a parameter, not inline)
    const instCalls = mockRun.mock.calls.filter(
      c => (c[0] as string).includes("INSTANTIATES"),
    );
    expect(instCalls.length).toBeGreaterThan(0);
    const instParams = instCalls[0][1] as Record<string, unknown>;
    expect(instParams.definitionId).toBe("def:morpheme:resonator");
  });

  it("rejects empty content (A1 enforcement)", async () => {
    await expect(
      createContainedResonator(
        { id: "r-bad", name: "Bad", content: "", type: "test", status: "active" },
        "parent-bloom",
      ),
    ).rejects.toThrow();
  });
});

describe("updateBloomStatus delegation", () => {
  let updateBloomStatus: typeof import("../../src/graph/queries/bloom.js").updateBloomStatus;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("../../src/graph/queries/bloom.js");
    updateBloomStatus = mod.updateBloomStatus;
  });

  it("delegates to updateMorpheme", async () => {
    // Mock: node exists as Bloom
    mockNodeLabels("bloom-1", ["Bloom"]);

    await updateBloomStatus("bloom-1", "complete", { phiL: 0.9 });

    // Should SET status and phiL via the mutation protocol
    const setCalls = mockRun.mock.calls.filter(
      c => (c[0] as string).includes("SET") && (c[0] as string).includes("Bloom"),
    );
    expect(setCalls.length).toBeGreaterThan(0);

    // Should record mutation observation
    const obsCalls = mockRun.mock.calls.filter(
      c => (c[0] as string).includes("grid:mutation-observations"),
    );
    expect(obsCalls.length).toBeGreaterThan(0);
  });

  it("throws on non-existent bloom", async () => {
    // Mock: node doesn't exist
    mockRun.mockResolvedValue({ records: [] });

    await expect(updateBloomStatus("missing", "complete")).rejects.toThrow("does not exist");
  });
});
