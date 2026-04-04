// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Gnosis Planning Cycle — ecosystem-wide structural prioritisation.
 *
 * Reads: topology (multi-Bloom survey), violations, milestones, constitutional gaps.
 * Produces: PlanningReport with ranked, categorised intents.
 *
 * All prioritisation is structural — no LLM. Priority derives from:
 * 1. Violation severity (critical > error > warning)
 * 2. Constitutional gap (mandatory > advisory)
 * 3. λ₂ improvement potential
 * 4. ΦL uplift (lowest ΦL = highest priority)
 * 5. Dependency unblocking (intents that unblock other intents score higher)
 *
 * @module codex-signum-core/patterns/cognitive/planning
 */

import { readTransaction } from "../../graph/client.js";
import { surveyBloomTopology } from "./structural-survey.js";
import { queryTransformationDefinitions, computeConstitutionalDelta } from "./constitutional-delta.js";
import { instantiateMorpheme, updateMorpheme } from "../../graph/instantiation.js";
import { getMemoryContextForBloom, formatMemoryContextForSurvey } from "../../graph/queries/memory-context.js";
import { BOCPDDetector } from "../../signals/BOCPDDetector.js";
import { detectUnsourcedReferences } from "../architect/hallucination-detection.js";
import { extractPathReferences } from "../architect/canonical-references.js";
import type { LLMMemoryContext } from "../../graph/queries/memory-context.js";
import type { ModelExecutor } from "../architect/types.js";
import type { GapSeed, TransformationDef } from "./types.js";
import type {
  PlanningReport,
  PlanningIntent,
  IntentCategory,
  BloomStateEntry,
  ViolationEntry,
  MilestoneEntry,
  PersistedIntentStats,
} from "./planning-types.js";

// ─── Step 1: Ecosystem Survey ─────────────────────────────────────

async function surveyEcosystem(): Promise<{
  bloomStates: BloomStateEntry[];
  totalResonators: number;
  totalGrids: number;
  totalHelixes: number;
}> {
  return readTransaction(async (tx) => {
    const bloomResult = await tx.run(
      `MATCH (b:Bloom)
       WHERE b.status IN ['active', 'planned']
       OPTIONAL MATCH (b)-[:CONTAINS]->(child)
       WITH b, count(child) AS childCount
       RETURN b.id AS id, b.name AS name,
              coalesce(b.phiL, 0.0) AS phiL,
              coalesce(b.psiH, 0.0) AS psiH,
              coalesce(b.lambda2, 0.0) AS lambda2,
              b.status AS status,
              childCount
       ORDER BY phiL ASC`,
    );

    const bloomStates: BloomStateEntry[] = bloomResult.records.map((r) => ({
      id: r.get("id") as string,
      name: (r.get("name") as string) ?? r.get("id") as string,
      phiL: asNumber(r.get("phiL")),
      psiH: asNumber(r.get("psiH")),
      lambda2: asNumber(r.get("lambda2")),
      status: (r.get("status") as string) ?? "active",
      childCount: asNumber(r.get("childCount")),
    }));

    const countsResult = await tx.run(
      `MATCH (n)
       WHERE n:Resonator OR n:Grid OR n:Helix
       RETURN
         count(CASE WHEN n:Resonator THEN 1 END) AS resonators,
         count(CASE WHEN n:Grid THEN 1 END) AS grids,
         count(CASE WHEN n:Helix THEN 1 END) AS helixes`,
    );

    const countsRec = countsResult.records[0];

    return {
      bloomStates,
      totalResonators: countsRec ? asNumber(countsRec.get("resonators")) : 0,
      totalGrids: countsRec ? asNumber(countsRec.get("grids")) : 0,
      totalHelixes: countsRec ? asNumber(countsRec.get("helixes")) : 0,
    };
  });
}

// ─── Step 2: Read Violations ──────────────────────────────────────

async function readViolations(): Promise<{
  total: number;
  bySeverity: { critical: number; error: number; warning: number };
  top: ViolationEntry[];
}> {
  try {
    const violations = await readTransaction(async (tx) => {
      // Handles both CE violations (checkId, targetNodeId) and
      // A6 Highlander violations (transformationDefId, attemptedNodeId)
      const result = await tx.run(
        `MATCH (g:Grid {id: 'grid:violation:ecosystem'})-[:CONTAINS]->(v:Seed)
         WHERE v.status = 'active'
         RETURN v.id AS id,
                coalesce(v.checkId, CASE WHEN v.id STARTS WITH 'violation:a6:' THEN 'A6' ELSE 'unknown' END) AS checkId,
                coalesce(v.targetNodeId, v.attemptedNodeId, 'unknown') AS targetNodeId,
                v.severity AS severity,
                coalesce(v.evidence, v.content, '') AS evidence,
                v.createdAt AS createdAt
         ORDER BY
           CASE v.severity WHEN 'critical' THEN 0 WHEN 'error' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
           v.createdAt DESC`,
      );
      return result.records.map((r) => ({
        id: r.get("id") as string,
        checkId: (r.get("checkId") as string) ?? "unknown",
        targetNodeId: (r.get("targetNodeId") as string) ?? "unknown",
        severity: (r.get("severity") as string) ?? "warning",
        evidence: (r.get("evidence") as string) ?? "",
      }));
    });

    const bySeverity = {
      critical: violations.filter((v) => v.severity === "critical").length,
      error: violations.filter((v) => v.severity === "error").length,
      warning: violations.filter((v) => v.severity === "warning").length,
    };

    return { total: violations.length, bySeverity, top: violations };
  } catch {
    // Violation Grid may not exist yet — non-fatal
    return { total: 0, bySeverity: { critical: 0, error: 0, warning: 0 }, top: [] };
  }
}

// ─── Step 2.5a: Read LLM Memory State (Stream 2) ────────────────

async function readLLMMemoryState(): Promise<{
  contexts: LLMMemoryContext[];
  infrastructureFailures: string[];
  driftingModels: string[];
  topPerformers: string[];
  summary: string;
}> {
  try {
    const llmBlooms = await readTransaction(async (tx) => {
      const result = await tx.run(
        `MATCH (b:Bloom) WHERE b.id STARTS WITH 'llm:' AND b.status = 'active'
         RETURN b.id AS id ORDER BY b.id`,
      );
      return result.records.map((r) => r.get("id") as string);
    });

    const contexts: LLMMemoryContext[] = [];
    for (const bloomId of llmBlooms) {
      try {
        const ctx = await getMemoryContextForBloom(bloomId);
        if (ctx) contexts.push(ctx);
      } catch { /* non-fatal */ }
    }

    // Infrastructure failures = cold start + recent failures (stale endpoints, not dead models)
    const infrastructureFailures = contexts
      .filter((c) => c.isColdStart && c.recentFailures.length > 0)
      .map((c) => c.bloomId);

    const driftingModels = contexts
      .filter((c) => c.bocpd?.currentRunLength !== null &&
                     c.bocpd?.currentRunLength !== undefined &&
                     c.bocpd.currentRunLength < 3)
      .map((c) => c.bloomId);

    const topPerformers = contexts
      .filter((c) => !c.isColdStart)
      .sort((a, b) => b.posteriors.mean - a.posteriors.mean)
      .slice(0, 5)
      .map((c) => c.bloomId);

    const summary = formatMemoryContextForSurvey(contexts);

    return { contexts, infrastructureFailures, driftingModels, topPerformers, summary };
  } catch {
    return { contexts: [], infrastructureFailures: [], driftingModels: [], topPerformers: [], summary: "" };
  }
}

// ─── Step 0: Read Previous Planning Observation (Stream 3a) ──────

async function readPreviousPlanningObservation(): Promise<{
  previousViolations: number;
  previousGaps: number;
  previousIntents: number;
  previousTimestamp: string;
} | null> {
  try {
    return await readTransaction(async (tx) => {
      const res = await tx.run(
        `MATCH (g:Grid {id: 'grid:cognitive-observations'})-[:CONTAINS]->(s:Seed)
         WHERE s.seedType = 'observation' AND s.name = 'Planning Cycle Observation'
         RETURN s.violationCount AS violations, s.constitutionalGapCount AS gaps,
                s.intentCount AS intents, s.createdAt AS timestamp
         ORDER BY s.createdAt DESC
         LIMIT 1`,
      );
      if (res.records.length === 0) return null;
      const r = res.records[0];
      return {
        previousViolations: asNumber(r.get("violations")),
        previousGaps: asNumber(r.get("gaps")),
        previousIntents: asNumber(r.get("intents")),
        previousTimestamp: String(r.get("timestamp") ?? ""),
      };
    });
  } catch { return null; }
}

// ─── Step 3.5: Read Existing Backlog (Stream 3b) ─────────────────

async function readExistingBacklog(): Promise<{
  activeIntents: Array<{ id: string; name: string; category: string; priorityScore: number; status: string }>;
  rItems: Array<{ id: string; name: string; status: string }>;
}> {
  try {
    return await readTransaction(async (tx) => {
      const intentResult = await tx.run(
        `MATCH (cb:Bloom {id: 'cognitive-bloom'})-[:CONTAINS]->(i:Seed)
         WHERE i.seedType = 'intent' AND i.status IN ['proposed', 'approved', 'active']
         RETURN i.id AS id, i.name AS name, coalesce(i.category, 'unknown') AS category,
                coalesce(i.priorityScore, 0) AS priorityScore, i.status AS status
         ORDER BY i.priorityScore DESC`,
      );
      const activeIntents = intentResult.records.map((r) => ({
        id: r.get("id") as string,
        name: (r.get("name") as string) ?? "",
        category: r.get("category") as string,
        priorityScore: asNumber(r.get("priorityScore")),
        status: r.get("status") as string,
      }));

      const rResult = await tx.run(
        `MATCH (s:Seed)
         WHERE s.id =~ 'R-\\\\d+' AND s.status IN ['planned', 'active']
         RETURN s.id AS id, s.name AS name, s.status AS status
         ORDER BY s.id`,
      );
      const rItems = rResult.records.map((r) => ({
        id: r.get("id") as string,
        name: (r.get("name") as string) ?? "",
        status: r.get("status") as string,
      }));

      return { activeIntents, rItems };
    });
  } catch {
    return { activeIntents: [], rItems: [] };
  }
}

// ─── Step 2.7: Structural Drift Detection (Stream 4) ────────────

async function detectStructuralDrift(
  bloomStates: BloomStateEntry[],
): Promise<Array<{ bloomId: string; metric: string; changePointProbability: number }>> {
  const drifts: Array<{ bloomId: string; metric: string; changePointProbability: number }> = [];
  const DRIFT_THRESHOLD = 0.7;

  const patternBlooms = bloomStates.filter((b) =>
    !b.id.startsWith("M-") &&
    !/^\d{4}-\d{2}-/.test(b.id) &&
    b.status === "active",
  );

  const detector = new BOCPDDetector();

  for (const bloom of patternBlooms) {
    try {
      const stateResult = await readTransaction(async (tx) => {
        const res = await tx.run(
          `MATCH (b:Bloom {id: $bloomId})
           RETURN b.bocpdState_phiL AS phiLState, b.bocpdState_lambda2 AS lambda2State`,
          { bloomId: bloom.id },
        );
        return res.records[0] ?? null;
      });
      if (!stateResult) continue;

      // ΦL drift
      if (bloom.phiL > 0) {
        const phiLStateJson = stateResult.get("phiLState") as string | null;
        const phiLState = phiLStateJson ? JSON.parse(phiLStateJson) : detector.initialState();
        const { signal, nextState } = detector.update(bloom.phiL, phiLState);
        if (signal.changePointProbability >= DRIFT_THRESHOLD) {
          drifts.push({ bloomId: bloom.id, metric: "phiL", changePointProbability: signal.changePointProbability });
        }
        try { await updateMorpheme(bloom.id, { bocpdState_phiL: JSON.stringify(nextState) }); } catch { /* non-fatal */ }
      }

      // λ₂ drift
      if (bloom.lambda2 > 0) {
        const lambda2StateJson = stateResult.get("lambda2State") as string | null;
        const lambda2State = lambda2StateJson ? JSON.parse(lambda2StateJson) : detector.initialState();
        const { signal, nextState } = detector.update(bloom.lambda2, lambda2State);
        if (signal.changePointProbability >= DRIFT_THRESHOLD) {
          drifts.push({ bloomId: bloom.id, metric: "lambda2", changePointProbability: signal.changePointProbability });
        }
        try { await updateMorpheme(bloom.id, { bocpdState_lambda2: JSON.stringify(nextState) }); } catch { /* non-fatal */ }
      }
    } catch { /* non-fatal per-bloom */ }
  }
  return drifts;
}

// ─── CE Scope Detection (Stream 8) ──────────────────────────────

async function findUnwiredBlooms(): Promise<string[]> {
  try {
    const result = await readTransaction(async (tx) => {
      const res = await tx.run(
        `MATCH (b:Bloom)
         WHERE b.status IN ['active', 'planned']
           AND NOT (b)-[:FLOWS_TO]->(:Resonator {id: 'resonator:compliance-evaluation'})
           AND NOT b.id = 'constitutional-bloom'
           AND NOT b.id STARTS WITH 'M-'
           AND NOT b.id =~ '\\\\d{4}-\\\\d{2}-.*'
         RETURN b.id AS id`,
      );
      return res.records.map((r) => r.get("id") as string);
    });
    return result;
  } catch {
    return [];
  }
}

// ─── Intent Persistence (Stream 5) ──────────────────────────────

async function persistIntents(
  intents: PlanningIntent[],
): Promise<PersistedIntentStats> {
  const stats: PersistedIntentStats = { total: 0, created: 0, updated: 0, resolved: 0, enriched: 0 };

  // Read existing intent Seeds for idempotency
  const existingIntents = await readTransaction(async (tx) => {
    const res = await tx.run(
      `MATCH (cb:Bloom {id: 'cognitive-bloom'})-[:CONTAINS]->(i:Seed {seedType: 'intent'})
       WHERE i.status IN ['proposed', 'approved', 'active']
       RETURN i.id AS id, coalesce(i.proposedCycleCount, 1) AS cycleCount`,
    );
    return new Map(res.records.map((r) => [r.get("id") as string, asNumber(r.get("cycleCount"))]));
  });

  // Build set of current intent IDs for resolved detection
  const currentIntentIds = new Set(intents.map((i) => i.intentId));

  // Mark existing intents that are no longer in the current set as resolved
  for (const [existingId] of existingIntents) {
    if (!currentIntentIds.has(existingId)) {
      try {
        await updateMorpheme(existingId, { status: "resolved" });
        stats.resolved++;
      } catch { /* non-fatal */ }
    }
  }

  // Persist current intents
  for (let i = 0; i < intents.length; i++) {
    const intent = intents[i];
    if ((i + 1) % 50 === 0) {
      console.log(`  [Planning] Persisting intent ${i + 1}/${intents.length}...`);
    }

    try {
      if (existingIntents.has(intent.intentId)) {
        // Update existing — bump cycle count, update score
        const oldCycleCount = existingIntents.get(intent.intentId) ?? 1;
        await updateMorpheme(intent.intentId, {
          priorityScore: intent.priorityScore,
          proposedCycleCount: oldCycleCount + 1,
          category: intent.category,
          architectIntent: intent.architectIntent ?? "",
        });
        stats.updated++;
      } else {
        // Create new intent Seed
        await instantiateMorpheme("seed", {
          id: intent.intentId,
          name: intent.description.slice(0, 200),
          content: intent.description,
          seedType: "intent",
          status: "proposed",
          category: intent.category,
          priorityScore: intent.priorityScore,
          architectIntent: intent.architectIntent ?? "",
          proposedCycleCount: 1,
        }, "cognitive-bloom");
        stats.created++;

        // Wire SCOPED_TO if target Bloom exists
        if (intent.justification.phiLTarget) {
          try {
            const { createLine } = await import("../../graph/instantiation.js");
            await createLine(intent.intentId, intent.justification.phiLTarget, "SCOPED_TO", {
              label: "intent-scope",
            });
          } catch { /* target may not exist — non-fatal */ }
        }

        // Wire REFERENCES if constitutional definition
        if (intent.targetDefId) {
          try {
            const { createLine } = await import("../../graph/instantiation.js");
            await createLine(intent.intentId, intent.targetDefId, "REFERENCES", {
              label: "intent-reference",
            });
          } catch { /* def may not exist — non-fatal */ }
        }
      }
      stats.total++;
    } catch {
      // Individual persist failure is non-fatal
    }
  }

  return stats;
}

// ─── Constitutional Context (Stream A) ──────────────────────────

/** Repo structure constant — canonical file paths the LLM may reference */
const REPO_STRUCTURE_CONTEXT = `REPO STRUCTURE (TypeScript — NOT Python, NOT YAML, NOT Java):
  src/graph/instantiation.ts — instantiateMorpheme(), updateMorpheme(), createLine(), stampBloomComplete(), retireDefinition()
  src/graph/client.ts — Neo4j driver, readTransaction(), writeTransaction()
  src/graph/queries/ — Neo4j query functions
  src/patterns/architect/ — Architect pipeline (survey, decompose, classify, sequence, gate, dispatch, adapt)
  src/patterns/cognitive/ — Gnosis (planning, survey, delta, evaluation, sweep)
  src/patterns/thompson-router/ — Thompson Sampling model selection
  src/patterns/dev-agent/ — DevAgent pipeline (scope, execute, review, validate)
  src/patterns/assayer/ — Structural integrity verification
  src/computation/ — State dimension calculators (phi-l, psi-h, epsilon-r, dampening)
  src/computation/signals/ — 7-stage signal conditioning pipeline
  src/signals/ — BOCPD, signal conditioning
  src/constitutional/ — Governance layer
  src/memory/ — Four-stratum memory operations
  scripts/architect.ts — CLI: Architect pipeline entry
  scripts/cognitive.ts — CLI: Gnosis entry (survey, evaluate, sweep, plan, execute)
  scripts/dev-agent.ts — CLI: DevAgent entry
  scripts/bootstrap-executor.ts — ModelExecutor implementation (raw fetch)`;

/** Parse known file paths from REPO_STRUCTURE_CONTEXT */
const REPO_STRUCTURE_FILES: string[] = (() => {
  const paths: string[] = [];
  const lines = REPO_STRUCTURE_CONTEXT.split("\n");
  for (const line of lines) {
    const match = line.match(/^\s+(src\/[^\s—]+|scripts\/[^\s—]+)/);
    if (match) paths.push(match[1]);
  }
  return paths;
})();

/**
 * Query the Constitutional Bloom for organisational grounding (system prompt).
 * Called once per planning cycle, result cached. Pure graph query — no LLM.
 */
export async function buildConstitutionalContext(): Promise<string> {
  // Step 1: Diagnostic discovery — find actual seedType values
  const discovery = await readTransaction(async (tx) => {
    const res = await tx.run(
      `MATCH (cb:Bloom {id: 'constitutional-bloom'})-[:CONTAINS]->(s:Seed)
       RETURN DISTINCT s.seedType AS seedType, count(s) AS count,
              collect(s.id)[0..3] AS sampleIds
       ORDER BY count DESC`,
    );
    return res.records.map((r) => ({
      seedType: r.get("seedType") as string,
      count: asNumber(r.get("count")),
      sampleIds: r.get("sampleIds") as string[],
    }));
  });

  console.log(`  [Planning] Constitutional discovery: ${discovery.length} seedTypes found`);
  for (const d of discovery) {
    console.log(`    ${d.seedType}: ${d.count} (samples: ${d.sampleIds.join(", ")})`);
  }

  // Step 2: Extraction — query by seedType, not by ID prefix
  const seedTypeSet = new Set(discovery.map((d) => d.seedType));

  const constitutionalData = await readTransaction(async (tx) => {
    const res = await tx.run(
      `MATCH (cb:Bloom {id: 'constitutional-bloom'})-[:CONTAINS]->(s:Seed)
       WHERE s.status = 'active'
       RETURN s.id AS id, s.name AS name, s.seedType AS seedType,
              left(coalesce(s.content, ''), 300) AS contentSnippet`,
    );
    return res.records.map((r) => ({
      id: r.get("id") as string,
      name: (r.get("name") as string) ?? "",
      seedType: (r.get("seedType") as string) ?? "",
      contentSnippet: (r.get("contentSnippet") as string) ?? "",
    }));
  });

  // Categorise by seedType
  const axioms: Array<{ id: string; name: string }> = [];
  const grammarRules: Array<{ id: string; name: string; summary: string }> = [];
  const antiPatterns: Array<{ id: string; name: string; summary: string }> = [];
  const morphemeDefs: Array<{ id: string; name: string; category: string }> = [];
  const interactionRules: Array<{ id: string; name: string; content: string }> = [];

  for (const s of constitutionalData) {
    const st = s.seedType.toLowerCase();
    if (st === "axiom" || st === "axiom-definition") {
      axioms.push({ id: s.id, name: s.name });
    } else if (st === "grammar-rule" || st === "grammar-rule-definition") {
      const firstSentence = s.contentSnippet.split(/[.!]\s/)[0] ?? "";
      grammarRules.push({ id: s.id, name: s.name, summary: firstSentence.slice(0, 150) });
    } else if (st === "anti-pattern" || st === "anti-pattern-definition") {
      const firstSentence = s.contentSnippet.split(/[.!]\s/)[0] ?? "";
      antiPatterns.push({ id: s.id, name: s.name, summary: firstSentence.slice(0, 100) });
    } else if (st === "transformation-definition" || st === "bloom-definition" ||
               st === "grid-definition" || st === "helix-definition") {
      const category = st.replace("-definition", "");
      morphemeDefs.push({ id: s.id, name: s.name, category });
    } else if (st === "interaction-rule" || st === "morpheme-interaction-rule" || st === "containment-rule") {
      interactionRules.push({ id: s.id, name: s.name, content: s.contentSnippet });
    }
  }

  // Build compact output
  const sections: string[] = [];

  sections.push(
    `You are reasoning about Codex Signum, a graph-native AI governance system built in TypeScript on Neo4j. State is structural — there is no separate monitoring layer. The graph IS the observability.`,
  );

  // Axioms
  if (axioms.length > 0) {
    const lines = axioms.map((a) => `  ${a.id}: ${a.name}`);
    sections.push(`AXIOMS (${axioms.length} constraints — all graph writes must satisfy these):\n${lines.join("\n")}`);
  }

  // Grammar rules
  if (grammarRules.length > 0) {
    const lines = grammarRules.map((g) => `  ${g.id}: ${g.name}${g.summary ? ` — ${g.summary}` : ""}`);
    sections.push(`GRAMMAR RULES (composition constraints):\n${lines.join("\n")}`);
  }

  // Anti-patterns
  if (antiPatterns.length > 0) {
    const lines = antiPatterns.map((a) => `  ${a.name}: ${a.summary}`);
    sections.push(`ANTI-PATTERNS (if your response would create any of these, stop):\n${lines.join("\n")}`);
  }

  // Morpheme containment rules (from graph if available, else hardcoded from v5.0)
  if (interactionRules.length > 0) {
    const lines = interactionRules.map((r) => `  ${r.name}: ${r.content}`);
    sections.push(`MORPHEME CONTAINMENT (what may contain what):\n${lines.join("\n")}`);
  } else {
    // Fallback: encode from v5.0 §Morpheme Interaction Rules
    sections.push(`MORPHEME CONTAINMENT (what may contain what):
  Bloom: may contain Seeds, Lines, Resonators, Grids, Helixes, other Blooms
  Grid: may contain Seeds, Lines only — NO computation inside
  Resonator: does NOT contain — transforms through input/output Lines
  Helix: does NOT contain — spans across elements it governs
  Seed: does NOT contain — atomic unit
Note: any morpheme may BE CONTAINED by a Bloom. The rules above govern what each type may contain as children.`);
  }

  // Morpheme type definitions
  if (morphemeDefs.length > 0) {
    const byCategory = new Map<string, string[]>();
    for (const d of morphemeDefs) {
      const cat = d.category;
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push(d.name || d.id);
    }
    const lines: string[] = [];
    for (const [cat, names] of byCategory) {
      lines.push(`  ${cat}s (${names.length}): ${names.join(", ")}`);
    }
    sections.push(`VALID MORPHEME TYPES (${morphemeDefs.length} active definitions):\n${lines.join("\n")}`);
  }

  // Repo structure
  sections.push(REPO_STRUCTURE_CONTEXT);

  sections.push(
    `When enriching intents, reference ONLY files and node IDs from the grounding context provided in the user message. Do not invent file paths, function names, or graph node IDs.`,
  );

  return sections.join("\n\n");
}

// ─── Intent Grounding Context (Stream B) ────────────────────────

/**
 * Build per-intent grounding context from graph queries.
 * Returns the context string and the list of file paths provided (for hallucination detection).
 */
export async function buildIntentGroundingContext(
  intent: PlanningIntent,
  bloomMap: Map<string, BloomStateEntry>,
): Promise<{ context: string; providedFiles: string[] }> {
  const sections: string[] = [];
  const allProvidedFiles = new Set<string>(REPO_STRUCTURE_FILES);

  // Path 1: Single definition reference
  if (intent.targetDefId) {
    try {
      const defData = await readTransaction(async (tx) => {
        const res = await tx.run(
          `MATCH (s:Seed {id: $defId})
           RETURN s.content AS content, s.name AS name, s.seedType AS seedType`,
          { defId: intent.targetDefId },
        );
        if (res.records.length === 0) return null;
        const r = res.records[0];
        return {
          content: (r.get("content") as string) ?? "",
          name: (r.get("name") as string) ?? "",
          seedType: (r.get("seedType") as string) ?? "",
        };
      });

      if (defData?.content) {
        sections.push(`=== GOVERNING CONSTRAINT ===\nDefinition: ${intent.targetDefId}\nName: ${defData.name}\nContent: ${defData.content}`);
      }

      // Query existing instances via INSTANTIATES
      const instances = await readTransaction(async (tx) => {
        const res = await tx.run(
          `MATCH (inst)-[:INSTANTIATES]->(def:Seed {id: $defId})
           RETURN inst.id AS id, inst.status AS status, labels(inst) AS labels`,
          { defId: intent.targetDefId },
        );
        return res.records.map((r) => ({
          id: r.get("id") as string,
          status: (r.get("status") as string) ?? "unknown",
          labels: r.get("labels") as string[],
        }));
      });

      if (instances.length > 0) {
        const instanceLines = instances.map((i) => `  ${i.id} (${i.labels.join(":")}, ${i.status})`);
        sections.push(`=== EXISTING INSTANCES ===\nDefinition ${intent.targetDefId} has ${instances.length} instance(s) — do NOT recreate:\n${instanceLines.join("\n")}`);
      } else {
        sections.push(`=== EXISTING INSTANCES ===\nDefinition ${intent.targetDefId} has NO instances — this needs creation.`);
      }
    } catch { /* non-fatal */ }
  }

  // Path 2: Cluster intent — multiple definitions
  if (intent.intentId.startsWith("plan:cluster:") && intent.architectIntent) {
    try {
      const defIdPattern = /def:[a-z-]+:[a-z-]+/g;
      const defIds = [...new Set(intent.architectIntent.match(defIdPattern) ?? [])];

      if (defIds.length > 0) {
        const truncateContent = defIds.length > 3;
        const contentLimit = truncateContent ? 300 : 2000;

        const defsData = await readTransaction(async (tx) => {
          const res = await tx.run(
            `UNWIND $defIds AS defId
             MATCH (s:Seed {id: defId})
             OPTIONAL MATCH (inst)-[:INSTANTIATES]->(s)
             RETURN s.id AS id, s.name AS name,
                    left(coalesce(s.content, ''), $limit) AS content,
                    collect(DISTINCT inst.id) AS instanceIds`,
            { defIds, limit: contentLimit },
          );
          return res.records.map((r) => ({
            id: r.get("id") as string,
            name: (r.get("name") as string) ?? "",
            content: (r.get("content") as string) ?? "",
            instanceIds: (r.get("instanceIds") as string[]).filter(Boolean),
          }));
        });

        const withInstances = defsData.filter((d) => d.instanceIds.length > 0);
        const withoutInstances = defsData.filter((d) => d.instanceIds.length === 0);

        const lines: string[] = ["=== GOVERNING CONSTRAINTS (cluster) ==="];

        if (withInstances.length > 0) {
          lines.push("Definitions WITH existing instances (do NOT recreate):");
          for (const d of withInstances) {
            lines.push(`  ${d.id} (${d.name}) → ${d.instanceIds.join(", ")}`);
          }
        }
        if (withoutInstances.length > 0) {
          lines.push("Definitions WITHOUT instances (these need creation):");
          for (const d of withoutInstances) {
            lines.push(`  ${d.id} (${d.name}): ${d.content.slice(0, 150)}`);
          }
        }
        sections.push(lines.join("\n"));
      }
    } catch { /* non-fatal */ }
  }

  // Path 3: Target Bloom topology
  if (intent.justification.phiLTarget) {
    const bloomEntry = bloomMap.get(intent.justification.phiLTarget);
    if (bloomEntry) {
      try {
        const children = await readTransaction(async (tx) => {
          const res = await tx.run(
            `MATCH (b:Bloom {id: $bloomId})-[:CONTAINS]->(child)
             RETURN child.id AS id, child.name AS name, labels(child) AS labels,
                    child.status AS status, child.seedType AS seedType
             ORDER BY child.id
             LIMIT 30`,
            { bloomId: intent.justification.phiLTarget },
          );
          return res.records.map((r) => ({
            id: r.get("id") as string,
            name: (r.get("name") as string) ?? "",
            labels: r.get("labels") as string[],
            status: (r.get("status") as string) ?? "unknown",
            seedType: (r.get("seedType") as string) ?? "",
          }));
        });

        // Filter FLOWS_TO to those involving the intent's definitions or instances
        const relevantIds = new Set<string>();
        if (intent.targetDefId) relevantIds.add(intent.targetDefId);
        for (const child of children) relevantIds.add(child.id);

        const flowsTo = await readTransaction(async (tx) => {
          const res = await tx.run(
            `MATCH (b:Bloom {id: $bloomId})-[:CONTAINS]->(child)-[r:FLOWS_TO]->(target)
             WHERE child.id IN $relevantIds OR target.id IN $relevantIds
             RETURN child.id AS from, target.id AS to, type(r) AS relType
             LIMIT 20`,
            { bloomId: intent.justification.phiLTarget, relevantIds: [...relevantIds] },
          );
          return res.records.map((r) => ({
            from: r.get("from") as string,
            to: r.get("to") as string,
          }));
        });

        const childLines = children.map((c) => {
          const type = c.labels.filter((l) => l !== "Seed" && l !== "Bloom").join(":") || c.labels[0];
          return `  ${c.id} (${type}${c.seedType ? `:${c.seedType}` : ""}, ${c.status})`;
        });

        const topoLines = [
          `=== TARGET TOPOLOGY ===`,
          `Bloom: ${bloomEntry.id} (${bloomEntry.name}, ΦL=${bloomEntry.phiL}, λ₂=${bloomEntry.lambda2}, ΨH=${bloomEntry.psiH}, children=${bloomEntry.childCount})`,
        ];
        if (childLines.length > 0) {
          topoLines.push(`Children:\n${childLines.join("\n")}`);
        }
        if (flowsTo.length > 0) {
          const flowLines = flowsTo.map((f) => `  ${f.from} → ${f.to}`);
          topoLines.push(`Relevant FLOWS_TO:\n${flowLines.join("\n")}`);
        }
        sections.push(topoLines.join("\n"));
      } catch { /* non-fatal */ }
    }
  }

  // Path 4: Violation-sourced intent
  if (intent.violationId) {
    try {
      const violationData = await readTransaction(async (tx) => {
        const res = await tx.run(
          `MATCH (v:Seed {id: $violationId})
           RETURN v.checkId AS checkId, v.targetNodeId AS targetNodeId,
                  v.evidence AS evidence, v.severity AS severity`,
          { violationId: intent.violationId },
        );
        if (res.records.length === 0) return null;
        const r = res.records[0];
        return {
          checkId: (r.get("checkId") as string) ?? "",
          targetNodeId: (r.get("targetNodeId") as string) ?? "",
          evidence: (r.get("evidence") as string) ?? "",
          severity: (r.get("severity") as string) ?? "",
        };
      });

      if (violationData) {
        sections.push(`=== VIOLATION CONTEXT ===\nCheck: ${violationData.checkId}\nTarget: ${violationData.targetNodeId}\nSeverity: ${violationData.severity}\nEvidence: ${violationData.evidence}`);
      }
    } catch { /* non-fatal */ }
  }

  // Fallback: minimal context
  if (sections.length === 0) {
    sections.push(`Intent: ${intent.description}\nCategory: ${intent.category}`);
  }

  const context = sections.join("\n\n");

  // Build providedFiles from repo structure + extracted paths from grounding
  const groundingPaths = extractPathReferences(context);
  for (const p of groundingPaths) allProvidedFiles.add(p);

  return { context, providedFiles: [...allProvidedFiles] };
}

// ─── LLM Enrichment (Stream 6) ──────────────────────────────────

async function enrichTopIntents(
  intents: PlanningIntent[],
  bloomStates: BloomStateEntry[],
  modelExecutor: ModelExecutor,
  topN: number,
): Promise<number> {
  const bloomMap = new Map(bloomStates.map((b) => [b.id, b]));
  let enriched = 0;

  // Build constitutional system prompt once for the entire enrichment batch
  let constitutionalSystemPrompt: string;
  try {
    constitutionalSystemPrompt = await buildConstitutionalContext();
    console.log(`  [Planning] Constitutional context built (${constitutionalSystemPrompt.length} chars)`);
  } catch (err) {
    console.warn(`  [Planning] Failed to build constitutional context, enrichment will proceed without system prompt: ${err}`);
    constitutionalSystemPrompt = "";
  }

  const toEnrich = intents.slice(0, topN);
  for (let i = 0; i < toEnrich.length; i++) {
    const intent = toEnrich[i];

    try {
      // Build per-intent grounding context from graph
      const { context: groundingContext, providedFiles } = await buildIntentGroundingContext(intent, bloomMap);

      const prompt = `${groundingContext}

TASK: Produce a 2-3 paragraph architectural enrichment for this intent.

INTENT: ${intent.description}
CATEGORY: ${intent.category}
SCORE: ${intent.priorityScore}

Rules:
- The GOVERNING CONSTRAINT section above defines what is valid. Your response must conform to it.
- If existing instances already satisfy a definition, say so — do not propose recreating them.
- Do not pull in work outside the intent's scope.
- Name specific anti-patterns from the system context that this intent must avoid.

Cover:
1. What this fixes structurally (reference ΦL/λ₂/ΨH implications)
2. Which existing files and functions are affected
3. Approach: what to create, what to wire, what already exists
4. Boundaries: what anti-patterns to avoid, what NOT to do`;

      const result = await modelExecutor.execute(prompt, {
        taskType: "analytical",
        complexity: "moderate",
        systemPrompt: constitutionalSystemPrompt || undefined,
      });

      if (result.text) {
        const flags = detectUnsourcedReferences(result.text, intent.intentId, providedFiles);
        const hasErrors = flags.some((f) => f.severity === "error");

        if (hasErrors) {
          console.warn(`  [Planning] Enrichment REJECTED for ${intent.intentId} — unsourced references detected:`);
          for (const flag of flags) {
            console.warn(`    [${flag.severity}] ${flag.description}`);
          }
          // Do NOT persist — intent keeps its raw unenriched content
        } else {
          if (flags.length > 0) {
            console.warn(`  [Planning] Enrichment warnings for ${intent.intentId}:`);
            for (const flag of flags) {
              console.warn(`    [${flag.severity}] ${flag.description}`);
            }
          }
          await updateMorpheme(intent.intentId, { content: result.text });
          enriched++;
          console.log(`  [Planning] Enriched ${i + 1}/${toEnrich.length}: ${intent.intentId}`);
        }
      }
    } catch {
      // Enrichment failure is non-fatal — raw description remains
      console.warn(`  [Planning] Enrichment failed for ${intent.intentId}, keeping raw description`);
    }
  }

  return enriched;
}

// ─── FLOWS_TO Wiring (Stream 7a) ────────────────────────────────

async function ensureGnosisToArchitectWiring(): Promise<boolean> {
  try {
    const exists = await readTransaction(async (tx) => {
      const res = await tx.run(
        `MATCH (cb:Bloom {id: 'cognitive-bloom'})-[r:FLOWS_TO]->(a:Bloom {id: 'architect'})
         RETURN count(r) AS cnt`,
      );
      return asNumber(res.records[0]?.get("cnt")) > 0;
    });

    if (!exists) {
      const { createLine } = await import("../../graph/instantiation.js");
      await createLine("cognitive-bloom", "architect", "FLOWS_TO", {
        label: "gnosis-to-architect",
        description: "Gnosis planning output informs Architect SURVEY enrichment",
      });
      console.log("  [Planning] Created FLOWS_TO: cognitive-bloom → architect");
      return true;
    }
    return false;
  } catch {
    // Wiring failure is non-fatal
    return false;
  }
}

// ─── Step 3: Read Milestone State ─────────────────────────────────

async function readMilestoneState(): Promise<{
  total: number;
  complete: number;
  active: number;
  planned: number;
  unblocked: MilestoneEntry[];
}> {
  try {
    return await readTransaction(async (tx) => {
      // All milestones for counts
      const allResult = await tx.run(
        `MATCH (b:Bloom)
         WHERE b.id STARTS WITH 'M-' OR b.type IN ['milestone', 'sub-milestone']
         RETURN b.status AS status, count(*) AS cnt`,
      );

      let total = 0, complete = 0, active = 0, planned = 0;
      for (const r of allResult.records) {
        const s = r.get("status") as string;
        const c = asNumber(r.get("cnt"));
        total += c;
        if (s === "complete") complete += c;
        else if (s === "active") active += c;
        else if (s === "planned") planned += c;
      }

      // Unblocked milestones with structural context
      const unblockedResult = await tx.run(
        `MATCH (b:Bloom)
         WHERE (b.id STARTS WITH 'M-' OR b.type IN ['milestone', 'sub-milestone'])
           AND b.status IN ['active', 'planned']
         OPTIONAL MATCH (b)-[:CONTAINS]->(child)
         WHERE child:Bloom OR (child:Seed AND child.seedType = 'exit-criterion')
         WITH b,
              count(child) AS total,
              count(CASE WHEN child.status = 'complete' THEN 1 END) AS done
         OPTIONAL MATCH (prereq:Bloom)-[:DEPENDS_ON]->(b)
         WHERE prereq.status <> 'complete'
         WITH b, total, done,
              collect(DISTINCT prereq.id) AS blockedBy
         RETURN b.id AS id, b.name AS name,
                coalesce(b.phiL, 0.0) AS phiL,
                done AS childrenComplete, total AS childrenTotal,
                blockedBy
         ORDER BY size(blockedBy) ASC, b.phiL ASC`,
      );

      const unblocked: MilestoneEntry[] = unblockedResult.records
        .filter((r) => {
          const blocked = r.get("blockedBy") as string[];
          return !blocked || blocked.length === 0;
        })
        .map((r) => ({
          id: r.get("id") as string,
          name: (r.get("name") as string) ?? r.get("id") as string,
          phiL: asNumber(r.get("phiL")),
          childrenComplete: asNumber(r.get("childrenComplete")),
          childrenTotal: asNumber(r.get("childrenTotal")),
          blockedBy: [],
        }));

      return { total, complete, active, planned, unblocked };
    });
  } catch {
    return { total: 0, complete: 0, active: 0, planned: 0, unblocked: [] };
  }
}

// ─── Step 4: Constitutional Delta (Scoped) ────────────────────────

async function computeScopedDelta(
  definitions: TransformationDef[],
): Promise<GapSeed[]> {
  // Dynamic scope: survey all Blooms that have bloom-level INSTANTIATES
  const patternBlooms = await readTransaction(async (tx) => {
    const result = await tx.run(
      `MATCH (b:Bloom)-[:INSTANTIATES]->(def:Seed)
       WHERE def.seedType = 'bloom-definition'
         AND b.status IN ['active', 'planned']
         AND NOT b.id STARTS WITH 'M-'
         AND NOT b.id =~ '\\\\d{4}-\\\\d{2}-.*'
       RETURN b.id AS id`,
    );
    return result.records.map((r) => r.get("id") as string);
  });

  const allGaps: GapSeed[] = [];
  for (const bloomId of patternBlooms) {
    try {
      const survey = await surveyBloomTopology(bloomId);
      const relevantScopes = inferScopesForBloom(bloomId, definitions);
      const scopedDefs = definitions.filter((d) => relevantScopes.includes(d.scope));
      const gaps = computeConstitutionalDelta(survey, scopedDefs, relevantScopes);
      allGaps.push(...gaps);
    } catch {
      // Survey failure on a Bloom is non-fatal — log and continue
      console.warn(`  [Planning] Survey failed for ${bloomId}, skipping`);
    }
  }

  // Deduplicate by gap ID (deterministic IDs from Fix 2 make this work).
  // Ecosystem-level gaps (missing-instance, empty-stage, missing-line) produce
  // the same ID from every Bloom survey. Per-Bloom topology gaps have Bloom-specific
  // IDs and are preserved.
  const seen = new Map<string, GapSeed>();
  for (const gap of allGaps) {
    if (!seen.has(gap.gapId)) {
      seen.set(gap.gapId, gap);
    }
  }

  const deduped = Array.from(seen.values());
  if (deduped.length < allGaps.length) {
    console.log(`  [Planning] Deduped gaps: ${allGaps.length} → ${deduped.length} (${allGaps.length - deduped.length} duplicates removed)`);
  }

  return deduped;
}

/**
 * Infer which definition scopes are relevant for a given Bloom ID.
 * Maps Bloom identity to scope names based on naming conventions + definitions.
 */
function inferScopesForBloom(
  bloomId: string,
  definitions: TransformationDef[],
): string[] {
  const scopes = new Set<string>(["ecosystem"]);

  // Extract scope hints from the bloom ID
  const id = bloomId.toLowerCase();
  if (id.includes("architect")) scopes.add("architect");
  if (id.includes("cognitive") || id.includes("gnosis")) scopes.add("cognitive");
  if (id.includes("dev-agent") || id.includes("devagent")) scopes.add("dev-agent");
  if (id.includes("thompson")) scopes.add("thompson");
  if (id.includes("assayer")) scopes.add("assayer");

  // Also check if any definition scope matches part of the bloom ID
  const uniqueScopes = new Set(definitions.map((d) => d.scope));
  for (const scope of uniqueScopes) {
    if (id.includes(scope.toLowerCase())) {
      scopes.add(scope);
    }
  }

  return Array.from(scopes);
}

// ─── Step 5: Categorise ───────────────────────────────────────────

function categoriseViolation(checkId: string): IntentCategory {
  if (checkId.startsWith("G")) return "governance";
  if (checkId.startsWith("A")) return "governance";
  if (checkId.startsWith("anti:")) return "governance";
  return "governance";
}

function categoriseGap(gap: GapSeed): IntentCategory {
  if (gap.missingLineType) return "pattern-topology";
  if (gap.missingDefId) return "pattern-topology";
  if (gap.gapType === "topological") return "pattern-topology";
  return "governance";
}

function categoriseMilestone(name: string): IntentCategory {
  const lower = (name ?? "").toLowerCase();
  if (lower.includes("pipeline") || lower.includes("thompson") ||
      lower.includes("constraint") || lower.includes("poka-yoke") ||
      lower.includes("infra")) return "infrastructure";
  if (lower.includes("pattern") || lower.includes("topology") ||
      lower.includes("wiring") || lower.includes("composition")) return "pattern-topology";
  if (lower.includes("governance") || lower.includes("compliance") ||
      lower.includes("constitutional")) return "governance";
  if (lower.includes("grounding") || lower.includes("priming") ||
      lower.includes("substrate") || lower.includes("llm")) return "substrate-grounding";
  // Default to infrastructure for unclassifiable milestones
  return "infrastructure";
}

// ─── Gap Clustering (Fix 4) ──────────────────────────────────────

function clusterGapIntents(intents: PlanningIntent[]): PlanningIntent[] {
  const gapIntents = intents.filter((i) => i.intentId.startsWith("plan:gap:gap:missing-instance:"));
  const otherIntents = intents.filter((i) => !i.intentId.startsWith("plan:gap:gap:missing-instance:"));

  if (gapIntents.length <= 1) return intents;

  // Group missing-instance gaps by definition type prefix
  const clusters = new Map<string, PlanningIntent[]>();
  for (const intent of gapIntents) {
    const defId = intent.targetDefId ?? "";
    let clusterKey: string;
    if (defId.startsWith("def:transformation:")) clusterKey = "missing-transformation-instances";
    else if (defId.startsWith("def:bloom:")) clusterKey = "missing-bloom-instances";
    else if (defId.startsWith("def:grid:")) clusterKey = "missing-grid-instances";
    else if (defId.startsWith("def:helix:")) clusterKey = "missing-helix-instances";
    else clusterKey = "missing-other-instances";

    if (!clusters.has(clusterKey)) clusters.set(clusterKey, []);
    clusters.get(clusterKey)!.push(intent);
  }

  const composites: PlanningIntent[] = [];
  for (const [clusterKey, members] of clusters) {
    if (members.length === 1) {
      composites.push(members[0]);
      continue;
    }

    const defNames = members
      .map((m) => m.targetDefId ?? m.description)
      .join(", ");
    const composite: PlanningIntent = {
      intentId: `plan:cluster:${clusterKey}`,
      category: "pattern-topology",
      description: `${members.length} missing ${clusterKey.replace(/-/g, " ")}: ${defNames}. ` +
                   `These are related ecosystem gaps — instantiate as a group and wire FLOWS_TO Lines.`,
      priorityScore: 0,
      justification: {
        gapType: "constitutional",
        lambda2Delta: members.reduce((sum, m) => sum + (m.justification.lambda2Delta ?? 0), 0),
      },
      architectIntent: `[Gnosis Planning] pattern-topology: Instantiate ${members.length} ${clusterKey.replace(/-/g, " ")}. ` +
                       `Definitions: ${defNames}. Wire FLOWS_TO from relevant Stage Blooms to each.`,
    };
    composites.push(composite);
  }

  return [...composites, ...otherIntents];
}

// ─── Step 6: Score and Rank ───────────────────────────────────────

function scorePlanningIntent(intent: PlanningIntent): number {
  let score = 0;

  // Violation severity weight
  if (intent.justification.violationSeverity === "critical") score += 100;
  if (intent.justification.violationSeverity === "error") score += 50;
  if (intent.justification.violationSeverity === "warning") score += 10;

  // Constitutional gap weight (mandatory = high)
  if (intent.justification.gapType === "constitutional") score += 40;
  if (intent.justification.gapType === "violation") score += 30;

  // λ₂ improvement potential
  score += (intent.justification.lambda2Delta ?? 0) * 20;

  // ΦL uplift (lower current ΦL = higher priority)
  if (intent.justification.phiLCurrent !== undefined) {
    score += (1 - intent.justification.phiLCurrent) * 15;
  }

  // Dependency unblocking multiplier
  const unblockCount = intent.justification.unblocks?.length ?? 0;
  if (unblockCount > 0) score *= 1 + unblockCount * 0.2;

  return Math.round(score * 100) / 100;
}

// ─── Intent Builders ──────────────────────────────────────────────

function violationToIntent(v: ViolationEntry): PlanningIntent {
  const category = categoriseViolation(v.checkId);
  const intent: PlanningIntent = {
    intentId: `plan:violation:${v.id}`,
    category,
    description: `Fix ${v.checkId} violation on ${v.targetNodeId}: ${v.evidence}`,
    priorityScore: 0,
    justification: {
      violationSeverity: v.severity as "critical" | "error" | "warning",
      violationCount: 1,
      gapType: "violation",
    },
    violationId: v.id,
  };
  intent.priorityScore = scorePlanningIntent(intent);
  intent.architectIntent = `[Gnosis Planning] ${category}: Fix ${v.checkId} violation on ${v.targetNodeId} — ${v.evidence}`;
  return intent;
}

function gapToIntent(gap: GapSeed): PlanningIntent {
  const category = categoriseGap(gap);
  const intent: PlanningIntent = {
    intentId: `plan:gap:${gap.gapId}`,
    category,
    description: gap.description,
    priorityScore: 0,
    justification: {
      lambda2Delta: gap.expectedLambda2Delta,
      gapType: gap.gapType,
    },
    targetDefId: gap.missingDefId,
  };
  intent.priorityScore = scorePlanningIntent(intent);
  intent.architectIntent = `[Gnosis Planning] ${category}: ${gap.description}`;
  return intent;
}

function milestoneToIntent(m: MilestoneEntry): PlanningIntent {
  const category = categoriseMilestone(m.name);
  const progress = m.childrenTotal > 0
    ? `${m.childrenComplete}/${m.childrenTotal} children complete`
    : "no children tracked";
  const intent: PlanningIntent = {
    intentId: `plan:milestone:${m.id}`,
    category,
    description: `Advance ${m.id} (${m.name}): ${progress}, ΦL=${m.phiL}`,
    priorityScore: 0,
    justification: {
      phiLTarget: m.id,
      phiLCurrent: m.phiL,
      gapType: "milestone",
    },
    milestoneId: m.id,
  };
  intent.priorityScore = scorePlanningIntent(intent);
  intent.architectIntent = `[Gnosis Planning] ${category}: Advance ${m.id} — ${m.name} (${progress})`;
  return intent;
}

// ─── Step 8: Record Observation ───────────────────────────────────

async function recordPlanningObservation(
  report: PlanningReport,
): Promise<void> {
  try {
    await instantiateMorpheme("seed", {
      id: `obs:planning:${Date.now()}`,
      name: "Planning Cycle Observation",
      content: `Planning report: ${report.ecosystemState.totalBlooms} Blooms surveyed, ` +
               `${report.activeViolations.total} violations, ` +
               `${report.milestoneState.unblocked.length} unblocked milestones, ` +
               `${report.constitutionalGaps} constitutional gaps, ` +
               `${report.intents.length} intents produced. ` +
               `Models: ${report.modelMemory.totalModels} total, ${report.modelMemory.infrastructureFailures.length} infra-failures. ` +
               `Drifts: ${report.structuralDrifts.length}. Unwired: ${report.unwiredBlooms.length}.`,
      seedType: "observation",
      status: "recorded",
      bloomCount: report.ecosystemState.totalBlooms,
      violationCount: report.activeViolations.total,
      milestoneUnblockedCount: report.milestoneState.unblocked.length,
      constitutionalGapCount: report.constitutionalGaps,
      intentCount: report.intents.length,
      modelCount: report.modelMemory.totalModels,
      infraFailureCount: report.modelMemory.infrastructureFailures.length,
      driftCount: report.structuralDrifts.length,
      unwiredCount: report.unwiredBlooms.length,
      persistedCount: report.persistenceStats?.total ?? 0,
      processingTimeMs: report.processingTimeMs,
    }, "grid:cognitive-observations");
  } catch {
    // Observation recording is non-fatal
  }
}

// ─── Utilities ────────────────────────────────────────────────────

/** Safely convert Neo4j integer or float to JS number */
function asNumber(val: unknown): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "object" && val !== null && "toNumber" in val) {
    return (val as { toNumber(): number }).toNumber();
  }
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

// ─── Main Entry Point ─────────────────────────────────────────────

/**
 * Run the Gnosis Planning Cycle — ecosystem-wide structural prioritisation.
 *
 * Surveys all active Blooms, reads violations and milestone state, computes
 * constitutional delta across pattern Blooms, reads LLM memory and existing
 * backlog, detects structural drift via BOCPD, and produces a ranked,
 * categorised list of intents with structural justification.
 *
 * All ranking is deterministic — derived from graph properties, no LLM.
 * LLM enrichment of top-N intents is optional (requires modelExecutor).
 *
 * @param modelExecutor - Optional: Thompson-routed model for intent enrichment
 * @param enrichTopN - Number of top intents to enrich (default: 10)
 */
export async function runPlanningCycle(
  modelExecutor?: ModelExecutor,
  enrichTopN: number = 10,
): Promise<PlanningReport> {
  const startTime = Date.now();

  // Step 0: Read previous planning observation (cross-cycle delta)
  console.log("  [Planning] Step 0: Reading previous planning cycle...");
  const previousObs = await readPreviousPlanningObservation();
  if (previousObs) {
    console.log(`  [Planning] Previous cycle: ${previousObs.previousViolations} violations, ` +
      `${previousObs.previousGaps} gaps, ${previousObs.previousIntents} intents`);
  } else {
    console.log("  [Planning] No previous cycle found (first run)");
  }

  // Step 1: Ecosystem survey
  console.log("  [Planning] Step 1: Surveying ecosystem...");
  const ecosystem = await surveyEcosystem();
  console.log(`  [Planning] ${ecosystem.bloomStates.length} active/planned Blooms, ` +
    `${ecosystem.totalResonators} Resonators, ${ecosystem.totalGrids} Grids, ${ecosystem.totalHelixes} Helixes`);

  // Step 2: Read violations
  console.log("  [Planning] Step 2: Reading violations...");
  const violations = await readViolations();
  console.log(`  [Planning] ${violations.total} active violations ` +
    `(${violations.bySeverity.critical} critical, ${violations.bySeverity.error} error, ${violations.bySeverity.warning} warning)`);

  // Step 2.5: Read LLM memory state (Stream 2)
  console.log("  [Planning] Step 2.5: Reading LLM memory state...");
  const memoryState = await readLLMMemoryState();
  console.log(`  [Planning] ${memoryState.contexts.length} LLM models, ` +
    `${memoryState.infrastructureFailures.length} infra-failures, ` +
    `${memoryState.driftingModels.length} drifting`);

  // Step 2.7: Structural drift detection (Stream 4)
  console.log("  [Planning] Step 2.7: Detecting structural drift (BOCPD)...");
  const structuralDrifts = await detectStructuralDrift(ecosystem.bloomStates);
  console.log(`  [Planning] ${structuralDrifts.length} structural drifts detected`);

  // Step 3: Read milestone state
  console.log("  [Planning] Step 3: Reading milestone state...");
  const milestones = await readMilestoneState();
  console.log(`  [Planning] ${milestones.total} milestones ` +
    `(${milestones.complete} complete, ${milestones.active} active, ${milestones.planned} planned, ` +
    `${milestones.unblocked.length} unblocked)`);

  // Step 3.5: Read existing backlog (Stream 3b)
  console.log("  [Planning] Step 3.5: Reading existing backlog...");
  const backlog = await readExistingBacklog();
  console.log(`  [Planning] Backlog: ${backlog.activeIntents.length} intent Seeds, ` +
    `${backlog.rItems.length} R-items`);

  // Step 4: Constitutional delta across pattern Blooms
  console.log("  [Planning] Step 4: Computing constitutional delta...");
  const definitions = await queryTransformationDefinitions();
  const gaps = await computeScopedDelta(definitions);
  const constitutionalGaps = gaps.filter((g) => g.gapType === "constitutional").length;
  console.log(`  [Planning] ${gaps.length} gaps (${constitutionalGaps} constitutional)`);

  // Step 5: Build intents from all sources, categorise, score
  console.log("  [Planning] Step 5: Building and scoring intents...");
  const intents: PlanningIntent[] = [];

  // Violations → intents
  for (const v of violations.top) {
    intents.push(violationToIntent(v));
  }

  // Constitutional/topological gaps → intents
  for (const gap of gaps) {
    intents.push(gapToIntent(gap));
  }

  // Unblocked milestones → intents
  for (const m of milestones.unblocked) {
    intents.push(milestoneToIntent(m));
  }

  // Infrastructure failure models → poka-yoke intents (Stream 2)
  for (const model of memoryState.infrastructureFailures) {
    intents.push({
      intentId: `plan:memory:infra-failure:${model}`,
      category: "infrastructure",
      description: `Model ${model}: infrastructure failures (likely stale API endpoint). ` +
                   `Poka-yoke fix: updateStructuralMemoryAfterExecution() must classify failures — ` +
                   `infrastructure errors (404/429/auth/timeout) must NOT update posteriors.`,
      priorityScore: 0,
      justification: {
        gapType: "topological",
        phiLTarget: model,
        phiLCurrent: 0,
      },
    });
  }

  // Drifting models → investigation intents (Stream 2)
  for (const model of memoryState.driftingModels) {
    intents.push({
      intentId: `plan:memory:drift:${model}`,
      category: "infrastructure",
      description: `BOCPD drift on ${model}: quality change point detected. Review recent outputs, consider recalibration.`,
      priorityScore: 0,
      justification: {
        gapType: "topological",
        phiLTarget: model,
      },
    });
  }

  // Structural drifts → governance intents (Stream 4)
  for (const drift of structuralDrifts) {
    intents.push({
      intentId: `plan:drift:${drift.bloomId}:${drift.metric}`,
      category: "governance",
      description: `Structural drift on ${drift.bloomId} (${drift.metric}): change point P=${drift.changePointProbability.toFixed(2)}. Investigate cause.`,
      priorityScore: 0,
      justification: {
        gapType: "topological",
        phiLTarget: drift.bloomId,
      },
    });
  }

  // R-items → intents (Stream 3b)
  for (const r of backlog.rItems) {
    const category = categoriseMilestone(r.name);
    intents.push({
      intentId: `plan:backlog:${r.id}`,
      category,
      description: `Backlog ${r.id}: ${r.name} (status: ${r.status})`,
      priorityScore: 0,
      justification: {
        gapType: "milestone",
      },
    });
  }

  // CE scope detection → governance intents (Stream 8)
  const unwiredBlooms = await findUnwiredBlooms();
  for (const bloomId of unwiredBlooms) {
    intents.push({
      intentId: `plan:unwired:${bloomId}`,
      category: "governance",
      description: `Bloom ${bloomId} has no FLOWS_TO to resonator:compliance-evaluation. Wire or justify exclusion.`,
      priorityScore: 0,
      justification: {
        gapType: "topological",
        phiLTarget: bloomId,
      },
    });
  }

  // Cluster related missing-instance gaps into composite intents (Fix 4)
  const preclusterCount = intents.length;
  const clustered = clusterGapIntents(intents);
  // Replace intents array contents with clustered result
  intents.length = 0;
  intents.push(...clustered);
  if (intents.length < preclusterCount) {
    console.log(`  [Planning] Clustered: ${preclusterCount} → ${intents.length} intents (${preclusterCount - intents.length} atoms merged into composites)`);
  }

  // Score all intents
  for (const intent of intents) {
    if (intent.priorityScore === 0) {
      intent.priorityScore = scorePlanningIntent(intent);
    }
  }

  // Backlog boost: active/approved intents get 1.5× score, stale proposed get 0.8×
  const existingIntentStatuses = new Map(
    backlog.activeIntents.map((i) => [i.id, i.status]),
  );
  for (const intent of intents) {
    const existingStatus = existingIntentStatuses.get(intent.intentId);
    if (existingStatus === "active" || existingStatus === "approved") {
      intent.priorityScore = Math.round(intent.priorityScore * 1.5 * 100) / 100;
    }
  }

  // Sort by priority score (descending)
  intents.sort((a, b) => b.priorityScore - a.priorityScore);

  // Step 6: Group by category
  const byCategory: Record<IntentCategory, PlanningIntent[]> = {
    infrastructure: [],
    "pattern-topology": [],
    governance: [],
    "substrate-grounding": [],
  };
  for (const intent of intents) {
    byCategory[intent.category].push(intent);
  }

  console.log(`  [Planning] ${intents.length} intents produced`);

  // Step 7: Persist all scored intents as Seeds (Stream 5)
  console.log("  [Planning] Step 7: Persisting intent Seeds...");
  const persistenceStats = await persistIntents(intents);
  console.log(`  [Planning] Persisted: ${persistenceStats.total} total ` +
    `(${persistenceStats.created} new, ${persistenceStats.updated} updated, ${persistenceStats.resolved} resolved)`);

  // Step 7.5: LLM enrichment of top-N intents (Stream 6)
  if (modelExecutor && enrichTopN > 0) {
    console.log(`  [Planning] Step 7.5: Enriching top ${enrichTopN} intents via Thompson...`);
    const enrichedCount = await enrichTopIntents(
      intents, ecosystem.bloomStates, modelExecutor, enrichTopN,
    );
    persistenceStats.enriched = enrichedCount;
    console.log(`  [Planning] Enriched ${enrichedCount}/${enrichTopN} intents`);
  }

  // Step 7.7: Ensure FLOWS_TO wiring (Stream 7a) — one-time
  await ensureGnosisToArchitectWiring();

  // Compute cross-cycle delta
  const previousCycleDelta = previousObs ? {
    previousTimestamp: previousObs.previousTimestamp,
    violationDelta: violations.total - previousObs.previousViolations,
    gapDelta: constitutionalGaps - previousObs.previousGaps,
    intentDelta: intents.length - previousObs.previousIntents,
  } : null;

  // Backlog summary
  const backlogCounts = {
    activeIntents: backlog.activeIntents.filter((i) => i.status === "active").length,
    approvedIntents: backlog.activeIntents.filter((i) => i.status === "approved").length,
    proposedIntents: backlog.activeIntents.filter((i) => i.status === "proposed").length,
    rItems: backlog.rItems.length,
  };

  const processingTimeMs = Date.now() - startTime;

  const report: PlanningReport = {
    timestamp: new Date().toISOString(),
    ecosystemState: {
      totalBlooms: ecosystem.bloomStates.length,
      totalResonators: ecosystem.totalResonators,
      totalGrids: ecosystem.totalGrids,
      totalHelixes: ecosystem.totalHelixes,
      bloomStates: ecosystem.bloomStates,
    },
    activeViolations: violations,
    milestoneState: milestones,
    constitutionalGaps,
    modelMemory: {
      totalModels: memoryState.contexts.length,
      activeModels: memoryState.contexts.filter((c) => !c.isColdStart).length,
      infrastructureFailures: memoryState.infrastructureFailures,
      driftingModels: memoryState.driftingModels,
      topPerformers: memoryState.topPerformers,
      summary: memoryState.summary,
    },
    previousCycleDelta,
    existingBacklog: backlogCounts,
    structuralDrifts,
    unwiredBlooms,
    persistenceStats,
    intents,
    byCategory,
    processingTimeMs,
  };

  // Step 8: Record observation
  console.log("  [Planning] Step 8: Recording observation...");
  await recordPlanningObservation(report);

  console.log(`  [Planning] Complete in ${processingTimeMs}ms`);

  return report;
}

// Re-export for testing and CLI
export { scorePlanningIntent, inferScopesForBloom, categoriseMilestone, clusterGapIntents, readLLMMemoryState, readExistingBacklog, detectStructuralDrift, findUnwiredBlooms, persistIntents, enrichTopIntents, ensureGnosisToArchitectWiring };
