/**
 * Anti-Pattern: Shadow System — no parallel state outside the graph.
 *
 * "State is structural" means the Neo4j graph is the single source of truth.
 * Tests verify that:
 * - No SQLite, JSON caches, or log-as-state patterns exist in src/
 * - No Observer class instantiation exists (interface is OK, class is not)
 * - computation/ modules are pure functions, not stateful services
 * - No separate health database or monitoring overlay
 * Level: L5 Invariant
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

function collectTsFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTsFiles(fullPath));
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      results.push(fullPath);
    }
  }
  return results;
}

describe("Shadow System: no parallel state stores in src/", () => {
  const srcFiles = collectTsFiles("src");

  it("no SQLite imports in src/", () => {
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, "utf-8");
      expect(content, `${file} imports sqlite`).not.toMatch(
        /import.*(?:sqlite3|better-sqlite|sql\.js)/,
      );
    }
  });

  it("no JSON file writes in src/ (fs.writeFileSync for JSON state)", () => {
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, "utf-8");
      // Allow writeFileSync in general, but not with .json extensions for state caching
      const jsonWriteMatch = content.match(
        /writeFileSync\s*\([^)]*\.json/,
      );
      expect(
        jsonWriteMatch,
        `${file} writes JSON state files`,
      ).toBeNull();
    }
  });

  it("no localStorage or sessionStorage usage in src/", () => {
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, "utf-8");
      expect(content, `${file} uses localStorage`).not.toMatch(
        /localStorage|sessionStorage/,
      );
    }
  });

  it("no Redis client imports in src/", () => {
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, "utf-8");
      expect(content, `${file} imports Redis`).not.toMatch(
        /import.*(?:redis|ioredis)/,
      );
    }
  });
});

describe("Shadow System: no Observer class instantiation in src/", () => {
  const srcFiles = collectTsFiles("src");

  it("no 'class Observer' definition in src/", () => {
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, "utf-8");
      expect(content, `${file} defines class Observer`).not.toMatch(
        /class\s+Observer\s/,
      );
    }
  });

  it("no 'new Observer(' instantiation in src/", () => {
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, "utf-8");
      expect(content, `${file} instantiates Observer`).not.toMatch(
        /new\s+Observer\s*\(/,
      );
    }
  });

  it("GraphObserver is an interface, not a class", () => {
    const feedbackTypes = fs.readFileSync(
      "src/patterns/feedback/types.ts",
      "utf-8",
    );
    expect(feedbackTypes).toContain("export interface GraphObserver");
    expect(feedbackTypes).not.toContain("export class GraphObserver");
  });
});

describe("Shadow System: computation modules are pure functions", () => {
  const computeDir = "src/computation";
  const computeFiles = collectTsFiles(computeDir);

  it("no global mutable state (let at module scope) in computation/", () => {
    for (const file of computeFiles) {
      const content = fs.readFileSync(file, "utf-8");
      // Split into lines and check for top-level let declarations
      // (not inside functions/classes — we check for lines starting with 'let' or 'export let')
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Skip lines inside functions/blocks (crude heuristic: not indented = top level)
        if (
          lines[i].match(/^(export\s+)?let\s+/) &&
          !lines[i].trim().startsWith("//")
        ) {
          // Allow 'export let' only if it's actually a const-like pattern
          expect(line).not.toMatch(
            /^(export\s+)?let\s+\w+\s*=/,
          );
        }
      }
    }
  });

  it("no Math.random() in computation/ (determinism required)", () => {
    for (const file of computeFiles) {
      const content = fs.readFileSync(file, "utf-8");
      expect(content, `${file} uses Math.random()`).not.toContain(
        "Math.random()",
      );
    }
  });

  it("no Date.now() side effects in computation/ (except signal/conditioning pipeline)", () => {
    // Signal pipeline and conditioning modules legitimately use timestamps
    const nonSignalFiles = computeFiles.filter(
      (f) =>
        !f.includes("signals") &&
        !f.includes("signal-conditioning") &&
        !f.includes("condition-value"),
    );
    for (const file of nonSignalFiles) {
      const content = fs.readFileSync(file, "utf-8");
      expect(content, `${file} uses Date.now()`).not.toContain("Date.now()");
    }
  });
});

describe("Shadow System: no Prometheus/Grafana/DataDog patterns in src/", () => {
  const srcFiles = collectTsFiles("src");

  it("no metrics registry or counter/gauge/histogram in src/", () => {
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, "utf-8");
      expect(content, `${file} contains metrics patterns`).not.toMatch(
        /(?:prometheus|prom-client|datadog|grafana|statsd)/i,
      );
    }
  });

  it("no 'dashboard' function or class in src/", () => {
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, "utf-8");
      expect(content, `${file} contains dashboard`).not.toMatch(
        /(?:export\s+(?:function|class)\s+\w*[Dd]ashboard)/,
      );
    }
  });
});
