import "dotenv/config";
import { runQuery, closeDriver } from "../src/graph/client.js";
import { updateMorpheme } from "../src/graph/instantiation.js";
import { verifyStamp } from "../src/graph/queries/bloom.js";

const TEST_COUNT = 1654;
const COMMIT_SHA = "bb7de00";

async function main() {
  // ── Step 1: Show M-9 children and current state ──
  console.log("=== M-9 Children ===");
  const childrenResult = await runQuery(`
    MATCH (parent:Bloom {id: 'M-9'})-[:CONTAINS]->(child:Bloom)
    RETURN child.id AS id, child.name AS name, child.status AS status, child.phiL AS phiL
    ORDER BY child.id
  `, {}, "READ");
  let allComplete = true;
  for (const rec of childrenResult.records) {
    const status = rec.get("status");
    const id = rec.get("id");
    console.log(`  ${id}: status=${status}, phiL=${rec.get("phiL")}, name=${rec.get("name")}`);
    if (status !== "complete") allComplete = false;
  }
  console.log(`\n  Total children: ${childrenResult.records.length}`);
  console.log(`  All complete: ${allComplete}`);

  // Check if M-9.V is already a child
  const m9vChild = childrenResult.records.find(r => r.get("id") === "M-9.V");
  console.log(`  M-9.V is child of M-9: ${m9vChild ? "YES" : "NO"}`);

  // ── Step 2: Show M-9 parent state ──
  console.log("\n=== M-9 Parent State ===");
  const m9Result = await runQuery(`
    MATCH (b:Bloom {id: 'M-9'})
    RETURN b.id AS id, b.name AS name, b.status AS status, b.phiL AS phiL,
           b.commitSha AS commitSha, b.testCount AS testCount
  `, {}, "READ");
  for (const rec of m9Result.records) {
    console.log(`  id=${rec.get("id")}, name=${rec.get("name")}, status=${rec.get("status")}, phiL=${rec.get("phiL")}`);
  }

  // ── Step 3: Stamp M-9.V complete ──
  console.log("\n=== Stamping M-9.V complete ===");
  const stampResult = await updateMorpheme("M-9.V", {
    status: "complete",
    phiL: 0.9,
    commitSha: COMMIT_SHA,
    testCount: TEST_COUNT,
    completedAt: new Date().toISOString(),
  });
  console.log("  updateMorpheme result:", JSON.stringify(stampResult, null, 2));

  // ── Step 4: Verify M-9.V stamp ──
  console.log("\n=== Verify M-9.V stamp ===");
  const v9vVerify = await verifyStamp("M-9.V", "complete");
  console.log("  M-9.V verification:", JSON.stringify(v9vVerify, null, 2));

  // ── Step 5: Check M-9 parent auto-closure ──
  console.log("\n=== M-9 Parent After Stamp ===");
  const m9After = await runQuery(`
    MATCH (b:Bloom {id: 'M-9'})
    RETURN b.status AS status, b.phiL AS phiL
  `, {}, "READ");
  for (const rec of m9After.records) {
    console.log(`  M-9: status=${rec.get("status")}, phiL=${rec.get("phiL")}`);
  }

  // ── Step 6: Verify M-9 stamp ──
  console.log("\n=== Verify M-9 stamp ===");
  const m9Verify = await verifyStamp("M-9", "complete");
  console.log("  M-9 verification:", JSON.stringify(m9Verify, null, 2));

  // ── Step 7: Final raw Cypher confirmation ──
  console.log("\n=== Final Confirmation ===");
  const finalResult = await runQuery(`
    MATCH (parent:Bloom {id: 'M-9'})-[:CONTAINS]->(child:Bloom)
    RETURN parent.id AS parentId, parent.status AS parentStatus, parent.phiL AS parentPhiL,
           child.id AS childId, child.status AS childStatus
    ORDER BY child.id
  `, {}, "READ");
  for (const rec of finalResult.records) {
    console.log(`  parent: ${rec.get("parentId")} (${rec.get("parentStatus")}, phiL=${rec.get("parentPhiL")}) -> child: ${rec.get("childId")} (${rec.get("childStatus")})`);
  }

  await closeDriver();
}

main().catch(async (err) => {
  console.error("FATAL:", err);
  await closeDriver().catch(() => {});
  process.exit(1);
});
