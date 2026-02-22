/**
 * Codex Signum — SURVEY Stage Implementation
 *
 * A pure function that reads filesystem and git state to produce a
 * structured audit of a repository's alignment with @codex-signum/core.
 *
 * Does NOT call any LLM. Does NOT require Neo4j. Is deterministic
 * given the same filesystem state.
 *
 * @module codex-signum-core/patterns/architect
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import type { BlindSpot, GapItem, SurveyInput, SurveyOutput } from "./types.js";

// ── Known core exports that consumer repos sometimes reimplement ────────────
const KNOWN_CORE_FUNCTIONS = [
  {
    name: "computePhiL",
    aliases: ["HealthComputer", "computeHealth", "computePhiL"],
    category: "computation",
  },
  {
    name: "computeEpsilonR",
    aliases: ["ExplorationTracker", "computeEpsilonR", "computeExploration"],
    category: "computation",
  },
  {
    name: "computePsiH",
    aliases: ["HarmonicResonance", "computePsiH", "computeHarmonic"],
    category: "computation",
  },
  {
    name: "computeDampening",
    aliases: ["DampeningEngine", "computeDampening"],
    category: "computation",
  },
  {
    name: "propagateDegradation",
    aliases: ["propagateDegradation", "DegradationCascade"],
    category: "computation",
  },
  {
    name: "DevAgent",
    aliases: ["hybridAgent", "PipelineOrchestrator"],
    category: "pipeline",
  },
  {
    name: "selectModel",
    aliases: ["ModelRouter", "selectModel"],
    category: "routing",
  },
  { name: "route", aliases: ["ThompsonRouter", "route"], category: "routing" },
  {
    name: "evaluateConstitution",
    aliases: ["ConstitutionalEngine", "evaluateConstitution"],
    category: "constitutional",
  },
];

// ── Directories to skip during tree walk ────────────────────────────────────
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  ".turbo",
]);

// ── File extensions to include in analysis ──────────────────────────────────
const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs"]);

// ────────────────────────────────────────────────────────────────────────────

/**
 * SURVEY — The Architect's reconnaissance stage.
 *
 * Reads the filesystem and git history of a repository and produces a
 * structured gap analysis comparing the codebase state against known
 * @codex-signum/core architectural expectations.
 */
export async function survey(input: SurveyInput): Promise<SurveyOutput> {
  const surveyId = `survey-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const blindSpots: BlindSpot[] = [];

  // ── 1. Directory tree ────────────────────────────────────────────────────
  const directorySummary = buildDirectorySummary(input.repoPath, 3, blindSpots);

  // ── 2. Key files ─────────────────────────────────────────────────────────
  const keyFiles = readKeyFiles(input.repoPath, blindSpots);

  // ── 3. Git log ───────────────────────────────────────────────────────────
  const recentCommits = readRecentCommits(input.repoPath, 20, blindSpots);

  // ── 4. Core imports ──────────────────────────────────────────────────────
  const coreImports = findCoreImports(input.repoPath, blindSpots);

  // ── 5. Duplication detection ─────────────────────────────────────────────
  const duplications = detectDuplications(
    input.repoPath,
    coreImports,
    blindSpots,
  );

  // ── 6. Entry points ──────────────────────────────────────────────────────
  const entryPoints = findEntryPoints(input.repoPath, keyFiles, blindSpots);

  // ── 7. Specification cross-reference ──────────────────────────────────────
  const { specGaps, whatNeedsBuilding } = await crossReferenceSpecs(
    input.specificationRefs,
    input.repoPath,
    blindSpots,
  );

  // ── 8. Graph state inspection ────────────────────────────────────────────
  const graphState = await inspectGraphState(
    input.graphClient ?? null,
    blindSpots,
  );

  // ── 8. Gap analysis from codebase state ─────────────────────────────────
  const codebaseGaps: GapItem[] = buildCodebaseGaps(
    duplications,
    coreImports,
    input.repoPath,
    blindSpots,
  );
  const gaps: GapItem[] = [...codebaseGaps, ...specGaps];

  // ── 9. Confidence score ──────────────────────────────────────────────────
  let confidence = 1.0;
  if (!keyFiles["package.json"]) confidence -= 0.2;
  if (recentCommits.length === 0) confidence -= 0.1;
  if (coreImports && Object.keys(coreImports).length === 0) confidence -= 0.1;
  if (input.specificationRefs.length > 0 && specGaps.length === 0)
    confidence -= 0.05; // Spec refs given but no assertions extracted
  confidence -= blindSpots.length * 0.03;
  confidence = Math.max(0.1, Math.min(1.0, confidence));

  const output: SurveyOutput = {
    surveyId,
    timestamp: new Date(),
    intent: input.intent,
    codebaseState: {
      directorySummary,
      keyFiles,
      recentCommits,
      coreImports,
      duplications,
      entryPoints,
    },
    graphState: graphState,
    gapAnalysis: {
      whatExists: buildWhatExists(coreImports),
      whatNeedsBuilding,
      whatNeedsFixing: buildWhatNeedsFixing(duplications),
      gaps,
    },
    confidence,
    blindSpots,
  };

  return output;
}

// ── Directory tree builder ───────────────────────────────────────────────────

function buildDirectorySummary(
  rootPath: string,
  maxDepth: number,
  blindSpots: BlindSpot[],
): string[] {
  const lines: string[] = [];

  try {
    walkDir(rootPath, "", 0, maxDepth, lines);
  } catch (err) {
    blindSpots.push({
      description: `Could not fully read directory tree at ${rootPath}: ${String(err)}`,
      resolution: "Ensure the path exists and is readable",
    });
  }

  return lines;
}

function walkDir(
  absPath: string,
  relPath: string,
  depth: number,
  maxDepth: number,
  lines: string[],
): void {
  if (depth > maxDepth) return;

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(absPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;

    const displayPath = relPath ? `${relPath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      lines.push(`${displayPath}/`);
      if (depth < maxDepth) {
        walkDir(
          path.join(absPath, entry.name),
          displayPath,
          depth + 1,
          maxDepth,
          lines,
        );
      }
    } else if (depth <= 2 || CODE_EXTENSIONS.has(path.extname(entry.name))) {
      // Only show code files at deeper levels to avoid noise
      lines.push(displayPath);
    }
  }
}

// ── Key file reader ──────────────────────────────────────────────────────────

function readKeyFiles(
  rootPath: string,
  blindSpots: BlindSpot[],
): Record<string, string> {
  const keyFiles: Record<string, string> = {};

  const candidates = [
    "package.json",
    "tsconfig.json",
    "src/index.ts",
    "index.ts",
    "README.md",
  ];

  for (const rel of candidates) {
    const fullPath = path.join(rootPath, rel);
    try {
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        // Keep size manageable — first 2000 chars
        keyFiles[rel] = content.slice(0, 2000);
      }
    } catch (err) {
      blindSpots.push({
        description: `Could not read ${rel}: ${String(err)}`,
        resolution: "Ensure file is readable",
      });
    }
  }

  // Also scan for barrel index.ts files at src/*/index.ts depth
  try {
    const srcPath = path.join(rootPath, "src");
    if (fs.existsSync(srcPath)) {
      const srcDirs = fs
        .readdirSync(srcPath, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name);

      for (const dir of srcDirs.slice(0, 10)) {
        const idxPath = path.join(srcPath, dir, "index.ts");
        try {
          if (fs.existsSync(idxPath)) {
            const content = fs.readFileSync(idxPath, "utf-8");
            keyFiles[`src/${dir}/index.ts`] = content.slice(0, 1000);
          }
        } catch {
          // skip
        }
      }
    }
  } catch (err) {
    blindSpots.push({
      description: `Could not scan src/ subdirectories: ${String(err)}`,
      resolution: "Ensure src/ directory is readable",
    });
  }

  return keyFiles;
}

// ── Git log reader ───────────────────────────────────────────────────────────

function readRecentCommits(
  rootPath: string,
  count: number,
  blindSpots: BlindSpot[],
): string[] {
  try {
    const output = execSync(`git log --oneline -${count}`, {
      cwd: rootPath,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return output.trim().split("\n").filter(Boolean);
  } catch {
    blindSpots.push({
      description: "Could not read git log — repository may not be initialized",
      resolution: "Ensure the path is a git repository with commits",
    });
    return [];
  }
}

// ── Core imports finder ──────────────────────────────────────────────────────

function findCoreImports(
  rootPath: string,
  blindSpots: BlindSpot[],
): Record<string, string[]> {
  const imports: Record<string, string[]> = {};

  const tsFiles = findTsFiles(rootPath, blindSpots);

  for (const filePath of tsFiles) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const relPath = path.relative(rootPath, filePath).replace(/\\/g, "/");

      // Find all import statements referencing @codex-signum/core
      const matches = content.match(
        /from\s+["'](@codex-signum\/core[^"']*)["']/g,
      );

      if (matches && matches.length > 0) {
        const importedSymbols: string[] = [];

        // Extract what's being imported
        const blockMatches = content.matchAll(
          /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+["']@codex-signum\/core[^"']*["']/g,
        );
        for (const match of blockMatches) {
          const symbols = match[1]
            .split(",")
            .map((s) =>
              s
                .trim()
                .replace(/\s+as\s+\w+/, "")
                .trim(),
            )
            .filter(Boolean);
          importedSymbols.push(...symbols);
        }

        // Also catch default/namespace imports
        const defaultMatches = content.matchAll(
          /import\s+(\w+)\s+from\s+["']@codex-signum\/core[^"']*["']/g,
        );
        for (const match of defaultMatches) {
          importedSymbols.push(match[1]);
        }

        imports[relPath] = importedSymbols;
      }
    } catch {
      // Skip unreadable files
    }
  }

  return imports;
}

function findTsFiles(rootPath: string, blindSpots: BlindSpot[]): string[] {
  const files: string[] = [];

  function recurse(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        recurse(fullPath);
      } else if (CODE_EXTENSIONS.has(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }
  }

  try {
    recurse(rootPath);
  } catch (err) {
    blindSpots.push({
      description: `Could not fully scan TypeScript files: ${String(err)}`,
      resolution: "Ensure directory is readable",
    });
  }

  return files;
}

// ── Duplication detector ─────────────────────────────────────────────────────

function detectDuplications(
  rootPath: string,
  coreImports: Record<string, string[]>,
  blindSpots: BlindSpot[],
): Array<{
  localFile: string;
  duplicates: string;
  confidence: "high" | "medium" | "low";
}> {
  const results: Array<{
    localFile: string;
    duplicates: string;
    confidence: "high" | "medium" | "low";
  }> = [];

  const allImportedFromCore = new Set(Object.values(coreImports).flat());

  const tsFiles = findTsFiles(rootPath, blindSpots);

  for (const filePath of tsFiles) {
    const relPath = path.relative(rootPath, filePath).replace(/\\/g, "/");

    // Skip the file itself if it's in core (when surveying core repo)
    if (relPath.startsWith("src/") || relPath.startsWith("dist/")) continue;

    let content: string;
    try {
      content = fs.readFileSync(filePath, "utf-8");
    } catch {
      continue;
    }

    const lineCount = content.split("\n").length;
    const fileName = path.basename(filePath, path.extname(filePath));

    for (const func of KNOWN_CORE_FUNCTIONS) {
      // Check if filename matches a known alias
      const filenameMatch = func.aliases.some(
        (alias) =>
          fileName.toLowerCase() === alias.toLowerCase() ||
          fileName.toLowerCase().includes(alias.toLowerCase()),
      );

      if (!filenameMatch) continue;

      // Check that this file is NOT just importing from core
      const isJustImporting = allImportedFromCore.has(func.name);

      // Check for local function definitions matching core function names
      const defPatterns = func.aliases.map(
        (a) => new RegExp(`(function|class|const|export)\\s+${a}\\b`),
      );
      const hasLocalDef = defPatterns.some((p) => p.test(content));

      if (!hasLocalDef && !filenameMatch) continue;

      // Determine confidence
      let confidence: "high" | "medium" | "low" = "low";
      if (filenameMatch && hasLocalDef) {
        confidence = "high";
      } else if (filenameMatch && lineCount > 50) {
        confidence = "medium";
      }

      // Only report if it looks like a reimplementation (not a thin wrapper that imports from core)
      const importsCore = coreImports[relPath]?.some((s) =>
        func.aliases.some((a) => a === s),
      );

      if (!importsCore || confidence === "high") {
        results.push({
          localFile: relPath,
          duplicates: `core:${func.name} (aliases: ${func.aliases.join(", ")})`,
          confidence: isJustImporting ? "low" : confidence,
        });
        break; // Don't double-report same file
      }
    }

    // Large pipeline files (>500 lines with staged pipeline keywords)
    if (
      lineCount > 500 &&
      /scope|execute|review|validate/i.test(content) &&
      /pipeline|agent|orchestrat/i.test(fileName.toLowerCase())
    ) {
      const alreadyReported = results.some((r) => r.localFile === relPath);
      if (!alreadyReported) {
        results.push({
          localFile: relPath,
          duplicates:
            "core:DevAgent (large monolith with pipeline stage keywords)",
          confidence: "medium",
        });
      }
    }
  }

  return results;
}

// ── Entry point finder ───────────────────────────────────────────────────────

function findEntryPoints(
  rootPath: string,
  keyFiles: Record<string, string>,
  blindSpots: BlindSpot[],
): string[] {
  const entryPoints: string[] = [];

  // Check package.json main/bin
  const pkgJson = keyFiles["package.json"];
  if (pkgJson) {
    try {
      const pkg = JSON.parse(pkgJson) as Record<string, unknown>;
      if (pkg["main"]) entryPoints.push(String(pkg["main"]));
      if (pkg["bin"]) {
        const bins = pkg["bin"];
        if (typeof bins === "string") {
          entryPoints.push(bins);
        } else if (typeof bins === "object" && bins !== null) {
          entryPoints.push(...Object.values(bins as Record<string, string>));
        }
      }
    } catch {
      blindSpots.push({
        description: "Could not parse package.json to find entry points",
        resolution: "Ensure package.json is valid JSON",
      });
    }
  }

  // Scan for CLI-style files
  const cliCandidates = [
    "agent/cli.ts",
    "cli.ts",
    "index.ts",
    "src/index.ts",
    "agent/tools/copilotBridge.ts",
  ];
  for (const candidate of cliCandidates) {
    const fullPath = path.join(rootPath, candidate);
    if (fs.existsSync(fullPath)) {
      entryPoints.push(candidate);
    }
  }

  // Check for bridge files (CodexBridge pattern)
  const bridgeCandidates = [
    "agent/codex-bridge.ts",
    "agent/routing/codexBridge.ts",
    "agent/hybridAgent.ts",
    "agent/devAgent.ts",
  ];
  for (const candidate of bridgeCandidates) {
    const fullPath = path.join(rootPath, candidate);
    if (fs.existsSync(fullPath)) {
      entryPoints.push(candidate);
    }
  }

  return [...new Set(entryPoints)]; // Deduplicate
}

// ── Gap builders ─────────────────────────────────────────────────────────────

function buildCodebaseGaps(
  duplications: Array<{
    localFile: string;
    duplicates: string;
    confidence: "high" | "medium" | "low";
  }>,
  coreImports: Record<string, string[]>,
  rootPath: string,
  _blindSpots: BlindSpot[],
): GapItem[] {
  const gaps: GapItem[] = [];

  // Gaps from duplication detection
  for (const dup of duplications) {
    if (dup.confidence === "high" || dup.confidence === "medium") {
      gaps.push({
        id: `dup-${gaps.length + 1}`,
        description: `Local file '${dup.localFile}' appears to reimplement ${dup.duplicates}. Consumer apps should import from @codex-signum/core instead.`,
        severity: dup.confidence === "high" ? "warning" : "info",
        codeRef: [dup.localFile],
        category: "duplication",
      });
    }
  }

  // Check for bridge files — are they all routed correctly?
  const bridges = Object.keys(coreImports).filter(
    (f) => f.includes("bridge") || f.includes("Bridge"),
  );
  const hybridAgentExists = fs.existsSync(
    path.join(rootPath, "agent/hybridAgent.ts"),
  );
  const codexBridgeExists = fs.existsSync(
    path.join(rootPath, "agent/codex-bridge.ts"),
  );

  if (hybridAgentExists && codexBridgeExists && bridges.length > 0) {
    gaps.push({
      id: `structural-1`,
      description:
        "Both agent/codex-bridge.ts and agent/hybridAgent.ts exist. There should be a single entry point. Verify that hybridAgent is retired or that codex-bridge.ts is the sole entry point.",
      severity: "warning",
      codeRef: ["agent/codex-bridge.ts", "agent/hybridAgent.ts"],
      category: "structural",
    });
  }

  // Check for propagateDegradation import
  const allImported = new Set(Object.values(coreImports).flat());
  if (!allImported.has("propagateDegradation")) {
    gaps.push({
      id: `missing-1`,
      description:
        "core:propagateDegradation is exported from @codex-signum/core but is not imported in any consumer file. Degradation cascade wiring may be missing.",
      severity: "critical",
      category: "missing",
    });
  }

  return gaps;
}

function buildWhatExists(coreImports: Record<string, string[]>): string[] {
  const allImported = new Set(Object.values(coreImports).flat());
  const existing: string[] = [];

  for (const func of KNOWN_CORE_FUNCTIONS) {
    if (func.aliases.some((a) => allImported.has(a))) {
      existing.push(
        `${func.name} (imported from core in ${Object.keys(coreImports).length} file(s))`,
      );
    }
  }

  if (coreImports && Object.keys(coreImports).length > 0) {
    existing.push(
      `@codex-signum/core integration: ${Object.keys(coreImports).length} files import from core`,
    );
  }

  return existing;
}

function buildWhatNeedsFixing(
  duplications: Array<{
    localFile: string;
    duplicates: string;
    confidence: "high" | "medium" | "low";
  }>,
): string[] {
  return duplications
    .filter((d) => d.confidence !== "low")
    .map(
      (d) => `Replace local ${d.localFile} with core import of ${d.duplicates}`,
    );
}

// ── Graph state inspection ───────────────────────────────────────────────────

type GraphState = NonNullable<SurveyOutput["graphState"]>;

/**
 * Query Neo4j for live system health.
 * Gracefully degrades if graph is unavailable.
 */
async function inspectGraphState(
  session: import("neo4j-driver").Session | null | undefined,
  blindSpots: BlindSpot[],
): Promise<SurveyOutput["graphState"]> {
  if (!session) {
    blindSpots.push({
      description:
        "Neo4j graph state unavailable — cannot assess pattern health or cascade status",
      resolution: "Provide a graphClient (neo4j-driver Session) in SurveyInput",
    });
    return null;
  }

  const state: GraphState = {
    patternHealth: {},
    activeCascades: 0,
    thresholdEvents: [],
    constitutionalAlerts: [],
  };

  // Query pattern health (ΦL values)
  try {
    const result = await session.run(
      "MATCH (p:Pattern) RETURN p.id AS id, p.phi_l AS phiL",
    );
    for (const record of result.records) {
      const id = record.get("id") as string;
      const phiL = record.get("phiL") as number | null;
      if (id && phiL !== null && phiL !== undefined) {
        state.patternHealth[id] = phiL;
      }
    }
  } catch (err) {
    blindSpots.push({
      description: `Graph query failed for pattern health: ${String(err)}`,
      resolution: "Check Neo4j connectivity and Pattern node schema",
    });
  }

  // Query active cascade events
  try {
    const result = await session.run(
      "MATCH (c:CascadeEvent) WHERE c.resolved = false RETURN count(c) AS cnt",
    );
    const cnt = result.records[0]?.get("cnt");
    state.activeCascades = typeof cnt === "number" ? cnt : 0;
  } catch (err) {
    blindSpots.push({
      description: `Graph query failed for cascade events: ${String(err)}`,
      resolution: "Check if CascadeEvent nodes exist in graph schema",
    });
  }

  // Query recent threshold events (last 7 days)
  try {
    const result = await session.run(
      `MATCH (t:ThresholdEvent)
       WHERE t.timestamp > datetime() - duration('P7D')
       RETURN t.patternId AS pid, t.dimension AS dim, t.direction AS dir, t.timestamp AS ts
       ORDER BY t.timestamp DESC LIMIT 20`,
    );
    for (const record of result.records) {
      const pid = record.get("pid") as string;
      const dim = record.get("dim") as string;
      const dir = record.get("dir") as string;
      state.thresholdEvents.push(`${pid}: ${dim} ${dir}`);
    }
  } catch (err) {
    blindSpots.push({
      description: `Graph query failed for threshold events: ${String(err)}`,
      resolution: "Check if ThresholdEvent nodes exist in graph schema",
    });
  }

  // Query constitutional alerts (Patterns with constitutional violations)
  try {
    const result = await session.run(
      `MATCH (p:Pattern)
       WHERE p.constitutional_violations IS NOT NULL AND size(p.constitutional_violations) > 0
       RETURN p.id AS id, p.constitutional_violations AS violations`,
    );
    for (const record of result.records) {
      const id = record.get("id") as string;
      const violations = record.get("violations") as string[];
      if (Array.isArray(violations)) {
        state.constitutionalAlerts.push(`${id}: ${violations.join(", ")}`);
      }
    }
  } catch (err) {
    blindSpots.push({
      description: `Graph query failed for constitutional alerts: ${String(err)}`,
      resolution:
        "Check if Pattern nodes have constitutional_violations property",
    });
  }

  return state;
}

// ── Specification cross-reference ────────────────────────────────────────────

interface SpecCrossRefResult {
  specGaps: GapItem[];
  whatNeedsBuilding: string[];
}

/**
 * Load specification markdown files and extract testable assertions.
 * Cross-references them against the codebase to find mismatches.
 */
async function crossReferenceSpecs(
  specPaths: string[],
  repoPath: string,
  blindSpots: BlindSpot[],
): Promise<SpecCrossRefResult> {
  const specGaps: GapItem[] = [];
  const whatNeedsBuilding: string[] = [];

  for (const specPath of specPaths) {
    // Resolve relative paths against repo root
    const absPath = path.isAbsolute(specPath)
      ? specPath
      : path.join(repoPath, specPath);

    let specContent: string;
    try {
      if (!fs.existsSync(absPath)) {
        blindSpots.push({
          description: `Specification file not found: ${specPath}`,
          resolution: `Ensure the file exists at ${absPath}`,
        });
        continue;
      }
      specContent = fs.readFileSync(absPath, "utf-8");
    } catch (err) {
      blindSpots.push({
        description: `Could not read specification file ${specPath}: ${String(err)}`,
        resolution: "Check file permissions",
      });
      continue;
    }

    const specName = path.basename(specPath);

    // Extract parameter assertions (e.g., CONSTANT_NAME = value)
    const paramAssertions = extractParameterAssertions(specContent, specName);
    for (const assertion of paramAssertions) {
      const gapItem = crossReferenceParameter(assertion, repoPath);
      if (gapItem) specGaps.push(gapItem);
    }

    // Extract "missing" items from acceptance criteria and what needs building
    const missingItems = extractMissingItems(specContent, specName);
    whatNeedsBuilding.push(...missingItems);

    // Check for architectural requirements
    const archGaps = checkArchitecturalRequirements(
      specContent,
      specName,
      repoPath,
    );
    specGaps.push(...archGaps);
  }

  // Deduplicate whatNeedsBuilding
  return {
    specGaps,
    whatNeedsBuilding: [...new Set(whatNeedsBuilding)],
  };
}

interface ParsedAssertion {
  constantName: string;
  expectedValue: string;
  source: string;
  context: string;
}

/** Extract CONSTANT = value style assertions from markdown */
function extractParameterAssertions(
  content: string,
  sourceName: string,
): ParsedAssertion[] {
  const assertions: ParsedAssertion[] = [];

  // Pattern 1: UPPER_SNAKE_CASE = numeric_value
  const constPattern =
    /\b([A-Z][A-Z0-9_]{2,})\s*[=:]\s*([\d.]+(?:×|\*|\s*x\s*)?[\d.]*)\b/g;
  for (const match of content.matchAll(constPattern)) {
    const value = match[2].replace(/\s*x\s*/i, "×");
    assertions.push({
      constantName: match[1],
      expectedValue: value,
      source: sourceName,
      context: extractContext(content, match.index ?? 0, 100),
    });
  }

  // Pattern 2: Named ratio/factor assertions (e.g., "hysteresis.*2.5", "ratio.*1.5")
  const ratioPattern =
    /(?:hysteresis|cascade|dampening|threshold|factor)\s+(?:ratio|limit|value|=|is|of)\s+([0-9.]+(?:×)?[0-9.]*)/gi;
  for (const match of content.matchAll(ratioPattern)) {
    assertions.push({
      constantName: `INFERRED_${match[0].replace(/\s+/g, "_").toUpperCase().slice(0, 30)}`,
      expectedValue: match[1],
      source: sourceName,
      context: extractContext(content, match.index ?? 0, 120),
    });
  }

  // Pattern 3: Weight assignments (e.g., "weight: 0.4", "0.4 weight")
  const weightPattern = /(?:weight|weights?|factor)\s*[=:]\s*(0\.[0-9]+)/gi;
  for (const match of content.matchAll(weightPattern)) {
    assertions.push({
      constantName: "PHI_L_WEIGHT",
      expectedValue: match[1],
      source: sourceName,
      context: extractContext(content, match.index ?? 0, 80),
    });
  }

  return assertions;
}

function extractContext(content: string, index: number, chars: number): string {
  const start = Math.max(0, index - 20);
  const end = Math.min(content.length, index + chars);
  return content.slice(start, end).replace(/\n/g, " ").trim();
}

/** Cross-reference a parameter assertion against codebase constants */
function crossReferenceParameter(
  assertion: ParsedAssertion,
  repoPath: string,
): GapItem | null {
  const { constantName, expectedValue, source } = assertion;

  // Skip very generic names
  if (constantName.length < 4 || constantName === "PHI_L_WEIGHT") return null;

  const tsFiles = findTsFilesSync(repoPath);
  const matches: Array<{ file: string; foundValue: string }> = [];

  for (const filePath of tsFiles) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const relPath = path.relative(repoPath, filePath).replace(/\\/g, "/");

      // Skip dist/build files
      if (relPath.startsWith("dist/") || relPath.startsWith("build/")) continue;

      // Look for the constant name with a value assignment
      const pattern = new RegExp(
        `${constantName}\\s*[=:]\\s*([0-9.]+(?:[×x][0-9.]+)?)`,
        "i",
      );
      const match = content.match(pattern);
      if (match) {
        matches.push({ file: relPath, foundValue: match[1] });
      }
    } catch {
      // Skip unreadable
    }
  }

  if (matches.length === 0) return null; // Constant not found in code — not necessarily a gap

  // Check if any found value differs from expected
  const expectedNumeric = parseFloat(
    expectedValue.replace(/[×x]/, " ").split(/\s+/)[0] ?? "0",
  );

  for (const found of matches) {
    const foundNumeric = parseFloat(found.foundValue);
    if (
      !isNaN(foundNumeric) &&
      !isNaN(expectedNumeric) &&
      Math.abs(foundNumeric - expectedNumeric) > 0.001
    ) {
      return {
        id: `mismatch-${constantName.toLowerCase()}`,
        description: `Specification '${source}' specifies ${constantName}=${expectedValue}, but code has ${found.foundValue} in ${found.file}`,
        severity: "warning",
        specRef: source,
        codeRef: [found.file],
        category: "mismatch",
      };
    }
  }

  return null;
}

function findTsFilesSync(rootPath: string): string[] {
  const files: string[] = [];
  function recurse(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        recurse(fullPath);
      } else if (CODE_EXTENSIONS.has(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }
  }
  recurse(rootPath);
  return files;
}

/** Extract "what needs building" items from spec acceptance criteria */
function extractMissingItems(content: string, _sourceName: string): string[] {
  const items: string[] = [];

  // Look for "Not implemented" or similar indicators in spec
  const notImplPattern =
    /[-*]\s+([^:\n]+):\s*(?:not implemented|pending|missing|todo)/gi;
  for (const match of content.matchAll(notImplPattern)) {
    items.push(match[1].trim());
  }

  // Look for ❌ or 🔜 markers indicating not-yet-done items
  const markerPattern = /(?:❌|🔜|⬜)\s*\*?\*?([^*\n]+)\*?\*?/g;
  for (const match of content.matchAll(markerPattern)) {
    items.push(match[1].trim());
  }

  return items;
}

/** Check for architectural requirements (cascade wiring, circuit breaker, debouncing) */
function checkArchitecturalRequirements(
  specContent: string,
  specName: string,
  repoPath: string,
): GapItem[] {
  const gaps: GapItem[] = [];

  // Check: degradation cascade wiring
  if (
    /propagat.*degradation|cascade.*wir|degradation.*cascade/i.test(specContent)
  ) {
    const tsFiles = findTsFilesSync(repoPath);
    const hasCascadeWiring = tsFiles.some((f) => {
      try {
        const content = fs.readFileSync(f, "utf-8");
        return /propagateDegradation/.test(content);
      } catch {
        return false;
      }
    });

    if (!hasCascadeWiring) {
      gaps.push({
        id: "missing-cascade-wiring",
        description: `Specification '${specName}' requires degradation cascade wiring (propagateDegradation), but no consumer code calls it.`,
        severity: "critical",
        specRef: specName,
        category: "missing",
      });
    }
  }

  // Check: threshold event debouncing
  if (/debounce|threshold.*event|N=\d/i.test(specContent)) {
    const tsFiles = findTsFilesSync(repoPath);
    const hasDebouncing = tsFiles.some((f) => {
      try {
        const content = fs.readFileSync(f, "utf-8");
        return /debounce|ThresholdEvent|DEBOUNCE/i.test(content);
      } catch {
        return false;
      }
    });

    if (!hasDebouncing) {
      gaps.push({
        id: "missing-debouncing",
        description: `Specification '${specName}' requires threshold event debouncing, but no implementation found.`,
        severity: "warning",
        specRef: specName,
        category: "missing",
      });
    }
  }

  // Check: circuit breaker
  if (/circuit.?breaker/i.test(specContent)) {
    const tsFiles = findTsFilesSync(repoPath);
    const hasCircuitBreaker = tsFiles.some((f) => {
      try {
        const content = fs.readFileSync(f, "utf-8");
        return /circuit.?breaker|CircuitBreaker/i.test(content);
      } catch {
        return false;
      }
    });

    if (!hasCircuitBreaker) {
      gaps.push({
        id: "missing-circuit-breaker",
        description: `Specification '${specName}' requires a circuit breaker mechanism, but none is implemented.`,
        severity: "critical",
        specRef: specName,
        category: "missing",
      });
    }
  }

  return gaps;
}
