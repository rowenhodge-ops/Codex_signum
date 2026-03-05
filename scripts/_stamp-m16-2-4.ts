// One-shot script: stamp M-16.2 + M-16.4 complete
import { runQuery, closeDriver } from "../src/graph/index.js";

async function main() {
  const commitSha = "bc413c1";
  const testCount = 1369;

  // Stamp M-16.2: Axiom Canonicalization
  const r1 = await runQuery(
    `MATCH (m:Bloom {id: "M-16.2"})
     SET m.status = "complete",
         m.phiL = 0.9,
         m.completedAt = datetime(),
         m.commitSha = $commitSha,
         m.testCount = $testCount
     RETURN m.id AS id, m.status AS status, m.phiL AS phiL`,
    { commitSha, testCount },
  );
  if (r1.records.length > 0) {
    console.log("Updated M-16.2:", r1.records[0].toObject());
  } else {
    console.log("M-16.2 Bloom not found, creating...");
    await runQuery(
      `MERGE (m:Bloom {id: "M-16.2"})
       SET m.name = "Axiom Canonicalization (10→9)",
           m.type = "sub-milestone",
           m.status = "complete",
           m.phiL = 0.9,
           m.sequence = 16.2,
           m.completedAt = datetime(),
           m.commitSha = $commitSha,
           m.testCount = $testCount
       RETURN m.id AS id`,
      { commitSha, testCount },
    );
    console.log("Created M-16.2 Bloom");
  }

  // Stamp M-16.4: Governance Updates
  const r2 = await runQuery(
    `MATCH (m:Bloom {id: "M-16.4"})
     SET m.status = "complete",
         m.phiL = 0.9,
         m.completedAt = datetime(),
         m.commitSha = $commitSha,
         m.testCount = $testCount
     RETURN m.id AS id, m.status AS status, m.phiL AS phiL`,
    { commitSha, testCount },
  );
  if (r2.records.length > 0) {
    console.log("Updated M-16.4:", r2.records[0].toObject());
  } else {
    console.log("M-16.4 Bloom not found, creating...");
    await runQuery(
      `MERGE (m:Bloom {id: "M-16.4"})
       SET m.name = "Governance Updates (CLAUDE.md, specs, tests)",
           m.type = "sub-milestone",
           m.status = "complete",
           m.phiL = 0.9,
           m.sequence = 16.4,
           m.completedAt = datetime(),
           m.commitSha = $commitSha,
           m.testCount = $testCount
       RETURN m.id AS id`,
      { commitSha, testCount },
    );
    console.log("Created M-16.4 Bloom");
  }

  await closeDriver();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
