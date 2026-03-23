import "dotenv/config";
import { runQuery, closeDriver } from "../src/graph/client.js";

async function main() {
  // Find M-9 parent bloom (any ID scheme)
  const r1 = await runQuery(`
    MATCH (b:Bloom)
    WHERE b.id = 'M-9' OR b.id = 'bloom:m-9' OR b.id = 'bloom:M-9' OR b.name STARTS WITH 'M-9'
    RETURN b.id AS id, b.name AS name, b.status AS status, b.type AS type, b.phiL AS phiL
  `, {}, "READ");
  console.log("=== M-9 Parent Bloom ===");
  for (const rec of r1.records) {
    console.log(JSON.stringify({
      id: rec.get("id"), name: rec.get("name"),
      status: rec.get("status"), type: rec.get("type"), phiL: rec.get("phiL"),
    }));
  }
  if (r1.records.length === 0) console.log("  (none found)");

  // Find ALL M-9.* blooms and their parents
  const r2 = await runQuery(`
    MATCH (b:Bloom)
    WHERE b.id STARTS WITH 'M-9'
    OPTIONAL MATCH (parent)-[:CONTAINS]->(b)
    RETURN b.id AS id, b.name AS name, b.status AS status, b.type AS type,
           parent.id AS parentId
    ORDER BY b.id
  `, {}, "READ");
  console.log("\n=== All M-9.* Blooms + Parents ===");
  for (const rec of r2.records) {
    console.log(JSON.stringify({
      id: rec.get("id"), name: rec.get("name"),
      status: rec.get("status"), type: rec.get("type"),
      parentId: rec.get("parentId"),
    }));
  }

  // What does M-9 contain?
  const r3 = await runQuery(`
    MATCH (b:Bloom {id: 'M-9'})-[:CONTAINS]->(child)
    RETURN child.id AS id, child.name AS name, child.status AS status, labels(child) AS labels
    ORDER BY child.id
  `, {}, "READ");
  console.log("\n=== M-9 Children ===");
  for (const rec of r3.records) {
    console.log(JSON.stringify({
      id: rec.get("id"), name: rec.get("name"),
      status: rec.get("status"), labels: rec.get("labels"),
    }));
  }
  if (r3.records.length === 0) console.log("  (none found)");

  await closeDriver();
}

main().catch(async (err) => {
  console.error("FATAL:", err);
  await closeDriver().catch(() => {});
  process.exit(1);
});
