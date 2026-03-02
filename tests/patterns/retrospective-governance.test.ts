/**
 * Retrospective Governance — verifies that the retrospective pattern
 * enforces "state is structural" by reading from graph, not maintaining
 * parallel state. Also verifies type contracts.
 *
 * Level: L2 Contract + L5 Invariant
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";

describe("Retrospective: reads from graph, does not maintain parallel state", () => {
  const retroContent = fs.readFileSync(
    "src/patterns/retrospective/retrospective.ts",
    "utf-8",
  );

  it("runRetrospective imports from graph/client (queries graph)", () => {
    expect(retroContent).toContain('from "../../graph/client.js"');
  });

  it("uses graph queries, not in-memory computation", () => {
    expect(retroContent).toContain("queryOverallSuccess");
    expect(retroContent).toContain("queryConvergence");
    expect(retroContent).toContain("queryStageHealth");
    expect(retroContent).toContain("queryDegradation");
  });

  it("does not import computation modules (no ΦL/ΨH recomputation)", () => {
    expect(retroContent).not.toContain('from "../../computation/');
  });

  it("does not create local caches or state stores", () => {
    expect(retroContent).not.toContain("Map(");
    expect(retroContent).not.toContain("new Set");
    // The only mutable state is insightNodeIds (return value accumulator)
    expect(retroContent).not.toMatch(/(?:let|var)\s+\w+\s*=\s*new Map/);
  });

  it("runs queries concurrently with Promise.all (not sequential)", () => {
    expect(retroContent).toContain("Promise.all");
  });
});

describe("Retrospective: writes only DistilledInsight nodes (not monitoring)", () => {
  const retroContent = fs.readFileSync(
    "src/patterns/retrospective/retrospective.ts",
    "utf-8",
  );

  it("only writes DistilledInsight nodes to graph", () => {
    // Check the write function name
    expect(retroContent).toContain("writeDistilledInsight");
    // Uses MERGE for DistilledInsight — idempotent
    expect(retroContent).toContain("MERGE (di:DistilledInsight");
  });

  it("writeInsights is opt-in (default: false)", () => {
    expect(retroContent).toContain("writeInsights = false");
  });

  it("only writes for 'diverging' clusters (high-signal only)", () => {
    expect(retroContent).toContain('"diverging"');
    // Filter to only diverging before writing
    expect(retroContent).toMatch(/filter.*diverging|diverging.*filter/s);
  });
});

describe("Retrospective: type contracts are correct", () => {
  const typesContent = fs.readFileSync(
    "src/patterns/retrospective/types.ts",
    "utf-8",
  );

  it("RetrospectiveOptions has windowHours, bloomIds, writeInsights", () => {
    expect(typesContent).toContain("windowHours");
    expect(typesContent).toContain("bloomIds");
    expect(typesContent).toContain("writeInsights");
  });

  it("RetrospectiveInsights includes all required output fields", () => {
    expect(typesContent).toContain("overallSuccessRate");
    expect(typesContent).toContain("convergence");
    expect(typesContent).toContain("stages");
    expect(typesContent).toContain("degradation");
    expect(typesContent).toContain("insightNodeIds");
  });

  it("ConvergenceReading has 4 status values", () => {
    expect(typesContent).toContain("converging");
    expect(typesContent).toContain("stable");
    expect(typesContent).toContain("diverging");
    expect(typesContent).toContain("insufficient_data");
  });

  it("DegradationReading tracks recovery status", () => {
    expect(typesContent).toContain("recovered");
    expect(typesContent).toContain("lowestBandReached");
  });
});

describe("Retrospective: no LLM dependency", () => {
  const retroContent = fs.readFileSync(
    "src/patterns/retrospective/retrospective.ts",
    "utf-8",
  );

  it("does not import ModelExecutor or any executor interface", () => {
    expect(retroContent).not.toContain("ModelExecutor");
    expect(retroContent).not.toContain("TaskExecutor");
    expect(retroContent).not.toContain("DevAgentModelExecutor");
  });

  it("does not reference fetch or API calls", () => {
    expect(retroContent).not.toMatch(/\bfetch\s*\(/);
    expect(retroContent).not.toContain("api.anthropic");
    expect(retroContent).not.toContain("openai");
  });
});
