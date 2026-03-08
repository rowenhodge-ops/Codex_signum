/**
 * G1. Proximity — Connections only exist where explicitly created (Lines).
 *
 * Tests that the Neo4j schema uses typed relationships (not generic CONNECTED_TO),
 * and that all graph writes create explicit, named relationships.
 * Level: L2 Contract + L5 Invariant
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";

describe("G1 Proximity: schema uses typed relationships only", () => {
  const schemaContent = fs.readFileSync("src/graph/schema.ts", "utf-8");

  it("schema does NOT define a generic CONNECTED_TO relationship", () => {
    expect(schemaContent).not.toContain("CONNECTED_TO");
  });

  it("schema uses morpheme-specific relationship names", () => {
    // These are the canonical relationship types
    expect(schemaContent).toContain("ROUTED_TO");
    expect(schemaContent).toContain("ORIGINATED_FROM");
    expect(schemaContent).toContain("OBSERVED_IN");
  });

  it("migration defines typed relationship renames (not generic ones)", () => {
    // Migration explicitly names relationship types
    expect(schemaContent).toContain("SELECTED");  // Old name
    expect(schemaContent).toContain("ROUTED_TO");  // New name
    expect(schemaContent).toContain("MADE_BY");    // Old name
    expect(schemaContent).toContain("ORIGINATED_FROM"); // New name
  });
});

// Helper: read all query module source files
const readAllQueryModules = () =>
  fs.readdirSync("src/graph/queries")
    .filter((f: string) => f.endsWith(".ts"))
    .map((f: string) => fs.readFileSync(`src/graph/queries/${f}`, "utf-8"))
    .join("\n");

describe("G1 Proximity: graph writes create named relationships", () => {
  const writeObsContent = fs.readFileSync("src/graph/write-observation.ts", "utf-8");
  const queriesContent = readAllQueryModules();

  it("ThresholdEvent uses THRESHOLD_CROSSED_BY relationship", () => {
    expect(writeObsContent).toContain("THRESHOLD_CROSSED_BY");
  });

  it("Observation uses OBSERVED_IN relationship to Bloom", () => {
    // recordObservation in queries.ts creates OBSERVED_IN relationship
    expect(queriesContent).toContain("OBSERVED_IN");
  });
});

describe("G1 Proximity: graph queries use typed relationships", () => {
  const queriesContent = readAllQueryModules();

  it("Decision → Seed uses ROUTED_TO relationship", () => {
    expect(queriesContent).toContain("ROUTED_TO");
  });

  it("Decision → Bloom uses ORIGINATED_FROM relationship", () => {
    expect(queriesContent).toContain("ORIGINATED_FROM");
  });

  it("no CONNECTED_TO in any graph query", () => {
    expect(queriesContent).not.toContain("CONNECTED_TO");
  });
});
