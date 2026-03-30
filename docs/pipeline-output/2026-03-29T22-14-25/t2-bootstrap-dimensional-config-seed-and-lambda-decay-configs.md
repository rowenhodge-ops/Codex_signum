# Bootstrap dimensional Config Seed and lambda decay Configs

> Task ID: t2
> Model: claude-haiku-4-5:extended:4k
> Duration: 44243ms
> Output chars: 13843
> Timestamp: 2026-03-29T22:39:53.841Z

---

# Analysis: Bootstrap Dimensional Config Seed and Lambda Decay Configs (t2)

## Executive Summary

Task t2 requires seeding five Config Seed nodes into the graph: one dimensional-phi-profiles configuration defining the constitutional dimension set, and four lambda decay configurations for different context domains. The task has clear quantitative acceptance criteria but lacks specification around: (1) Config Seed morpheme schema/structure, (2) storage mechanism for configuration values (properties vs. content encoding), and (3) parent/relationship topology.

---

## Findings

### F1: Config Seed Status — Novel Morpheme Type

**Finding:** `config:*` node types do not appear in existing schema files or prior bootstrap scripts. Seeds (t8, t1) are grammar/intent artifacts. Config Seeds represent a new category: **configuration state nodes**.

**Evidence:** 
- bootstrap-m10-intent.ts creates Seeds with `seedType: "intent"`, `category: "infrastructure"` 
- No `seedType: "config"` or similar pattern exists in extant code
- M-10.1 requirement 2-3 references "Config Seed" with no morpheme definition; implies it's a Seed instance with special semantics

**Implication:** Config Seeds are likely Seed nodes (morphemeType = Seed) with:
- `seedType: "config"` to distinguish from intent/grammar/etc.
- `category: "configuration"` or similar
- Specific structure for storing configuration data (detailed in F3-F4)

---

### F2: Dimensional Config Storage Strategy — Three Options

**Finding:** The dimensional-phi-profiles config must encode six dimensions: [code, analysis, creative, structured_output, classification, synthesis]. Three storage patterns are viable:

#### Option A: Content-Encoded (JSON in content field)
- Store dimensions as JSON array in `content` property
- Example: `content: JSON.stringify({ dimensions: ["code", "analysis", ...] })`
- **Pros:** Simple, matches pattern of intent Seed content
- **Cons:** Requires JSON parsing on read; not queryable via Cypher; violates M-10.4 requirement "derived ΦL from γ-recursive running averages on Bloom properties" (config should support property-driven queries)

#### Option B: Child Seed Nodes (Hierarchical)
- Create dimensional-phi-profiles as parent Seed
- Create five child Seed nodes (one per dimension: code, analysis, creative, structured_output, classification, synthesis)
- Connect via `CONTAINS` relationships
- **Pros:** Each dimension is queryable; supports future per-dimension state (e.g., phiL_code running average)
- **Cons:** Overhead (5 extra nodes); requires expansion logic on read

#### Option C: Direct Properties on Node
- Store dimensions as separate properties: `dimension_code: 0.0`, `dimension_analysis: 0.0`, etc.
- **Pros:** Queryable directly; matches M-10.1 requirement 4 (ΦL derived from Bloom properties)
- **Cons:** Inflexible if dimension set changes; violates clean morpheme property design (morphemes have fixed structural properties)

**Assessment:** Option B aligns best with M-10.1 molecular architecture (composition via CONTAINS) and supports future BOCPD recalibration (M-10.2) on per-dimension state. Option C is pragmatic if dimensions are immutable.

---

### F3: Lambda Decay Config Storage — Value Encoding Required

**Finding:** Four lambda configs must each encode a single millisecond half-life value. The task specifies literal millisecond values:
- model-performance: 216000000ms
- schema-definition: 7776000000ms
- threat-archive: 1814400000ms
- remedy-archive: 7776000000ms

**Evidence:**
- M-10.1 requirement 3: "all in milliseconds"
- Verification criteria: "config queryable via graph"
- M-10.1 requirement 4: assemblePatternHealthContext() "derive ΦL from γ-recursive running averages" — implies configs are read dynamically, not baked at compile-time

**Implication:** Each lambda Config Seed needs a property storing the millisecond value. Options:

#### Option A: `lambdaHalfLifeMs` property
- Store value in a typed property (integer): `lambdaHalfLifeMs: 216000000`
- Query via `MATCH (c:Seed {id: 'config:lambda:model-performance'}) RETURN c.lambdaHalfLifeMs`
- **Pros:** Direct, simple Cypher; matches property-driven governance model
- **Cons:** Non-standard property name if not formalized in morpheme spec

#### Option B: Content-encoded with metadata
- Store in content with `decayHalfLifeMs: 216000000` object or structured text
- **Pros:** Flexible; keeps graph "clean"
- **Cons:** Requires parsing; defeats "queryable via graph" criterion

**Assessment:** Option A (direct property) is preferred. Requires morpheme schema expansion to allow `lambdaHalfLifeMs` on Config Seeds, or a new Config-specific morpheme type.

---

### F4: Parent Bloom Topology

**Finding:** bootstrap-m10-intent.ts locates the Gnosis (Cognitive) Bloom and instantiates the M-10 intent under it. Config Seeds should follow the same pattern.

**Evidence:**
- M-10.1 is infrastructure (morpheme, dimensional, per-context configuration)
- Gnosis Bloom is the Cognitive layer — appropriate parent for memory infrastructure
- CONTAINS relationships in bootstrap-m10-intent.ts show parent-child instantiation pattern

**Implication:** All five Config Seeds should be instantiated as children of the Gnosis Bloom via CONTAINS relationships (implicitly created by instantiateMorpheme, confirmed via verification queries in bootstrap-m10-intent.ts).

---

### F5: Relationships — INSTANTIATES and Domain Wiring

**Finding:** Each Config Seed must reference its definition Seed (e.g., `def:config:lambda` or `def:config:dimensional`). Additionally, context-specific lambda configs (threat-archive, remedy-archive) should wire to their corresponding Grids/patterns.

**Evidence:**
- bootstrap-m10-intent.ts creates INSTANTIATES edges to `def:bloom:cognitive`, `def:helix:learning`, etc.
- M-10.1 requirement 3 specifies "per-context lambda" — implies domain association (model-performance, schema-definition, threat-archive, remedy-archive are named contexts)
- Verification queries in bootstrap-m10-intent.ts check for INSTANTIATES edges

**Implication:**
1. Each Config Seed needs INSTANTIATES → definition Seed (likely `def:seed:config` or morpheme-specific)
2. Lambda configs should wire to relevant Grids:
   - `config:lambda:threat-archive` → `grid:threat-archive` (or equivalent)
   - `config:lambda:remedy-archive` → `grid:remedy-archive`
   - Model-performance and schema-definition may be ecosystem-scoped (no specific Grid target, or wire to ecosystem Bloom)

---

### F6: Definition Seeds May Not Exist

**Finding:** The schema files provided do not include definition Seeds for Config types (e.g., `def:seed:config` or `def:config:dimensional`).

**Evidence:**
- bootstrap-m10-intent.ts INSTANTIATES to `def:bloom:cognitive`, `def:morpheme:seed`, `def:transformation:llm-invocation` — all defined in prior schema bootstrap
- No `def:config:*` or `def:seed:config` found in provided files

**Implication:** Either:
1. Config Seeds do not INSTANTIATE (break the morpheme instantiation pattern)
2. Definition Seeds must be created first (separate bootstrap step)
3. Config Seeds INSTANTIATE to a generic `def:seed:config` that must be created

**Recommendation:** Clarify whether M-10.1 includes a step to create definition Seeds for Config types, or whether Config Seeds are exceptions to the INSTANTIATES pattern.

---

### F7: Verification Challenge — Cypher Query Patterns

**Finding:** The acceptance criteria state "All configs queryable via graph," but the specific query patterns are unspecified.

**Evidence:**
- bootstrap-m10-intent.ts verification queries:
  ```cypher
  MATCH (i:Seed {id: 'intent:m10:...'})
  ```
- No example queries for Config Seeds provided

**Implication:** Verification must confirm:
1. Nodes exist with correct `id` and labels
2. Properties contain correct values (dimensions array or lambda milliseconds)
3. Relationships (CONTAINS, INSTANTIATES, domain-specific wires) are intact
4. Example query: `MATCH (c:Seed {id: 'config:dimensional-phi-profiles'}) RETURN c.*`

---

## Recommendations

### R1: Formalize Config Seed Morpheme Schema
Define Config Seed as a morpheme in Codex specification. Add to schema (schema.ts):
- Node label: `:Seed` (reuse existing morpheme)
- Constraints: `config_id_unique` (similar to seed_id_unique)
- Required properties: `id`, `name`, `seedType: "config"`, `configType` (e.g., "dimensional", "lambda")
- Optional properties: `lambdaHalfLifeMs` (for lambda configs), `dimensionSet` (if stored as comma-separated string)

**Rationale:** Maintains morpheme clarity; enables schema-aware validation.

### R2: Choose and Implement Dimensional Encoding
**Recommended approach:** Option C (content-encoded JSON) for now, with migration path to Option B (child Seed nodes) in M-10.2.

```json
{
  "id": "config:dimensional-phi-profiles",
  "name": "Constitutional Dimension Set",
  "seedType": "config",
  "configType": "dimensional",
  "status": "active",
  "content": "{\n  \"dimensions\": [\"code\", \"analysis\", \"creative\", \"structured_output\", \"classification\", \"synthesis\"],\n  \"initialValue\": 0.0,\n  \"description\": \"Constitutional dimension set for ΦL (dimensional profile) computation. Each dimension tracks phiL values for Thompson posterior initialization.\"\n}",
  "category": "infrastructure"
}
```

**Rationale:** JSON in content is human-readable, parseable, and doesn't require schema expansion. Verification parses and validates dimensions array.

### R3: Lambda Config Storage — Direct Properties
Implement lambda configs with `lambdaHalfLifeMs` property:

```typescript
// Example instantiation:
{
  "id": "config:lambda:model-performance",
  "name": "Model Performance Decay",
  "seedType": "config",
  "configType": "lambda",
  "lambdaHalfLifeMs": 216000000,  // 2.5 days
  "status": "active",
  "content": "Half-life (decay timescale) for model performance Thompson posteriors. γ = e^(−λ) with λ = ln(2) / (216000000ms).",
  "category": "infrastructure"
}
```

**Rationale:** Direct property allows Cypher queries like `MATCH (c:Seed {configType: 'lambda'}) WHERE c.lambdaHalfLifeMs < 86400000` for sub-day decays. Properties are first-class graph elements; content is documentation.

### R4: Wire Configs to Gnosis Bloom and Definition Seeds
Each Config Seed should:
1. Be instantiated as child of Gnosis Bloom (CONTAINS edge created implicitly)
2. INSTANTIATE to a definition Seed (create `def:seed:config` if missing)
3. Lambda configs should wire to relevant domain Grids/Blooms via a new `CONFIGURES` relationship type (or `SCOPED_TO` if ecosystem-wide)

```typescript
// After instantiating all 5 configs:
await createLine("config:dimensional-phi-profiles", "def:seed:config", "INSTANTIATES");
await createLine("config:lambda:threat-archive", "grid:threat-archive", "CONFIGURES");
await createLine("config:lambda:remedy-archive", "grid:remedy-archive", "CONFIGURES");
// model-performance and schema-definition wire to ecosystem/common Bloom if needed
```

### R5: Implement Verification Queries
Add to the bootstrap script (after all instantiations):

```cypher
// Verify dimensional config
MATCH (c:Seed {id: 'config:dimensional-phi-profiles'})
RETURN c.id, c.seedType, c.configType, c.content
LIMIT 1

// Verify lambda configs with values
MATCH (c:Seed {seedType: 'config', configType: 'lambda'})
RETURN c.id, c.lambdaHalfLifeMs
ORDER BY c.id

// Verify CONTAINS edges from Gnosis
MATCH (g:Bloom)-[:INSTANTIATES]->(def:Seed {id: 'def:bloom:cognitive'})
      (g)-[:CONTAINS]->(c:Seed {seedType: 'config'})
RETURN g.id, count(c) AS configCount
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Config Seeds are not queryable due to missing indexes | Medium | High | Add `config_id_unique` constraint and `seedType` index in schema before bootstrap |
| Lambda millisecond values exceed Neo4j integer range (2^63-1) | Low | High | All provided values fit in int64; verify no future configs exceed ~9.2E18ms (~292M years) |
| Definition Seed `def:seed:config` missing | High | Medium | Create definition Seed in same script or separate bootstrap step; document order dependency |
| Dimensional config JSON parsing fails at runtime | Medium | Medium | Add unit test parsing dimensions array from sample config seed before integration |
| Lambda configs wire to non-existent Grids | Medium | Low | Verify `grid:threat-archive` and `grid:remedy-archive` exist before calling createLine; skip if not present |

---

## Specification Gaps

1. **Config Seed Definition:** M-10.1 spec does not formally define Config Seed morpheme. Recommend addition to Codex specification v5.0 with property schema.

2. **Dimensional Encoding Format:** No specification of how dimensions are stored (content JSON vs. properties vs. child nodes). Recommend codifying before M-10.2.

3. **Per-Context Association:** M-10.1 §3 says "per-context lambda" but does not specify which contexts map to which lambda configs. threat-archive and remedy-archive are clear (Grids); model-performance and schema-definition need clarification (ecosystem? specific Blooms?).

4. **Definition Seed Requirement:** Unclear whether definition Seeds (`def:seed:config`) must exist. If yes, creation order matters (must bootstrap definitions before instances).

---

## Next Steps (for task author)

1. **Clarify storage strategy** for dimensional set (recommend Option C: JSON content).
2. **Confirm lambda property name** (`lambdaHalfLifeMs` vs. alternative).
3. **Verify definition Seeds exist or create them** in same script.
4. **Map lambda contexts to domains** (which Grid/Bloom does each lambda configure?).
5. **Write bootstrap script** following bootstrap-m10-intent.ts pattern.
6. **Execute verification queries** to confirm all five configs are present, queryable, and wired correctly.