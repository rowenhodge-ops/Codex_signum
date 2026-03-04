/**
 * Tests for M-9.2: Bootstrap TaskExecutor graph wiring
 *
 * These are structural/type-level tests verifying backward compatibility
 * and the opt-in design of graph writes. They do NOT require a Neo4j connection.
 */
import { describe, it, expect } from "vitest";
import {
  createBootstrapTaskExecutor,
  type BootstrapExecutorConfig,
  type BootstrapTaskExecutorBundle,
} from "../../scripts/bootstrap-task-executor.js";
import { createMockModelExecutor } from "../../src/patterns/architect/mock-model-executor.js";

describe("Bootstrap TaskExecutor — graph wiring", () => {
  it("createBootstrapTaskExecutor accepts no config (backward compat)", () => {
    const mockModel = createMockModelExecutor();
    const bundle = createBootstrapTaskExecutor(mockModel);
    expect(bundle).toBeDefined();
    expect(typeof bundle.executor.execute).toBe("function");
    expect(typeof bundle.writeManifest).toBe("function");
  });

  it("createBootstrapTaskExecutor accepts config with graphEnabled=false", () => {
    const mockModel = createMockModelExecutor();
    const config: BootstrapExecutorConfig = { graphEnabled: false };
    const bundle = createBootstrapTaskExecutor(mockModel, config);
    expect(bundle).toBeDefined();
    expect(typeof bundle.executor.execute).toBe("function");
  });

  it("createBootstrapTaskExecutor accepts config with graphEnabled=true", () => {
    const mockModel = createMockModelExecutor();
    const config: BootstrapExecutorConfig = {
      graphEnabled: true,
      architectBloomId: "bloom_architect_test",
    };
    const bundle = createBootstrapTaskExecutor(mockModel, config);
    expect(bundle).toBeDefined();
    expect(typeof bundle.executor.execute).toBe("function");
  });

  it("BootstrapExecutorConfig fields are all optional", () => {
    const config: BootstrapExecutorConfig = {};
    expect(config.graphEnabled).toBeUndefined();
    expect(config.architectBloomId).toBeUndefined();
  });

  it("writeManifest returns a Promise (async signature)", () => {
    const mockModel = createMockModelExecutor();
    const bundle = createBootstrapTaskExecutor(mockModel);
    const result = bundle.writeManifest();
    expect(result).toBeInstanceOf(Promise);
  });

  it("writeManifest resolves to null when no tasks executed", async () => {
    const mockModel = createMockModelExecutor();
    const bundle = createBootstrapTaskExecutor(mockModel);
    const manifest = await bundle.writeManifest();
    expect(manifest).toBeNull();
  });

  it("bundle satisfies BootstrapTaskExecutorBundle interface", () => {
    const mockModel = createMockModelExecutor();
    const bundle: BootstrapTaskExecutorBundle = createBootstrapTaskExecutor(mockModel);
    expect(bundle.executor).toBeDefined();
    expect(bundle.writeManifest).toBeDefined();
  });
});

describe("Bootstrap TaskExecutor — failed task DISPATCH linkage", () => {
  it("executor module imports linkTaskOutputToStage for failure path", async () => {
    // The failure path in bootstrap-task-executor calls linkTaskOutputToStage
    // to link failed TaskOutputs to the DISPATCH Resonator.
    // Verify the function is importable from the graph module.
    const graphModule = await import("../../src/graph/queries.js");
    expect(typeof graphModule.linkTaskOutputToStage).toBe("function");
  });

  it("linkTaskOutputToStage signature: (taskOutputId, resonatorId) => Promise<void>", async () => {
    const { linkTaskOutputToStage } = await import("../../src/graph/queries.js");
    const fn: (id: string, rid: string) => Promise<void> = linkTaskOutputToStage;
    expect(typeof fn).toBe("function");
  });
});
