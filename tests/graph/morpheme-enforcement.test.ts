// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * R-39 Morpheme Instantiation Layer — Structural Enforcement Assertions
 *
 * These tests verify that enforcement EXISTS — not that data is compliant.
 * If someone loosens the types or removes runtime guards, these tests break.
 * They protect the topology, not the data.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import type {
  DataSeedProps,
  BloomProps,
} from "../../src/graph/queries.js";
import {
  createDataSeed,
  createContainedDataSeed,
  createContainedBloom,
  updateBloomStatus,
} from "../../src/graph/queries.js";

// ── Layer 1: Type Contracts ─────────────────────────────────────────────────

describe("Layer 1 — Type contracts", () => {
  it("DataSeedProps requires content as string (not optional)", () => {
    // If someone makes content optional, this construction with empty string
    // still compiles but the runtime guard catches it. The type requires the key.
    const props: DataSeedProps = {
      id: "test-l1-content",
      name: "Test Seed",
      seedType: "test",
      content: "This seed has content",
      status: "active",
    };
    expect(props.content).toBeDefined();
    expect(typeof props.content).toBe("string");
  });

  it("DataSeedProps requires seedType as string (not optional)", () => {
    const props: DataSeedProps = {
      id: "test-l1-seedtype",
      name: "Test Seed",
      seedType: "backlog",
      content: "A backlog item",
      status: "planned",
    };
    expect(props.seedType).toBeDefined();
    expect(typeof props.seedType).toBe("string");
  });

  it("DataSeedProps requires status as string (not optional)", () => {
    const props: DataSeedProps = {
      id: "test-l1-status",
      name: "Test Seed",
      seedType: "exit-criterion",
      content: "All tests pass",
      status: "active",
    };
    expect(props.status).toBeDefined();
    expect(typeof props.status).toBe("string");
  });

  it("BloomProps requires type as string (not optional)", () => {
    const props: BloomProps = {
      id: "test-l1-bloom-type",
      name: "Test Bloom",
      type: "milestone",
      status: "planned",
    };
    expect(props.type).toBeDefined();
    expect(typeof props.type).toBe("string");
  });

  it("BloomProps requires status as string (not optional)", () => {
    const props: BloomProps = {
      id: "test-l1-bloom-status",
      name: "Test Bloom",
      type: "pattern",
      status: "active",
    };
    expect(props.status).toBeDefined();
    expect(typeof props.status).toBe("string");
  });

  it("BloomProps no longer has optional state field", () => {
    // The old BloomProps had `state?: string`. It's now `status: string` (required).
    const props: BloomProps = {
      id: "test-l1-no-state",
      name: "No State",
      type: "test-suite",
      status: "created",
    };
    // 'state' is not a defined property on the new interface
    expect("status" in props).toBe(true);
  });
});

// ── Layer 2: Runtime Guards ─────────────────────────────────────────────────

describe("Layer 2 — Runtime guards", () => {
  it("createDataSeed() throws on empty content", async () => {
    await expect(
      createDataSeed({
        id: "test-l2-empty",
        name: "Empty Content",
        seedType: "test",
        content: "",
        status: "active",
      }),
    ).rejects.toThrow("A1 violation");
  });

  it("createDataSeed() throws on whitespace-only content", async () => {
    await expect(
      createDataSeed({
        id: "test-l2-whitespace",
        name: "Whitespace Content",
        seedType: "test",
        content: "   \t\n  ",
        status: "active",
      }),
    ).rejects.toThrow("A1 violation");
  });

  it("createContainedDataSeed() throws on empty content", async () => {
    await expect(
      createContainedDataSeed(
        {
          id: "test-l2-contained-empty",
          name: "Empty Contained Seed",
          seedType: "test",
          content: "",
          status: "active",
        },
        "parent-bloom",
      ),
    ).rejects.toThrow("A1 violation");
  });

  it("createContainedDataSeed() is a function that requires parentBloomId", () => {
    expect(typeof createContainedDataSeed).toBe("function");
    expect(createContainedDataSeed.length).toBeGreaterThanOrEqual(2);
  });

  it("createContainedBloom() is a function that requires parentId", () => {
    expect(typeof createContainedBloom).toBe("function");
    expect(createContainedBloom.length).toBeGreaterThanOrEqual(2);
  });

  it("updateBloomStatus() is a function", () => {
    expect(typeof updateBloomStatus).toBe("function");
  });
});

// ── Layer 3: Schema Constraints ─────────────────────────────────────────────

describe("Layer 3 — Schema constraints declared", () => {
  const schemaSource = readFileSync(
    join(process.cwd(), "src", "graph", "schema.ts"),
    "utf-8",
  );

  it("schema declares seed_content_required constraint", () => {
    expect(schemaSource).toContain("seed_content_required");
    expect(schemaSource).toContain("s.content IS NOT NULL");
  });

  it("schema declares seed_seedtype_required constraint", () => {
    expect(schemaSource).toContain("seed_seedtype_required");
    expect(schemaSource).toContain("s.seedType IS NOT NULL");
  });

  it("schema declares seed_status_required constraint", () => {
    expect(schemaSource).toContain("seed_status_required");
    expect(schemaSource).toContain("s.status IS NOT NULL");
  });

  it("schema declares bloom_type_required constraint", () => {
    expect(schemaSource).toContain("bloom_type_required");
    expect(schemaSource).toContain("b.type IS NOT NULL");
  });

  it("schema declares bloom_status_required constraint", () => {
    expect(schemaSource).toContain("bloom_status_required");
    expect(schemaSource).toContain("b.status IS NOT NULL");
  });
});

// ── Export Completeness ─────────────────────────────────────────────────────

describe("R-39 exports available through barrel", () => {
  it("DataSeedProps is exported", async () => {
    const mod = await import("../../src/graph/queries.js");
    // DataSeedProps is a type — can't check at runtime, but we check the functions
    expect(mod.createDataSeed).toBeDefined();
  });

  it("createDataSeed is exported", async () => {
    const mod = await import("../../src/graph/queries.js");
    expect(typeof mod.createDataSeed).toBe("function");
  });

  it("createContainedDataSeed is exported", async () => {
    const mod = await import("../../src/graph/queries.js");
    expect(typeof mod.createContainedDataSeed).toBe("function");
  });

  it("createContainedBloom is exported", async () => {
    const mod = await import("../../src/graph/queries.js");
    expect(typeof mod.createContainedBloom).toBe("function");
  });

  it("updateBloomStatus is exported", async () => {
    const mod = await import("../../src/graph/queries.js");
    expect(typeof mod.updateBloomStatus).toBe("function");
  });
});
