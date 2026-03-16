// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details
import { writeTransaction } from "../client.js";
import { instantiateMorpheme } from "../instantiation.js";
import { ARCHITECT_STAGES } from "./pipeline-run.js";
// ============ RESONATOR QUERIES ============
/**
 * Create a Resonator AND wire it to a parent Bloom via the Instantiation Protocol.
 * Delegates to instantiateMorpheme() for hygiene, containment, and INSTANTIATES wiring.
 */
export async function createContainedResonator(props, parentBloomId) {
    const result = await instantiateMorpheme("resonator", { ...props }, parentBloomId);
    if (!result.success) {
        throw new Error(result.error ?? "Resonator instantiation failed");
    }
}
/** Ensure the 7 Architect stage Blooms exist and are contained in the Architect Bloom */
export async function ensureArchitectStages(architectBloomId) {
    await writeTransaction(async (tx) => {
        for (const stage of ARCHITECT_STAGES) {
            await tx.run(`MERGE (r:Bloom:Stage { id: $stageId })
         ON CREATE SET
           r.name = $stage,
           r.stage = $stage,
           r.createdAt = datetime()
         WITH r
         MATCH (b:Bloom { id: $bloomId })
         MERGE (b)-[:CONTAINS]->(r)`, {
                stageId: `${architectBloomId}_${stage}`,
                stage,
                bloomId: architectBloomId,
            });
        }
    });
}
/** @deprecated Use ensureArchitectStages instead */
export const ensureArchitectResonators = ensureArchitectStages;
/** Link a TaskOutput to the Stage Bloom for its assigned stage */
export async function linkTaskOutputToStage(taskOutputId, stageId) {
    await writeTransaction(async (tx) => {
        await tx.run(`MATCH (to:TaskOutput { id: $taskOutputId }),
             (r:Stage { id: $stageId })
       MERGE (r)-[:PROCESSED]->(to)`, { taskOutputId, stageId });
    });
}
//# sourceMappingURL=resonator.js.map