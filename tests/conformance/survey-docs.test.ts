/**
 * Codex Signum — Conformance Tests: SURVEY Document Discovery
 *
 * Tests for the document-awareness features added to SURVEY:
 * - discoverDocumentSources() discovers .md files and extracts claims
 * - extractClaims() catches formula, warning, threshold, recommendation patterns
 * - survey() includes documentSources in output and handles missing docs gracefully
 * - Document claims generate "research-divergence" gaps when code disagrees
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  discoverDocumentSources,
  extractClaims,
  parseHypotheses,
  survey,
} from "../../src/patterns/architect/index.js";

// ── Temp directory helpers ───────────────────────────────────────────────────

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "survey-docs-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeTmpFile(relPath: string, content: string): string {
  const abs = path.join(tmpDir, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, "utf-8");
  return abs;
}

// ── extractClaims() ──────────────────────────────────────────────────────────

describe("extractClaims", () => {
  it("catches formula patterns with Greek letters and assignment", () => {
    const content = [
      "The effective dampening is computed as:",
      "γ_effective = min(0.7, 0.8 / (k - 1))",
      "Where k is the branching factor.",
    ].join("\n");

    const claims = extractClaims(content, "test.md");
    const formulaClaims = claims.filter((c) => c.type === "formula");
    expect(formulaClaims.length).toBeGreaterThan(0);
    expect(formulaClaims[0].text).toContain("γ_effective");
  });

  it("catches formula patterns with math operators (√, ×, ≤, ≥)", () => {
    const content = [
      "Hub dampening uses the square root formula:",
      "γ_hub = γ_base / √k",
      "This is not budget-capped.",
    ].join("\n");

    const claims = extractClaims(content, "test.md");
    const formulaClaims = claims.filter((c) => c.type === "formula");
    expect(formulaClaims.length).toBeGreaterThan(0);
    expect(formulaClaims[0].text).toContain("√k");
  });

  it("catches formula patterns with min/max functions", () => {
    const content = [
      "The recommended formula is:",
      "gamma = min(gamma_base, s / k)",
      "where s <= 0.8 is the propagation budget.",
    ].join("\n");

    const claims = extractClaims(content, "test.md");
    const formulaClaims = claims.filter((c) => c.type === "formula");
    expect(formulaClaims.length).toBeGreaterThan(0);
  });

  it("catches warning patterns: dangerously inadequate", () => {
    const content = [
      "Analysis of the hub dampening formula shows it is",
      "dangerously inadequate for networks with k ≥ 3.",
      "It produces supercritical behavior with μ > 1.",
    ].join("\n");

    const claims = extractClaims(content, "test.md");
    const warnings = claims.filter((c) => c.type === "warning");
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w) => /dangerously/i.test(w.text))).toBe(true);
  });

  it("catches warning patterns: supercritical", () => {
    const content = [
      "This configuration produces supercritical cascade behavior.",
      "The system becomes unstable when the branching ratio exceeds 1.",
    ].join("\n");

    const claims = extractClaims(content, "test.md");
    const warnings = claims.filter((c) => c.type === "warning");
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w) => /supercritical/i.test(w.text))).toBe(true);
  });

  it("catches warning patterns: CRITICAL and WARNING caps", () => {
    const content = [
      "CRITICAL: The following formula produces incorrect results.",
      "WARNING: Do not use γ = 0.7 as a fixed constant.",
    ].join("\n");

    const claims = extractClaims(content, "test.md");
    const warnings = claims.filter((c) => c.type === "warning");
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("catches threshold patterns: must be < 1", () => {
    const content = [
      "For stability, the propagation ratio μ must be < 1.",
      "The cascade depth limit must not exceed 2 hops.",
    ].join("\n");

    const claims = extractClaims(content, "test.md");
    const thresholds = claims.filter((c) => c.type === "threshold");
    expect(thresholds.length).toBeGreaterThan(0);
  });

  it("catches threshold patterns: budget of 0.8", () => {
    const content = [
      "The propagation budget is constrained with s ≤ 0.8",
      "to ensure sub-critical behavior across all topologies.",
    ].join("\n");

    const claims = extractClaims(content, "test.md");
    const thresholds = claims.filter((c) => c.type === "threshold");
    expect(thresholds.length).toBeGreaterThan(0);
    expect(thresholds.some((t) => /0\.8/.test(t.text))).toBe(true);
  });

  it("catches recommendation patterns: should use / replace with", () => {
    const content = [
      "The correct formula: replace with min(γ_base, s/k).",
      "You should use the budget-capped version instead.",
    ].join("\n");

    const claims = extractClaims(content, "test.md");
    const recs = claims.filter((c) => c.type === "recommendation");
    expect(recs.length).toBeGreaterThan(0);
  });

  it("catches recommendation patterns: budget-capped", () => {
    const content = [
      "The recommended fix is to use a budget-capped formula",
      "that enforces s ≤ 0.8 at all branching factors.",
    ].join("\n");

    const claims = extractClaims(content, "test.md");
    const recs = claims.filter((c) => c.type === "recommendation");
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.some((r) => /budget.capped/i.test(r.text))).toBe(true);
  });

  it("catches architectural assertion patterns: state is structural", () => {
    const content = [
      "In Codex Signum, state is structural — the graph is truth.",
      "All monitoring must use Cypher queries, not wrapper classes.",
    ].join("\n");

    const claims = extractClaims(content, "test.md");
    const arch = claims.filter((c) => c.type === "architectural");
    expect(arch.length).toBeGreaterThan(0);
    expect(arch.some((a) => /state is structural/i.test(a.text))).toBe(true);
  });

  it("returns empty array for content with no claims", () => {
    const content = "# Introduction\nThis document describes the system.";
    const claims = extractClaims(content, "test.md");
    expect(claims).toEqual([]);
  });

  it("includes correct lineNumber in claims", () => {
    const content = ["# Header", "", "γ_eff = min(0.7, 0.8 / (k-1))"].join(
      "\n",
    );
    const claims = extractClaims(content, "test.md");
    const formulaClaim = claims.find((c) => c.type === "formula");
    expect(formulaClaim).toBeDefined();
    expect(formulaClaim!.lineNumber).toBe(3);
  });

  it("claim text is capped at ~200 chars", () => {
    const longLine =
      "γ_effective = " + "x".repeat(300) + " = some very long formula value";
    const claims = extractClaims(longLine, "test.md");
    for (const claim of claims) {
      expect(claim.text.length).toBeLessThanOrEqual(200);
    }
  });
});

// ── discoverDocumentSources() ────────────────────────────────────────────────

describe("discoverDocumentSources", () => {
  it("discovers .md files in a temp directory and returns structured output", () => {
    writeTmpFile(
      "docs/spec.md",
      "# Spec Doc\n\nγ_effective = min(0.7, 0.8/(k-1))\n",
    );
    writeTmpFile(
      "docs/research.md",
      "# Research\n\ndangerously inadequate formula found.\n",
    );

    const blindSpots: { description: string; resolution: string }[] = [];
    const sources = discoverDocumentSources(
      tmpDir,
      ["docs/"],
      blindSpots,
    );

    expect(sources.length).toBe(2);
    const paths = sources.map((s) => s.path.replace(/\\/g, "/"));
    expect(paths.some((p) => p.includes("spec.md"))).toBe(true);
    expect(paths.some((p) => p.includes("research.md"))).toBe(true);
  });

  it("extracts title from first # heading", () => {
    writeTmpFile("docs/my-doc.md", "# My Document Title\n\nContent here.\n");

    const blindSpots: { description: string; resolution: string }[] = [];
    const sources = discoverDocumentSources(tmpDir, ["docs/"], blindSpots);

    expect(sources.length).toBe(1);
    expect(sources[0].title).toBe("My Document Title");
  });

  it("falls back to filename when no # heading", () => {
    writeTmpFile("docs/no-heading.md", "Just content without a heading.\n");

    const blindSpots: { description: string; resolution: string }[] = [];
    const sources = discoverDocumentSources(tmpDir, ["docs/"], blindSpots);

    expect(sources.length).toBe(1);
    expect(sources[0].title).toBe("no-heading");
  });

  it("caps content at 16000 chars", () => {
    const longContent = "# Big Doc\n\n" + "x ".repeat(10000);
    writeTmpFile("docs/big.md", longContent);

    const blindSpots: { description: string; resolution: string }[] = [];
    const sources = discoverDocumentSources(tmpDir, ["docs/"], blindSpots);

    expect(sources[0].content.length).toBeLessThanOrEqual(16000);
  });

  it("runs claim extraction on each document", () => {
    writeTmpFile(
      "docs/spec.md",
      "# Spec\n\nγ_eff = min(0.7, 0.8/(k-1))\nThis formula is dangerously inadequate.\n",
    );

    const blindSpots: { description: string; resolution: string }[] = [];
    const sources = discoverDocumentSources(tmpDir, ["docs/"], blindSpots);

    expect(sources[0].extractedClaims.length).toBeGreaterThan(0);
  });

  it("recursively finds .md files in subdirectories", () => {
    writeTmpFile("docs/specs/a.md", "# Spec A\n\nContent.\n");
    writeTmpFile("docs/research/b.md", "# Research B\n\nContent.\n");

    const blindSpots: { description: string; resolution: string }[] = [];
    const sources = discoverDocumentSources(tmpDir, ["docs/"], blindSpots);

    expect(sources.length).toBe(2);
  });

  it("adds a blind spot (not a crash) when docs directory does not exist", () => {
    const blindSpots: { description: string; resolution: string }[] = [];
    const sources = discoverDocumentSources(
      tmpDir,
      ["docs/nonexistent/"],
      blindSpots,
    );

    expect(sources).toEqual([]);
    expect(blindSpots.length).toBeGreaterThan(0);
    expect(blindSpots[0].description).toContain("not found");
  });

  it("deduplicates files when the same path appears via multiple docsPaths", () => {
    writeTmpFile("docs/shared.md", "# Shared\n\nContent.\n");

    const blindSpots: { description: string; resolution: string }[] = [];
    // Pass "docs/" twice — should only discover shared.md once
    const sources = discoverDocumentSources(
      tmpDir,
      ["docs/", "docs/"],
      blindSpots,
    );

    const paths = sources.map((s) => s.path);
    const uniquePaths = new Set(paths);
    expect(paths.length).toBe(uniquePaths.size);
  });
});

// ── survey() integration ─────────────────────────────────────────────────────

describe("survey() — document source integration", () => {
  it("includes documentSources in output when docs directories exist", async () => {
    // Set up a minimal repo structure
    writeTmpFile("package.json", JSON.stringify({ name: "test" }));
    writeTmpFile("docs/specs/spec.md", "# Spec\n\nγ_eff = min(0.7, 0.8/(k-1))\n");
    writeTmpFile("docs/research/paper.md", "# Research\n\ndangerously inadequate hub formula.\n");

    const result = await survey({
      repoPath: tmpDir,
      specificationRefs: [],
      docsPaths: ["docs/specs/", "docs/research/"],
    });

    expect(result.documentSources).toBeDefined();
    expect(result.documentSources.length).toBe(2);
  });

  it("returns empty documentSources (no crash) when docs directories do not exist", async () => {
    writeTmpFile("package.json", JSON.stringify({ name: "test" }));

    const result = await survey({
      repoPath: tmpDir,
      specificationRefs: [],
      docsPaths: ["docs/specs/", "docs/research/"],
    });

    expect(result.documentSources).toBeDefined();
    expect(result.documentSources).toEqual([]);
    // Should have blind spots noting the missing directories
    const docBlindSpots = result.blindSpots.filter((bs) =>
      bs.description.includes("not found"),
    );
    expect(docBlindSpots.length).toBeGreaterThan(0);
  });

  it("document claims generate research-divergence gaps when code has warned-about pattern", async () => {
    // Set up a minimal repo with a dampening file that uses Math.sqrt
    writeTmpFile("package.json", JSON.stringify({ name: "test" }));
    writeTmpFile(
      "src/computation/dampening.ts",
      [
        "// Hub dampening",
        "export function computeHubDampening(k: number, gammaBase: number): number {",
        "  return gammaBase / Math.sqrt(k);",
        "}",
      ].join("\n"),
    );
    writeTmpFile(
      "docs/research/safety.md",
      [
        "# Safety Analysis",
        "",
        "WARNING: The hub dampening formula γ_base/√k is dangerously inadequate.",
        "It produces supercritical behavior (μ > 1) for k ≥ 3.",
        "The sqrt(k) denominator does not sufficiently suppress cascade propagation.",
      ].join("\n"),
    );

    const result = await survey({
      repoPath: tmpDir,
      specificationRefs: [],
      docsPaths: ["docs/research/"],
    });

    const divergenceGaps = result.gapAnalysis.gaps.filter(
      (g) => g.category === "research-divergence",
    );
    expect(divergenceGaps.length).toBeGreaterThan(0);
    const hubGap = divergenceGaps.find((g) =>
      g.id.includes("hub-dampening"),
    );
    expect(hubGap).toBeDefined();
    expect(hubGap!.severity).toBe("critical");
  });

  it("confidence is lower when no documentSources are found", async () => {
    writeTmpFile("package.json", JSON.stringify({ name: "test" }));

    const resultNoDocs = await survey({
      repoPath: tmpDir,
      specificationRefs: [],
      docsPaths: ["docs/specs/"],
    });

    writeTmpFile(
      "docs/specs/spec.md",
      "# Spec\n\nγ_eff = min(0.7, 0.8/(k-1))\n",
    );

    const resultWithDocs = await survey({
      repoPath: tmpDir,
      specificationRefs: [],
      docsPaths: ["docs/specs/"],
    });

    expect(resultNoDocs.confidence).toBeLessThan(resultWithDocs.confidence);
  });
});

// ── parseHypotheses() ──────────────────────────────────────────────────────

describe("parseHypotheses", () => {
  it("extracts hypothesis ID, source, claim, and status from markdown", () => {
    writeTmpFile(
      "docs/hypotheses/test.md",
      [
        "# Test Hypotheses",
        "",
        "## H-001: Subcriticality Check",
        "",
        "- **Source:** Safety Analysis §4",
        "- **Claim:** γ_eff ensures subcriticality for all k",
        "- **Status:** validated",
        "- **Evidence:** tests exist",
        "",
        "## H-002: Depth Limit",
        "",
        "- **Source:** Engineering Bridge v2.0",
        "- **Claim:** Cascade depth limited to 2",
        "- **Status:** proposed",
        "- **Evidence:** not yet tested",
      ].join("\n"),
    );

    const hypotheses = parseHypotheses(tmpDir, "docs/hypotheses/");
    expect(hypotheses.length).toBe(2);

    const h1 = hypotheses.find((h) => h.id === "H-001");
    expect(h1).toBeDefined();
    expect(h1!.source).toBe("Safety Analysis §4");
    expect(h1!.claim).toContain("subcriticality");
    expect(h1!.status).toBe("validated");

    const h2 = hypotheses.find((h) => h.id === "H-002");
    expect(h2).toBeDefined();
    expect(h2!.status).toBe("proposed");
  });

  it("returns empty array when directory does not exist (no crash)", () => {
    const hypotheses = parseHypotheses(tmpDir, "docs/hypotheses/nonexistent/");
    expect(hypotheses).toEqual([]);
  });

  it("skips README.md", () => {
    writeTmpFile(
      "docs/hypotheses/README.md",
      "# Hypothesis Registry\n\n## H-999: Should Be Skipped\n\n- **Source:** test\n- **Claim:** test\n- **Status:** proposed\n",
    );
    writeTmpFile(
      "docs/hypotheses/real.md",
      "# Real\n\n## H-100: Real One\n\n- **Source:** test\n- **Claim:** real claim\n- **Status:** validated\n",
    );

    const hypotheses = parseHypotheses(tmpDir, "docs/hypotheses/");
    expect(hypotheses.length).toBe(1);
    expect(hypotheses[0].id).toBe("H-100");
  });

  it("handles all valid status values", () => {
    const statuses = [
      "proposed",
      "validated",
      "partially-validated",
      "invalidated",
      "superseded",
      "deferred",
    ];
    const blocks = statuses
      .map(
        (s, i) =>
          `## H-${String(i).padStart(3, "0")}: Status ${s}\n\n- **Source:** test\n- **Claim:** testing ${s}\n- **Status:** ${s}\n`,
      )
      .join("\n");
    writeTmpFile("docs/hypotheses/statuses.md", `# Statuses\n\n${blocks}`);

    const hypotheses = parseHypotheses(tmpDir, "docs/hypotheses/");
    expect(hypotheses.length).toBe(statuses.length);
    for (const s of statuses) {
      expect(hypotheses.some((h) => h.status === s)).toBe(true);
    }
  });

  it("defaults unknown status to proposed", () => {
    writeTmpFile(
      "docs/hypotheses/bad-status.md",
      "# Bad\n\n## H-050: Unknown Status\n\n- **Source:** test\n- **Claim:** test\n- **Status:** banana\n",
    );

    const hypotheses = parseHypotheses(tmpDir, "docs/hypotheses/");
    expect(hypotheses.length).toBe(1);
    expect(hypotheses[0].status).toBe("proposed");
  });
});

// ── survey() hypothesis integration ───────────────────────────────────────

describe("survey() — hypothesis integration", () => {
  it("includes hypotheses in output when docs/hypotheses/ exists", async () => {
    writeTmpFile("package.json", JSON.stringify({ name: "test" }));
    writeTmpFile(
      "docs/hypotheses/test.md",
      "# Test\n\n## H-001: Test\n\n- **Source:** test\n- **Claim:** test\n- **Status:** validated\n",
    );

    const result = await survey({
      repoPath: tmpDir,
      specificationRefs: [],
      hypothesesPath: "docs/hypotheses/",
    });

    expect(result.hypotheses).toBeDefined();
    expect(result.hypotheses.length).toBe(1);
    expect(result.hypotheses[0].id).toBe("H-001");
  });

  it("returns empty hypotheses (no crash) when directory does not exist", async () => {
    writeTmpFile("package.json", JSON.stringify({ name: "test" }));

    const result = await survey({
      repoPath: tmpDir,
      specificationRefs: [],
      hypothesesPath: "docs/hypotheses/nonexistent/",
    });

    expect(result.hypotheses).toBeDefined();
    expect(result.hypotheses).toEqual([]);
  });

  it("confidence is lower when proposed hypotheses exist", async () => {
    writeTmpFile("package.json", JSON.stringify({ name: "test" }));

    // Without hypotheses
    const resultNoHyp = await survey({
      repoPath: tmpDir,
      specificationRefs: [],
      hypothesesPath: "docs/hypotheses/nonexistent/",
    });

    // With proposed hypotheses
    writeTmpFile(
      "docs/hypotheses/test.md",
      "# Test\n\n## H-001: Untested\n\n- **Source:** test\n- **Claim:** untested claim\n- **Status:** proposed\n",
    );

    const resultWithProposed = await survey({
      repoPath: tmpDir,
      specificationRefs: [],
      hypothesesPath: "docs/hypotheses/",
    });

    expect(resultWithProposed.confidence).toBeLessThan(resultNoHyp.confidence);
  });
});
