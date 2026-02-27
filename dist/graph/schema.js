/**
 * Codex Signum — Neo4j Schema
 *
 * Node labels, relationships, constraints, and indexes
 * that encode the Codex grammar as a graph structure.
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
 */
const SCHEMA_STATEMENTS = [
    // ── Node Uniqueness Constraints ──
    // Agents (models, services — compute substrate)
    "CREATE CONSTRAINT agent_id_unique IF NOT EXISTS FOR (a:Agent) REQUIRE a.id IS UNIQUE",
    // Patterns (compositions of morphemes)
    "CREATE CONSTRAINT pattern_id_unique IF NOT EXISTS FOR (p:Pattern) REQUIRE p.id IS UNIQUE",
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
    // Seeds (atomic morphemes within patterns)
    "CREATE CONSTRAINT seed_id_unique IF NOT EXISTS FOR (s:Seed) REQUIRE s.id IS UNIQUE",
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
    // Observations by source pattern (ΦL computation per pattern)
    "CREATE INDEX observation_source IF NOT EXISTS FOR (o:Observation) ON (o.sourcePatternId)",
    // Decisions by timestamp
    "CREATE INDEX decision_timestamp IF NOT EXISTS FOR (d:Decision) ON (d.timestamp)",
    // Decisions by pattern
    "CREATE INDEX decision_pattern IF NOT EXISTS FOR (d:Decision) ON (d.madeByPatternId)",
    // Agents by status (for Thompson Sampling — active agents)
    "CREATE INDEX agent_status IF NOT EXISTS FOR (a:Agent) ON (a.status)",
    // Agents by provider / model family / probe freshness
    "CREATE INDEX agent_provider IF NOT EXISTS FOR (a:Agent) ON (a.provider)",
    "CREATE INDEX agent_base_model IF NOT EXISTS FOR (a:Agent) ON (a.baseModelId)",
    "CREATE INDEX agent_last_probed IF NOT EXISTS FOR (a:Agent) ON (a.lastProbed)",
    // Patterns by state (integration lifecycle)
    "CREATE INDEX pattern_state IF NOT EXISTS FOR (p:Pattern) ON (p.state)",
    // Constitutional Rules by status (active rules)
    "CREATE INDEX rule_status IF NOT EXISTS FOR (r:ConstitutionalRule) ON (r.status)",
    // Context Clusters by task type (Thompson routing)
    "CREATE INDEX cluster_task_type IF NOT EXISTS FOR (cc:ContextCluster) ON (cc.taskType)",
    // ThresholdEvent (immutable band crossing records)
    "CREATE CONSTRAINT threshold_event_id_unique IF NOT EXISTS FOR (te:ThresholdEvent) REQUIRE te.id IS UNIQUE",
    "CREATE INDEX threshold_event_pattern IF NOT EXISTS FOR (te:ThresholdEvent) ON (te.patternId)",
    "CREATE INDEX threshold_event_timestamp IF NOT EXISTS FOR (te:ThresholdEvent) ON (te.timestamp)",
];
// ============ SCHEMA MIGRATION ============
/**
 * Apply the full Codex schema to Neo4j.
 * Idempotent — safe to run multiple times.
 */
export async function migrateSchema() {
    const errors = [];
    let applied = 0;
    for (const statement of SCHEMA_STATEMENTS) {
        try {
            await writeTransaction(async (tx) => {
                await tx.run(statement);
            });
            applied++;
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            // "equivalent constraint already exists" is fine
            if (msg.includes("already exists") || msg.includes("equivalent")) {
                applied++;
            }
            else {
                errors.push(`${statement.slice(0, 60)}... → ${msg}`);
            }
        }
    }
    return { applied, errors };
}
/**
 * Verify schema is in place by checking constraint count.
 */
export async function verifySchema() {
    const { runQuery } = await import("./client.js");
    const constraintResult = await runQuery("SHOW CONSTRAINTS YIELD name RETURN count(name) AS count", {}, "READ");
    const indexResult = await runQuery("SHOW INDEXES YIELD name WHERE name <> 'constraint' RETURN count(name) AS count", {}, "READ");
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
export async function seedConstitutionalRules() {
    const rules = [
        {
            id: "rule-cascade-limit-2",
            name: "Cascade Limit",
            tier: 1,
            target: "cascade_limit",
            constraint: "max",
            value: 2,
            priority: "mandatory",
            rationale: "Degradation propagates at most 2 containment levels. Primary safety mechanism.",
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
            rationale: "εR must never be exactly 0 for active patterns. High ΦL with zero εR is a warning.",
        },
        {
            id: "rule-max-correction-iterations",
            name: "Correction Helix Bound",
            tier: 1,
            target: "max_correction_iterations",
            constraint: "max",
            value: 3,
            priority: "mandatory",
            rationale: "Maximum 3 correction iterations. Then pass best available + signal degraded ΦL.",
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
            rationale: "Routing decisions should meet a minimum confidence threshold before execution.",
        },
        {
            id: "rule-max-latency-ms",
            name: "Maximum Decision Latency",
            tier: 2,
            target: "max_decision_latency_ms",
            constraint: "max",
            value: 30000,
            priority: "advisory",
            rationale: "Excessive routing latency degrades operational usefulness and should be bounded.",
        },
        {
            id: "rule-outcome-required",
            name: "Outcome Recording Required",
            tier: 1,
            target: "decision_outcome_required",
            constraint: "boolean",
            value: true,
            priority: "mandatory",
            rationale: "Completed decisions must record outcomes so learning and governance remain stateful.",
        },
        {
            id: "rule-review-model-differs",
            name: "Cross-Model Validation",
            tier: 2,
            target: "review_model_differs",
            constraint: "boolean",
            value: true,
            priority: "preferred",
            rationale: "REVIEW model should differ from EXECUTE model when multiple viable models exist.",
        },
    ];
    let created = 0;
    for (const rule of rules) {
        await writeTransaction(async (tx) => {
            await tx.run(`MERGE (r:ConstitutionalRule { id: $id })
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
         RETURN r`, rule);
            created++;
        });
    }
    return created;
}
//# sourceMappingURL=schema.js.map