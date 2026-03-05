# M-16.3: Assayer Types + Compliance Corpus + Morpheme Visual Enrichment

**Milestone:** M-16.3
**Agent:** 🏗️ Architect (corpus design) + 🔧 DevAgent (types + graph enrichment)
**Recommended model:** Opus for Task 0 design, Sonnet for Tasks 1–4
**Repo:** `Codex_signum` (core library)
**Branch:** `main` (no feature branch)
**Previous milestone:** M-9.7b complete (`e67656c`), HEAD on main
**Starting tests:** 1313 passed, 19 skipped, 79 files
**Starting exports:** 264
**Prerequisite:** M-16.1 (Ro review) — approved. v4.3 spec is canonical.

---

## SITUATION

**Canonical plan:** Read from the graph first:

```bash
eval "$(grep -E '^(NEO4J_URI|NEO4J_USER|NEO4J_PASSWORD)=' '../DND-Manager/.env' | tr -d '\r' | sed 's/^/export /')"
npx tsx -e "
import { getMilestoneOverview } from './src/graph/queries.js';
import { closeDriver } from './src/graph/index.js';
const ms = await getMilestoneOverview();
console.table(ms);
await closeDriver();
"
```

Fall back to `docs/roadmap/codex-signum-roadmap-v7.md` §M-16.3 if graph query fails.

**What this milestone does — three deliverables:**

1. **Assayer pattern type definitions** — TypeScript types for the structural validation pattern (ProposalType, StructuralClaim, ClaimValidation, ComplianceResult, PostFlightResult). Types and corpus only — full pipeline implementation is M-18.

2. **Compliance corpus** — Populate the Grid placeholder (`grid_compliance_corpus`) from M-9.7b with the canonical spec data. This is the Assayer's knowledge base: axioms, grammar rules, anti-patterns, eliminated entities — all as queryable graph data.

3. **Morpheme visual enrichment** — Add rendering properties to the 6 morpheme grammar reference Seeds from M-9.7a. The vis research (`codex-signum-visualisation-research.md` in project knowledge) defines what goes on each morpheme Seed. Runtime nodes follow INSTANTIATES → morpheme Seed → read rendering properties. No hardcoded rendering logic in consumers.

**Why these three together:** They're all "enrich the grammar reference with canonical spec data." The Assayer needs the corpus. The vis needs the rendering properties. Both read from the same grammar reference Seeds. Doing them together ensures the Seeds are enriched once, consistently.

**What already exists:**
- 6 morpheme Seeds in Neo4j (`morpheme:seed`, `morpheme:line`, etc.) with `name`, `description`, `specSource`, `implementationStatus` — from M-9.7a
- Compliance corpus Grid placeholder (`grid_compliance_corpus`) — from M-9.7b
- INSTANTIATES relationships from runtime nodes to morpheme Seeds — from M-9.7b
- Assayer pattern design doc — `docs/specs/09_codex-signum-assayer-pattern-design.md`
- Vis research — `codex-signum-visualisation-research.md` in project knowledge

---

## Hard Rules

1. **READ `CLAUDE.md` FIRST.**
2. **READ the v4.3 spec** — §The Six Morphemes, §Axioms, §Grammar, §State Dimensions for canonical definitions.
3. **READ the Assayer design doc** (`docs/specs/09_codex-signum-assayer-pattern-design.md`) — §Morpheme Composition, §Interface Shape, §VALIDATE, §Invocation Modes.
4. **READ the vis research** (`codex-signum-visualisation-research.md` in project knowledge) — §2 Morpheme Visual Identity, §2.1 Shape Language, §2.2 State Dimension Visual Encoding, §2.3 Colour System.
5. **Do NOT modify `src/computation/signals/`, `src/computation/`, or `src/memory/`.**
6. **Commit after each task.** One task = one commit + push.
7. **`npx tsc --noEmit` must pass before every commit.**
8. **`npm test` must show 0 failures before every commit.**
9. **Work directly on `main`.** No feature branch.
10. **All graph writes remain non-fatal.**
11. **READ the actual source before editing.** `grep` and `cat` first.
12. **Use existing patterns.** `bootstrap-grammar-reference.ts` and `bootstrap-morpheme-topology.ts` are the templates.
13. **This is types and corpus only.** Do NOT implement Assayer pipeline logic. That's M-18.
14. **Visual properties come from the vis research, not from guessing.** If the research doesn't specify a property, don't invent it.

---

## Task 0: Reconnaissance

```bash
# Read CLAUDE.md
cat CLAUDE.md

# Read Assayer design doc
cat docs/specs/09_codex-signum-assayer-pattern-design.md | head -200

# Read existing grammar reference bootstrap
cat scripts/bootstrap-grammar-reference.ts | head -60

# Check current morpheme Seed properties
grep -A 20 "morpheme:seed" scripts/bootstrap-grammar-reference.ts

# Check existing compliance Grid
grep -rn "grid_compliance_corpus\|compliance-corpus" scripts/ src/ tests/

# Check existing Assayer-related code
find src/patterns -name "assayer*" -o -name "Assayer*"
ls src/patterns/

# Check barrel exports for patterns
cat src/patterns/architect/index.ts | head -20
```

No commit. This is reconnaissance.

---

## Task 1: Assayer Pattern Type Definitions

**Goal:** Create the TypeScript types for the Assayer pattern. Types only — no implementation.

### Step 1.1: Create type definitions

Create `src/patterns/assayer/types.ts`:

```typescript
/**
 * Codex Signum — Assayer Pattern Types
 *
 * Structural validation pattern: 4 stages (CLASSIFY → DECOMPOSE → VALIDATE → SYNTHESISE),
 * 4 invocation modes (advisory, gate, post-flight, historical).
 *
 * Types only — full pipeline implementation is M-18.
 * Design: docs/specs/09_codex-signum-assayer-pattern-design.md
 *
 * @module codex-signum-core/patterns/assayer
 */

// Read the Assayer design doc for the full type definitions.
// Extract these types from the doc's TypeScript snippets:

/** What kind of proposal is being assessed */
export type ProposalType =
  | "code_change"        // Diff-based
  | "spec_edit"          // Specification modification
  | "architecture_decision"  // ADR or structural decision
  | "process_change"     // Workflow modification
  | "prompt_template"    // Agent prompt changes

/** How the Assayer was invoked — determines response behaviour */
export type InvocationMode =
  | "advisory"    // Architect SURVEY/DECOMPOSE/ADAPT — warnings, not gates
  | "gate"        // DevAgent REVIEW→VALIDATE boundary — blocks on violation
  | "post_flight" // Retrospective — historical compliance check
  | "historical"  // Batch analysis of past decisions

/** A single structural claim extracted from a proposal */
export interface StructuralClaim {
  claimId: string;
  description: string;
  claimType:
    | "entity_introduction"
    | "flow_establishment"
    | "boundary_modification"
    | "construct_replacement"
    | "concept_declaration";
  affectedMorphemes: string[];
  affectedAxioms: string[];
  evidence: string;
}

/** Dependency between claims within a proposal */
export interface ClaimDependency {
  from: string;  // claimId
  to: string;    // claimId
  relationship: "enables" | "conflicts_with" | "modifies_same_scope";
}

/** Per-axiom validation result */
export interface AxiomResult {
  axiom: string;       // "A1" through "A9"
  axiomName: string;
  satisfied: boolean;
  evidence: string;
  confidence: number;  // 0.0–1.0
}

/** Anti-pattern match result */
export interface AntiPatternMatch {
  antiPattern: string;
  matchConfidence: number;   // 0.0–1.0
  evidence: string;
  structuralSimilarity: number;
}

/** Per-claim validation result */
export interface ClaimValidation {
  claimId: string;
  grammarExpressible: boolean;
  grammarMapping: string | null;
  grammarIssues: Array<{
    rule: string;
    description: string;
    severity: "minor" | "major" | "critical";
  }>;
  axiomResults: AxiomResult[];
  antiPatternMatches: AntiPatternMatch[];
  overallSeverity: "clear" | "minor" | "major" | "critical";
  correctionPossible: boolean;
  correctionSuggestion: string | null;
}

/** Full compliance assessment output */
export interface ComplianceResult {
  proposalId: string;
  proposalType: ProposalType;
  invocationMode: InvocationMode;
  claims: StructuralClaim[];
  validations: ClaimValidation[];
  compoundEffects: Array<{
    description: string;
    interactingClaims: string[];
    severity: "minor" | "major" | "critical";
  }>;
  overallVerdict: "compliant" | "minor_issues" | "major_issues" | "non_compliant";
  confidence: number;
  processingTimeMs: number;
}

/** Post-flight analysis result (Retrospective mode) */
export interface PostFlightResult extends ComplianceResult {
  runId: string;
  retrospectiveInsights: Array<{
    pattern: string;
    frequency: number;
    recommendation: string;
  }>;
}
```

### Step 1.2: Create barrel export

Create `src/patterns/assayer/index.ts`:
```typescript
export * from "./types.js";
```

### Step 1.3: Update parent barrel exports

Update `src/index.ts` to export from `src/patterns/assayer/index.js`.

### Step 1.4: Tests

Add `tests/conformance/assayer-types.test.ts`:
- All types importable from barrel
- ComplianceResult has required fields (type shape tests)
- ProposalType union has all expected members
- InvocationMode union has all expected members

**Commit:** `feat(assayer): M-16.3.1 Assayer pattern type definitions`

---

## Task 2: Morpheme Visual Enrichment

**Goal:** Add rendering properties to the 6 morpheme grammar reference Seeds, sourced from the vis research document.

### Step 2.1: Read the vis research

The vis research (`codex-signum-visualisation-research.md` in project knowledge) defines rendering properties in §2.1 (Shape Language) and §2.2 (State Dimension Visual Encoding). Read it carefully.

### Step 2.2: Update the grammar reference bootstrap

Modify `scripts/bootstrap-grammar-reference.ts` to add visual properties to each morpheme Seed.

**Properties to add per morpheme Seed (from vis research §2.1):**

```typescript
interface MorphemeVisualProps {
  // Shape (§2.1 Shape Language)
  baseShape: string;           // "circle", "directed-edge", "circle-boundary", "triangle", "square", "spiral"
  rendering: string;           // Rendering description from the research
  minSizePx: number;           // Ecosystem-level minimum
  detailThresholdPx: number;   // When labels/detail appear

  // State encoding (§2.2)
  phiL_encoding: string;       // How ΦL maps to visual properties for this morpheme
  psiH_encoding: string;       // How ΨH manifests on this morpheme
  epsilonR_encoding: string;   // How εR manifests on this morpheme

  // Colour (§2.3)
  defaultHue: string;          // Default hue category (may vary by domain)
}
```

**Data for each morpheme (from vis research §2.1 table):**

| Morpheme | baseShape | rendering | minSizePx | detailThresholdPx |
|----------|-----------|-----------|-----------|-------------------|
| Seed (•) | circle | Filled circle with radial gradient glow. Brightness = ΦL. | 4 | 20 |
| Line (→) | directed-edge | Bézier curve with animated particles. Speed = urgency, brightness = volume. | 1 | 3 |
| Bloom (○) | circle-boundary | Dashed or petal-segment circle. Open C-shape or closed. Translucent fill. | 20 | 60 |
| Resonator (Δ) | triangle | Filled triangle. Δ up = output. ∇ down = input. Pulse rate = activity. | 8 | 24 |
| Grid (□) | square | Square with internal grid texture. Solid border = sealed. | 12 | 30 |
| Helix (🌀) | spiral | Multi-strand spiral. Tight = Correction, medium = Learning, wide = Evolutionary. | 12 | 30 |

**State encoding per morpheme (from vis research §2.2):**

All morphemes share the same state encoding scheme:
- ΦL: brightness (lightness channel) + glow intensity + saturation (stability) + pulsation rate (activity)
- ΨH: synchronised pulsation between resonant elements, colour temperature clash for strained, interference pattern for dissonant
- εR: shimmer/micro-movement (rigid=still, stable=faint shimmer, adaptive=breathing, unstable=flickering)

These are properties on the morpheme Seed — the renderer follows INSTANTIATES → reads them → applies them.

### Step 2.3: Run the updated bootstrap

```bash
eval "$(grep -E '^(NEO4J_URI|NEO4J_USER|NEO4J_PASSWORD)=' '../DND-Manager/.env' | tr -d '\r' | sed 's/^/export /')"
npx tsx scripts/bootstrap-grammar-reference.ts
```

### Step 2.4: Verify

```bash
# Morpheme Seeds now have visual properties
MATCH (s:Seed {seedType: "morpheme"})
RETURN s.id, s.baseShape, s.minSizePx, s.detailThresholdPx
ORDER BY s.id
```

### Step 2.5: Tests

Add to `tests/graph/grammar-reference.test.ts`:
- All 6 morpheme Seeds have `baseShape` property
- All 6 morpheme Seeds have `minSizePx` and `detailThresholdPx`
- All 6 morpheme Seeds have `phiL_encoding`, `psiH_encoding`, `epsilonR_encoding`
- Values match vis research (spot-check: Seed.minSizePx === 4, Bloom.detailThresholdPx === 60)

**Commit:** `feat(graph): M-16.3.2 morpheme visual enrichment — rendering properties on grammar Seeds`

---

## Task 3: Compliance Corpus Population

**Goal:** Populate the compliance corpus Grid (`grid_compliance_corpus`) with canonical spec data that the Assayer can query at runtime.

### Step 3.1: Design the corpus structure

The compliance corpus is a Grid containing reference data the Assayer uses for VALIDATE. It mirrors the grammar reference Seeds (M-9.7a) but adds validation-specific properties:

**Corpus content (as Seeds contained in the Grid):**

```typescript
// Already exist as grammar reference Seeds — link them, don't duplicate
// The corpus Grid CONTAINS the grammar element Seeds that are validation-relevant

// What the corpus adds beyond the grammar reference:
// 1. ELIMINATED_ENTITIES as Seeds with violation signatures
// 2. Bridge View Principle as a compliance rule
// 3. Anti-pattern detection signatures (enriching existing anti-pattern Seeds)
```

### Step 3.2: Create or extend bootstrap

Either extend `bootstrap-grammar-reference.ts` or create `scripts/bootstrap-compliance-corpus.ts`.

The script should:

1. **Link existing grammar Seeds to the corpus Grid** — Create CONTAINS relationships from `grid_compliance_corpus` to the axiom, grammar-rule, and anti-pattern Seeds. Don't duplicate the Seeds.

2. **Add ELIMINATED_ENTITIES as Seeds:**

```typescript
const ELIMINATED_ENTITIES = [
  { id: "eliminated:observer", name: "Observer", deletedIn: "ce0ef96", reason: "Shadow system anti-pattern" },
  { id: "eliminated:model-sentinel", name: "Model Sentinel", deletedIn: "M-8C", reason: "Monitoring overlay" },
  { id: "eliminated:signal-pipeline-entity", name: "Signal Pipeline (as entity)", reason: "Not a separate entity — inline computation" },
  { id: "eliminated:health-computation-entity", name: "Health Computation (as entity)", reason: "Not a separate entity — inline on write" },
  { id: "eliminated:symbiosis-axiom", name: "Symbiosis (Axiom)", reason: "Absorbed into A2 + A9 at v4.0" },
];
```

3. **Add Bridge View Principle** as a compliance rule Seed:

```typescript
{
  id: "rule:bridge-view-principle",
  seedType: "compliance-rule",
  name: "Bridge View Principle",
  description: "Every Engineering Bridge formula MUST be expressible as a pure function of grammar-defined morpheme states and axiom-defined parameters.",
  specSource: "M-8A t15 analysis, M-17.2",
  status: "canonical"
}
```

4. **Enrich anti-pattern Seeds with detection signatures** — Add `detectionHeuristic` property to existing anti-pattern Seeds (from Assayer design doc §VALIDATE Layer 3).

5. **Update corpus Grid status** from `placeholder` to `populated`, set `specVersion: "v4.3"`.

### Step 3.3: Verify

```bash
# Corpus Grid is populated
MATCH (g:Grid {id: "grid_compliance_corpus"})
RETURN g.status, g.specVersion

# Corpus contains grammar elements
MATCH (g:Grid {id: "grid_compliance_corpus"})-[:CONTAINS]->(s)
RETURN labels(s), count(s)

# Eliminated entities exist
MATCH (s:Seed {seedType: "eliminated-entity"})
RETURN s.id, s.name

# Bridge View Principle exists
MATCH (s:Seed {id: "rule:bridge-view-principle"})
RETURN s.name, s.description
```

### Step 3.4: Tests

Add `tests/graph/compliance-corpus.test.ts`:
- Corpus Grid has `status: "populated"` and `specVersion: "v4.3"`
- Corpus CONTAINS axiom Seeds (9)
- Corpus CONTAINS grammar-rule Seeds (5)
- Corpus CONTAINS anti-pattern Seeds (12)
- Eliminated entities exist as Seeds (5)
- Bridge View Principle Seed exists
- Anti-pattern Seeds have `detectionHeuristic` property
- Idempotency

**Commit:** `feat(graph): M-16.3.3 compliance corpus populated — Grid contains canonical spec data`

---

## Task 4: Final Gate

### Step 4.1: Full verification

```bash
npx tsc --noEmit
npm test 2>&1 | tail -20
npm run test:future 2>&1 | tail -10
```

### Step 4.2: Verify exit criteria

```bash
# Assayer types importable
node -e "const a = require('./dist'); console.log(typeof a.ProposalType === 'undefined' ? 'MISSING' : 'NOT EXPECTED - types not runtime');"
# Types are TypeScript-only, so check dist/*.d.ts:
grep "ProposalType\|ComplianceResult\|StructuralClaim" dist/patterns/assayer/types.d.ts

# Morpheme visual properties
MATCH (s:Seed {seedType: "morpheme"}) RETURN s.id, s.baseShape, s.minSizePx

# Corpus populated
MATCH (g:Grid {id: "grid_compliance_corpus"}) RETURN g.status, g.specVersion

# Eliminated entities
MATCH (s:Seed {seedType: "eliminated-entity"}) RETURN count(s)

# Export count
node -e "const c = require('./dist'); console.log(Object.keys(c).length, 'exports')"
```

### Step 4.3: Completion report

Create `docs/milestones/m16-3-completion.md` with:
- Assayer types created (file list, type count)
- Morpheme visual properties added (6 Seeds enriched)
- Corpus populated (element counts by type)
- Eliminated entities added
- Bridge View Principle recorded
- Test counts and export counts
- Commit list
- Note: "pending governance gate"

### Step 4.4: Push

```bash
git add -A && git commit -m "docs(M-16.3): completion report"
git push
```

---

## Exit Criteria

- [ ] `npx tsc --noEmit` clean
- [ ] All in-scope tests pass (0 failures)
- [ ] `src/patterns/assayer/types.ts` exists with all types from Assayer design doc
- [ ] Assayer types exported via barrel
- [ ] 6 morpheme Seeds enriched with visual properties (baseShape, minSizePx, detailThresholdPx, encoding properties)
- [ ] Visual properties sourced from vis research, not invented
- [ ] Compliance corpus Grid status = "populated", specVersion = "v4.3"
- [ ] Corpus CONTAINS axiom, grammar-rule, and anti-pattern Seeds
- [ ] 5 eliminated entity Seeds created
- [ ] Bridge View Principle compliance rule Seed created
- [ ] Anti-pattern Seeds enriched with detection heuristics
- [ ] Bootstrap scripts idempotent (MERGE not CREATE)
- [ ] Barrel exports updated
- [ ] All commits on `main`, pushed
- [ ] Completion report in `docs/milestones/`

---

## What This Enables

After M-16.3:
- **M-18 (Assayer implementation)** has type definitions to implement against.
- **M-13 (UI)** renderer follows INSTANTIATES → morpheme Seed → reads `baseShape`, `minSizePx`, `detailThresholdPx`, encoding properties. No hardcoded rendering rules.
- **Compliance checking** has a queryable corpus: "Which axioms does this anti-pattern violate?" is a Cypher query through the corpus Grid.
- **Hallucination detection** can be enriched with eliminated entity data from the corpus (future work).
- **The grammar reference is now a full rendering spec**, not just a structural inventory.

---

## Anti-Pattern Watchlist

| Anti-Pattern | What It Looks Like | Mitigation |
|---|---|---|
| Implementing Assayer pipeline | "Let me add the CLASSIFY stage logic" | Types only. Pipeline logic is M-18. |
| Inventing visual properties | "I think Resonators should be purple" | Properties come from the vis research document. If it's not in the research, don't add it. |
| Duplicating grammar Seeds | "Let me create compliance-specific copies of axioms" | CONTAINS relationship from corpus Grid to existing Seeds. Don't duplicate nodes. |
| Shadow system | "Let me create a compliance database" | The corpus IS the Grid in the graph. Cypher queries are the interface. |
| Scope creep into M-16.2/M-16.4 | "Let me also update CLAUDE.md axiom counts" | That's M-16.4. This task creates types, enriches Seeds, and populates the corpus. |

---

## Milestone Bloom Update Policy

**Do NOT update the M-16.3 milestone Bloom.** Leave it at its current status. Note "pending governance gate" in the completion report.

The bloom is updated only after:
1. Ro copies the DevAgent completion output to the session architect (Claude)
2. Claude checks repo state (commits, diffs) against this prompt seed
3. Claude checks for divergence from intent
4. Only if clean: the session architect stamps the bloom

The agent does not stamp blooms.
