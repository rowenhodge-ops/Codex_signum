// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * L2 Contract — stampBloomComplete() (M-23.2)
 *
 * Tests the stamp enforcement function: derived phiL, exit criteria gating,
 * Bloom type classification, inline recomputation, INSTANTIATES backfill.
 *
 * Graph layer + recomputation dependencies are mocked. These verify protocol
 * logic, not Neo4j connectivity.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

// ── Mock graph client ──────────────────────────────────────────────

const mockRunQuery = vi.fn().mockResolvedValue({ records: [] });
const mockTxRun = vi.fn().mockResolvedValue({ records: [] });
const mockWriteTransaction = vi.fn(async (work: (tx: { run: typeof mockTxRun }) => Promise<void>) => {
  await work({ run: mockTxRun });
});
const mockReadTransaction = vi.fn(async (work: (tx: { run: typeof mockTxRun }) => Promise<unknown>) => {
  return work({ run: mockTxRun });
});

vi.mock("../../src/graph/client.js", () => ({
  writeTransaction: (...args: unknown[]) => mockWriteTransaction(...args as [any]),
  readTransaction: (...args: unknown[]) => mockReadTransaction(...args as [any]),
  runQuery: (...args: unknown[]) => mockRunQuery(...args as [any]),
}));

// ── Mock dependencies that would touch Neo4j ───────────────────────

vi.mock("../../src/computation/hierarchical-health.js", () => ({
  propagatePhiLUpward: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/graph/queries/health.js", () => ({
  computeAndPersistPsiH: vi.fn().mockResolvedValue(null),
  computeAndPersistEpsilonR: vi.fn().mockResolvedValue(null),
}));

vi.mock("../../src/computation/immune-response.js", () => ({
  assembleTriggerState: vi.fn().mockResolvedValue({
    currentLambda2: 0.5,
    previousLambda2: 0.5,
    currentFriction: 0,
    refinementHelixTemporalConstant: 100,
    frictionDuration: 0,
    currentCascadeDepth: 0,
    currentPhiL: 0.5,
    epsilonR: 0.1,
    phiLVelocity: 0,
    phiLHistory: [],
    observationCount: 0,
  }),
}));

vi.mock("../../src/graph/queries/topology.js", () => ({
  getParentBloom: vi.fn().mockResolvedValue(null),
}));

vi.mock("../../src/graph/queries/conductivity.js", () => ({
  invalidateLineConductivity: vi.fn().mockResolvedValue(undefined),
  evaluateAndCacheLineConductivity: vi.fn().mockResolvedValue(undefined),
}));

import {
  stampBloomComplete,
  revertBloomToActive,
} from "../../src/graph/instantiation.js";
import type { StampOptions, StampResult } from "../../src/graph/instantiation.js";
import { propagatePhiLUpward } from "../../src/computation/hierarchical-health.js";
import { computeAndPersistPsiH } from "../../src/graph/queries/health.js";
import { getParentBloom } from "../../src/graph/queries/topology.js";

// ── Helpers ────────────────────────────────────────────────────────

/** A mock Neo4j record row */
function mockRecord(data: Record<string, unknown>) {
  return { get: (key: string) => data[key] };
}

/**
 * Configure mockRunQuery to respond to different Cypher patterns.
 * Responses is an array of { match, result } — first matching query wins.
 */
function setupQueryResponses(responses: Array<{
  match: string | RegExp;
  result: { records: Array<{ get: (key: string) => unknown }> };
}>) {
  mockRunQuery.mockImplementation(async (query: string) => {
    for (const r of responses) {
      const matches = typeof r.match === "string"
        ? query.includes(r.match)
        : r.match.test(query);
      if (matches) return r.result;
    }
    return { records: [] };
  });
}

/** Standard mock for a milestone Bloom with children */
function setupMilestoneBloom(opts: {
  bloomId: string;
  status?: string;
  type?: string;
  phiL?: number;
  exitCriteria?: Array<{ id: string; status: string; content: string }>;
  childBlooms?: Array<{ id: string; status: string }>;
  backlogItems?: Array<{ id: string; name: string }>;
  missingInstantiates?: Array<{ id: string; labels: string[] }>;
}) {
  const { bloomId, status = "active", type = "milestone", phiL = 0.5,
    exitCriteria = [], childBlooms = [], backlogItems = [],
    missingInstantiates = [] } = opts;

  // Count relevant children for derivation
  const relevantChildren = [
    ...childBlooms.map(c => ({ status: c.status })),
    ...exitCriteria.map(ec => ({ status: ec.status })),
  ];
  const total = relevantChildren.length;
  const done = relevantChildren.filter(c => c.status === "complete").length;
  const derivedPhiL = total > 0 ? done / total : 1.0;

  // Build stored props for mutation read-back
  const storedProps: Record<string, unknown> = { id: bloomId, status, phiL };

  setupQueryResponses([
    // Step 1: Bloom existence
    {
      match: "b.status AS status, b.type AS type",
      result: { records: [mockRecord({ id: bloomId, status, type, phiL })] },
    },
    // Step 3: Exit criteria check
    {
      match: "exit-criterion",
      result: {
        records: exitCriteria
          .filter(ec => ec.status !== "complete")
          .map(ec => mockRecord({ ecId: ec.id, status: ec.status, content: ec.content })),
      },
    },
    // Step 4: Backlog scope check
    {
      match: "STARTS WITH 'R-'",
      result: {
        records: backlogItems.map(b => mockRecord({ seedId: b.id, name: b.name })),
      },
    },
    // Step 5: INSTANTIATES check
    {
      match: "INSTANTIATES",
      result: {
        records: missingInstantiates.map(n => mockRecord({ nodeId: n.id, nodeLabels: n.labels })),
      },
    },
    // Step 6: Derive phiL
    {
      match: "derivedPhiL",
      result: { records: [mockRecord({ total, done, derivedPhiL })] },
    },
    // Step 9: Read-back verification
    {
      match: "b.status AS status, b.phiL AS phiL",
      result: { records: [mockRecord({ status: "complete", phiL: derivedPhiL })] },
    },
  ]);

  // Mock updateMorpheme's internal calls (writeTransaction + readTransaction)
  mockTxRun.mockImplementation(async (query: string, params?: Record<string, unknown>) => {
    // Capture SET values
    if (query.includes("SET") && params) {
      for (const [key, value] of Object.entries(params)) {
        if (key.startsWith("upd_")) storedProps[key.slice(4)] = value;
      }
    }
    return { records: [] };
  });

  mockReadTransaction.mockImplementation(async (work: (tx: { run: typeof mockTxRun }) => Promise<unknown>) => {
    return work({
      run: vi.fn().mockImplementation(async (query: string, params?: Record<string, unknown>) => {
        // labels(n) for getNodeInfo
        if (query.includes("labels(n)")) {
          return { records: [{ get: () => ["Bloom"] }] };
        }
        // properties(n) read-back
        if (query.includes("properties(n)")) {
          return { records: [{ get: () => ({ ...storedProps, ...{ status: "complete", phiL: derivedPhiL } }) }] };
        }
        // count(n) — nodeExists
        if (query.includes("count(n)")) {
          return { records: [{ get: () => 1 }] };
        }
        return { records: [] };
      }),
    });
  });
}

// ── Tests ──────────────────────────────────────────────────────────

describe("stampBloomComplete (M-23.2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when Bloom does not exist", async () => {
    setupQueryResponses([]);
    const result = await stampBloomComplete({ bloomId: "M-nonexistent" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("does not exist");
  });

  it("is idempotent — re-stamping a complete Bloom succeeds with warning", async () => {
    setupQueryResponses([
      {
        match: "b.status AS status",
        result: { records: [mockRecord({ id: "M-X", status: "complete", type: "milestone", phiL: 0.9 })] },
      },
    ]);
    const result = await stampBloomComplete({ bloomId: "M-X" });
    expect(result.success).toBe(true);
    expect(result.warnings.some(w => w.includes("already complete"))).toBe(true);
  });

  it("rejects when exit criteria are incomplete and force=false", async () => {
    setupMilestoneBloom({
      bloomId: "M-test",
      exitCriteria: [
        { id: "M-test:ec-1", status: "complete", content: "Done thing" },
        { id: "M-test:ec-2", status: "pending", content: "Not done yet" },
      ],
    });

    const result = await stampBloomComplete({ bloomId: "M-test", force: false });
    expect(result.success).toBe(false);
    expect(result.error).toContain("exit criteria are not complete");
    expect(result.error).toContain("M-test:ec-2");
  });

  it("force-stamps exit criteria when force=true", async () => {
    // Track all SET values per node for read-back verification
    const nodeProps = new Map<string, Record<string, unknown>>();
    nodeProps.set("M-force", { id: "M-force", name: "Test", content: "test", type: "milestone", status: "active", phiL: 0.5 });
    nodeProps.set("M-force:ec-1", { id: "M-force:ec-1", name: "EC1", content: "Pending thing", seedType: "exit-criterion", status: "pending" });
    nodeProps.set("M-force:ec-2", { id: "M-force:ec-2", name: "EC2", content: "Another pending", seedType: "exit-criterion", status: "pending" });

    setupQueryResponses([
      {
        match: "b.status AS status, b.type AS type",
        result: { records: [mockRecord({ id: "M-force", status: "active", type: "milestone", phiL: 0.5 })] },
      },
      {
        match: "exit-criterion",
        result: { records: [
          mockRecord({ ecId: "M-force:ec-1", status: "pending", content: "Pending thing" }),
          mockRecord({ ecId: "M-force:ec-2", status: "pending", content: "Another pending" }),
        ] },
      },
      { match: "STARTS WITH 'R-'", result: { records: [] } },
      { match: "INSTANTIATES", result: { records: [] } },
      { match: "derivedPhiL", result: { records: [mockRecord({ total: 2, done: 2, derivedPhiL: 1.0 })] } },
      { match: "b.status AS status, b.phiL AS phiL", result: { records: [mockRecord({ status: "complete", phiL: 1.0 })] } },
    ]);

    // Mock write+read transactions — capture SET values, replay on read-back
    mockTxRun.mockImplementation(async (query: string, params?: Record<string, unknown>) => {
      if (query.includes("SET") && params) {
        const nodeId = params.nodeId as string;
        if (nodeId && nodeProps.has(nodeId)) {
          const props = nodeProps.get(nodeId)!;
          for (const [key, value] of Object.entries(params)) {
            if (key.startsWith("upd_")) props[key.slice(4)] = value;
          }
        }
      }
      return { records: [] };
    });

    mockReadTransaction.mockImplementation(async (work: any) => {
      return work({
        run: vi.fn().mockImplementation(async (query: string, params?: Record<string, unknown>) => {
          const nodeId = params?.nodeId as string;
          if (query.includes("labels(n)")) {
            const label = nodeId?.includes(":ec") ? ["Seed"] : ["Bloom"];
            return { records: [{ get: () => label }] };
          }
          if (query.includes("properties(n)") && nodeId && nodeProps.has(nodeId)) {
            return { records: [{ get: () => ({ ...nodeProps.get(nodeId) }) }] };
          }
          if (query.includes("count(n)")) return { records: [{ get: () => 1 }] };
          return { records: [] };
        }),
      });
    });

    const result = await stampBloomComplete({ bloomId: "M-force", force: true });
    expect(result.success).toBe(true);
    expect(result.warnings.some(w => w.includes("Force-stamped exit criterion"))).toBe(true);
  });

  it("derives phiL from RELEVANT children only — ignores observation Seeds", async () => {
    // 2 child Blooms (complete) + 1 exit criterion (complete) = 3/3 = 1.0
    // The mock returns derivedPhiL=1.0 because the Cypher only counts Bloom+EC children
    setupMilestoneBloom({
      bloomId: "M-derive",
      exitCriteria: [{ id: "M-derive:ec-1", status: "complete", content: "Done" }],
      childBlooms: [
        { id: "M-derive.1", status: "complete" },
        { id: "M-derive.2", status: "complete" },
      ],
    });

    const result = await stampBloomComplete({ bloomId: "M-derive" });
    expect(result.success).toBe(true);
    expect(result.derivedPhiL).toBe(1.0);
  });

  it("emits warning for planned R-items scoped to the Bloom", async () => {
    setupMilestoneBloom({
      bloomId: "M-backlog",
      exitCriteria: [],
      backlogItems: [{ id: "R-99", name: "Unfinished backlog item" }],
    });

    const result = await stampBloomComplete({ bloomId: "M-backlog" });
    expect(result.success).toBe(true);
    expect(result.warnings.some(w => w.includes("R-99"))).toBe(true);
    expect(result.warnings.some(w => w.includes("Planned backlog item"))).toBe(true);
  });

  it("backfills missing INSTANTIATES before stamping", async () => {
    setupMilestoneBloom({
      bloomId: "M-backfill",
      exitCriteria: [],
      missingInstantiates: [{ id: "M-backfill.child", labels: ["Bloom"] }],
    });

    const result = await stampBloomComplete({ bloomId: "M-backfill" });
    expect(result.success).toBe(true);
    expect(result.warnings.some(w => w.includes("Backfilled INSTANTIATES"))).toBe(true);
  });

  it("skips child-status-derivation for definitional Blooms", async () => {
    const bloomId = "constitutional-bloom";
    const nodeProps: Record<string, unknown> = { id: bloomId, name: "Constitutional Bloom", content: "governance", type: "definitional", status: "active", phiL: 0.8 };

    setupQueryResponses([
      {
        match: "b.status AS status",
        result: { records: [mockRecord({ id: bloomId, status: "active", type: "definitional", phiL: 0.8 })] },
      },
    ]);

    // Capture SET values and return them in read-back
    mockTxRun.mockImplementation(async (query: string, params?: Record<string, unknown>) => {
      if (query.includes("SET") && params) {
        for (const [key, value] of Object.entries(params)) {
          if (key.startsWith("upd_")) nodeProps[key.slice(4)] = value;
        }
      }
      return { records: [] };
    });

    mockReadTransaction.mockImplementation(async (work: any) => {
      return work({
        run: vi.fn().mockImplementation(async (query: string) => {
          if (query.includes("labels(n)")) return { records: [{ get: () => ["Bloom"] }] };
          if (query.includes("properties(n)")) return { records: [{ get: () => ({ ...nodeProps }) }] };
          if (query.includes("count(n)")) return { records: [{ get: () => 1 }] };
          return { records: [] };
        }),
      });
    });

    const result = await stampBloomComplete({ bloomId });
    expect(result.success).toBe(true);
    const ecCalls = mockRunQuery.mock.calls.filter(c => String(c[0]).includes("exit-criterion"));
    expect(ecCalls.length).toBe(0);
  });

  it("uses type property over ID heuristic when type is set", async () => {
    const bloomId = "M-99";
    const nodeProps: Record<string, unknown> = { id: bloomId, name: "Test", content: "analytical", type: "analytical", status: "active", phiL: 0.5 };

    setupQueryResponses([
      {
        match: "b.status AS status",
        result: { records: [mockRecord({ id: bloomId, status: "active", type: "analytical", phiL: 0.5 })] },
      },
    ]);

    mockTxRun.mockImplementation(async (query: string, params?: Record<string, unknown>) => {
      if (query.includes("SET") && params) {
        for (const [key, value] of Object.entries(params)) {
          if (key.startsWith("upd_")) nodeProps[key.slice(4)] = value;
        }
      }
      return { records: [] };
    });

    mockReadTransaction.mockImplementation(async (work: any) => {
      return work({
        run: vi.fn().mockImplementation(async (query: string) => {
          if (query.includes("labels(n)")) return { records: [{ get: () => ["Bloom"] }] };
          if (query.includes("properties(n)")) return { records: [{ get: () => ({ ...nodeProps }) }] };
          if (query.includes("count(n)")) return { records: [{ get: () => 1 }] };
          return { records: [] };
        }),
      });
    });

    const result = await stampBloomComplete({ bloomId });
    expect(result.success).toBe(true);
    const ecCalls = mockRunQuery.mock.calls.filter(c => String(c[0]).includes("exit-criterion"));
    expect(ecCalls.length).toBe(0);
  });

  it("calls propagatePhiLUpward after stamp", async () => {
    setupMilestoneBloom({ bloomId: "M-prop", exitCriteria: [] });

    await stampBloomComplete({ bloomId: "M-prop" });
    expect(propagatePhiLUpward).toHaveBeenCalledWith("M-prop", expect.any(Number), expect.any(Number));
  });

  it("calls computeAndPersistPsiH on the stamped Bloom", async () => {
    setupMilestoneBloom({ bloomId: "M-psi" });

    await stampBloomComplete({ bloomId: "M-psi" });
    expect(computeAndPersistPsiH).toHaveBeenCalledWith("M-psi");
  });

  it("calls computeAndPersistPsiH on the PARENT Bloom when parent exists", async () => {
    setupMilestoneBloom({ bloomId: "M-child" });
    vi.mocked(getParentBloom).mockResolvedValueOnce({ id: "M-parent", phiL: 0.6, degree: 3 });

    await stampBloomComplete({ bloomId: "M-child" });
    // Should have been called for both child and parent
    expect(computeAndPersistPsiH).toHaveBeenCalledWith("M-child");
    expect(computeAndPersistPsiH).toHaveBeenCalledWith("M-parent");
  });

  it("ΨH failure does not roll back the stamp", async () => {
    setupMilestoneBloom({ bloomId: "M-psifail" });
    vi.mocked(computeAndPersistPsiH).mockRejectedValueOnce(new Error("ΨH computation failed"));

    const result = await stampBloomComplete({ bloomId: "M-psifail" });
    expect(result.success).toBe(true);
    expect(result.warnings.some(w => w.includes("ΨH recomputation"))).toBe(true);
  });

  it("ΦL propagation failure does not roll back the stamp", async () => {
    setupMilestoneBloom({ bloomId: "M-philfail" });
    vi.mocked(propagatePhiLUpward).mockRejectedValueOnce(new Error("propagation failed"));

    const result = await stampBloomComplete({ bloomId: "M-philfail" });
    expect(result.success).toBe(true);
    expect(result.warnings.some(w => w.includes("ΦL propagation failed"))).toBe(true);
  });

  it("returns psiH from computeAndPersistPsiH when available", async () => {
    setupMilestoneBloom({ bloomId: "M-psiresult" });
    vi.mocked(computeAndPersistPsiH).mockResolvedValueOnce({
      combined: 0.75,
      lambda2: 0.3,
      friction: 0.1,
    });

    const result = await stampBloomComplete({ bloomId: "M-psiresult" });
    expect(result.psiH).toEqual({ combined: 0.75, lambda2: 0.3, friction: 0.1 });
  });

  it("does NOT throw at module import time", () => {
    // This test passes by existing — stampBloomComplete is importable
    // without Neo4j env vars being set.
    expect(typeof stampBloomComplete).toBe("function");
  });
});

describe("revertBloomToActive (M-23.2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to updateMorpheme with status=active", async () => {
    // Mock the node existence check
    mockReadTransaction.mockImplementation(async (work: any) => {
      return work({
        run: vi.fn().mockImplementation(async (query: string) => {
          if (query.includes("labels(n)")) return { records: [{ get: () => ["Bloom"] }] };
          if (query.includes("properties(n)")) return { records: [{ get: () => ({ id: "M-revert", status: "active" }) }] };
          return { records: [] };
        }),
      });
    });
    mockTxRun.mockResolvedValue({ records: [] });

    const result = await revertBloomToActive("M-revert");
    expect(result.success).toBe(true);
  });

  it("is exported alongside stampBloomComplete", () => {
    expect(typeof revertBloomToActive).toBe("function");
  });
});
