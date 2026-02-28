// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import "dotenv/config";
import { runQuery } from "../src/graph/client.js";
import { recordDecisionOutcome, selectModel } from "../src/index.js";

async function verify() {
  console.log("--- Calling selectModel() ---");
  let result;
  try {
    result = await selectModel({
      taskType: "code-generation",
      complexity: "moderate",
      domain: "test",
      qualityRequirement: 70,
      callerPatternId: "verify-script",
    });
    console.log("selectModel returned:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("selectModel() failed:", err);
    console.log("\nThis means the core selectModel function cannot operate.");
    console.log("Check: Are there Agent nodes in the graph?");
    console.log("Check: Does selectModel require pre-registered agents?");

    const agents = await runQuery(
      "MATCH (a:Agent) RETURN a.id AS id, a.status AS status LIMIT 10",
      {},
      "READ",
    );
    console.log(`\nAgent nodes in graph: ${agents.records.length}`);
    for (const r of agents.records) {
      console.log(`  - ${r.get("id")} [${r.get("status")}]`);
    }

    if (agents.records.length === 0) {
      console.log(
        "\nNo agents registered. The bootstrap may need to seed Agent nodes.",
      );
      console.log(
        "Or selectModel() may need agents registered before it can route.",
      );
    }
    process.exit(1);
  }

  console.log("\n--- Checking Decision was written to graph ---");
  const decisions = await runQuery(
    "MATCH (d:Decision {id: $id}) RETURN d.id AS id, d.selectedAgentId AS agent, d.taskType AS task",
    { id: result.decisionId },
    "READ",
  );

  if (decisions.records.length === 0) {
    console.error(
      "ERROR: selectModel returned a decisionId but no Decision node found in graph",
    );
    console.log("This means selectModel is NOT writing to Neo4j.");
    console.log(
      "Check: Does selectModel actually call a graph write, or does it only return in-memory results?",
    );
    process.exit(1);
  }

  console.log(`Decision node found: ${decisions.records[0].get("id")}`);
  console.log(`Selected agent: ${decisions.records[0].get("agent")}`);

  console.log("\n--- Recording outcome ---");
  await recordDecisionOutcome({
    decisionId: result.decisionId,
    success: true,
    qualityScore: 0.85,
    durationMs: 1500,
    cost: 0.002,
  });

  console.log("\n--- Verifying outcome was recorded ---");
  const updated = await runQuery(
    "MATCH (d:Decision {id: $id}) RETURN d.success AS success, d.qualityScore AS quality",
    { id: result.decisionId },
    "READ",
  );

  const success = updated.records[0]?.get("success");
  const quality = updated.records[0]?.get("quality");
  console.log(`Outcome recorded — success: ${success}, quality: ${quality}`);

  if (success === null || quality === null) {
    console.error(
      "ERROR: recordDecisionOutcome did not update the Decision node",
    );
    process.exit(1);
  }

  console.log("\n--- Cleanup ---");
  await runQuery(
    "MATCH (d:Decision {id: $id}) DETACH DELETE d",
    { id: result.decisionId },
    "WRITE",
  );

  console.log("\n✅ selectModel → recordOutcome → graph verification complete");
}

verify().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
