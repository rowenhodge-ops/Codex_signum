// One-shot script: stamp M-9.6 complete + add R-27, R-28 backlog
import { runQuery, closeDriver } from "../src/graph/index.js";

async function main() {
  // Update M-9.6 milestone Bloom
  const result = await runQuery(
    `MATCH (m:Bloom {id: "M-9.6"})
     SET m.status = "complete",
         m.phiL = 0.9,
         m.completedAt = datetime(),
         m.commitSha = "3ab815d",
         m.testCount = 1293
     RETURN m.id AS id, m.status AS status, m.phiL AS phiL`,
    {},
  );
  if (result.records.length > 0) {
    console.log("Updated M-9.6:", result.records[0].toObject());
  } else {
    console.log("M-9.6 Bloom not found, creating...");
    await runQuery(
      `MERGE (m:Bloom {id: "M-9.6"})
       SET m.name = "Model Expansion: Vertex AI MaaS Substrate",
           m.type = "sub-milestone",
           m.status = "complete",
           m.phiL = 0.9,
           m.sequence = 9.6,
           m.completedAt = datetime(),
           m.commitSha = "3ab815d",
           m.testCount = 1293
       RETURN m.id AS id`,
      {},
    );
    console.log("Created M-9.6 Bloom");
  }

  // Add R-27 backlog
  await runQuery(
    `MERGE (s:Bloom {id: "R-27"})
     SET s.name = "Deployable model substrate (GPU provisioning)",
         s.type = "backlog",
         s.status = "planned",
         s.phiL = 0.1,
         s.description = "GPU-provisioned models: Llama 3.1 70B/8B, Llama 3.3 70B, Gemma 3 12B, Gemma 2 27B, Mixtral 8x7B/8x22B, Mistral Nemo/7B, GPT-OSS 20B"
     RETURN s.id AS id`,
    {},
  );
  console.log("Created/updated R-27 backlog");

  // Add R-28 backlog
  await runQuery(
    `MERGE (s:Bloom {id: "R-28"})
     SET s.name = "Anti-drift fine-tuning recipe (M-14+)",
         s.type = "backlog",
         s.status = "planned",
         s.phiL = 0.1,
         s.description = "SFT on real tasks, contrastive negatives against architectural drift, DPO/ORPO preferring graph-native state, hard gate evaluation set"
     RETURN s.id AS id`,
    {},
  );
  console.log("Created/updated R-28 backlog");

  await closeDriver();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
