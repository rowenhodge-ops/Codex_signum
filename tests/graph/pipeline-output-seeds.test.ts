/**
 * Tests for pipeline output Seed creation (M-17-PREP).
 *
 * Level 2 (Contract): Verifies the interface shape and function signatures
 * of PipelineOutputSeedProps, createPipelineOutputSeed, linkSeedToPipelineRun,
 * and tryCreateAndLinkSeed.
 *
 * Does NOT require a Neo4j connection — tests structure and export contracts.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PipelineOutputSeedProps } from "../../src/graph/queries.js";

// We can't call the real graph functions without Neo4j, but we can verify:
// 1. The interface shape is correct
// 2. The functions are exported
// 3. tryCreateAndLinkSeed never throws (non-fatal contract)

describe("PipelineOutputSeedProps — interface contract", () => {
  it("accepts all required fields", () => {
    const props: PipelineOutputSeedProps = {
      id: "run-123:t1",
      name: "Test Task",
      seedType: "pipeline-output",
      content: "Full output text here",
      qualityScore: 0.85,
      modelId: "claude-opus-4-6:adaptive:medium",
      charCount: 21,
      durationMs: 5000,
      runId: "run-123",
      taskId: "t1",
      order: 0,
    };
    expect(props.id).toBe("run-123:t1");
    expect(props.seedType).toBe("pipeline-output");
    expect(props.order).toBe(0);
  });

  it("accepts null qualityScore (REVIEW: null not 1.0 for unassessed)", () => {
    const props: PipelineOutputSeedProps = {
      id: "run-123:scope",
      name: "DevAgent scope output",
      seedType: "pipeline-output",
      content: "Scope analysis...",
      qualityScore: null,
      modelId: "mistral-medium-3:default",
      charCount: 17,
      durationMs: 3000,
      runId: "run-123",
      taskId: "scope",
      order: 0,
    };
    expect(props.qualityScore).toBeNull();
  });

  it("accepts null modelId (failure path)", () => {
    const props: PipelineOutputSeedProps = {
      id: "run-123:t2",
      name: "Failed Task",
      seedType: "pipeline-output",
      content: "Error: connection refused",
      qualityScore: 0.05,
      modelId: null,
      charCount: 25,
      durationMs: 0,
      runId: "run-123",
      taskId: "t2",
      order: 1,
    };
    expect(props.modelId).toBeNull();
  });

  it("seedType is always 'pipeline-output'", () => {
    const props: PipelineOutputSeedProps = {
      id: "test",
      name: "test",
      seedType: "pipeline-output",
      content: "",
      qualityScore: null,
      modelId: null,
      charCount: 0,
      durationMs: 0,
      runId: "r",
      taskId: "t",
      order: 0,
    };
    // TypeScript enforces this at compile time — runtime check for completeness
    expect(props.seedType).toBe("pipeline-output");
  });
});

describe("Pipeline output seed functions — export contract", () => {
  it("createPipelineOutputSeed is exported and is a function", async () => {
    const mod = await import("../../src/graph/queries.js");
    expect(typeof mod.createPipelineOutputSeed).toBe("function");
  });

  it("linkSeedToPipelineRun is exported and is a function", async () => {
    const mod = await import("../../src/graph/queries.js");
    expect(typeof mod.linkSeedToPipelineRun).toBe("function");
  });

  it("tryCreateAndLinkSeed is exported and is a function", async () => {
    const mod = await import("../../src/graph/queries.js");
    expect(typeof mod.tryCreateAndLinkSeed).toBe("function");
  });
});

describe("tryCreateAndLinkSeed — non-fatal contract", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("does not throw when graph write fails (mocked)", async () => {
    // Mock the underlying writeTransaction to throw
    const clientMod = await import("../../src/graph/client.js");
    vi.spyOn(clientMod, "writeTransaction").mockRejectedValue(
      new Error("Connection refused"),
    );

    const { tryCreateAndLinkSeed: tryFn } = await import("../../src/graph/queries.js");

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Must not throw — this is the core non-fatal contract
    await expect(
      tryFn({
        id: "test-run:t1",
        name: "Test",
        seedType: "pipeline-output",
        content: "test content",
        qualityScore: 0.5,
        modelId: "test-model",
        charCount: 12,
        durationMs: 100,
        runId: "test-run",
        taskId: "t1",
        order: 0,
      }),
    ).resolves.toBeUndefined();

    // Should have logged a warning
    expect(warnSpy).toHaveBeenCalled();
    const warnMsg = warnSpy.mock.calls[0]?.[0] as string;
    expect(warnMsg).toContain("[GRAPH]");
    expect(warnMsg).toContain("test-run:t1");

    warnSpy.mockRestore();
  });
});
