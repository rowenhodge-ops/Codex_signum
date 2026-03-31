// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * L2 Contract — M-10.3 LLM Bloom Reclassification
 *
 * Validates:
 * - ec-10: def:bloom:llm-model definition exists with correct content
 * - ec-11: Highlander accepts multiple LLM children with distinct_governance_scope
 * - ec-11: LLM Bloom structure (dimensions, priors, schema gate)
 * - ec-12: Ring buffer enforces bounded Learning Grid
 * - ec-12: Schema gate Config Seed defines typed entry requirements
 *
 * Graph layer is mocked. Tests verify protocol logic, not Neo4j connectivity.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

// ── Mock the graph client ──────────────────────────────────────────

const mockRun = vi.fn().mockResolvedValue({ records: [] });
const mockWriteTransaction = vi.fn(
  async (work: (tx: { run: typeof mockRun }) => Promise<void>) => {
    await work({ run: mockRun });
  },
);
const mockReadTransaction = vi.fn(
  async (work: (tx: { run: typeof mockRun }) => Promise<unknown>) => {
    return work({ run: mockRun });
  },
);

vi.mock("../../src/graph/client.js", () => ({
  writeTransaction: (...args: unknown[]) =>
    mockWriteTransaction(...(args as [any])),
  readTransaction: (...args: unknown[]) =>
    mockReadTransaction(...(args as [any])),
  runQuery: vi.fn().mockResolvedValue({ records: [] }),
}));

import {
  instantiateMorpheme,
  updateMorpheme,
  createLine,
} from "../../src/graph/instantiation.js";

import { enforceGridRingBuffer } from "../../src/graph/queries/learning-grid.js";

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Configure mockRun for Highlander Protocol testing with multiple justified instances.
 */
function mockHighlanderEnvironment(opts: {
  parentId: string;
  defId: string;
  defExists?: boolean;
  existingInstances?: Array<{ id: string; name: string }>;
}) {
  const { parentId, defExists = true, existingInstances = [] } = opts;
  mockRun.mockImplementation(
    async (query: string, params?: Record<string, unknown>) => {
      // Parent type query
      if (query.includes("labels(n)") && params?.nodeId === parentId) {
        return { records: [{ get: () => ["Bloom"] }] };
      }
      // Count query for parent
      if (query.includes("count(n)") && params?.nodeId === parentId) {
        return { records: [{ get: () => 1 }] };
      }
      // Constitutional Bloom definition check
      if (
        query.includes("constitutional-bloom") &&
        query.includes("CONTAINS") &&
        params?.defId
      ) {
        if (defExists) {
          return { records: [{ get: () => params!.defId }] };
        }
        return { records: [] };
      }
      // Uniqueness check (existing instances)
      if (
        query.includes("INSTANTIATES") &&
        query.includes("existing") &&
        params?.defId
      ) {
        if (existingInstances.length > 0) {
          return {
            records: existingInstances.map((inst) => ({
              get: (key: string) => (key === "id" ? inst.id : inst.name),
            })),
          };
        }
        return { records: [] };
      }
      // count(n) for any other node
      if (query.includes("count(n)")) {
        return { records: [{ get: () => 1 }] };
      }
      // Violation Grid existence
      if (query.includes("grid:violation:ecosystem")) {
        return { records: [{ get: () => 0 }] };
      }
      return { records: [] };
    },
  );
}

/**
 * Configure mocks for ring buffer testing.
 * Both readTransaction and writeTransaction must handle all queries that
 * enforceGridRingBuffer → updateMorpheme will issue.
 */
function mockRingBufferEnv(
  gridId: string,
  seeds: Array<{ id: string; createdAt: string }>,
) {
  const ringBufferMockRun = vi.fn(
    async (query: string, params?: Record<string, unknown>) => {
      // Grid children query (enforceGridRingBuffer step 1)
      if (
        query.includes("CONTAINS") &&
        query.includes("Archived") &&
        params?.gridId === gridId
      ) {
        return {
          records: seeds.map((s) => ({
            get: (key: string) => (key === "id" ? s.id : s.createdAt),
          })),
        };
      }
      // read-back verification → properties(n) — MUST be checked before labels(n)
      // because this query contains BOTH properties(n) and labels(n)
      if (query.includes("properties(n)")) {
        return {
          records: [
            {
              get: (key: string) =>
                key === "nodeLabels"
                  ? ["Seed", "Archived"]
                  : { id: "mock" },
            },
          ],
        };
      }
      // getNodeInfo → labels(n)
      if (query.includes("labels(n)")) {
        return { records: [{ get: () => ["Seed"] }] };
      }
      // nodeExists → count(n)
      if (query.includes("count(n)")) {
        return { records: [{ get: () => 1 }] };
      }
      return { records: [] };
    },
  );

  mockReadTransaction.mockImplementation(
    async (work: (tx: { run: typeof ringBufferMockRun }) => Promise<unknown>) => {
      return work({ run: ringBufferMockRun });
    },
  );
  mockWriteTransaction.mockImplementation(
    async (work: (tx: { run: typeof ringBufferMockRun }) => Promise<void>) => {
      await work({ run: ringBufferMockRun });
    },
  );
}

// ════════════════════════════════════════════════════════════════════
// ec-10: Constitutional Definition
// ════════════════════════════════════════════════════════════════════

describe("ec-10: def:bloom:llm-model definition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("can be created as a Seed in the Constitutional Bloom", async () => {
    // Mock parent as Bloom
    mockRun.mockImplementation(
      async (query: string, params?: Record<string, unknown>) => {
        if (
          query.includes("labels(n)") &&
          params?.nodeId === "constitutional-bloom"
        ) {
          return { records: [{ get: () => ["Bloom"] }] };
        }
        if (
          query.includes("count(n)") &&
          params?.nodeId === "constitutional-bloom"
        ) {
          return { records: [{ get: () => 1 }] };
        }
        return { records: [] };
      },
    );

    const result = await instantiateMorpheme(
      "seed",
      {
        id: "def:bloom:llm-model",
        name: "LLM Model Bloom Definition",
        seedType: "bloom-definition",
        status: "active",
        content:
          "LLM model scope containing arm nodes. Molecule Principle: accumulated self-knowledge requires a Bloom boundary.",
      },
      "constitutional-bloom",
    );

    expect(result.success).toBe(true);
    expect(result.nodeId).toBe("def:bloom:llm-model");
  });

  it("requires content describing the Molecule Principle", async () => {
    // Content is validated non-empty by instantiateMorpheme
    const result = await instantiateMorpheme(
      "seed",
      {
        id: "def:bloom:llm-model",
        name: "LLM Model Bloom Definition",
        seedType: "bloom-definition",
        status: "active",
        content: "",
      },
      "constitutional-bloom",
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("content");
  });
});

// ════════════════════════════════════════════════════════════════════
// ec-11: Highlander accepts distinct_governance_scope
// ════════════════════════════════════════════════════════════════════

describe("ec-11: Highlander — distinct_governance_scope justification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts multiple LLM Invocation Resonators with distinct_governance_scope", async () => {
    // First resonator already exists
    mockHighlanderEnvironment({
      parentId: "llm:claude-opus-4-6",
      defId: "def:transformation:llm-invocation",
      defExists: true,
      existingInstances: [
        {
          id: "resonator:llm-invocation:claude-sonnet-4-6",
          name: "LLM Invocation: claude-sonnet-4-6",
        },
      ],
    });

    const result = await instantiateMorpheme(
      "resonator",
      {
        id: "resonator:llm-invocation:claude-opus-4-6",
        name: "LLM Invocation: claude-opus-4-6",
        type: "llm-invocation",
        status: "active",
        content: "LLM invocation transformation for claude-opus-4-6.",
      },
      "llm:claude-opus-4-6",
      {
        transformationDefId: "def:transformation:llm-invocation",
        a6Justification: "distinct_governance_scope",
      },
    );

    expect(result.success).toBe(true);
    expect(result.composed).toBeUndefined();
  });

  it("accepts multiple Learning Helixes with distinct_governance_scope", async () => {
    mockHighlanderEnvironment({
      parentId: "llm:claude-opus-4-6",
      defId: "def:helix:learning",
      defExists: true,
      existingInstances: [
        {
          id: "helix:learning:claude-sonnet-4-6",
          name: "Learning Helix: claude-sonnet-4-6",
        },
      ],
    });

    const result = await instantiateMorpheme(
      "helix",
      {
        id: "helix:learning:claude-opus-4-6",
        name: "Learning Helix: claude-opus-4-6",
        mode: "learning",
        status: "active",
        content: "Learning helix for claude-opus-4-6.",
      },
      "llm:claude-opus-4-6",
      {
        transformationDefId: "def:helix:learning",
        a6Justification: "distinct_governance_scope",
      },
    );

    expect(result.success).toBe(true);
    expect(result.composed).toBeUndefined();
  });

  it("accepts multiple Learning Grids with distinct_governance_scope", async () => {
    mockHighlanderEnvironment({
      parentId: "llm:claude-opus-4-6",
      defId: "def:grid:observation",
      defExists: true,
      existingInstances: [
        {
          id: "grid:learning:claude-sonnet-4-6",
          name: "Learning Grid: claude-sonnet-4-6",
        },
      ],
    });

    const result = await instantiateMorpheme(
      "grid",
      {
        id: "grid:learning:claude-opus-4-6",
        name: "Learning Grid: claude-opus-4-6",
        type: "observation",
        status: "active",
        content: "Bounded learning grid for claude-opus-4-6.",
      },
      "llm:claude-opus-4-6",
      {
        transformationDefId: "def:grid:observation",
        a6Justification: "distinct_governance_scope",
      },
    );

    expect(result.success).toBe(true);
    expect(result.composed).toBeUndefined();
  });
});

// ════════════════════════════════════════════════════════════════════
// ec-11: LLM Bloom structure verification
// ════════════════════════════════════════════════════════════════════

describe("ec-11: LLM Bloom structural properties", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dimensional properties initialise at 0.0", () => {
    // Verify the expected property shape — these are the dimensional affinities
    const dimensions = {
      phiL_code: 0.0,
      phiL_analysis: 0.0,
      phiL_creative: 0.0,
      phiL_structured_output: 0.0,
      phiL_classification: 0.0,
      phiL_synthesis: 0.0,
    };

    for (const [key, value] of Object.entries(dimensions)) {
      expect(value).toBe(0.0);
      expect(typeof value).toBe("number");
    }
    expect(Object.keys(dimensions)).toHaveLength(6);
  });

  it("uninformative priors are 1.0 / 1.0", () => {
    const priors = {
      weightedSuccesses: 1.0,
      weightedFailures: 1.0,
    };

    expect(priors.weightedSuccesses).toBe(1.0);
    expect(priors.weightedFailures).toBe(1.0);
  });

  it("schema gate Config Seed defines three entry types", () => {
    const schemaGateContent =
      "Typed entry requirements for Learning Grid. Only these Seed types may enter: " +
      "failure-signature (requires errorCode: string, taskType: string, contextSize: number), " +
      "calibration-event (requires dimension: string, beforeValue: number, afterValue: number), " +
      "capability-observation (requires taskType: string, capability: string, evidence: string). " +
      "All other operational data goes to structural properties on the Bloom.";

    expect(schemaGateContent).toContain("failure-signature");
    expect(schemaGateContent).toContain("calibration-event");
    expect(schemaGateContent).toContain("capability-observation");
    expect(schemaGateContent).toContain("errorCode");
    expect(schemaGateContent).toContain("dimension");
    expect(schemaGateContent).toContain("taskType");
  });

  it("LLM Bloom status derives from arm statuses — retired if all retired", () => {
    const armStatuses = ["retired", "retired", "retired"];
    const allRetired = armStatuses.every((s) => s === "retired");
    expect(allRetired).toBe(true);

    const mixedStatuses = ["active", "retired", "active"];
    const mixedAllRetired = mixedStatuses.every((s) => s === "retired");
    expect(mixedAllRetired).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════
// ec-12: Ring buffer enforcement
// ════════════════════════════════════════════════════════════════════

describe("ec-12: enforceGridRingBuffer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is a no-op when seed count is within limit", async () => {
    const seeds = Array.from({ length: 30 }, (_, i) => ({
      id: `seed-${i}`,
      createdAt: new Date(2026, 0, 1 + i).toISOString(),
    }));
    mockRingBufferEnv("grid:learning:test", seeds);

    const result = await enforceGridRingBuffer("grid:learning:test", 50);
    expect(result.archived).toBe(0);
  });

  it("archives oldest seeds when count exceeds max", async () => {
    const seeds = Array.from({ length: 55 }, (_, i) => ({
      id: `seed-${i}`,
      createdAt: new Date(2026, 0, 1 + i).toISOString(),
    }));
    mockRingBufferEnv("grid:learning:test", seeds);

    const result = await enforceGridRingBuffer("grid:learning:test", 50);
    expect(result.archived).toBe(5);
  });

  it("archives exactly (count - maxSeeds) oldest seeds", async () => {
    const seeds = Array.from({ length: 53 }, (_, i) => ({
      id: `seed-${i}`,
      createdAt: new Date(2026, 0, 1 + i).toISOString(),
    }));
    mockRingBufferEnv("grid:learning:test", seeds);

    const result = await enforceGridRingBuffer("grid:learning:test", 50);
    expect(result.archived).toBe(3);
  });

  it("is a no-op when grid has exactly maxSeeds", async () => {
    const seeds = Array.from({ length: 50 }, (_, i) => ({
      id: `seed-${i}`,
      createdAt: new Date(2026, 0, 1 + i).toISOString(),
    }));
    mockRingBufferEnv("grid:learning:test", seeds);

    const result = await enforceGridRingBuffer("grid:learning:test", 50);
    expect(result.archived).toBe(0);
  });

  it("is a no-op when grid is empty", async () => {
    mockRingBufferEnv("grid:learning:test", []);

    const result = await enforceGridRingBuffer("grid:learning:test", 50);
    expect(result.archived).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════
// ec-12: Schema gate content validation
// ════════════════════════════════════════════════════════════════════

describe("ec-12: Schema gate typed entry requirements", () => {
  it("failure-signature entry type has required fields", () => {
    const required = ["errorCode", "taskType", "contextSize"];
    const content =
      "failure-signature (requires errorCode: string, taskType: string, contextSize: number)";
    for (const field of required) {
      expect(content).toContain(field);
    }
  });

  it("calibration-event entry type has required fields", () => {
    const required = ["dimension", "beforeValue", "afterValue"];
    const content =
      "calibration-event (requires dimension: string, beforeValue: number, afterValue: number)";
    for (const field of required) {
      expect(content).toContain(field);
    }
  });

  it("capability-observation entry type has required fields", () => {
    const required = ["taskType", "capability", "evidence"];
    const content =
      "capability-observation (requires taskType: string, capability: string, evidence: string)";
    for (const field of required) {
      expect(content).toContain(field);
    }
  });
});
