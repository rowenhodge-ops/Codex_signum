/**
 * Spec Gap: A4 Visible State — Pattern Decisions Must Reach the Graph
 *
 * Codex v3.0 A4: "All state changes MUST be visible in the graph."
 * Engineering Bridge §Part 2: Decisions are graph nodes (Decision → ROUTED_TO → Seed).
 *
 * CURRENT VIOLATION:
 *   DevAgent (pipeline.ts) calls createDecision() and createObservation() which are
 *   pure in-memory factories. The Decision objects stay in a JS array, never persisted
 *   to Neo4j. The Observation return value is discarded entirely.
 *
 *   Architect (architect.ts) has ZERO graph imports — no recordDecision, no
 *   recordObservation, no writeTransaction. All 7 stages produce a PlanState JS object.
 *
 * WHAT THE SPEC REQUIRES:
 *   Every routing decision made by a pattern pipeline must create a Decision node
 *   in the graph via recordDecision(). Every execution outcome must create an
 *   Observation node via recordObservation() or writeObservation().
 *
 * THESE TESTS WILL FAIL. That's the point — they show where you stand.
 *
 * Level: L5 Invariant (spec-encoded)
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const SRC = path.resolve(__dirname, "../../src");

describe("A4 Spec Gap: DevAgent pipeline must persist decisions to graph", () => {
  const pipelinePath = path.join(SRC, "patterns/dev-agent/pipeline.ts");
  const pipelineContent = fs.readFileSync(pipelinePath, "utf-8");

  it("pipeline.ts imports recordDecision from graph/queries", () => {
    // Spec requires: decisions go to graph, not just in-memory
    // Current state: imports createDecision from memory/index.js (in-memory only)
    expect(pipelineContent).toMatch(/import\s.*recordDecision.*from.*graph/);
  });

  it("pipeline.ts imports recordObservation or writeObservation from graph/", () => {
    // Spec requires: observations are graph nodes (OBSERVED_IN relationship)
    // Current state: calls createObservation() whose return is discarded (line 206)
    expect(pipelineContent).toMatch(
      /import\s.*(recordObservation|writeObservation).*from.*graph/,
    );
  });

  it("pipeline.ts calls recordDecision() after creating a decision", () => {
    // Spec requires: every decision becomes a Decision node in the graph
    // Current state: only calls createDecision() → array push → never persisted
    expect(pipelineContent).toMatch(/await\s+recordDecision\s*\(/);
  });

  it("createObservation() return value is used (not discarded)", () => {
    // Current state: line 206 calls createObservation() without storing the result
    // This is a dead call — the observation is created and immediately garbage-collected
    const discardedObservation = /^\s*createObservation\(/m;
    const storedObservation = /(?:const|let|var)\s+\w+\s*=\s*createObservation\(/;
    const hasDiscarded = discardedObservation.test(pipelineContent);
    const hasStored = storedObservation.test(pipelineContent);

    // Should store the return value, not discard it
    expect(hasDiscarded).toBe(false);
    expect(hasStored).toBe(true);
  });
});

describe("A4 Spec Gap: Architect pipeline must persist decisions to graph", () => {
  const architectPath = path.join(SRC, "patterns/architect/architect.ts");
  const architectContent = fs.readFileSync(architectPath, "utf-8");

  it("architect.ts imports from graph/ module", () => {
    // Spec requires: architect stage transitions and model selections are visible in graph
    // Current state: ZERO imports from graph/ — entire pipeline is ephemeral JS objects
    expect(architectContent).toMatch(/from\s+["'].*graph/);
  });

  it("architect.ts records decisions for model selection at DECOMPOSE", () => {
    // The DECOMPOSE stage selects a model via ModelExecutor — this is a decision
    // Spec requires it to be a Decision node in the graph
    expect(architectContent).toMatch(/recordDecision/);
  });

  it("architect.ts records stage transition events", () => {
    // Each status change (surveying → decomposing → classifying → ...) is a state change
    // Spec A4 requires all state changes to be visible in the graph
    // Current state: planState.status is updated in a JS object, never persisted
    expect(architectContent).toMatch(
      /recordObservation|writeObservation|writeTransaction/,
    );
  });
});
