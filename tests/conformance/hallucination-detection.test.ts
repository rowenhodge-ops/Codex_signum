// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { describe, expect, it } from "vitest";
import {
  detectHallucinations,
  ELIMINATED_ENTITIES,
  CANONICAL_AXIOM_NAMES,
} from "../../scripts/bootstrap-task-executor.js";
import type { Task } from "../../src/patterns/architect/types.js";

// ── Helpers ──────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    task_id: "t1",
    title: "Test task",
    description: "A test task",
    acceptance_criteria: ["Analyze dampening parameters", "Provide recommendations"],
    type: "generative",
    phase: "phase_1",
    estimated_complexity: "medium",
    files_affected: [],
    specification_refs: [],
    verification: "npx tsc --noEmit",
    commit_message: "test",
    ...overrides,
  };
}

// ── Signal-level detection ───────────────────────────────────────────────

describe("detectHallucinations — signal level", () => {
  it("flags empty output as error", () => {
    const flags = detectHallucinations("", makeTask());

    expect(flags).toHaveLength(1);
    expect(flags[0].level).toBe("signal");
    expect(flags[0].severity).toBe("error");
    expect(flags[0].description).toContain("Empty");
  });

  it("flags whitespace-only output as error", () => {
    const flags = detectHallucinations("   \n\n  ", makeTask());

    expect(flags).toHaveLength(1);
    expect(flags[0].severity).toBe("error");
  });

  it("flags very short output as warning", () => {
    const flags = detectHallucinations("Short response.", makeTask());

    const shortFlags = flags.filter((f) => f.description.includes("short"));
    expect(shortFlags).toHaveLength(1);
    expect(shortFlags[0].severity).toBe("warning");
  });

  it("flags error-like output pattern", () => {
    const flags = detectHallucinations(
      "Error: I cannot process this request due to content policy.\n" +
      "x".repeat(300), // long enough to avoid short flag
      makeTask(),
    );

    const errorFlags = flags.filter((f) => f.description.includes("error-like"));
    expect(errorFlags).toHaveLength(1);
  });

  it("does not flag normal output", () => {
    const output = "# Analysis of Dampening Parameters\n\n" +
      "The dampening coefficient should follow γ_effective = min(0.7, 0.8/k).\n" +
      "Recommendations include proper hub scaling.\n" +
      "x".repeat(300);

    const flags = detectHallucinations(output, makeTask());

    const signalFlags = flags.filter((f) => f.level === "signal");
    expect(signalFlags).toHaveLength(0);
  });
});

// ── Content-level detection ──────────────────────────────────────────────

describe("detectHallucinations — content level", () => {
  it("flags references to eliminated entities", () => {
    const output = "We should implement the Observer pattern for monitoring.\n" +
      "The Model Sentinel will track health metrics.\n" +
      "x".repeat(300);

    const flags = detectHallucinations(output, makeTask());

    const contentFlags = flags.filter((f) => f.level === "content");
    expect(contentFlags.length).toBeGreaterThanOrEqual(2);
    expect(contentFlags.some((f) => f.description.includes("Observer pattern"))).toBe(true);
    expect(contentFlags.some((f) => f.description.includes("Model Sentinel"))).toBe(true);
  });

  it("flags wrong axiom count", () => {
    const output = "The system has 12 axioms that govern behavior.\n" +
      "x".repeat(300);

    const flags = detectHallucinations(output, makeTask());

    const axiomFlags = flags.filter((f) => f.description.includes("axiom"));
    expect(axiomFlags).toHaveLength(1);
    expect(axiomFlags[0].description).toContain("12");
    expect(axiomFlags[0].description).toContain("10");
  });

  it("does not flag correct axiom count", () => {
    const output = "The protocol defines 10 axioms.\n" +
      "x".repeat(300);

    const flags = detectHallucinations(output, makeTask());

    const axiomFlags = flags.filter((f) => f.description.includes("axiom"));
    expect(axiomFlags).toHaveLength(0);
  });

  it("flags wrong pipeline stage count", () => {
    const output = "The 5-stage pipeline processes tasks.\n" +
      "x".repeat(300);

    const flags = detectHallucinations(output, makeTask());

    const stageFlags = flags.filter((f) => f.description.includes("pipeline"));
    expect(stageFlags).toHaveLength(1);
    expect(stageFlags[0].description).toContain("5");
  });

  it("does not flag correct pipeline stage count", () => {
    const output = "The 7-stage pipeline handles task execution.\n" +
      "x".repeat(300);

    const flags = detectHallucinations(output, makeTask());

    const stageFlags = flags.filter((f) => f.description.includes("pipeline"));
    expect(stageFlags).toHaveLength(0);
  });
});

// ── Structural-level detection ───────────────────────────────────────────

describe("detectHallucinations — structural level", () => {
  it("flags missing acceptance criteria coverage", () => {
    const task = makeTask({
      acceptance_criteria: [
        "Provide analysis of cascade propagation",
        "Include hypothesis validation results",
      ],
    });

    // Output addresses cascade but not hypothesis
    const output = "# Cascade Analysis\n\n" +
      "The cascade propagation mechanism works correctly.\n" +
      "x".repeat(300);

    const flags = detectHallucinations(output, task);

    const structFlags = flags.filter((f) => f.level === "structural");
    expect(structFlags.length).toBeGreaterThanOrEqual(1);
    expect(structFlags.some((f) => f.description.includes("hypothesis"))).toBe(true);
  });

  it("does not flag when all criteria keywords appear", () => {
    const task = makeTask({
      acceptance_criteria: [
        "Analyze dampening behavior",
        "Provide recommendations",
      ],
    });

    const output = "# Dampening Analysis\n\n" +
      "The dampening behavior follows the specification.\n" +
      "Our recommendations include adjusting the coefficient.\n" +
      "x".repeat(300);

    const flags = detectHallucinations(output, task);

    const structFlags = flags.filter((f) => f.level === "structural");
    expect(structFlags).toHaveLength(0);
  });
});

// ── Constants ────────────────────────────────────────────────────────────

describe("hallucination detection constants", () => {
  it("has eliminated entities list", () => {
    expect(ELIMINATED_ENTITIES.length).toBeGreaterThan(0);
    expect(ELIMINATED_ENTITIES).toContain("Observer pattern");
    expect(ELIMINATED_ENTITIES).toContain("Model Sentinel");
  });

  it("axiom names are all present", () => {
    expect(CANONICAL_AXIOM_NAMES).toContain("Symbiosis");
    expect(CANONICAL_AXIOM_NAMES).toContain("Semantic Stability");
    expect(CANONICAL_AXIOM_NAMES).toContain("Adaptive Pressure");
  });
});
