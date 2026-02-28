// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
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
export async function survey(input) {
    const surveyId = `survey-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const blindSpots = [];
    // ── 1. Directory tree ────────────────────────────────────────────────────
    const directorySummary = buildDirectorySummary(input.repoPath, 3, blindSpots);
    // ── 2. Key files ─────────────────────────────────────────────────────────
    const keyFiles = readKeyFiles(input.repoPath, blindSpots);
    // ── 3. Git log ───────────────────────────────────────────────────────────
    const recentCommits = readRecentCommits(input.repoPath, 20, blindSpots);
    // ── 4. Core imports ──────────────────────────────────────────────────────
    const coreImports = findCoreImports(input.repoPath, blindSpots);
    // ── 5. Duplication detection ─────────────────────────────────────────────
    const duplications = detectDuplications(input.repoPath, coreImports, blindSpots);
    // ── 6. Entry points ──────────────────────────────────────────────────────
    const entryPoints = findEntryPoints(input.repoPath, keyFiles, blindSpots);
    // ── 7. Specification cross-reference ──────────────────────────────────────
    const { specGaps, whatNeedsBuilding, processedSpecPaths } = await crossReferenceSpecs(input.specificationRefs, input.repoPath, blindSpots);
    // ── 8. Document sources (auto-discovery) ──────────────────────────────────
    const docsPaths = input.docsPaths ?? ["docs/specs/", "docs/research/"];
    const documentSources = discoverDocumentSources(input.repoPath, docsPaths, blindSpots);
    // ── 9. Hypotheses ──────────────────────────────────────────────────────────
    const hypothesesPath = input.hypothesesPath ?? "docs/hypotheses/";
    const hypotheses = parseHypotheses(input.repoPath, hypothesesPath);
    // ── 10. Graph state inspection ────────────────────────────────────────────
    const graphState = await inspectGraphState(input.graphClient ?? null, blindSpots);
    // ── 11. Gap analysis from codebase state ─────────────────────────────────
    const codebaseGaps = buildCodebaseGaps(duplications, coreImports, input.repoPath, blindSpots);
    // ── 12. Cross-reference document claims against code ─────────────────────
    const docClaimGaps = crossReferenceDocumentClaims(documentSources, processedSpecPaths, input.repoPath, blindSpots);
    const gaps = [...codebaseGaps, ...specGaps, ...docClaimGaps];
    // ── 13. Confidence score ──────────────────────────────────────────────────
    let confidence = 1.0;
    if (!keyFiles["package.json"])
        confidence -= 0.2;
    if (recentCommits.length === 0)
        confidence -= 0.1;
    if (coreImports && Object.keys(coreImports).length === 0)
        confidence -= 0.1;
    if (input.specificationRefs.length > 0 && specGaps.length === 0)
        confidence -= 0.05; // Spec refs given but no assertions extracted
    if (documentSources.length === 0)
        confidence -= 0.15; // No docs found = major blind spot
    if (documentSources.some((d) => d.extractedClaims.length > 0))
        confidence += 0.05; // Found actionable claims
    if (hypotheses.length > 0 && hypotheses.some((h) => h.status === "proposed"))
        confidence -= 0.05; // Untested hypotheses reduce confidence
    confidence -= blindSpots.length * 0.03;
    confidence = Math.max(0.1, Math.min(1.0, confidence));
    const output = {
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
        documentSources,
        hypotheses,
        confidence,
        blindSpots,
    };
    return output;
}
// ── Directory tree builder ───────────────────────────────────────────────────
function buildDirectorySummary(rootPath, maxDepth, blindSpots) {
    const lines = [];
    try {
        walkDir(rootPath, "", 0, maxDepth, lines);
    }
    catch (err) {
        blindSpots.push({
            description: `Could not fully read directory tree at ${rootPath}: ${String(err)}`,
            resolution: "Ensure the path exists and is readable",
        });
    }
    return lines;
}
function walkDir(absPath, relPath, depth, maxDepth, lines) {
    if (depth > maxDepth)
        return;
    let entries;
    try {
        entries = fs.readdirSync(absPath, { withFileTypes: true });
    }
    catch {
        return;
    }
    for (const entry of entries) {
        if (SKIP_DIRS.has(entry.name))
            continue;
        const displayPath = relPath ? `${relPath}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
            lines.push(`${displayPath}/`);
            if (depth < maxDepth) {
                walkDir(path.join(absPath, entry.name), displayPath, depth + 1, maxDepth, lines);
            }
        }
        else if (depth <= 2 || CODE_EXTENSIONS.has(path.extname(entry.name))) {
            // Only show code files at deeper levels to avoid noise
            lines.push(displayPath);
        }
    }
}
// ── Key file reader ──────────────────────────────────────────────────────────
function readKeyFiles(rootPath, blindSpots) {
    const keyFiles = {};
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
        }
        catch (err) {
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
                }
                catch {
                    // skip
                }
            }
        }
    }
    catch (err) {
        blindSpots.push({
            description: `Could not scan src/ subdirectories: ${String(err)}`,
            resolution: "Ensure src/ directory is readable",
        });
    }
    return keyFiles;
}
// ── Git log reader ───────────────────────────────────────────────────────────
function readRecentCommits(rootPath, count, blindSpots) {
    try {
        const output = execSync(`git log --oneline -${count}`, {
            cwd: rootPath,
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
        });
        return output.trim().split("\n").filter(Boolean);
    }
    catch {
        blindSpots.push({
            description: "Could not read git log — repository may not be initialized",
            resolution: "Ensure the path is a git repository with commits",
        });
        return [];
    }
}
// ── Core imports finder ──────────────────────────────────────────────────────
function findCoreImports(rootPath, blindSpots) {
    const imports = {};
    const tsFiles = findTsFiles(rootPath, blindSpots);
    for (const filePath of tsFiles) {
        try {
            const content = fs.readFileSync(filePath, "utf-8");
            const relPath = path.relative(rootPath, filePath).replace(/\\/g, "/");
            // Find all import statements referencing @codex-signum/core
            const matches = content.match(/from\s+["'](@codex-signum\/core[^"']*)["']/g);
            if (matches && matches.length > 0) {
                const importedSymbols = [];
                // Extract what's being imported
                const blockMatches = content.matchAll(/import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+["']@codex-signum\/core[^"']*["']/g);
                for (const match of blockMatches) {
                    const symbols = match[1]
                        .split(",")
                        .map((s) => s
                        .trim()
                        .replace(/\s+as\s+\w+/, "")
                        .trim())
                        .filter(Boolean);
                    importedSymbols.push(...symbols);
                }
                // Also catch default/namespace imports
                const defaultMatches = content.matchAll(/import\s+(\w+)\s+from\s+["']@codex-signum\/core[^"']*["']/g);
                for (const match of defaultMatches) {
                    importedSymbols.push(match[1]);
                }
                imports[relPath] = importedSymbols;
            }
        }
        catch {
            // Skip unreadable files
        }
    }
    return imports;
}
function findTsFiles(rootPath, blindSpots) {
    const files = [];
    function recurse(dir) {
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        }
        catch {
            return;
        }
        for (const entry of entries) {
            if (SKIP_DIRS.has(entry.name))
                continue;
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                recurse(fullPath);
            }
            else if (CODE_EXTENSIONS.has(path.extname(entry.name))) {
                files.push(fullPath);
            }
        }
    }
    try {
        recurse(rootPath);
    }
    catch (err) {
        blindSpots.push({
            description: `Could not fully scan TypeScript files: ${String(err)}`,
            resolution: "Ensure directory is readable",
        });
    }
    return files;
}
// ── Duplication detector ─────────────────────────────────────────────────────
function detectDuplications(rootPath, coreImports, blindSpots) {
    const results = [];
    const allImportedFromCore = new Set(Object.values(coreImports).flat());
    const tsFiles = findTsFiles(rootPath, blindSpots);
    for (const filePath of tsFiles) {
        const relPath = path.relative(rootPath, filePath).replace(/\\/g, "/");
        // Skip the file itself if it's in core (when surveying core repo)
        if (relPath.startsWith("src/") || relPath.startsWith("dist/"))
            continue;
        // Skip test files — they test core functions, they don't reimplement them
        if (relPath.startsWith("tests/") ||
            relPath.startsWith("test/") ||
            relPath.includes("__tests__/") ||
            relPath.endsWith(".test.ts") ||
            relPath.endsWith(".spec.ts"))
            continue;
        let content;
        try {
            content = fs.readFileSync(filePath, "utf-8");
        }
        catch {
            continue;
        }
        const lineCount = content.split("\n").length;
        const fileName = path.basename(filePath, path.extname(filePath));
        for (const func of KNOWN_CORE_FUNCTIONS) {
            // Check if filename matches a known alias
            const filenameMatch = func.aliases.some((alias) => fileName.toLowerCase() === alias.toLowerCase() ||
                fileName.toLowerCase().includes(alias.toLowerCase()));
            if (!filenameMatch)
                continue;
            // Check that this file is NOT just importing from core
            const isJustImporting = allImportedFromCore.has(func.name);
            // Check for local function definitions matching core function names
            const defPatterns = func.aliases.map((a) => new RegExp(`(function|class|const|export)\\s+${a}\\b`));
            const hasLocalDef = defPatterns.some((p) => p.test(content));
            if (!hasLocalDef && !filenameMatch)
                continue;
            // Determine confidence
            let confidence = "low";
            if (filenameMatch && hasLocalDef) {
                confidence = "high";
            }
            else if (filenameMatch && lineCount > 50) {
                confidence = "medium";
            }
            // Only report if it looks like a reimplementation (not a thin wrapper that imports from core)
            const importsCore = coreImports[relPath]?.some((s) => func.aliases.some((a) => a === s));
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
        if (lineCount > 500 &&
            /scope|execute|review|validate/i.test(content) &&
            /pipeline|agent|orchestrat/i.test(fileName.toLowerCase())) {
            const alreadyReported = results.some((r) => r.localFile === relPath);
            if (!alreadyReported) {
                results.push({
                    localFile: relPath,
                    duplicates: "core:DevAgent (large monolith with pipeline stage keywords)",
                    confidence: "medium",
                });
            }
        }
    }
    return results;
}
// ── Entry point finder ───────────────────────────────────────────────────────
function findEntryPoints(rootPath, keyFiles, blindSpots) {
    const entryPoints = [];
    // Check package.json main/bin
    const pkgJson = keyFiles["package.json"];
    if (pkgJson) {
        try {
            const pkg = JSON.parse(pkgJson);
            if (pkg["main"])
                entryPoints.push(String(pkg["main"]));
            if (pkg["bin"]) {
                const bins = pkg["bin"];
                if (typeof bins === "string") {
                    entryPoints.push(bins);
                }
                else if (typeof bins === "object" && bins !== null) {
                    entryPoints.push(...Object.values(bins));
                }
            }
        }
        catch {
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
function buildCodebaseGaps(duplications, coreImports, rootPath, _blindSpots) {
    const gaps = [];
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
    const bridges = Object.keys(coreImports).filter((f) => f.includes("bridge") || f.includes("Bridge"));
    const hybridAgentExists = fs.existsSync(path.join(rootPath, "agent/hybridAgent.ts"));
    const codexBridgeExists = fs.existsSync(path.join(rootPath, "agent/codex-bridge.ts"));
    if (hybridAgentExists && codexBridgeExists && bridges.length > 0) {
        gaps.push({
            id: `structural-1`,
            description: "Both agent/codex-bridge.ts and agent/hybridAgent.ts exist. There should be a single entry point. Verify that hybridAgent is retired or that codex-bridge.ts is the sole entry point.",
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
            description: "core:propagateDegradation is exported from @codex-signum/core but is not imported in any consumer file. Degradation cascade wiring may be missing.",
            severity: "critical",
            category: "missing",
        });
    }
    return gaps;
}
function buildWhatExists(coreImports) {
    const allImported = new Set(Object.values(coreImports).flat());
    const existing = [];
    for (const func of KNOWN_CORE_FUNCTIONS) {
        if (func.aliases.some((a) => allImported.has(a))) {
            existing.push(`${func.name} (imported from core in ${Object.keys(coreImports).length} file(s))`);
        }
    }
    if (coreImports && Object.keys(coreImports).length > 0) {
        existing.push(`@codex-signum/core integration: ${Object.keys(coreImports).length} files import from core`);
    }
    return existing;
}
function buildWhatNeedsFixing(duplications) {
    return duplications
        .filter((d) => d.confidence !== "low")
        .map((d) => `Replace local ${d.localFile} with core import of ${d.duplicates}`);
}
/**
 * Query Neo4j for live system health.
 * Gracefully degrades if graph is unavailable.
 */
async function inspectGraphState(session, blindSpots) {
    if (!session) {
        blindSpots.push({
            description: "Neo4j graph state unavailable — cannot assess pattern health or cascade status",
            resolution: "Provide a graphClient (neo4j-driver Session) in SurveyInput",
        });
        return null;
    }
    const state = {
        patternHealth: {},
        activeCascades: 0,
        thresholdEvents: [],
        constitutionalAlerts: [],
    };
    // Query pattern health (ΦL values)
    try {
        const result = await session.run("MATCH (p:Pattern) RETURN p.id AS id, p.phi_l AS phiL");
        for (const record of result.records) {
            const id = record.get("id");
            const phiL = record.get("phiL");
            if (id && phiL !== null && phiL !== undefined) {
                state.patternHealth[id] = phiL;
            }
        }
    }
    catch (err) {
        blindSpots.push({
            description: `Graph query failed for pattern health: ${String(err)}`,
            resolution: "Check Neo4j connectivity and Pattern node schema",
        });
    }
    // Query active cascade events
    try {
        const result = await session.run("MATCH (c:CascadeEvent) WHERE c.resolved = false RETURN count(c) AS cnt");
        const cnt = result.records[0]?.get("cnt");
        state.activeCascades = typeof cnt === "number" ? cnt : 0;
    }
    catch (err) {
        blindSpots.push({
            description: `Graph query failed for cascade events: ${String(err)}`,
            resolution: "Check if CascadeEvent nodes exist in graph schema",
        });
    }
    // Query recent threshold events (last 7 days)
    try {
        const result = await session.run(`MATCH (t:ThresholdEvent)
       WHERE t.timestamp > datetime() - duration('P7D')
       RETURN t.patternId AS pid, t.dimension AS dim, t.direction AS dir, t.timestamp AS ts
       ORDER BY t.timestamp DESC LIMIT 20`);
        for (const record of result.records) {
            const pid = record.get("pid");
            const dim = record.get("dim");
            const dir = record.get("dir");
            state.thresholdEvents.push(`${pid}: ${dim} ${dir}`);
        }
    }
    catch (err) {
        blindSpots.push({
            description: `Graph query failed for threshold events: ${String(err)}`,
            resolution: "Check if ThresholdEvent nodes exist in graph schema",
        });
    }
    // Query constitutional alerts (Patterns with constitutional violations)
    try {
        const result = await session.run(`MATCH (p:Pattern)
       WHERE p.constitutional_violations IS NOT NULL AND size(p.constitutional_violations) > 0
       RETURN p.id AS id, p.constitutional_violations AS violations`);
        for (const record of result.records) {
            const id = record.get("id");
            const violations = record.get("violations");
            if (Array.isArray(violations)) {
                state.constitutionalAlerts.push(`${id}: ${violations.join(", ")}`);
            }
        }
    }
    catch (err) {
        blindSpots.push({
            description: `Graph query failed for constitutional alerts: ${String(err)}`,
            resolution: "Check if Pattern nodes have constitutional_violations property",
        });
    }
    return state;
}
/**
 * Load specification markdown files and extract testable assertions.
 * Cross-references them against the codebase to find mismatches.
 */
async function crossReferenceSpecs(specPaths, repoPath, blindSpots) {
    const specGaps = [];
    const whatNeedsBuilding = [];
    const processedSpecPaths = new Set();
    for (const specPath of specPaths) {
        // Resolve relative paths against repo root
        const absPath = path.isAbsolute(specPath)
            ? specPath
            : path.join(repoPath, specPath);
        let specContent;
        try {
            if (!fs.existsSync(absPath)) {
                blindSpots.push({
                    description: `Specification file not found: ${specPath}`,
                    resolution: `Ensure the file exists at ${absPath}`,
                });
                continue;
            }
            specContent = fs.readFileSync(absPath, "utf-8");
        }
        catch (err) {
            blindSpots.push({
                description: `Could not read specification file ${specPath}: ${String(err)}`,
                resolution: "Check file permissions",
            });
            continue;
        }
        // Track processed paths (relative to repo root) for deduplication
        const relSpecPath = path.relative(repoPath, absPath).replace(/\\/g, "/");
        processedSpecPaths.add(relSpecPath);
        const specName = path.basename(specPath);
        // Extract parameter assertions (e.g., CONSTANT_NAME = value)
        const paramAssertions = extractParameterAssertions(specContent, specName);
        for (const assertion of paramAssertions) {
            const gapItem = crossReferenceParameter(assertion, repoPath);
            if (gapItem)
                specGaps.push(gapItem);
        }
        // Extract "missing" items from acceptance criteria and what needs building
        const missingItems = extractMissingItems(specContent, specName);
        whatNeedsBuilding.push(...missingItems);
        // Check for architectural requirements
        const archGaps = checkArchitecturalRequirements(specContent, specName, repoPath);
        specGaps.push(...archGaps);
    }
    // Deduplicate whatNeedsBuilding
    return {
        specGaps,
        whatNeedsBuilding: [...new Set(whatNeedsBuilding)],
        processedSpecPaths,
    };
}
/** Extract CONSTANT = value style assertions from markdown */
function extractParameterAssertions(content, sourceName) {
    const assertions = [];
    // Pattern 1: UPPER_SNAKE_CASE = numeric_value
    const constPattern = /\b([A-Z][A-Z0-9_]{2,})\s*[=:]\s*([\d.]+(?:×|\*|\s*x\s*)?[\d.]*)\b/g;
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
    const ratioPattern = /(?:hysteresis|cascade|dampening|threshold|factor)\s+(?:ratio|limit|value|=|is|of)\s+([0-9.]+(?:×)?[0-9.]*)/gi;
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
function extractContext(content, index, chars) {
    const start = Math.max(0, index - 20);
    const end = Math.min(content.length, index + chars);
    return content.slice(start, end).replace(/\n/g, " ").trim();
}
/** Cross-reference a parameter assertion against codebase constants */
function crossReferenceParameter(assertion, repoPath) {
    const { constantName, expectedValue, source } = assertion;
    // Skip very generic names
    if (constantName.length < 4 || constantName === "PHI_L_WEIGHT")
        return null;
    const tsFiles = findTsFilesSync(repoPath);
    const matches = [];
    for (const filePath of tsFiles) {
        try {
            const content = fs.readFileSync(filePath, "utf-8");
            const relPath = path.relative(repoPath, filePath).replace(/\\/g, "/");
            // Skip dist/build files
            if (relPath.startsWith("dist/") || relPath.startsWith("build/"))
                continue;
            // Look for the constant name with a value assignment
            const pattern = new RegExp(`${constantName}\\s*[=:]\\s*([0-9.]+(?:[×x][0-9.]+)?)`, "i");
            const match = content.match(pattern);
            if (match) {
                matches.push({ file: relPath, foundValue: match[1] });
            }
        }
        catch {
            // Skip unreadable
        }
    }
    if (matches.length === 0)
        return null; // Constant not found in code — not necessarily a gap
    // Check if any found value differs from expected
    const expectedNumeric = parseFloat(expectedValue.replace(/[×x]/, " ").split(/\s+/)[0] ?? "0");
    for (const found of matches) {
        const foundNumeric = parseFloat(found.foundValue);
        if (!isNaN(foundNumeric) &&
            !isNaN(expectedNumeric) &&
            Math.abs(foundNumeric - expectedNumeric) > 0.001) {
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
function findTsFilesSync(rootPath) {
    const files = [];
    function recurse(dir) {
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        }
        catch {
            return;
        }
        for (const entry of entries) {
            if (SKIP_DIRS.has(entry.name))
                continue;
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                recurse(fullPath);
            }
            else if (CODE_EXTENSIONS.has(path.extname(entry.name))) {
                files.push(fullPath);
            }
        }
    }
    recurse(rootPath);
    return files;
}
/** Extract "what needs building" items from spec acceptance criteria */
function extractMissingItems(content, _sourceName) {
    const items = [];
    // Look for "Not implemented" or similar indicators in spec
    const notImplPattern = /[-*]\s+([^:\n]+):\s*(?:not implemented|pending|missing|todo)/gi;
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
function checkArchitecturalRequirements(specContent, specName, repoPath) {
    const gaps = [];
    // Check: degradation cascade wiring
    if (/propagat.*degradation|cascade.*wir|degradation.*cascade/i.test(specContent)) {
        const tsFiles = findTsFilesSync(repoPath);
        const hasCascadeWiring = tsFiles.some((f) => {
            try {
                const content = fs.readFileSync(f, "utf-8");
                return /propagateDegradation/.test(content);
            }
            catch {
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
            }
            catch {
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
            }
            catch {
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
// ── Document source discovery ────────────────────────────────────────────────
/** Find all .md files recursively under absDir. Notes non-markdown files as blind spots. */
function findMdFilesInDir(absDir, blindSpots) {
    const files = [];
    function recurse(dir) {
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        }
        catch {
            return;
        }
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                recurse(fullPath);
            }
            else {
                const ext = path.extname(entry.name).toLowerCase();
                if (ext === ".md") {
                    files.push(fullPath);
                }
                else if ([".pdf", ".docx", ".pptx", ".xlsx"].includes(ext)) {
                    blindSpots.push({
                        description: `Non-markdown document skipped: ${entry.name} (${ext})`,
                        resolution: "Convert to .md format for SURVEY to process",
                    });
                }
            }
        }
    }
    recurse(absDir);
    return files;
}
/** Extract up to maxChars of context around line i (previous + current + next line). */
function extractLineContext(lines, lineIndex, maxChars) {
    const before = lineIndex > 0 ? (lines[lineIndex - 1] ?? "") : "";
    const current = lines[lineIndex] ?? "";
    const after = lineIndex < lines.length - 1 ? (lines[lineIndex + 1] ?? "") : "";
    return [before, current, after]
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxChars);
}
/**
 * Extract typed claims from a document's content.
 *
 * Catches formulas (Greek letters, math notation), thresholds (numeric bounds),
 * warnings (dangerous patterns, supercritical flags), recommendations
 * (fix suggestions), and architectural assertions.
 *
 * Exported for testing.
 */
export function extractClaims(content, _sourcePath) {
    const claims = [];
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line || line.trim().length === 0)
            continue;
        const lineNumber = i + 1;
        // ── Formula patterns ────────────────────────────────────────────────────
        // Greek letter with assignment, or math operators with assignment
        if ((/[γεΦΨμθλΩ]/u.test(line) && /=/.test(line)) ||
            (/[√×≤≥]/.test(line) && /=/.test(line)) ||
            /\bmin\s*\(|\bmax\s*\(|\bclamp\s*\(/.test(line)) {
            claims.push({
                text: extractLineContext(lines, i, 200),
                type: "formula",
                lineNumber,
            });
        }
        // ── Threshold patterns ───────────────────────────────────────────────────
        if (/must\s+(?:be|not)\s*[<>≤≥]|must\s+not\s+exceed|limit\s+of\s+\d|maximum\s+cascade/i.test(line) ||
            /budget\s+of\s+0\.\d|s\s*[≤<]\s*0\.\d|k\s*[≥>]\s*\d/i.test(line) ||
            /(?:cascade|dampening|threshold|depth)\s+(?:limit|cap|bound|max)\b/i.test(line)) {
            claims.push({
                text: extractLineContext(lines, i, 200),
                type: "threshold",
                lineNumber,
            });
        }
        // ── Warning patterns ─────────────────────────────────────────────────────
        if (/dangerously\s+inadequate|supercritical|fails?\s+for\b|not\s+safe\b|over.?aggressive/i.test(line) ||
            /\bincorrect\b.*formula|\bwrong\b.*formula|\bunderestimat|\boverestimat/i.test(line) ||
            /\bCRITICAL\b|\bWARNING\b/.test(line) ||
            /μ\s*[>≥]\s*1\b|produces?\s+(?:supercritical|unstable|incorrect)/i.test(line)) {
            claims.push({
                text: extractLineContext(lines, i, 200),
                type: "warning",
                lineNumber,
            });
        }
        // ── Recommendation patterns ──────────────────────────────────────────────
        if (/recommended?\s+(?:fix|formula|approach|value)|should\s+use\b|replace\s+with\b/i.test(line) ||
            /correct\s+formula\b|proposed\s+(?:fix|formula|approach)|budget.?capped/i.test(line) ||
            /alternative\s+approach\b|instead\s+use\b/i.test(line)) {
            claims.push({
                text: extractLineContext(lines, i, 200),
                type: "recommendation",
                lineNumber,
            });
        }
        // ── Architectural assertion patterns ─────────────────────────────────────
        if (/state\s+is\s+structural\b|shall\s+not\b/i.test(line) ||
            /\bconstitutional\b|\baxiom\b/i.test(line) ||
            /\bimmutable\b|\bnon.?negotiable\b/i.test(line) ||
            (/\bmandatory\b|\bforbidden\b/.test(line) && !/\(.*mandatory.*\)/i.test(line))) {
            claims.push({
                text: extractLineContext(lines, i, 200),
                type: "architectural",
                lineNumber,
            });
        }
    }
    // ── Multi-line critical term pair extraction ─────────────────────────────
    // If two critical terms appear within 500 characters of each other anywhere
    // in the document (including across lines), extract as a warning claim.
    const criticalTermPairs = [
        ["hub", "√k"],
        ["hub", "sqrt(k)"],
        ["supercritical", "dampening"],
        ["cascade", "probability"],
    ];
    for (const [termA, termB] of criticalTermPairs) {
        const idxA = content.toLowerCase().indexOf(termA.toLowerCase());
        if (idxA === -1)
            continue;
        const idxB = content.toLowerCase().indexOf(termB.toLowerCase());
        if (idxB === -1)
            continue;
        const distance = Math.abs(idxA - idxB);
        if (distance <= 500) {
            const start = Math.max(0, Math.min(idxA, idxB) - 50);
            const end = Math.min(content.length, Math.max(idxA, idxB) + 200);
            const excerpt = content.slice(start, end).replace(/\n/g, " ").trim();
            const approxLine = content.slice(0, Math.min(idxA, idxB)).split("\n").length;
            claims.push({
                text: excerpt,
                type: "warning",
                lineNumber: approxLine,
            });
        }
    }
    return claims;
}
/**
 * Discover all .md files under the given docs paths, read them (capped at 16000 chars),
 * extract a title, and run claim extraction on each.
 */
export function discoverDocumentSources(repoPath, docsPaths, blindSpots) {
    const sources = [];
    const seen = new Set();
    for (const docsPath of docsPaths) {
        const absDocsPath = path.isAbsolute(docsPath)
            ? docsPath
            : path.join(repoPath, docsPath);
        if (!fs.existsSync(absDocsPath)) {
            blindSpots.push({
                description: `Documentation path not found: ${docsPath}`,
                resolution: `Create the directory or update SurveyInput.docsPaths. Expected: ${absDocsPath}`,
            });
            continue;
        }
        const mdFiles = findMdFilesInDir(absDocsPath, blindSpots);
        for (const mdFile of mdFiles) {
            const relPath = path.relative(repoPath, mdFile).replace(/\\/g, "/");
            if (seen.has(relPath))
                continue;
            seen.add(relPath);
            try {
                const rawContent = fs.readFileSync(mdFile, "utf-8");
                const content = rawContent.slice(0, 16000);
                // Extract title from first # heading, fall back to filename
                const titleMatch = content.match(/^#\s+(.+)/m);
                const title = titleMatch
                    ? titleMatch[1].trim()
                    : path.basename(mdFile, ".md");
                const extractedClaims = extractClaims(content, relPath);
                sources.push({ path: relPath, title, content, extractedClaims });
            }
            catch (err) {
                blindSpots.push({
                    description: `Could not read document ${relPath}: ${String(err)}`,
                    resolution: "Check file permissions",
                });
            }
        }
    }
    return sources;
}
// ── Hypothesis parser ─────────────────────────────────────────────────────
/**
 * Parse hypothesis files from docs/hypotheses/.
 * Returns structured hypothesis records for gap analysis.
 *
 * Exported for testing.
 */
export function parseHypotheses(repoPath, hypothesesPath) {
    const absPath = path.isAbsolute(hypothesesPath)
        ? hypothesesPath
        : path.join(repoPath, hypothesesPath);
    if (!fs.existsSync(absPath))
        return [];
    let entries;
    try {
        entries = fs.readdirSync(absPath, { withFileTypes: true });
    }
    catch {
        return [];
    }
    const hypotheses = [];
    for (const entry of entries) {
        if (!entry.isFile())
            continue;
        if (!entry.name.endsWith(".md"))
            continue;
        if (entry.name === "README.md")
            continue;
        const filePath = path.join(absPath, entry.name);
        const relPath = path.relative(repoPath, filePath).replace(/\\/g, "/");
        let content;
        try {
            content = fs.readFileSync(filePath, "utf-8");
        }
        catch {
            continue;
        }
        // Split on hypothesis headings: ## H-NNN: Title
        const blocks = content.split(/^## (H-\d{3}):?\s*/m);
        // blocks[0] is preamble, then alternating: [id, body, id, body, ...]
        for (let i = 1; i < blocks.length - 1; i += 2) {
            const id = blocks[i].trim();
            const body = blocks[i + 1];
            const sourceMatch = body.match(/\*\*Source:\*\*\s*(.+?)(?:\n|$)/);
            const claimMatch = body.match(/\*\*Claim:\*\*\s*(.+?)(?:\n- \*\*|$)/s);
            const statusMatch = body.match(/\*\*Status:\*\*\s*(\S+)/);
            const source = sourceMatch ? sourceMatch[1].trim() : "unknown";
            const claim = claimMatch ? claimMatch[1].trim() : "unknown";
            const rawStatus = statusMatch ? statusMatch[1].trim() : "proposed";
            const validStatuses = new Set([
                "proposed",
                "validated",
                "partially-validated",
                "invalidated",
                "superseded",
                "deferred",
            ]);
            const status = validStatuses.has(rawStatus)
                ? rawStatus
                : "proposed";
            hypotheses.push({ id, source, claim, status, filePath: relPath });
        }
    }
    return hypotheses;
}
// ── Document claim cross-reference ──────────────────────────────────────────
/**
 * Cross-reference claims extracted from documentation against the codebase.
 *
 * Skips files already processed by crossReferenceSpecs() to avoid duplicates.
 * Creates GapItems with category "research-divergence" when a warned-about
 * or corrected pattern is found in code.
 */
function crossReferenceDocumentClaims(documentSources, alreadyProcessedPaths, repoPath, blindSpots) {
    const gaps = [];
    const gapIds = new Set();
    const tsFiles = findTsFilesSync(repoPath);
    function addGap(gap) {
        if (!gapIds.has(gap.id)) {
            gapIds.add(gap.id);
            gaps.push(gap);
        }
    }
    for (const doc of documentSources) {
        // Skip files already processed in crossReferenceSpecs
        if (alreadyProcessedPaths.has(doc.path))
            continue;
        for (const claim of doc.extractedClaims) {
            checkClaimAgainstCode(claim, doc, tsFiles, repoPath, addGap);
        }
    }
    void blindSpots; // acknowledged — used upstream
    return gaps;
}
/**
 * Check a single claim against the codebase and emit gap items via addGap.
 */
function checkClaimAgainstCode(claim, doc, tsFiles, repoPath, addGap) {
    const text = claim.text;
    const ltext = text.toLowerCase();
    // ── Warning: hub dampening γ_base/√k flagged as supercritical ─────────────
    if (claim.type === "warning" &&
        (ltext.includes("√k") ||
            ltext.includes("/ sqrt") ||
            /γ.{0,30}sqrt/i.test(text) ||
            /sqrt.{0,10}k\b/i.test(text)) &&
        (ltext.includes("hub") ||
            ltext.includes("damp") ||
            /supercritical|dangerous|inadequate/i.test(text))) {
        const affectedFiles = [];
        for (const filePath of tsFiles) {
            const relPath = path.relative(repoPath, filePath).replace(/\\/g, "/");
            if (relPath.startsWith("dist/"))
                continue;
            try {
                const code = fs.readFileSync(filePath, "utf-8");
                if (/Math\.sqrt\s*\(/.test(code) && /damp|hub/i.test(relPath)) {
                    affectedFiles.push(relPath);
                }
            }
            catch {
                /* skip */
            }
        }
        if (affectedFiles.length > 0) {
            addGap({
                id: "research-divergence-hub-dampening-sqrt",
                description: `Research '${doc.title}' flags γ_base/√k hub dampening as supercritical (μ>1 for k≥3). Code still uses Math.sqrt(k) in hub dampening.`,
                severity: "critical",
                specRef: doc.path,
                codeRef: affectedFiles,
                category: "research-divergence",
            });
        }
    }
    // ── Warning: 28.6% cascade probability is wrong (correct is 81.6%) ────────
    if (claim.type === "warning" &&
        /28\.6\s*%|28\.6\s*percent/i.test(text)) {
        // If the same document also contains "81.6%" or correction language,
        // it's a correction paper — the 28.6% is being flagged, not propagated.
        const docContent = doc.content || "";
        const isCorrectionContext = /81\.6\s*%/i.test(docContent) ||
            /correct(?:ed|ion|s)?\b/i.test(docContent) ||
            /percolation.theoretic/i.test(docContent);
        if (isCorrectionContext) {
            // Suppress — the document is correcting the figure, not citing it as truth
        }
        else {
            addGap({
                id: "research-divergence-cascade-probability",
                description: `Research '${doc.title}' mentions 28.6% cascade probability without correction context. The correct value is 81.6% (percolation-theoretic) at γ=0.7. Verify no specs or comments cite 28.6%.`,
                severity: "warning",
                specRef: doc.path,
                category: "research-divergence",
            });
        }
    }
    // ── Formula: budget-capped dampening min(γ_base, s/k) ─────────────────────
    if ((claim.type === "formula" || claim.type === "recommendation") &&
        (/min\s*\([^)]*s\s*\/\s*k|budget.?capped/i.test(text) ||
            /min\s*\(\s*γ_base.*s\s*\/\s*k/i.test(text))) {
        const affectedFiles = [];
        for (const filePath of tsFiles) {
            const relPath = path.relative(repoPath, filePath).replace(/\\/g, "/");
            if (relPath.startsWith("dist/"))
                continue;
            if (!/damp/i.test(relPath))
                continue;
            try {
                const code = fs.readFileSync(filePath, "utf-8");
                // Flag if dampening file doesn't have the budget-capped s/k formula
                if (!/\/\s*k\b/.test(code)) {
                    affectedFiles.push(relPath);
                }
            }
            catch {
                /* skip */
            }
        }
        if (affectedFiles.length > 0) {
            addGap({
                id: "research-divergence-budget-capped-dampening",
                description: `Research '${doc.title}' recommends budget-capped formula min(γ_base, s/k) with s≤0.8. Dampening implementation may not use this formula.`,
                severity: "warning",
                specRef: doc.path,
                codeRef: affectedFiles,
                category: "research-divergence",
            });
        }
    }
    // ── Threshold: s ≤ 0.8 propagation budget ──────────────────────────────────
    if (claim.type === "threshold" &&
        /s\s*[≤<]\s*0\.8|propagation\s+budget.*0\.8|0\.8.*budget/i.test(text)) {
        const affectedFiles = [];
        for (const filePath of tsFiles) {
            const relPath = path.relative(repoPath, filePath).replace(/\\/g, "/");
            if (relPath.startsWith("dist/"))
                continue;
            if (!/damp/i.test(relPath))
                continue;
            try {
                const code = fs.readFileSync(filePath, "utf-8");
                // Flag if dampening file doesn't enforce the 0.8 budget
                if (!/0\.8/.test(code)) {
                    affectedFiles.push(relPath);
                }
            }
            catch {
                /* skip */
            }
        }
        if (affectedFiles.length > 0) {
            addGap({
                id: "research-divergence-budget-constraint-s08",
                description: `Research '${doc.title}' specifies propagation budget s≤0.8. Dampening code may not enforce this bound.`,
                severity: "warning",
                specRef: doc.path,
                codeRef: affectedFiles,
                category: "research-divergence",
            });
        }
    }
    // ── Architectural: observer pattern vs structural state ───────────────────
    if (claim.type === "architectural" &&
        /state\s+is\s+structural/i.test(text) &&
        /observer|monitor/i.test(text)) {
        // Check if observer pattern TypeScript classes exist
        const observerFiles = [];
        for (const filePath of tsFiles) {
            const relPath = path.relative(repoPath, filePath).replace(/\\/g, "/");
            if (relPath.startsWith("dist/"))
                continue;
            if (/patterns\/observer|patterns\\observer/i.test(relPath)) {
                try {
                    const code = fs.readFileSync(filePath, "utf-8");
                    if (/\bclass\b/.test(code)) {
                        observerFiles.push(relPath);
                    }
                }
                catch {
                    /* skip */
                }
            }
        }
        if (observerFiles.length > 0) {
            addGap({
                id: "research-divergence-observer-structural",
                description: `Research '${doc.title}' asserts state is structural — observation should be Cypher queries, not TypeScript wrapper classes. Found TypeScript classes in observer pattern.`,
                severity: "warning",
                specRef: doc.path,
                codeRef: observerFiles,
                category: "research-divergence",
            });
        }
    }
}
//# sourceMappingURL=survey.js.map