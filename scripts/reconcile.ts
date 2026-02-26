/**
 * Codex Signum — Research Reconciliation Audit
 *
 * Runs the broadened SURVEY against core's own implementation
 * to find divergences between research documents and implementation.
 *
 * Usage:
 *   npx tsx scripts/reconcile.ts
 */
import { survey } from "../src/patterns/architect/survey.js";

async function main(): Promise<void> {
  const result = await survey({
    repoPath: process.cwd(),
    specificationRefs: [
      "docs/specs/codex-signum-v3_0.md",
      "docs/specs/codex-signum-engineering-bridge-v2_0.md",
      "docs/specs/codex-signum-implementation-README.md",
    ],
    docsPaths: ["docs/specs/", "docs/research/"],
    intent:
      "Research reconciliation: audit all research claims against implementation",
  });

  const SEP = "═".repeat(70);
  const HR = "─".repeat(50);

  console.log("\n" + SEP);
  console.log("  CODEX SIGNUM — RESEARCH RECONCILIATION AUDIT");
  console.log(SEP);

  // ── Document Sources ──────────────────────────────────────────────────────
  console.log("\n📚 DOCUMENT SOURCES DISCOVERED");
  console.log(HR);

  if (result.documentSources.length === 0) {
    console.log("\n  ⚠️  No documents discovered.");
    console.log(
      "     Check that docs/specs/ and docs/research/ exist and contain .md files.",
    );
  } else {
    for (const doc of result.documentSources) {
      const byType: Record<string, number> = {};
      for (const c of doc.extractedClaims) {
        byType[c.type] = (byType[c.type] ?? 0) + 1;
      }
      const breakdown =
        Object.keys(byType).length > 0
          ? Object.entries(byType)
              .map(([t, n]) => `${t}:${n}`)
              .join(", ")
          : "none";

      console.log(`\n  📄 ${doc.title}`);
      console.log(`     Path:   ${doc.path}`);
      console.log(`     Claims: ${doc.extractedClaims.length}  (${breakdown})`);
    }
  }

  // ── Gap Analysis ──────────────────────────────────────────────────────────
  console.log("\n\n🔍 GAP ANALYSIS");
  console.log(HR);

  const byCategory: Record<string, typeof result.gapAnalysis.gaps> = {};
  for (const gap of result.gapAnalysis.gaps) {
    (byCategory[gap.category] ??= []).push(gap);
  }

  // Show research-divergence first (most important for this audit)
  const categoryOrder = [
    "research-divergence",
    "mismatch",
    "missing",
    "structural",
    "duplication",
    "drift",
  ];

  let anyGaps = false;
  for (const cat of categoryOrder) {
    const gaps = byCategory[cat];
    if (!gaps || gaps.length === 0) continue;
    anyGaps = true;

    console.log(`\n  ── ${cat.toUpperCase()} (${gaps.length}) ──`);
    for (const gap of gaps) {
      const icon =
        gap.severity === "critical"
          ? "🔴"
          : gap.severity === "warning"
            ? "🟡"
            : "🔵";
      console.log(`\n  ${icon} [${gap.severity}] ${gap.id}`);
      console.log(`     ${gap.description}`);
      if (gap.specRef) console.log(`     Source: ${gap.specRef}`);
      if (gap.codeRef && gap.codeRef.length > 0)
        console.log(`     Code:   ${gap.codeRef.join(", ")}`);
    }
  }

  if (!anyGaps) {
    console.log("\n  ✅ No gaps found.");
  }

  // ── What Needs Building / Fixing ─────────────────────────────────────────
  if (result.gapAnalysis.whatNeedsBuilding.length > 0) {
    console.log("\n\n📋 NEEDS BUILDING:");
    console.log(HR);
    for (const item of result.gapAnalysis.whatNeedsBuilding) {
      console.log(`  • ${item}`);
    }
  }

  if (result.gapAnalysis.whatNeedsFixing.length > 0) {
    console.log("\n\n🔧 NEEDS FIXING:");
    console.log(HR);
    for (const item of result.gapAnalysis.whatNeedsFixing) {
      console.log(`  • ${item}`);
    }
  }

  // ── Blind Spots ───────────────────────────────────────────────────────────
  if (result.blindSpots.length > 0) {
    console.log("\n\n⚠️  BLIND SPOTS:");
    console.log(HR);
    for (const bs of result.blindSpots) {
      console.log(`  • ${bs.description}`);
      console.log(`    Resolution: ${bs.resolution}`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalGaps = result.gapAnalysis.gaps.length;
  const criticalGaps = result.gapAnalysis.gaps.filter(
    (g) => g.severity === "critical",
  ).length;
  const warningGaps = result.gapAnalysis.gaps.filter(
    (g) => g.severity === "warning",
  ).length;
  const totalClaims = result.documentSources.reduce(
    (sum, d) => sum + d.extractedClaims.length,
    0,
  );
  const researchDivergences = (byCategory["research-divergence"] ?? []).length;

  // Aggregate claim counts by type across all documents
  const claimTotals: Record<string, number> = {};
  for (const doc of result.documentSources) {
    for (const claim of doc.extractedClaims) {
      claimTotals[claim.type] = (claimTotals[claim.type] ?? 0) + 1;
    }
  }
  const claimBreakdown =
    Object.keys(claimTotals).length > 0
      ? Object.entries(claimTotals)
          .sort((a, b) => b[1] - a[1])
          .map(([t, n]) => `${t}:${n}`)
          .join("  ")
      : "none";

  console.log("\n\n" + SEP);
  console.log(
    `  GAPS:       ${totalGaps} total  (${criticalGaps} critical, ${warningGaps} warning)`,
  );
  console.log(`  DIVERGENCES: ${researchDivergences} research-divergence gaps`);
  console.log(
    `  DOCUMENTS:  ${result.documentSources.length} sources, ${totalClaims} total claims`,
  );
  console.log(`  CLAIMS:     ${claimBreakdown}`);
  console.log(
    `  CONFIDENCE: ${(result.confidence * 100).toFixed(0)}%  (blind spots: ${result.blindSpots.length})`,
  );
  console.log(SEP + "\n");
}

main().catch((err: unknown) => {
  console.error("Reconciliation failed:", err);
  process.exit(1);
});
