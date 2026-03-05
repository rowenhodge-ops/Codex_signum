// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { describe, expect, it } from "vitest";
import {
  detectHallucinations,
  ELIMINATED_ENTITIES,
  CANONICAL_AXIOM_NAMES,
  CANONICAL_PIPELINE_STAGES,
  CANONICAL_MORPHEME_NAMES,
} from "../../scripts/bootstrap-task-executor.js";
import {
  detectUnsourcedReferences,
} from "../../src/patterns/architect/hallucination-detection.js";
import {
  DOCUMENT_NAME_MAP,
  resolveDocumentReferences,
} from "../../src/patterns/architect/canonical-references.js";
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
    expect(axiomFlags[0].description).toContain("9");
  });

  it("does not flag correct axiom count", () => {
    const output = "The protocol defines 9 axioms.\n" +
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

  it("axiom names are all present (v4.3: 9 axioms, Symbiosis removed)", () => {
    expect(CANONICAL_AXIOM_NAMES).not.toContain("Symbiosis");
    expect(CANONICAL_AXIOM_NAMES).toContain("Semantic Stability");
    expect(CANONICAL_AXIOM_NAMES).toContain("Adaptive Pressure");
    expect(CANONICAL_AXIOM_NAMES).toHaveLength(9);
  });
});

// ── Source verification (M-8.QG.2) ──────────────────────────────────────

describe("detectUnsourcedReferences — source verification gate", () => {
  it("produces no signal when referenced file WAS in context", () => {
    const output = "See `docs/specs/01_codex-signum-v3_0.md` for the definition.\n" +
      "x".repeat(200);
    const provided = ["docs/specs/01_codex-signum-v3_0.md", "src/patterns/architect/types.ts"];

    const flags = detectUnsourcedReferences(output, "t1", provided);

    const pathFlags = flags.filter((f) => f.description.includes("01_codex-signum-v3_0.md"));
    expect(pathFlags).toHaveLength(0);
  });

  it("produces a signal when referenced file was NOT in context", () => {
    const output = "According to `docs/specs/05_codex-signum-engineering-bridge-v2_0.md`, " +
      "the dampening formula is γ = min(0.7, 0.8/k).\n" +
      "x".repeat(200);
    const provided = ["src/computation/dampening.ts"]; // Bridge NOT provided

    const flags = detectUnsourcedReferences(output, "t1", provided);

    expect(flags.length).toBeGreaterThan(0);
    const bridgeFlag = flags.find((f) =>
      f.description.includes("05_codex-signum-engineering-bridge-v2_0.md"),
    );
    expect(bridgeFlag).toBeDefined();
    expect(bridgeFlag?.level).toBe("content");
  });

  it("resolves 'engineering bridge' document name reference and flags if not in context", () => {
    const output = "As documented in the Engineering Bridge, the cascade limit is 2.\n" +
      "x".repeat(200);
    const provided = ["src/computation/dampening.ts"]; // Bridge NOT provided

    const flags = detectUnsourcedReferences(output, "t1", provided);

    // Should detect that Engineering Bridge path is referenced but not provided
    expect(flags.length).toBeGreaterThan(0);
  });

  it("does not false-positive for unknown document names", () => {
    const output = "As described in some other unknown document, the system works.\n" +
      "x".repeat(200);
    const provided: string[] = [];

    const flags = detectUnsourcedReferences(output, "t1", provided);

    // Unknown docs don't trigger detection
    expect(flags).toHaveLength(0);
  });

  it("returns empty array for empty output", () => {
    const flags = detectUnsourcedReferences("", "t1", []);
    expect(flags).toHaveLength(0);
  });
});

// ── DOCUMENT_NAME_MAP ────────────────────────────────────────────────────

describe("DOCUMENT_NAME_MAP", () => {
  it("resolves 'v3.0 spec' to the canonical v3.0 file path", () => {
    const output = "The v3.0 spec defines the core axioms.";
    const resolved = resolveDocumentReferences(output);

    expect(resolved).toContain("docs/specs/01_codex-signum-v3_0.md");
  });

  it("resolves 'engineering bridge' to the correct path", () => {
    const output = "The Engineering Bridge v2.0 is the implementation authority.";
    const resolved = resolveDocumentReferences(output);

    expect(resolved).toContain("docs/specs/05_codex-signum-engineering-bridge-v2_0.md");
  });

  it("returns no paths for text with no known document references", () => {
    const output = "The dampening formula is γ = min(0.7, 0.8/k). No doc refs here.";
    const resolved = resolveDocumentReferences(output);

    expect(resolved).toHaveLength(0);
  });

  it("all mapped paths use docs/specs/ prefix", () => {
    for (const [, path] of Object.entries(DOCUMENT_NAME_MAP)) {
      expect(path.startsWith("docs/")).toBe(true);
    }
  });
});

// ── Canonical allowlists (M-8.QG.3) ─────────────────────────────────────

describe("CANONICAL_AXIOM_NAMES — v4.3 spec (9 axioms)", () => {
  it("contains exactly 9 axioms", () => {
    expect(CANONICAL_AXIOM_NAMES).toHaveLength(9);
  });

  it("contains all 9 v4.3 axiom names", () => {
    expect(CANONICAL_AXIOM_NAMES).toContain("Fidelity");
    expect(CANONICAL_AXIOM_NAMES).toContain("Visible State");
    expect(CANONICAL_AXIOM_NAMES).toContain("Transparency");
    expect(CANONICAL_AXIOM_NAMES).toContain("Provenance");
    expect(CANONICAL_AXIOM_NAMES).toContain("Reversibility");
    expect(CANONICAL_AXIOM_NAMES).toContain("Minimal Authority");
    expect(CANONICAL_AXIOM_NAMES).toContain("Semantic Stability");
    expect(CANONICAL_AXIOM_NAMES).toContain("Adaptive Pressure");
    expect(CANONICAL_AXIOM_NAMES).toContain("Comprehension Primacy");
  });

  it("does NOT contain Symbiosis (absorbed into A2+A9 at v4.0)", () => {
    expect(CANONICAL_AXIOM_NAMES).not.toContain("Symbiosis");
  });
});

describe("CANONICAL_MORPHEME_NAMES — post-M-7C grammar", () => {
  it("contains all 6 post-M-7C morpheme names", () => {
    expect(CANONICAL_MORPHEME_NAMES).toContain("Seed");
    expect(CANONICAL_MORPHEME_NAMES).toContain("Line");
    expect(CANONICAL_MORPHEME_NAMES).toContain("Bloom");
    expect(CANONICAL_MORPHEME_NAMES).toContain("Resonator");
    expect(CANONICAL_MORPHEME_NAMES).toContain("Grid");
    expect(CANONICAL_MORPHEME_NAMES).toContain("Helix");
  });

  it("does NOT contain pre-M-7C morpheme names", () => {
    expect(CANONICAL_MORPHEME_NAMES).not.toContain("Agent");
    expect(CANONICAL_MORPHEME_NAMES).not.toContain("Pattern");
  });
});

describe("ELIMINATED_ENTITIES — pre-M-7C morpheme context patterns", () => {
  it("contains contextual pre-M-7C entity patterns (not bare words)", () => {
    // These are the contextual patterns — NOT bare "Agent" or "Pattern"
    expect(ELIMINATED_ENTITIES).toContain("Agent node");
    expect(ELIMINATED_ENTITIES).toContain("Pattern node");
    expect(ELIMINATED_ENTITIES).toContain(":Agent");
    expect(ELIMINATED_ENTITIES).toContain(":Pattern");
  });

  it("does NOT flag general English usage of 'agent'", () => {
    // "agent" as general English word should not trigger eliminated entity detection
    const output = "The agent ran the pipeline successfully. This pattern of behaviour is expected.\n" +
      "x".repeat(300);
    const flags = detectHallucinations(output, makeTask());
    const entityFlags = flags.filter(
      (f) => f.level === "content" && f.description.includes("eliminated"),
    );
    expect(entityFlags).toHaveLength(0);
  });

  it("DOES flag morpheme-context usage of 'Agent node'", () => {
    // "Agent node" is an eliminated morpheme-context reference
    const output = "Create an Agent node in Neo4j to represent the model.\n" +
      "x".repeat(300);
    const flags = detectHallucinations(output, makeTask());
    const entityFlags = flags.filter((f) => f.level === "content");
    expect(entityFlags.length).toBeGreaterThan(0);
    expect(entityFlags.some((f) => f.description.includes("Agent node"))).toBe(true);
  });
});

describe("CANONICAL_PIPELINE_STAGES — 7-stage pipeline", () => {
  it("contains exactly 7 stages", () => {
    expect(CANONICAL_PIPELINE_STAGES).toHaveLength(7);
  });

  it("contains all canonical stage names", () => {
    expect(CANONICAL_PIPELINE_STAGES).toContain("SURVEY");
    expect(CANONICAL_PIPELINE_STAGES).toContain("DECOMPOSE");
    expect(CANONICAL_PIPELINE_STAGES).toContain("CLASSIFY");
    expect(CANONICAL_PIPELINE_STAGES).toContain("SEQUENCE");
    expect(CANONICAL_PIPELINE_STAGES).toContain("GATE");
    expect(CANONICAL_PIPELINE_STAGES).toContain("DISPATCH");
    expect(CANONICAL_PIPELINE_STAGES).toContain("ADAPT");
  });
});
