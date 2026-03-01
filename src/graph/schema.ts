// Copyright 2024-2026 Rowen Hodge
// Licensed under the Apache License, Version 2.0
// See LICENSE file for details

/**
 * Codex Signum — Neo4j Schema
 *
 * Node labels, relationships, constraints, and indexes
 * that encode the Codex grammar as a graph structure.
 *
 * M-7C: Labels use Codex morpheme names (Seed, Bloom).
 *
 * "The Neo4j graph is the single source of truth."
 *
 * @see codex-signum-implementation-README.md §TASK 1
 * @module codex-signum-core/graph/schema
 */

import { writeTransaction } from "./client.js";

// ============ SCHEMA DEFINITION ============

/**
 * All Cypher statements needed to create the Codex schema.
 * Run these once (idempotent — CREATE IF NOT EXISTS).
 *
 * M-7C: Uses morpheme-native labels (Seed instead of Agent, Bloom instead of Pattern).
 */
const SCHEMA_STATEMENTS: string[] = [
  // ── Node Uniqueness Constraints ──

  // Seeds (compute substrate — LLM model instances)
  "CREATE CONSTRAINT seed_id_unique IF NOT EXISTS FOR (s:Seed) REQUIRE s.id IS UNIQUE",

  // Blooms (scoped compositions of morphemes)
  "CREATE CONSTRAINT bloom_id_unique IF NOT EXISTS FOR (b:Bloom) REQUIRE b.id IS UNIQUE",

  // Decisions (routing choices, governance evaluations)
  "CREATE CONSTRAINT decision_id_unique IF NOT EXISTS FOR (d:Decision) REQUIRE d.id IS UNIQUE",

  // Constitutional Rules (governance constraints)
  "CREATE CONSTRAINT rule_id_unique IF NOT EXISTS FOR (r:ConstitutionalRule) REQUIRE r.id IS UNIQUE",

  // Observations (Stratum 2 memory — RETAINED)
  "CREATE CONSTRAINT observation_id_unique IF NOT EXISTS FOR (o:Observation) REQUIRE o.id IS UNIQUE",

  // Distillations (Stratum 3 memory — extracted patterns)
  "CREATE CONSTRAINT distillation_id_unique IF NOT EXISTS FOR (di:Distillation) REQUIRE di.id IS UNIQUE",

  // Institutional Knowledge (Stratum 4)
  "CREATE CONSTRAINT institutional_id_unique IF NOT EXISTS FOR (ik:InstitutionalKnowledge) REQUIRE ik.id IS UNIQUE",

  // Resonators (transformation morphemes)
  "CREATE CONSTRAINT resonator_id_unique IF NOT EXISTS FOR (r:Resonator) REQUIRE r.id IS UNIQUE",

  // Grids (knowledge structure morphemes)
  "CREATE CONSTRAINT grid_id_unique IF NOT EXISTS FOR (g:Grid) REQUIRE g.id IS UNIQUE",

  // Helixes (feedback loop morphemes)
  "CREATE CONSTRAINT helix_id_unique IF NOT EXISTS FOR (h:Helix) REQUIRE h.id IS UNIQUE",

  // Context Clusters (for Thompson Sampling)
  "CREATE CONSTRAINT context_cluster_id_unique IF NOT EXISTS FOR (cc:ContextCluster) REQUIRE cc.id IS UNIQUE",

  // Decision lifecycle integrity
  "CREATE CONSTRAINT decision_timestamp_required IF NOT EXISTS FOR (d:Decision) REQUIRE d.timestamp IS NOT NULL",

  // ── Indexes for Common Queries ──

  // Observations by timestamp (time-range queries for ΦL computation)
  "CREATE INDEX observation_timestamp IF NOT EXISTS FOR (o:Observation) ON (o.timestamp)",

  // Observations by source bloom (ΦL computation per bloom)
  "CREATE INDEX observation_source_bloom IF NOT EXISTS FOR (o:Observation) ON (o.sourceBloomId)",

  // Decisions by timestamp
  "CREATE INDEX decision_timestamp IF NOT EXISTS FOR (d:Decision) ON (d.timestamp)",

  // Decisions by bloom
  "CREATE INDEX decision_bloom IF NOT EXISTS FOR (d:Decision) ON (d.madeByBloomId)",

  // Seeds by status (for Thompson Sampling — active seeds)
  "CREATE INDEX seed_status IF NOT EXISTS FOR (s:Seed) ON (s.status)",

  // Seeds by provider / model family / probe freshness
  "CREATE INDEX seed_provider IF NOT EXISTS FOR (s:Seed) ON (s.provider)",
  "CREATE INDEX seed_base_model IF NOT EXISTS FOR (s:Seed) ON (s.baseModelId)",
  "CREATE INDEX seed_last_probed IF NOT EXISTS FOR (s:Seed) ON (s.lastProbed)",

  // Blooms by state (integration lifecycle)
  "CREATE INDEX bloom_state IF NOT EXISTS FOR (b:Bloom) ON (b.state)",

  // Constitutional Rules by status (active rules)
  "CREATE INDEX rule_status IF NOT EXISTS FOR (r:ConstitutionalRule) ON (r.status)",

  // Context Clusters by task type (Thompson routing)
  "CREATE INDEX cluster_task_type IF NOT EXISTS FOR (cc:ContextCluster) ON (cc.taskType)",

  // ThresholdEvent (immutable band crossing records)
  "CREATE CONSTRAINT threshold_event_id_unique IF NOT EXISTS FOR (te:ThresholdEvent) REQUIRE te.id IS UNIQUE",
  "CREATE INDEX threshold_event_pattern IF NOT EXISTS FOR (te:ThresholdEvent) ON (te.patternId)",
  "CREATE INDEX threshold_event_timestamp IF NOT EXISTS FOR (te:ThresholdEvent) ON (te.timestamp)",

  // Human feedback calibration (breaks LLM-evaluating-LLM circularity)
  "CREATE CONSTRAINT human_feedback_id_unique IF NOT EXISTS FOR (hf:HumanFeedback) REQUIRE hf.id IS UNIQUE",
  "CREATE INDEX human_feedback_run IF NOT EXISTS FOR (hf:HumanFeedback) ON (hf.runId)",
  "CREATE INDEX human_feedback_timestamp IF NOT EXISTS FOR (hf:HumanFeedback) ON (hf.timestamp)",
];

// ============ SCHEMA MIGRATION ============

/**
 * Apply the full Codex schema to Neo4j.
 * Idempotent — safe to run multiple times.
 */
export async function migrateSchema(): Promise<{
  applied: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let applied = 0;

  for (const statement of SCHEMA_STATEMENTS) {
    try {
      await writeTransaction(async (tx) => {
        await tx.run(statement);
      });
      applied++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      // "equivalent constraint already exists" is fine
      if (msg.includes("already exists") || msg.includes("equivalent")) {
        applied++;
      } else {
        errors.push(`${statement.slice(0, 60)}... → ${msg}`);
      }
    }
  }

  return { applied, errors };
}

// ============ M-7C MORPHEME LABEL MIGRATION ============

/**
 * M-7C migration: rename pre-Codex node labels to morpheme-native names.
 * Idempotent — safe to run multiple times.
 * Run AFTER migrateSchema() on existing databases.
 *
 * Label renames: Agent → Seed, Pattern → Bloom
 * Relationship renames: SELECTED → ROUTED_TO, MADE_BY → ORIGINATED_FROM, OBSERVED_BY → OBSERVED_IN
 * Property renames: selectedAgentId → selectedSeedId, madeByPatternId → madeByBloomId, sourcePatternId → sourceBloomId
 */
export async function migrateToMorphemeLabels(): Promise<{
  renamed: string[];
  skipped: string[];
  errors: string[];
}> {
  const renamed: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  // ── Label Migrations ──
  const labelMigrations = [
    { from: "Agent", to: "Seed" },
    { from: "Pattern", to: "Bloom" },
  ];

  for (const { from, to } of labelMigrations) {
    try {
      await writeTransaction(async (tx) => {
        // Check if any nodes with old label exist
        const check = await tx.run(
          `MATCH (n:${from}) RETURN count(n) AS count`,
        );
        const count = check.records[0]?.get("count") ?? 0;
        if (count === 0) {
          skipped.push(`${from} → ${to} (no nodes found)`);
          return;
        }
        // Add new label, remove old label
        await tx.run(
          `MATCH (n:${from}) SET n:${to} REMOVE n:${from}`,
        );
        renamed.push(`${from} → ${to} (${count} nodes)`);
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`Label ${from} → ${to}: ${msg}`);
    }
  }

  // ── Relationship Migrations ──
  const relMigrations = [
    { from: "SELECTED", to: "ROUTED_TO" },
    { from: "MADE_BY", to: "ORIGINATED_FROM" },
    { from: "OBSERVED_BY", to: "OBSERVED_IN" },
  ];

  for (const { from, to } of relMigrations) {
    try {
      await writeTransaction(async (tx) => {
        // Check if any relationships with old type exist
        const check = await tx.run(
          `MATCH ()-[r:${from}]->() RETURN count(r) AS count`,
        );
        const count = check.records[0]?.get("count") ?? 0;
        if (count === 0) {
          skipped.push(`Rel ${from} → ${to} (none found)`);
          return;
        }
        // Create new relationship with all properties, delete old
        await tx.run(
          `MATCH (a)-[r:${from}]->(b)
           CREATE (a)-[r2:${to}]->(b)
           SET r2 = properties(r)
           DELETE r`,
        );
        renamed.push(`Rel ${from} → ${to} (${count} relationships)`);
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`Rel ${from} → ${to}: ${msg}`);
    }
  }

  // ── Property Migrations ──
  const propMigrations = [
    { label: "Decision", from: "selectedAgentId", to: "selectedSeedId" },
    { label: "Decision", from: "madeByPatternId", to: "madeByBloomId" },
    { label: "Observation", from: "sourcePatternId", to: "sourceBloomId" },
  ];

  for (const { label, from, to } of propMigrations) {
    try {
      await writeTransaction(async (tx) => {
        const check = await tx.run(
          `MATCH (n:${label}) WHERE n.${from} IS NOT NULL RETURN count(n) AS count`,
        );
        const count = check.records[0]?.get("count") ?? 0;
        if (count === 0) {
          skipped.push(`Prop ${label}.${from} → ${to} (none found)`);
          return;
        }
        await tx.run(
          `MATCH (n:${label}) WHERE n.${from} IS NOT NULL
           SET n.${to} = n.${from}
           REMOVE n.${from}`,
        );
        renamed.push(`Prop ${label}.${from} → ${to} (${count} nodes)`);
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`Prop ${label}.${from} → ${to}: ${msg}`);
    }
  }

  return { renamed, skipped, errors };
}

/**
 * Drop legacy pre-M-7C constraints and indexes.
 * Run AFTER migrateToMorphemeLabels() succeeds.
 * Idempotent — safe to run if constraints don't exist.
 */
export async function cleanupLegacySchema(): Promise<{
  dropped: string[];
  errors: string[];
}> {
  const dropped: string[] = [];
  const cleanupErrors: string[] = [];

  const legacyStatements = [
    // Old constraints
    "DROP CONSTRAINT agent_id_unique IF EXISTS",
    "DROP CONSTRAINT pattern_id_unique IF EXISTS",
    // Old indexes
    "DROP INDEX agent_status IF EXISTS",
    "DROP INDEX agent_provider IF EXISTS",
    "DROP INDEX agent_base_model IF EXISTS",
    "DROP INDEX agent_last_probed IF EXISTS",
    "DROP INDEX pattern_state IF EXISTS",
    "DROP INDEX observation_source IF EXISTS",
    "DROP INDEX decision_pattern IF EXISTS",
  ];

  for (const statement of legacyStatements) {
    try {
      await writeTransaction(async (tx) => {
        await tx.run(statement);
      });
      dropped.push(statement);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("does not exist") || msg.includes("not found")) {
        // Already cleaned up — that's fine
        dropped.push(`${statement} (already gone)`);
      } else {
        cleanupErrors.push(`${statement}: ${msg}`);
      }
    }
  }

  return { dropped, errors: cleanupErrors };
}

/**
 * Verify schema is in place by checking constraint count.
 */
export async function verifySchema(): Promise<{
  constraintCount: number;
  indexCount: number;
  healthy: boolean;
}> {
  const { runQuery } = await import("./client.js");

  const constraintResult = await runQuery(
    "SHOW CONSTRAINTS YIELD name RETURN count(name) AS count",
    {},
    "READ",
  );
  const indexResult = await runQuery(
    "SHOW INDEXES YIELD name WHERE name <> 'constraint' RETURN count(name) AS count",
    {},
    "READ",
  );

  const constraintCount = constraintResult.records[0]?.get("count") ?? 0;
  const indexCount = indexResult.records[0]?.get("count") ?? 0;

  return {
    constraintCount,
    indexCount,
    // We expect at least 13 constraints and 8 indexes
    healthy: constraintCount >= 13 && indexCount >= 8,
  };
}

/**
 * Seed the graph with foundational constitutional rules.
 * These are the non-negotiable constraints from the spec.
 */
export async function seedConstitutionalRules(): Promise<number> {
  const rules = [
    {
      id: "rule-cascade-limit-2",
      name: "Cascade Limit",
      tier: 1,
      target: "cascade_limit",
      constraint: "max",
      value: 2,
      priority: "mandatory",
      rationale:
        "Degradation propagates at most 2 containment levels. Primary safety mechanism.",
    },
    {
      id: "rule-hysteresis-2.5x",
      name: "Hysteresis Ratio",
      tier: 1,
      target: "hysteresis_ratio",
      constraint: "equals",
      value: 2.5,
      priority: "mandatory",
      rationale: "Recovery is 2.5× slower than degradation. Prevents flapping.",
    },
    {
      id: "rule-min-epsilon-r",
      name: "Minimum Exploration",
      tier: 1,
      target: "min_epsilon_r",
      constraint: "min",
      value: 0.01,
      priority: "mandatory",
      rationale:
        "εR must never be exactly 0 for active patterns. High ΦL with zero εR is a warning.",
    },
    {
      id: "rule-max-correction-iterations",
      name: "Correction Helix Bound",
      tier: 1,
      target: "max_correction_iterations",
      constraint: "max",
      value: 3,
      priority: "mandatory",
      rationale:
        "Maximum 3 correction iterations. Then pass best available + signal degraded ΦL.",
    },
    {
      id: "rule-quality-threshold",
      name: "Minimum Quality",
      tier: 1,
      target: "quality_threshold",
      constraint: "min",
      value: 0.5,
      priority: "preferred",
      rationale: "Minimum acceptable quality score for routing decisions.",
    },
    {
      id: "rule-provenance-clarity",
      name: "Minimum Provenance",
      tier: 1,
      target: "min_provenance_clarity",
      constraint: "min",
      value: 0.3,
      priority: "advisory",
      rationale: "Minimum provenance clarity for pattern health computation.",
    },
    {
      id: "rule-routing-confidence-threshold",
      name: "Minimum Routing Confidence",
      tier: 1,
      target: "routing_confidence",
      constraint: "min",
      value: 0.45,
      priority: "preferred",
      rationale:
        "Routing decisions should meet a minimum confidence threshold before execution.",
    },
    {
      id: "rule-max-latency-ms",
      name: "Maximum Decision Latency",
      tier: 2,
      target: "max_decision_latency_ms",
      constraint: "max",
      value: 30000,
      priority: "advisory",
      rationale:
        "Excessive routing latency degrades operational usefulness and should be bounded.",
    },
    {
      id: "rule-outcome-required",
      name: "Outcome Recording Required",
      tier: 1,
      target: "decision_outcome_required",
      constraint: "boolean",
      value: true,
      priority: "mandatory",
      rationale:
        "Completed decisions must record outcomes so learning and governance remain stateful.",
    },
    {
      id: "rule-review-model-differs",
      name: "Cross-Model Validation",
      tier: 2,
      target: "review_model_differs",
      constraint: "boolean",
      value: true,
      priority: "preferred",
      rationale:
        "REVIEW model should differ from EXECUTE model when multiple viable models exist.",
    },
  ];

  let created = 0;
  for (const rule of rules) {
    await writeTransaction(async (tx) => {
      await tx.run(
        `MERGE (r:ConstitutionalRule { id: $id })
         ON CREATE SET
           r.name = $name,
           r.tier = $tier,
           r.status = 'active',
           r.target = $target,
           r.constraint = $constraint,
           r.value = $value,
           r.priority = $priority,
           r.rationale = $rationale,
           r.createdAt = datetime()
         RETURN r`,
        rule,
      );
      created++;
    });
  }

  return created;
}
