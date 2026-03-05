// One-shot script: stamp M-9.7b complete
import { runQuery, closeDriver } from "../src/graph/index.js";

async function main() {
  // Update M-9.7b milestone Bloom
  const result = await runQuery(
    `MATCH (m:Bloom {id: "M-9.7b"})
     SET m.status = "complete",
         m.phiL = 0.9,
         m.completedAt = datetime(),
         m.commitSha = "177f81f",
         m.testCount = 1313
     RETURN m.id AS id, m.status AS status, m.phiL AS phiL`,
    {},
  );
  if (result.records.length > 0) {
    console.log("Updated M-9.7b:", result.records[0].toObject());
  } else {
    console.log("M-9.7b Bloom not found, creating...");
    await runQuery(
      `MERGE (m:Bloom {id: "M-9.7b"})
       SET m.name = "Morpheme Mapping + 3D Topology Visualisation",
           m.type = "sub-milestone",
           m.status = "complete",
           m.phiL = 0.9,
           m.sequence = 9.72,
           m.completedAt = datetime(),
           m.commitSha = "177f81f",
           m.testCount = 1313
       RETURN m.id AS id`,
      {},
    );
    console.log("Created M-9.7b Bloom");
  }

  await closeDriver();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
