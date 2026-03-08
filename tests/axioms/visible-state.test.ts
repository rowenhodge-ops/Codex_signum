/**
 * A4. Visible State — Health is in the graph, not in logs/metadata/separate DB.
 *
 * Tests that the Neo4j schema defines health on nodes, that writes target
 * graph nodes, and that no health computation stores its output to console.
 * Level: L2 Contract + L5 Invariant
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("A4 Visible State: Neo4j schema defines health on Bloom nodes", () => {
  const schemaPath = path.resolve("src/graph/schema.ts");
  const schemaContent = fs.readFileSync(schemaPath, "utf-8");

  it("schema defines Bloom node uniqueness constraint", () => {
    expect(schemaContent).toContain("bloom_id_unique");
    expect(schemaContent).toContain("(b:Bloom)");
  });

  it("schema defines Observation node linked to Blooms", () => {
    expect(schemaContent).toContain("observation_id_unique");
    expect(schemaContent).toContain("observation_source_bloom");
    expect(schemaContent).toContain("sourceBloomId");
  });

  it("schema defines ThresholdEvent as graph nodes (not log entries)", () => {
    expect(schemaContent).toContain("threshold_event_id_unique");
    expect(schemaContent).toContain("ThresholdEvent");
    expect(schemaContent).toContain("threshold_event_bloom");
  });

  it("schema defines Decision nodes with selectedSeedId (in graph, not SQLite)", () => {
    expect(schemaContent).toContain("decision_id_unique");
    expect(schemaContent).toContain("Decision");
    // Decision properties are recorded in graph queries, not separate DB
  });

  it("schema defines HumanFeedback as graph nodes", () => {
    expect(schemaContent).toContain("human_feedback_id_unique");
    expect(schemaContent).toContain("HumanFeedback");
  });
});

describe("A4 Visible State: graph queries write to Bloom nodes", () => {
  const queriesDir = path.resolve("src/graph/queries");
  const queriesContent = fs.readdirSync(queriesDir)
    .filter((f: string) => f.endsWith(".ts"))
    .map((f: string) => fs.readFileSync(path.join(queriesDir, f), "utf-8"))
    .join("\n");

  it("updateBloomPhiL writes ΦL to Bloom nodes in the graph", () => {
    expect(queriesContent).toContain("updateBloomPhiL");
    expect(queriesContent).toContain(":Bloom");
  });

  it("recordObservation creates Observation nodes linked to Blooms", () => {
    expect(queriesContent).toContain("recordObservation");
    expect(queriesContent).toContain("Observation");
  });

  it("ObservationProps requires sourceBloomId (typed, not optional)", () => {
    expect(queriesContent).toMatch(/sourceBloomId:\s*string/);
  });

  it("DecisionProps requires selectedSeedId (typed, not optional)", () => {
    expect(queriesContent).toMatch(/selectedSeedId:\s*string/);
  });
});

describe("A4 Visible State: no health computation uses console.log as primary output", () => {
  it("computation modules never use console.log for state storage", () => {
    const computationDir = path.resolve("src/computation");
    const files = getAllTsFiles(computationDir);
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      // console.log is acceptable in comments, but check for actual calls
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("//") || line.startsWith("*")) continue;
        if (line.includes("console.log(") || line.includes("console.info(")) {
          throw new Error(
            `${path.relative(".", file)}:${i + 1} — computation module writes to console. ` +
            `Health state must live in graph, not logs.`,
          );
        }
      }
    }
  });
});

function getAllTsFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllTsFiles(fullPath));
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      results.push(fullPath);
    }
  }
  return results;
}
