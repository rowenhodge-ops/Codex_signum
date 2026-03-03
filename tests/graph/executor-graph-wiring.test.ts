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
