// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

import { writeTransaction } from "../client.js";
import { instantiateMorpheme } from "../instantiation.js";
import type { HighlanderOptions } from "../instantiation.js";
import { ARCHITECT_STAGES } from "./pipeline-run.js";

// ============ TYPES ============

export interface ResonatorProps {
  id: string;
  name: string;
  content: string;
  type: string;
  status: string;
  [key: string]: unknown;
}

// ============ RESONATOR QUERIES ============

/**
 * Create a Resonator AND wire it to a parent Bloom via the Instantiation Protocol.
 * Delegates to instantiateMorpheme() for hygiene, containment, and INSTANTIATES wiring.
 */
export async function createContainedResonator(
  props: ResonatorProps,
  parentBloomId: string,
  highlander?: HighlanderOptions,
): Promise<void> {
  const result = await instantiateMorpheme("resonator", { ...props }, parentBloomId, highlander);
  if (!result.success) {
    throw new Error(result.error ?? "Resonator instantiation failed");
  }
}

const STAGE_CONTENT: Record<string, string> = {
  SURVEY: "Discovers codebase structure, graph state, specification references, and gap analysis for the intent",
  DECOMPOSE: "Breaks the intent into atomic Task Seeds with file paths, acceptance criteria, and dependency edges",
  CLASSIFY: "Enriches each Task Seed with taskType, kanoClass, estimatedComplexity, and routingHint via rule config",
  SEQUENCE: "Computes execution order via topological sort of Task Seed dependency graph",
  GATE: "Presents the execution plan for human review; captures approval, modification, or abort decision",
  DISPATCH: "Routes each Task Seed to its execution substrate via Thompson selection and executes",
  ADAPT: "Analyses execution outcomes and ΨH friction to determine whether replanning is needed",
};

/** Ensure the 7 Architect stage Blooms exist and are contained in the Architect Bloom */
export async function ensureArchitectStages(
  architectBloomId: string,
): Promise<void> {
  for (const stage of ARCHITECT_STAGES) {
    const stageId = `${architectBloomId}_${stage}`;
    const highlander: HighlanderOptions = {
      transformationDefId: "def:bloom:stage",
      a6Justification: "distinct_governance_scope",
    };

    const result = await instantiateMorpheme(
      "bloom",
      {
        id: stageId,
        name: stage,
        content: STAGE_CONTENT[stage],
        type: "stage",
        status: "active",
        stage,
      },
      architectBloomId,
      highlander,
    );

    if (!result.success && !result.composed) {
      console.warn(`  [GRAPH] ⚠️  Stage ${stage} instantiation: ${result.error}`);
    }

    // Add :Stage specialisation label (same pattern as PipelineRun)
    await writeTransaction(async (tx) => {
      await tx.run(
        `MATCH (s:Bloom {id: $stageId}) SET s:Stage`,
        { stageId },
      );
    });
  }
}

/** Link a TaskOutput to the Stage Bloom for its assigned stage */
export async function linkTaskOutputToStage(
  taskOutputId: string,
  stageId: string,
): Promise<void> {
  await writeTransaction(async (tx) => {
    await tx.run(
      `MATCH (to:TaskOutput { id: $taskOutputId }),
             (r:Stage { id: $stageId })
       MERGE (r)-[:PROCESSED]->(to)`,
      { taskOutputId, stageId },
    );
  });
}
