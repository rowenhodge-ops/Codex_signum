import { runQuery, closeDriver } from "../src/graph/client.js";

async function main() {
  // ── 1. All Milestone Blooms ──
  const r1 = await runQuery(
    `MATCH (b:Bloom) WHERE b.id STARTS WITH 'M-'
     OPTIONAL MATCH (b)-[:CONTAINS]->(child)
     WITH b,
       count(child) AS totalChildren,
       count(CASE WHEN child.status = 'complete' THEN 1 END) AS doneChildren,
       count(CASE WHEN child.status = 'active' THEN 1 END) AS activeChildren
     OPTIONAL MATCH (parent:Bloom)-[:CONTAINS]->(b)
     RETURN b.id AS id, b.name AS name, b.status AS status, b.phiL AS phiL,
            b.type AS bloomType, parent.id AS parentId,
            totalChildren, doneChildren, activeChildren
     ORDER BY b.id`,
    {},
    "READ",
  );

  console.log(`\n${"═".repeat(100)}`);
  console.log("  MILESTONE BLOOMS (" + r1.records.length + ")");
  console.log(`${"═".repeat(100)}\n`);

  const statusIcon = (s: string | null) =>
    s === "complete" ? "✅" : s === "active" ? "🔄" : "⬜";

  for (const r of r1.records) {
    const id = String(r.get("id")).padEnd(16);
    const st = r.get("status") || "?";
    const phi = r.get("phiL");
    const par = r.get("parentId") || "-";
    const t = r.get("totalChildren");
    const d = r.get("doneChildren");
    const a = r.get("activeChildren");
    const name = r.get("name") || "";
    const type = r.get("bloomType") || "";
    console.log(
      `${statusIcon(st)} ${id}| ${String(st).padEnd(10)}| phiL=${String(phi ?? "-").substring(0, 5).padEnd(6)}| parent=${String(par).padEnd(14)}| ${d}/${t} done, ${a} active | ${name} ${type ? `[${type}]` : ""}`,
    );
  }

  // ── 2. All R-* Seeds ──
  const r2 = await runQuery(
    `MATCH (s:Seed) WHERE s.id STARTS WITH 'R-'
     OPTIONAL MATCH (s)-[:SCOPED_TO]->(m:Bloom)
     OPTIONAL MATCH (parent:Bloom)-[:CONTAINS]->(s)
     RETURN s.id AS id, s.name AS name, s.seedType AS seedType,
            s.status AS status, s.content AS content,
            m.id AS scopedTo, m.status AS milestoneStatus,
            parent.id AS containedBy
     ORDER BY toInteger(replace(s.id, 'R-', ''))`,
    {},
    "READ",
  );

  console.log(`\n${"═".repeat(100)}`);
  console.log("  BACKLOG / REFINEMENT SEEDS (" + r2.records.length + ")");
  console.log(`${"═".repeat(100)}\n`);

  for (const r of r2.records) {
    const id = String(r.get("id")).padEnd(8);
    const st = r.get("status") || "?";
    const name = r.get("name") || "";
    const scoped = r.get("scopedTo") || "-";
    const contained = r.get("containedBy") || "-";
    const content = r.get("content") || "";
    const snip = content.length > 70 ? content.substring(0, 70) + "..." : content;
    console.log(
      `${statusIcon(st)} ${id}| ${String(st).padEnd(10)}| scope=${String(scoped).padEnd(12)}| parent=${String(contained).padEnd(14)}| ${name}`,
    );
    if (snip) console.log(`         | ${snip}`);
  }

  // ── 3. Exit Criteria per milestone ──
  const r3 = await runQuery(
    `MATCH (m:Bloom)-[:CONTAINS]->(s:Seed)
     WHERE m.id STARTS WITH 'M-' AND s.seedType = 'exit-criterion'
     RETURN m.id AS milestone, m.status AS mStatus,
            s.id AS ecId, s.content AS content, s.status AS status
     ORDER BY m.id, s.id`,
    {},
    "READ",
  );

  console.log(`\n${"═".repeat(100)}`);
  console.log("  EXIT CRITERIA (" + r3.records.length + ")");
  console.log(`${"═".repeat(100)}`);

  let currentM = "";
  for (const r of r3.records) {
    const m = r.get("milestone");
    if (m !== currentM) {
      const mSt = r.get("mStatus");
      console.log(`\n  ${statusIcon(mSt)} ${m} [${mSt}]:`);
      currentM = m;
    }
    const st = r.get("status") || "?";
    const content = r.get("content") || "(no content)";
    const snip = content.length > 80 ? content.substring(0, 80) + "..." : content;
    console.log(`      ${statusIcon(st)} ${r.get("ecId")} [${st}] — ${snip}`);
  }

  // ── 4. Dependencies ──
  const r4 = await runQuery(
    `MATCH (a:Bloom)-[:DEPENDS_ON]->(b:Bloom)
     WHERE a.id STARTS WITH 'M-' AND b.id STARTS WITH 'M-'
     RETURN a.id AS prereq, b.id AS dependent, a.status AS prereqSt, b.status AS depSt
     ORDER BY a.id, b.id`,
    {},
    "READ",
  );

  console.log(`\n${"═".repeat(100)}`);
  console.log("  DEPENDENCIES (" + r4.records.length + ")");
  console.log(`${"═".repeat(100)}\n`);

  for (const r of r4.records) {
    console.log(
      `  ${r.get("prereq")} [${r.get("prereqSt")}] ──DEPENDS_ON──> ${r.get("dependent")} [${r.get("depSt")}]`,
    );
  }

  // ── 5. Roadmap-v7 top-level summary ──
  const r5 = await runQuery(
    `MATCH (rv:Bloom {id: 'roadmap-v7'})-[:CONTAINS]->(child)
     WITH rv,
       count(child) AS total,
       count(CASE WHEN child.status = 'complete' THEN 1 END) AS done,
       count(CASE WHEN child.status = 'active' THEN 1 END) AS active,
       count(CASE WHEN child.status = 'planned' THEN 1 END) AS planned
     RETURN rv.status AS status, rv.phiL AS phiL, rv.psiH AS psiH,
            total, done, active, planned`,
    {},
    "READ",
  );

  console.log(`\n${"═".repeat(100)}`);
  console.log("  ROADMAP-V7 SUMMARY");
  console.log(`${"═".repeat(100)}\n`);

  if (r5.records.length > 0) {
    const rec = r5.records[0];
    console.log(`  Status:    ${rec.get("status")}`);
    console.log(`  phiL:      ${rec.get("phiL")}`);
    console.log(`  psiH:      ${rec.get("psiH")}`);
    console.log(`  Total:     ${rec.get("total")}`);
    console.log(`  Complete:  ${rec.get("done")}`);
    console.log(`  Active:    ${rec.get("active")}`);
    console.log(`  Planned:   ${rec.get("planned")}`);
  }

  // ── 6. All non-M, non-R nodes in roadmap-v7 ──
  const r6 = await runQuery(
    `MATCH (rv:Bloom {id: 'roadmap-v7'})-[:CONTAINS]->(child)
     WHERE NOT child.id STARTS WITH 'M-' AND NOT child.id STARTS WITH 'R-'
     RETURN child.id AS id, labels(child) AS labels, child.status AS status, child.name AS name
     ORDER BY child.id`,
    {},
    "READ",
  );

  if (r6.records.length > 0) {
    console.log(`\n${"═".repeat(100)}`);
    console.log("  OTHER ITEMS IN ROADMAP-V7 (" + r6.records.length + ")");
    console.log(`${"═".repeat(100)}\n`);

    for (const r of r6.records) {
      const st = r.get("status") || "?";
      console.log(
        `  ${statusIcon(st)} ${r.get("id")} [${r.get("labels")}] ${String(st).padEnd(10)} — ${r.get("name") || ""}`,
      );
    }
  }

  console.log(`\n${"═".repeat(100)}`);
  console.log("  Query complete");
  console.log(`${"═".repeat(100)}\n`);

  await closeDriver();
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
