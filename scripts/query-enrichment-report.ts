/**
 * Throwaway script — query enrichment grounding quality.
 * Usage: npx tsx scripts/query-enrichment-report.ts
 */

import { runQuery, closeDriver } from "../src/graph/client.js";

async function main() {
  try {
    // ── Query 1: Top 5 intents with content preview ──
    console.log("═══════════════════════════════════════════════════════════");
    console.log("  QUERY 1 — Top 5 intents with content preview");
    console.log("═══════════════════════════════════════════════════════════\n");

    const q1 = await runQuery(
      `MATCH (cb:Bloom {id: 'cognitive-bloom'})-[:CONTAINS]->(i:Seed {seedType: 'intent'})
       WHERE i.status IN ['proposed', 'approved']
       RETURN i.id AS id, i.priorityScore AS priorityScore,
              size(i.content) AS contentLength,
              substring(i.content, 0, 800) AS contentPreview
       ORDER BY i.priorityScore DESC
       LIMIT 5`,
      {},
      "READ",
    );

    if (q1.records.length === 0) {
      console.log("  (no results)\n");
    } else {
      for (const r of q1.records) {
        console.log(`  ID: ${r.get("id")}`);
        console.log(`  Priority: ${r.get("priorityScore")}`);
        console.log(`  Content Length: ${r.get("contentLength")}`);
        console.log(`  Preview:\n    ${r.get("contentPreview")?.replace(/\n/g, "\n    ")}`);
        console.log("  ---");
      }
    }

    // ── Query 2: Enrichment status for top 10 ──
    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("  QUERY 2 — Enrichment status for top 10");
    console.log("═══════════════════════════════════════════════════════════\n");

    const q2 = await runQuery(
      `MATCH (cb:Bloom {id: 'cognitive-bloom'})-[:CONTAINS]->(i:Seed {seedType: 'intent'})
       WHERE i.status IN ['proposed', 'approved']
       RETURN i.id AS id, i.priorityScore AS priorityScore,
              size(i.content) AS contentLength,
              CASE WHEN size(i.content) > 500 THEN 'ENRICHED' ELSE 'RAW' END AS status
       ORDER BY i.priorityScore DESC
       LIMIT 10`,
      {},
      "READ",
    );

    if (q2.records.length === 0) {
      console.log("  (no results)\n");
    } else {
      console.log(
        "  " +
          "ID".padEnd(40) +
          "Priority".padEnd(12) +
          "Length".padEnd(10) +
          "Status",
      );
      console.log("  " + "─".repeat(72));
      for (const r of q2.records) {
        console.log(
          "  " +
            String(r.get("id")).padEnd(40) +
            String(r.get("priorityScore") ?? "—").padEnd(12) +
            String(r.get("contentLength")).padEnd(10) +
            r.get("status"),
        );
      }
    }

    // ── Query 3: Latest planning observation ──
    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("  QUERY 3 — Latest planning observation");
    console.log("═══════════════════════════════════════════════════════════\n");

    const q3 = await runQuery(
      `MATCH (g:Grid {id: 'grid:cognitive-observations'})-[:CONTAINS]->(s:Seed)
       WHERE s.seedType = 'observation' AND s.name = 'Planning Cycle Observation'
       RETURN s.createdAt AS createdAt, s.bloomCount AS bloomCount,
              s.violationCount AS violationCount,
              s.constitutionalGapCount AS constitutionalGapCount,
              s.intentCount AS intentCount, s.persistedCount AS persistedCount,
              s.processingTimeMs AS processingTimeMs
       ORDER BY s.createdAt DESC LIMIT 1`,
      {},
      "READ",
    );

    if (q3.records.length === 0) {
      console.log("  (no results)\n");
    } else {
      const r = q3.records[0];
      console.log(`  Created At:             ${r.get("createdAt")}`);
      console.log(`  Bloom Count:            ${r.get("bloomCount")}`);
      console.log(`  Violation Count:        ${r.get("violationCount")}`);
      console.log(`  Constitutional Gaps:    ${r.get("constitutionalGapCount")}`);
      console.log(`  Intent Count:           ${r.get("intentCount")}`);
      console.log(`  Persisted Count:        ${r.get("persistedCount")}`);
      console.log(`  Processing Time (ms):   ${r.get("processingTimeMs")}`);
    }

    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("  Done.");
    console.log("═══════════════════════════════════════════════════════════\n");
  } finally {
    await closeDriver();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
