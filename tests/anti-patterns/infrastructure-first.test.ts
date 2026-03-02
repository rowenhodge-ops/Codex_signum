/**
 * Anti-Pattern: Infrastructure-First — core must not import provider SDKs or infrastructure.
 *
 * The library is substrate-agnostic. It uses interfaces (ModelExecutor, TaskExecutor,
 * GraphObserver) to let consumers inject their own infrastructure. Core MUST NOT
 * import specific LLM SDKs, database drivers beyond abstract graph interfaces,
 * or consumer application dependencies.
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

describe("Infrastructure-First: no LLM SDK imports in src/", () => {
  const srcFiles = collectTsFiles("src");
  const forbiddenSdks = [
    "@anthropic-ai/sdk",
    "openai",
    "@google-cloud/aiplatform",
    "google-generativeai",
    "@mistralai",
    "cohere-ai",
    "replicate",
  ];

  it("no provider SDK imports in any src/ file", () => {
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, "utf-8");
      for (const sdk of forbiddenSdks) {
        expect(
          content,
          `${file} imports ${sdk}`,
        ).not.toMatch(new RegExp(`from\\s+["']${sdk.replace(/[/\\]/g, "\\$&")}`, "i"));
      }
    }
  });

  it("no fetch() calls in src/ (provider calls go through ModelExecutor)", () => {
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, "utf-8");
      // Allow 'fetch' in comments and type definitions, but not as function calls
      const fetchCalls = content.match(/(?<!\/\/.*)\bfetch\s*\(/g);
      expect(
        fetchCalls,
        `${file} calls fetch() directly`,
      ).toBeNull();
    }
  });
});

describe("Infrastructure-First: no database driver imports in src/", () => {
  const srcFiles = collectTsFiles("src");

  it("no neo4j-driver import outside graph/ module", () => {
    const nonGraphFiles = srcFiles.filter(
      (f) => !f.replace(/\\/g, "/").includes("src/graph/"),
    );
    for (const file of nonGraphFiles) {
      const content = fs.readFileSync(file, "utf-8");
      expect(
        content,
        `${file} imports neo4j-driver outside graph/`,
      ).not.toMatch(/from\s+["']neo4j-driver/);
    }
  });

  it("no MongoDB/PostgreSQL/MySQL imports in src/", () => {
    const forbiddenDbs = ["mongodb", "mongoose", "pg", "mysql", "mysql2", "typeorm", "prisma"];
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, "utf-8");
      for (const db of forbiddenDbs) {
        expect(
          content,
          `${file} imports ${db}`,
        ).not.toMatch(new RegExp(`from\\s+["']${db}`, "i"));
      }
    }
  });
});

describe("Infrastructure-First: no consumer application imports in src/", () => {
  const srcFiles = collectTsFiles("src");

  it("no DND-Manager imports in src/", () => {
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, "utf-8");
      expect(
        content,
        `${file} imports DND-Manager`,
      ).not.toMatch(/from\s+["'].*dnd-manager/i);
    }
  });

  it("no consumer-specific types (character sheets, campaigns, etc.) in src/", () => {
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, "utf-8");
      expect(content, `${file} references character sheets`).not.toMatch(
        /CharacterSheet|Campaign|DungeonMaster|PlayerCharacter/,
      );
    }
  });
});

describe("Infrastructure-First: core uses interfaces for injection", () => {
  it("ModelExecutor is an interface, not a concrete implementation", () => {
    const typesContent = fs.readFileSync(
      "src/patterns/architect/types.ts",
      "utf-8",
    );
    expect(typesContent).toContain("export interface ModelExecutor");
    expect(typesContent).not.toContain("export class ModelExecutor");
  });

  it("TaskExecutor is an interface, not a concrete implementation", () => {
    const typesContent = fs.readFileSync(
      "src/patterns/architect/types.ts",
      "utf-8",
    );
    expect(typesContent).toContain("export interface TaskExecutor");
    expect(typesContent).not.toContain("export class TaskExecutor");
  });

  it("DevAgentModelExecutor is a type alias, not a concrete implementation", () => {
    const typesContent = fs.readFileSync(
      "src/patterns/dev-agent/types.ts",
      "utf-8",
    );
    // DevAgentModelExecutor is a function type alias (not a class)
    expect(typesContent).toMatch(/export type DevAgentModelExecutor\s*=/);
    expect(typesContent).not.toContain("export class DevAgentModelExecutor");
  });

  it("mock executors exist for testing (not provider-specific)", () => {
    expect(
      fs.existsSync("src/patterns/architect/mock-model-executor.ts"),
    ).toBe(true);
    expect(
      fs.existsSync("src/patterns/architect/mock-task-executor.ts"),
    ).toBe(true);

    const mockModel = fs.readFileSync(
      "src/patterns/architect/mock-model-executor.ts",
      "utf-8",
    );
    // Mock executor should not import any provider SDK
    expect(mockModel).not.toMatch(/from\s+["']@anthropic-ai/);
    expect(mockModel).not.toMatch(/from\s+["']openai/);
  });
});

describe("Infrastructure-First: no prepare script in package.json", () => {
  it("package.json does not contain a prepare script", () => {
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
    expect(pkg.scripts?.prepare).toBeUndefined();
  });
});
