/**
 * SURVEY Validation Script — Task 1.8
 *
 * Runs SURVEY against the DND-Manager repository and validates that it
 * detects the known gaps identified in the manual audit session
 * (codex-signum-reconciliation-plan-v2.md).
 *
 * This is NOT a unit test with assertions that fail the build.
 * It is a DIAGNOSTIC TOOL that produces a human-readable report.
 *
 * Usage:
 *   npx tsx tests/architect/survey-validation.ts <dnd-manager-path> [spec-path1] [spec-path2]
 *
 * Example:
 *   npx tsx tests/architect/survey-validation.ts \
 *     "/path/to/DND-Manager" \
 *     "/path/to/DND-Manager/docs/Codex_Signum/02_codex-signum-engineering-bridge-v2_0.md"
 */

import type {
  GapItem,
  SurveyOutput,
} from "../../src/patterns/architect/index.js";
import { survey } from "../../src/patterns/architect/index.js";

// ── Expected findings from the manual audit ──────────────────────────────────
// These are what the audit session with Ro found. SURVEY must detect them.

interface ExpectedFinding {
  id: string;
  description: string;
  /** Which gap categories to look for */
  matchCategories: Array<
    "duplication" | "missing" | "mismatch" | "drift" | "structural" | "research-divergence"
  >;
  /** Keywords that should appear in the gap description */
  matchKeywords: string[];
}

const EXPECTED_FINDINGS: ExpectedFinding[] = [
  {
    id: "dual-phi-l",
    description: "Dual ΦL implementation: HealthComputer.ts vs core phi-l.ts",
    matchCategories: ["duplication"],
    matchKeywords: ["HealthComputer", "phi", "phiL", "ΦL"],
  },
  {
    id: "dual-epsilon-r",
    description:
      "Dual εR implementation: ExplorationTracker.ts vs core epsilon-r.ts",
    matchCategories: ["duplication"],
    matchKeywords: ["ExplorationTracker", "epsilon", "εR"],
  },
  {
    id: "dual-psi-h",
    description:
      "Dual ΨH implementation: HarmonicResonance.ts vs core psi-h.ts",
    matchCategories: ["duplication"],
    matchKeywords: ["HarmonicResonance", "psi", "ΨH"],
  },
  {
    id: "monolith-hybrid-agent",
    description:
      "hybridAgent.ts as a 2400-line monolith reimplementing core's DevAgent",
    matchCategories: ["duplication", "structural"],
    matchKeywords: ["hybridAgent", "monolith", "pipeline"],
  },
  {
    id: "propagate-degradation-unwired",
    description:
      "propagateDegradation exported from core but not imported in DND-Manager",
    matchCategories: ["missing"],
    matchKeywords: ["propagateDegradation", "cascade", "degradation"],
  },
  {
    id: "two-bridges",
    description:
      "codex-bridge.ts exists but hybridAgent.ts is the actual entry point",
    matchCategories: ["structural"],
    matchKeywords: ["codex-bridge", "hybridAgent", "bridge", "entry"],
  },
];

// ────────────────────────────────────────────────────────────────────────────

async function runValidation(): Promise<void> {
  const args = process.argv.slice(2);
  const dndManagerPath =
    args[0] ??
    process.argv[2] ?? (() => { throw new Error("Usage: npx tsx tests/architect/survey-validation.ts <dnd-manager-path>"); })();
  const specPaths = args.slice(1);

  console.log(
    "═══════════════════════════════════════════════════════════════",
  );
  console.log("  SURVEY Validation — Phase 1 Gate Report");
  console.log(
    "═══════════════════════════════════════════════════════════════",
  );
  console.log(`  Target repo:  ${dndManagerPath}`);
  console.log(
    `  Spec files:   ${specPaths.length > 0 ? specPaths.join(", ") : "(none provided)"}`,
  );
  console.log(
    "═══════════════════════════════════════════════════════════════\n",
  );

  // Run SURVEY
  console.log("Running SURVEY...\n");
  const startTime = Date.now();

  let output: SurveyOutput;
  try {
    output = await survey({
      repoPath: dndManagerPath,
      specificationRefs: specPaths,
      intent:
        "Validate SURVEY against manual audit findings from Feb 2026 session",
      graphClient: null, // No graph client in validation script
    });
  } catch (err) {
    console.error("SURVEY failed:", err);
    process.exit(1);
  }

  const elapsed = Date.now() - startTime;

  // ── Summary ────────────────────────────────────────────────────────────
  console.log(`Survey ID:   ${output.surveyId}`);
  console.log(`Timestamp:   ${output.timestamp.toISOString()}`);
  console.log(`Duration:    ${elapsed}ms`);
  console.log(`Confidence:  ${(output.confidence * 100).toFixed(1)}%`);
  console.log(`Blind spots: ${output.blindSpots.length}`);
  console.log("");

  // ── Codebase state summary ─────────────────────────────────────────────
  console.log(
    "── Codebase State ──────────────────────────────────────────────",
  );
  console.log(
    `  Entry points:         ${output.codebaseState.entryPoints.join(", ") || "(none)"}`,
  );
  console.log(
    `  Core imports found:   ${Object.keys(output.codebaseState.coreImports).length} files`,
  );
  console.log(
    `  Duplications found:   ${output.codebaseState.duplications.length}`,
  );
  console.log(
    `  Recent commits:       ${output.codebaseState.recentCommits.length}`,
  );
  console.log("");

  if (output.codebaseState.duplications.length > 0) {
    console.log("  Detected duplications:");
    for (const dup of output.codebaseState.duplications) {
      const badge =
        dup.confidence === "high"
          ? "HIGH"
          : dup.confidence === "medium"
            ? "MED "
            : "LOW ";
      console.log(`    [${badge}] ${dup.localFile} → ${dup.duplicates}`);
    }
    console.log("");
  }

  // ── Gap analysis ────────────────────────────────────────────────────────
  console.log(
    "── Gap Analysis ────────────────────────────────────────────────",
  );
  console.log(`  Total gaps: ${output.gapAnalysis.gaps.length}`);

  const criticalGaps = output.gapAnalysis.gaps.filter(
    (g) => g.severity === "critical",
  );
  const warningGaps = output.gapAnalysis.gaps.filter(
    (g) => g.severity === "warning",
  );
  const infoGaps = output.gapAnalysis.gaps.filter((g) => g.severity === "info");

  console.log(`    Critical: ${criticalGaps.length}`);
  console.log(`    Warning:  ${warningGaps.length}`);
  console.log(`    Info:     ${infoGaps.length}`);
  console.log("");

  if (output.gapAnalysis.gaps.length > 0) {
    for (const gap of output.gapAnalysis.gaps) {
      const icon =
        gap.severity === "critical"
          ? "❌"
          : gap.severity === "warning"
            ? "⚠️ "
            : "ℹ️ ";
      console.log(`  ${icon} [${gap.category}] ${gap.description}`);
      if (gap.codeRef && gap.codeRef.length > 0) {
        console.log(`       Files: ${gap.codeRef.join(", ")}`);
      }
    }
    console.log("");
  }

  if (output.gapAnalysis.whatNeedsBuilding.length > 0) {
    console.log("  What needs building:");
    for (const item of output.gapAnalysis.whatNeedsBuilding) {
      console.log(`    • ${item}`);
    }
    console.log("");
  }

  // ── Blind spots ─────────────────────────────────────────────────────────
  if (output.blindSpots.length > 0) {
    console.log(
      "── Blind Spots ─────────────────────────────────────────────────",
    );
    for (const bs of output.blindSpots) {
      console.log(`  ? ${bs.description}`);
    }
    console.log("");
  }

  // ── Validation against expected findings ────────────────────────────────
  console.log(
    "═══════════════════════════════════════════════════════════════",
  );
  console.log("  Validation vs Manual Audit Findings");
  console.log(
    "═══════════════════════════════════════════════════════════════\n",
  );

  let detected = 0;
  let missed = 0;

  for (const expected of EXPECTED_FINDINGS) {
    const found = findMatchingGap(output, expected);
    if (found) {
      detected++;
      console.log(`  ✅ DETECTED: ${expected.id}`);
      console.log(`     Expected: ${expected.description}`);
      console.log(`     Matched:  ${found.description}`);
    } else {
      missed++;
      console.log(`  ❌ MISSED:   ${expected.id}`);
      console.log(`     Expected: ${expected.description}`);
    }
    console.log("");
  }

  // ── Bonus findings ─────────────────────────────────────────────────────
  const bonusGaps = output.gapAnalysis.gaps.filter(
    (gap) => !EXPECTED_FINDINGS.some((ef) => findMatchesGap(gap, ef)),
  );

  if (bonusGaps.length > 0) {
    console.log(
      "── Bonus Findings (not in manual audit) ───────────────────────",
    );
    for (const bonus of bonusGaps) {
      console.log(`  + [${bonus.severity}] ${bonus.description}`);
    }
    console.log("");
  }

  // ── Final score ─────────────────────────────────────────────────────────
  const score = ((detected / EXPECTED_FINDINGS.length) * 100).toFixed(1);
  console.log(
    "═══════════════════════════════════════════════════════════════",
  );
  console.log(
    `  SURVEY Detection Rate: ${detected}/${EXPECTED_FINDINGS.length} (${score}%)`,
  );
  console.log(
    `  SURVEY Confidence:     ${(output.confidence * 100).toFixed(1)}%`,
  );
  console.log(`  Bonus findings:        ${bonusGaps.length}`);

  if (missed === 0) {
    console.log("  Status: ✅ ALL EXPECTED FINDINGS DETECTED");
  } else if (detected >= Math.ceil(EXPECTED_FINDINGS.length * 0.7)) {
    console.log(
      `  Status: ⚠️  ${missed} findings missed — review and improve as backlog`,
    );
  } else {
    console.log(
      `  Status: ❌ Too many findings missed (${missed}/${EXPECTED_FINDINGS.length})`,
    );
  }
  console.log(
    "═══════════════════════════════════════════════════════════════\n",
  );
}

/** Check if any gap in the output matches an expected finding */
function findMatchingGap(
  output: SurveyOutput,
  expected: ExpectedFinding,
): GapItem | null {
  // Check all gaps + duplications as gaps
  const allGaps: GapItem[] = [
    ...output.gapAnalysis.gaps,
    // Convert duplications to pseudo-gaps for matching
    ...output.codebaseState.duplications.map((d, i) => ({
      id: `dup-${i}`,
      description: `${d.localFile} duplicates ${d.duplicates}`,
      severity: "warning" as const,
      category: "duplication" as const,
      codeRef: [d.localFile],
    })),
  ];

  for (const gap of allGaps) {
    if (findMatchesGap(gap, expected)) return gap;
  }
  return null;
}

function findMatchesGap(gap: GapItem, expected: ExpectedFinding): boolean {
  // Category match
  const categoryMatch = expected.matchCategories.includes(gap.category);
  if (!categoryMatch) return false;

  // Keyword match (case-insensitive, at least one keyword must match)
  const gapText =
    `${gap.description} ${(gap.codeRef ?? []).join(" ")}`.toLowerCase();
  const keywordMatch = expected.matchKeywords.some((kw) =>
    gapText.includes(kw.toLowerCase()),
  );

  return keywordMatch;
}

// Run
runValidation().catch((err) => {
  console.error("Validation error:", err);
  process.exit(1);
});
