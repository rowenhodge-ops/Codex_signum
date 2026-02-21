import "dotenv/config";
import { runQuery } from "../src/graph/client.js";

async function verify() {
  console.log("--- Checking constitutional rules ---");
  const rules = await runQuery(
    "MATCH (r:ConstitutionalRule) RETURN r.name AS name, r.status AS status",
    {},
    "READ",
  );
  console.log(`Found ${rules.records.length} constitutional rules:`);
  for (const record of rules.records) {
    console.log(`  - ${record.get("name")} [${record.get("status")}]`);
  }
  if (rules.records.length < 10) {
    console.error("ERROR: Expected at least 10 constitutional axioms");
    process.exit(1);
  }

  console.log("\n--- Checking constraints ---");
  const constraints = await runQuery("SHOW CONSTRAINTS", {}, "READ");
  console.log(`Found ${constraints.records.length} constraints`);

  console.log("\n--- Checking indexes ---");
  const indexes = await runQuery(
    "SHOW INDEXES YIELD name WHERE name <> 'constraint' RETURN count(*) AS count",
    {},
    "READ",
  );
  console.log(`Found ${indexes.records[0]?.get("count")} indexes`);

  console.log("\n--- Writing test Decision node ---");
  const testDecision = await runQuery(
    `CREATE (d:Decision {
      id: 'test-verify-' + toString(timestamp()),
      madeByPatternId: 'verify-script',
      selectedAgentId: 'test-model',
      taskType: 'verification',
      complexity: 'trivial',
      timestamp: datetime(),
      reasoning: 'Graph write verification',
      confidence: 1.0,
      wasExploratory: false
    }) RETURN d.id AS id`,
    {},
    "WRITE",
  );
  console.log(`Created test Decision: ${testDecision.records[0]?.get("id")}`);

  console.log("\n--- Reading back test Decision ---");
  const readBack = await runQuery(
    "MATCH (d:Decision) WHERE d.madeByPatternId = 'verify-script' RETURN d.id AS id, d.timestamp AS ts",
    {},
    "READ",
  );
  console.log(`Read back ${readBack.records.length} verification decision(s)`);

  if (readBack.records.length === 0) {
    console.error("ERROR: Write succeeded but read returned nothing");
    process.exit(1);
  }

  console.log("\n--- Cleaning up test data ---");
  await runQuery(
    "MATCH (d:Decision) WHERE d.madeByPatternId = 'verify-script' DELETE d",
    {},
    "WRITE",
  );
  console.log("Cleanup complete");

  console.log("\n✅ All graph verifications passed");
}

verify().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
