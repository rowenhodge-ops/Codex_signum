// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * L2 Contract — Stamp Persistence Verification
 *
 * Tests for:
 * - updateMorpheme() read-back verification (Task 1)
 * - verifyStamp() post-stamp diagnostic (Task 3)
 * - updateBloomState() deprecation warning (Task 2)
 *
 * Graph layer is mocked. These verify protocol logic, not Neo4j connectivity.
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
const mockRunQuery = vi.fn().mockResolvedValue({ records: [] });

vi.mock("../../src/graph/client.js", () => ({
  writeTransaction: (...args: unknown[]) => mockWriteTransaction(...args as [any]),
  readTransaction: (...args: unknown[]) => mockReadTransaction(...args as [any]),
  runQuery: (...args: unknown[]) => mockRunQuery(...args as [any, any, any]),
}));

// Mock conductivity (non-fatal, used by updateMorpheme)
vi.mock("../../src/graph/queries/conductivity.js", () => ({
  invalidateLineConductivity: vi.fn().mockResolvedValue(undefined),
  evaluateAndCacheLineConductivity: vi.fn().mockResolvedValue(undefined),
}));

import { updateMorpheme } from "../../src/graph/instantiation.js";
import type { MutationResult } from "../../src/graph/instantiation.js";
import { verifyStamp, updateBloomState } from "../../src/graph/queries/bloom.js";

// ── Helpers ────────────────────────────────────────────────────────

/** Configure mockRun to simulate a Bloom node for getNodeInfo + read-back */
function mockBloomNode(
  nodeId: string,
  properties: Record<string, unknown>,
) {
  mockRun.mockImplementation(async (query: string, params?: Record<string, unknown>) => {
    // labels(n) query (getNodeMorphemeType)
    if (query.includes("labels(n)") && params?.nodeId === nodeId) {
      return { records: [{ get: () => ["Bloom"] }] };
    }
    // properties(n) query (read-back verification)
    if (query.includes("properties(n)") && params?.nodeId === nodeId) {
      return { records: [{ get: () => properties }] };
    }
    return { records: [] };
  });
}

/** Configure mockRun so read-back returns stale/different data */
function mockBloomNodeWithStalePersistence(
  nodeId: string,
  staleProperties: Record<string, unknown>,
) {
  mockRun.mockImplementation(async (query: string, params?: Record<string, unknown>) => {
    // labels(n) query
    if (query.includes("labels(n)") && params?.nodeId === nodeId) {
      return { records: [{ get: () => ["Bloom"] }] };
    }
    // properties(n) — returns stale data (write didn't persist)
    if (query.includes("properties(n)") && params?.nodeId === nodeId) {
      return { records: [{ get: () => staleProperties }] };
    }
    return { records: [] };
  });
}

// ── Tests ──────────────────────────────────────────────────────────

describe("Stamp Persistence — Read-Back Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns verified: true when read-back matches updates", async () => {
    mockBloomNode("bloom:test-1", {
      id: "bloom:test-1",
      name: "Test",
      content: "Test content",
      type: "milestone",
      status: "complete",
      phiL: 0.9,
    });

    const result: MutationResult = await updateMorpheme("bloom:test-1", {
      status: "complete",
      phiL: 0.9,
    });

    expect(result.success).toBe(true);
    expect(result.verified).toBe(true);
    expect(result.nodeId).toBe("bloom:test-1");
  });

  it("returns success: false when read-back shows stale data", async () => {
    mockBloomNodeWithStalePersistence("bloom:test-2", {
      id: "bloom:test-2",
      name: "Test",
      content: "Test content",
      type: "milestone",
      status: "planned",  // stale — we tried to set 'complete'
      phiL: 0.3,          // stale — we tried to set 0.9
    });

    const result: MutationResult = await updateMorpheme("bloom:test-2", {
      status: "complete",
      phiL: 0.9,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Mutation verification failed");
    expect(result.error).toContain("status");
    expect(result.error).toContain("phiL");
  });

  it("returns success: false when node disappears after write", async () => {
    // getNodeInfo succeeds (labels query), but read-back returns nothing
    mockRun.mockImplementation(async (query: string, params?: Record<string, unknown>) => {
      if (query.includes("labels(n)") && params?.nodeId === "bloom:ghost") {
        return { records: [{ get: () => ["Bloom"] }] };
      }
      // properties(n) returns empty — node gone
      if (query.includes("properties(n)")) {
        return { records: [] };
      }
      return { records: [] };
    });

    const result: MutationResult = await updateMorpheme("bloom:ghost", {
      status: "complete",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("not found after write");
  });
});

describe("Stamp Persistence — verifyStamp()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("detects missing CONTAINS edge (orphaned node)", async () => {
    mockRunQuery.mockResolvedValueOnce({
      records: [{
        get: (key: string) => {
          const data: Record<string, unknown> = {
            childStatus: "complete",
            childPhiL: 0.9,
            childCommitSha: "abc123",
            parentId: null,
            parentStatus: null,
            totalChildren: 0,
            completeChildren: 0,
            hasParent: false,
          };
          return data[key];
        },
      }],
    });

    const verification = await verifyStamp("bloom:orphan", "complete");

    expect(verification.containsEdgeExists).toBe(false);
    expect(verification.issues.length).toBeGreaterThan(0);
    expect(verification.issues[0]).toContain("structurally orphaned");
  });

  it("detects status mismatch", async () => {
    mockRunQuery.mockResolvedValueOnce({
      records: [{
        get: (key: string) => {
          const data: Record<string, unknown> = {
            childStatus: "planned",
            childPhiL: 0.3,
            childCommitSha: null,
            parentId: "bloom:parent",
            parentStatus: "planned",
            totalChildren: 1,
            completeChildren: 0,
            hasParent: true,
          };
          return data[key];
        },
      }],
    });

    const verification = await verifyStamp("bloom:wrong-status", "complete");

    expect(verification.childStatus).toBe("planned");
    expect(verification.issues.some(i => i.includes("expected 'complete'"))).toBe(true);
  });

  it("detects parent derivation failure", async () => {
    // Parent has 2 children, 1 complete — parent should be 'active' but is 'planned'
    mockRunQuery.mockResolvedValueOnce({
      records: [{
        get: (key: string) => {
          const data: Record<string, unknown> = {
            childStatus: "complete",
            childPhiL: 0.9,
            childCommitSha: "def456",
            parentId: "bloom:m-22",
            parentStatus: "planned",  // wrong — should be 'active'
            totalChildren: 2,
            completeChildren: 1,
            hasParent: true,
          };
          return data[key];
        },
      }],
    });

    const verification = await verifyStamp("bloom:m-22.2", "complete", "bloom:m-22");

    expect(verification.parentStatus).toBe("planned");
    expect(verification.issues.some(i => i.includes("expected 'active'"))).toBe(true);
    expect(verification.issues.some(i => i.includes("1/2 children complete"))).toBe(true);
  });

  it("returns clean result when stamp is correct", async () => {
    mockRunQuery.mockResolvedValueOnce({
      records: [{
        get: (key: string) => {
          const data: Record<string, unknown> = {
            childStatus: "complete",
            childPhiL: 0.9,
            childCommitSha: "abc123",
            parentId: "bloom:m-22",
            parentStatus: "active",
            totalChildren: 7,
            completeChildren: 3,
            hasParent: true,
          };
          return data[key];
        },
      }],
    });

    const verification = await verifyStamp("bloom:m-22.2", "complete", "bloom:m-22");

    expect(verification.issues).toEqual([]);
    expect(verification.containsEdgeExists).toBe(true);
    expect(verification.childStatus).toBe("complete");
    expect(verification.parentChildCount).toBe(7);
    expect(verification.parentCompleteCount).toBe(3);
  });

  it("reports non-existent node", async () => {
    mockRunQuery.mockResolvedValueOnce({ records: [] });

    const verification = await verifyStamp("bloom:nonexistent", "complete");

    expect(verification.childStatus).toBeNull();
    expect(verification.issues[0]).toContain("does not exist");
  });
});

describe("Stamp Persistence — Deprecation Warning", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updateBloomState emits deprecation warning", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await updateBloomState("bloom:test", "active");

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("DEPRECATED"),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("updateBloomStatus()"),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("bloom:test"),
    );

    warnSpy.mockRestore();
  });
});
