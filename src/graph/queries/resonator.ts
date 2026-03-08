// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { writeTransaction } from "../client.js";
import { ARCHITECT_STAGES } from "./pipeline-run.js";

// ============ RESONATOR QUERIES ============

/** Ensure the 7 Architect stage Resonators exist and are contained in the Architect Bloom */
export async function ensureArchitectResonators(
  architectBloomId: string,
): Promise<void> {
  await writeTransaction(async (tx) => {
    for (const stage of ARCHITECT_STAGES) {
      await tx.run(
        `MERGE (r:Resonator { id: $resonatorId })
         ON CREATE SET
           r.name = $stage,
           r.stage = $stage,
           r.createdAt = datetime()
         WITH r
         MATCH (b:Bloom { id: $bloomId })
         MERGE (b)-[:CONTAINS]->(r)`,
        {
          resonatorId: `${architectBloomId}_${stage}`,
          stage,
          bloomId: architectBloomId,
        },
      );
    }
  });
}

/** Link a TaskOutput to the Resonator for its assigned stage */
export async function linkTaskOutputToStage(
  taskOutputId: string,
  resonatorId: string,
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (to:TaskOutput { id: $taskOutputId }),
             (r:Resonator { id: $resonatorId })
       MERGE (r)-[:PROCESSED]->(to)`,
      { taskOutputId, resonatorId },
    );
  });
}
