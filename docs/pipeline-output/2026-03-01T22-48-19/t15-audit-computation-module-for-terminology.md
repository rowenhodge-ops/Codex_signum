# Audit computation module for terminology

> Task ID: t15
> Model: claude-opus-4-6:adaptive:low
> Duration: 162855ms
> Output chars: 15552
> Timestamp: 2026-03-01T23:08:07.112Z

> **⚠️ Hallucination flags (1):**
> - [content/warning] References eliminated entity "getPattern"

---

# Audit Report: Computation Module Morpheme Terminology (t15)

## Executive Summary

The `src/computation/` module is in a **mixed state**. The mathematical computations themselves are correct and spec-aligned, but the _framing_ around them — imports, parameter names, variable names, JSDoc, and hierarchy descriptions — retains pre-refactor "Pattern" terminology in multiple files. The most critical finding is that `hierarchical-health.ts` imports graph query functions using pre-refactor names (`getPatternAdjacency`, `getPatternsWithHealth`), which either rely on undocumented backward-compatibility aliases or represent broken imports against the already-migrated graph/queries module (confirmed clean by t6). No `Agent` terminology was found anywhere in the module.

| File | Status | Finding Count |
|------|--------|---------------|
| `aggregation.ts` | ⚠️ Minor | 1 (comment: hybrid hierarchy description) |
| `hierarchical-health.ts` | 🔴 Significant | 6+ (imports, variables, comments all use Pattern) |
| `epsilon-r.ts` | ⚠️ Moderate | 4 (parameter name, comments, string literals) |
| `phi-l.ts` | ⚠️ Minor | 1 (comment table uses "pattern" descriptor) |
| `psi-h.ts` | ⚠️ Minor | 1 (JSDoc uses "pattern graph") |

---

## Methodology

1. Scanned all five computation files for pre-refactor terms: `Agent`, `Pattern`, `Model`, `observer`, `patternId`, `agentId`
2. Cross-referenced imports against t6 graph queries audit (confirmed `queries.ts` uses Bloom-native naming)
3. Verified formula implementations against Engineering Bridge §Part 2 for spec correctness
4. Checked that ΦL, ΨH, and εR computations reference correct entity types at their boundaries
5. Evaluated comment-level and code-level terminology separately

---

## Finding 1 — CRITICAL: `hierarchical-health.ts` Imports Pre-Refactor Function Names

**Severity: High (either broken import or undocumented alias dependency)**

```typescript
// hierarchical-health.ts, lines 22-28
import {
  getContainedChildren,
  getContainersBottomUp,
  getPatternAdjacency,      // ← Pre-refactor name
  getPatternsWithHealth,     // ← Pre-refactor name
  getSubgraphEdges,
} from "../graph/queries.js";
```

The t6 audit confirmed that `src/graph/queries.ts` exports functions named `getBloomAdjacency` and `getBlomsWithHealth` (using post-refactor Bloom terminology). These imports reference the **old** function names.

**Two possible runtime scenarios:**

| Scenario | Implication |
|----------|-------------|
| `queries.ts` exports backward-compat aliases | Functional but propagates pre-refactor names into computation module |
| `queries.ts` does NOT export old names | **Compile-time failure** — this module is broken |

Either way, the imports must be updated to canonical names:

| Current Import | Expected Import |
|----------------|-----------------|
| `getPatternAdjacency` | `getBloomAdjacency` |
| `getPatternsWithHealth` | `getBlomsWithHealth` |

**Impact:** This is the entry point for all hierarchical health computation. Every call path through `computeHierarchicalHealth()` and `computeSystemHealth()` flows through these imports.

---

## Finding 2 — `hierarchical-health.ts` Uses `patterns` Variable Name Throughout

**Severity: Medium (missed rename, multiple occurrences)**

The variable name `patterns` appears in both exported functions, carrying pre-refactor terminology through the entire computation flow:

| Location | Code | Expected |
|----------|------|----------|
| Line ~47 | `const patterns = await getPatternsWithHealth();` | `const blooms = await getBlomsWithHealth();` |
| Line ~48 | `for (const p of patterns) {` | `for (const b of blooms) {` |
| Line ~100 | `const patterns = await getPatternsWithHealth();` | `const blooms = await getBlomsWithHealth();` |
| Line ~105 | `const children: ChildHealth[] = patterns.map((p) => ({` | `blooms.map(...)` |
| Line ~112 | `nodeHealths: patterns.map((p) => ({ id: p.id, phiL: p.phiL })),` | `blooms.map(...)` |

---

## Finding 3 — `hierarchical-health.ts` Comments Use "Pattern" Terminology

**Severity: Low-Medium (documentation drift)**

| Line | Current | Expected |
|------|---------|----------|
| ~48 | `// Step 1: Get all leaf-level health (patterns with stored ΦL)` | `(blooms with stored ΦL)` |
| ~93 | `Aggregates ALL active patterns into a single system health score.` | `ALL active blooms` |
| ~107 | `// Build children from all active patterns (equal weight)` | `all active blooms` |

---

## Finding 4 — `aggregation.ts` Hierarchy Description Lists Both "Pattern" and "Bloom"

**Severity: Medium (hybrid state in module documentation)**

```typescript
// aggregation.ts, line 8
 * Node → Pattern → Bloom → System. Each level aggregates from constituents.
```

This describes a four-level hierarchy where both "Pattern" and "Bloom" appear as distinct levels. Post-refactor, Pattern and Bloom are the **same concept** (Pattern was renamed to Bloom). This is a clear hybrid state where the author appears to have added "Bloom" without removing "Pattern."

**Expected hierarchy description:** `Node → Bloom → System` (or `Leaf → Bloom (inner) → Bloom (outer) → System` if describing fractal nesting)

**Spec reference:** codex-signum-v3.0.md §Blooms fractal describes Bloom containment as fractal — Blooms contain other Blooms. There is no separate "Pattern" level.

---

## Finding 5 — `epsilon-r.ts` Parameter and Comment Terminology

**Severity: Medium (parameter name is public API surface)**

The `checkEpsilonRWarnings` function uses pre-refactor terminology in its parameter name and throughout its body:

| Location | Current | Expected |
|----------|---------|----------|
| Parameter (line ~111) | `isPatternActive: boolean` | `isBloomActive: boolean` |
| Condition (line ~117) | `epsilonR.value === 0 && isPatternActive` | `&& isBloomActive` |
| String literal (line ~120) | `"εR is exactly 0 on active pattern."` | `"on active bloom."` |

**Comment occurrences:**

| Location | Current | Expected |
|----------|---------|----------|
| Header (line ~10) | `εR must never be exactly 0 for active patterns.` | `for active blooms.` |
| Line ~50 | `// Enforce floor — εR must never be exactly 0 for active patterns` | `for active blooms` |
| JSDoc (line ~105-107) | `εR = 0 with active pattern → Constitutional violation` | `active bloom` |
| JSDoc (line ~107) | `High ΦL + low εR → Over-optimization` | ✅ Neutral |

**Spec alignment note:** The εR floor principle ("never zero for active entities") is correctly implemented regardless of naming. The formula and thresholds are spec-compliant. Only the framing language needs updating.

---

## Finding 6 — `phi-l.ts` Window Size Comment Uses "pattern"

**Severity: Low (documentation only, no code impact)**

```typescript
// phi-l.ts, lines ~35-40
 * | Node type              | Window size N |
 * | Leaf / function        | 10–20         |
 * | Intermediate / pattern | 30–50         |   // ← "pattern" here
 * | Root / coordinator     | 50–100        |
```

The `PHI_L_WINDOW_SIZES` constant keys themselves use neutral terminology (`leaf`, `intermediate`, `root`) which is correct. Only the descriptive comment uses "pattern" as a label for the intermediate level.

**Expected:** `Intermediate / bloom` to align with the containment hierarchy where Blooms are the intermediate containers.

---

## Finding 7 — `psi-h.ts` JSDoc Uses "pattern graph"

**Severity: Low (documentation only)**

```typescript
// psi-h.ts, line ~49
 * @param edges — Adjacency list of the pattern graph
```

Should be "bloom graph" or simply "graph" since the ΨH computation is entity-agnostic at the mathematical level.

---

## Formula and Spec Alignment Verification

### ΦL Computation (`phi-l.ts`) — ✅ SPEC COMPLIANT

| Spec Requirement | Implementation | Status |
|-----------------|----------------|--------|
| `raw = Σ(wᵢ × fᵢ)` | `computeRawPhiL()` weighted sum of 4 factors | ✅ Correct |
| `maturityFactor = (1 - e^(-0.05 × obs)) × (1 - e^(-0.5 × conn))` | Delegated to `computeMaturityFactor()` | ✅ Correct (delegated) |
| `effective = raw × maturityFactor` | Line ~79: `const effective = raw * maturityFactor` | ✅ Correct |
| Weights sum to 1.0 | `validateWeights()` enforces | ✅ Correct |
| Trend band ±0.02 | `computeTrend()` uses 0.02 threshold | ✅ Correct |

No entity type confusion in formula implementation. The formulas operate on numeric factors, not on entity references.

### ΨH Computation (`psi-h.ts`) — ✅ SPEC COMPLIANT

| Spec Requirement | Implementation | Status |
|-----------------|----------------|--------|
| λ₂ = Fiedler eigenvalue of graph Laplacian | `computeFiedlerEigenvalue()` via Jacobi eigenvalue algorithm | ✅ Correct |
| TV_G = (1/\|E\|) × Σ \|f(i) - f(j)\| | `computeGraphTotalVariation()` | ✅ Correct |
| Combined = 0.4 × normalize(λ₂) + 0.6 × (1 - friction) | Uses `PSI_H_WEIGHTS.structural` (0.4) and `.runtime` (0.6) | ✅ Correct |
| EWMA decomposition (transient/durable) | `decomposePsiH()` with configurable α | ✅ Correct |

The ΨH computation correctly takes `GraphEdge[]` and `NodeHealth[]` as inputs — these are entity-agnostic types defined locally, not referencing Seed/Bloom/Pattern directly. **Clean by design.**

### εR Computation (`epsilon-r.ts`) — ✅ SPEC COMPLIANT (formulas correct, naming issues only)

| Spec Requirement | Implementation | Status |
|-----------------|----------------|--------|
| εR = exploratory / total | `computeEpsilonR()` | ✅ Correct |
| Floor enforcement | `Math.max(value, floor)` | ✅ Correct |
| Spectral calibration table | `minEpsilonRForSpectralState()` matches Engineering Bridge §Part 2 | ✅ Correct |
| Floor = max(gradient-based, spectral, 0.01) | `computeEpsilonRFloor()` | ✅ Correct |

### Aggregation (`aggregation.ts`) — ✅ SPEC COMPLIANT

| Spec Requirement | Implementation | Status |
|-----------------|----------------|--------|
| ΦL at container = weighted mean of children | `weightedMean()` on `phiL_effective` values | ✅ Correct |
| ΨH at container = computed from OWN subgraph | `computePsiH(subgraph.edges, subgraph.nodeHealths)` | ✅ Correct |
| εR at container = weighted mean of children | `weightedMean()` on `epsilonR_value` values | ✅ Correct |
| ΨH fallback to weighted mean if no subgraph | Graceful degradation implemented | ✅ Correct |

---

## Verification Command Prediction

```bash
grep -rE '(Agent|Pattern)' src/computation/
```

**Expected output (non-empty — module is NOT clean):**

```
src/computation/aggregation.ts: * Node → Pattern → Bloom → System.
src/computation/hierarchical-health.ts:  getPatternAdjacency,
src/computation/hierarchical-health.ts:  getPatternsWithHealth,
src/computation/hierarchical-health.ts:  const patterns = await getPatternsWithHealth();
src/computation/hierarchical-health.ts:  for (const p of patterns) {
src/computation/hierarchical-health.ts:  const patterns = await getPatternsWithHealth();
src/computation/hierarchical-health.ts:  const children: ChildHealth[] = patterns.map((p) => ({
src/computation/epsilon-r.ts:  isPatternActive: boolean,
```

**Additional hits with case-insensitive grep** (`grep -riE '(agent|pattern)'`):

```
src/computation/epsilon-r.ts: * Key principle: εR must never be exactly 0 for active patterns.
src/computation/epsilon-r.ts:  // Enforce floor — εR must never be exactly 0 for active patterns
src/computation/epsilon-r.ts: * - εR = 0 with active pattern → Constitutional violation
src/computation/epsilon-r.ts:  "εR is exactly 0 on active pattern. Constitutional violation (Axiom 5).",
src/computation/phi-l.ts: * | Intermediate / pattern | 30–50         |
src/computation/psi-h.ts: * @param edges — Adjacency list of the pattern graph
```

---

## Acceptance Criteria Assessment

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Health calculations use Bloom references | ❌ **FAIL** | `hierarchical-health.ts` uses Pattern-named imports and variables; `epsilon-r.ts` uses `isPatternActive` parameter |
| Aggregation uses morpheme types | ⚠️ **PARTIAL** | `aggregation.ts` core code is entity-agnostic (✅), but header describes hybrid "Pattern → Bloom" hierarchy (❌) |
| No old terminology in computations | ❌ **FAIL** | 15+ occurrences of "Pattern"/"pattern" across module |
| Spec formulas reference correct entities | ✅ **PASS** | All mathematical formulas are correctly implemented and entity-agnostic at the computation level |

---

## Cross-Reference with Prior Audit Findings

| Prior Finding | Relevance to Computation Module |
|---------------|-------------------------------|
| t6: queries.ts uses `getBloomAdjacency` / `getBlomsWithHealth` | **Directly contradicts** hierarchical-health.ts imports of `getPatternAdjacency` / `getPatternsWithHealth` — confirms Finding 1 |
| t10: architect `survey.ts` has same hybrid (queries Bloom, stores in patternHealth) | Same pattern here — hierarchical-health.ts calls Pattern-named imports but the underlying queries use Bloom labels |
| t14: memory module hybrid state (old names in, new names out) | Computation module shows **inverse** hybrid: calls old-named functions that internally use new-named queries |
| t5: ThresholdEvent.patternId not migrated | Not directly relevant to computation module (no ThresholdEvent references) |

---

## Consolidated Findings Summary

| # | File | Type | Current | Expected | Severity |
|---|------|------|---------|----------|----------|
| 1 | hierarchical-health.ts | Import | `getPatternAdjacency` | `getBloomAdjacency` | 🔴 High |
| 1 | hierarchical-health.ts | Import | `getPatternsWithHealth` | `getBlomsWithHealth` | 🔴 High |
| 2 | hierarchical-health.ts | Variable | `patterns` (×5) | `blooms` | ⚠️ Medium |
| 3 | hierarchical-health.ts | Comment | "patterns with stored ΦL" (×3) | "blooms with stored ΦL" | ⚠️ Low-Med |
| 4 | aggregation.ts | Comment | "Node → Pattern → Bloom → System" | "Node → Bloom → System" | ⚠️ Medium |
| 5a | epsilon-r.ts | Parameter | `isPatternActive` | `isBloomActive` | ⚠️ Medium |
| 5b | epsilon-r.ts | String literal | "active pattern" (×2) | "active bloom" | ⚠️ Medium |
| 5c | epsilon-r.ts | Comment | "active patterns" (×3) | "active blooms" | ⚠️ Low |
| 6 | phi-l.ts | Comment | "Intermediate / pattern" | "Intermediate / bloom" | ⚠️ Low |
| 7 | psi-h.ts | JSDoc | "pattern graph" | "bloom graph" or "graph" | ⚠️ Low |

---

## Recommendations

### Priority 1 — Fix Broken/Aliased Imports (Finding 1)

Update `hierarchical-health.ts` imports to use canonical post-refactor function names from `graph/queries.ts`. If `queries.ts` currently exports backward-compat aliases for the old names, those aliases should be marked `@deprecated` and the computation module should not depend on them.

### Priority 2 — Rename Public Parameter (Finding 5a)

`checkEpsilonRWarnings(epsilonR, phiLEffective, isPatternActive)` is a public function. The parameter `isPatternActive` should become `isBloomActive`. If external consumers reference this parameter by name, add a backward-compat overload or document the change.

### Priority 3 — Variable and Comment Cleanup (Findings 2, 3, 4, 5b-c, 6, 7)

Batch rename of `patterns` → `blooms` variables and updating of documentation strings. These are lower risk but create confusion for anyone reading the computation module alongside the already-migrated graph module.

### Priority 4 — Backward-Compatibility Consideration

If `checkEpsilonRWarnings` is consumed externally with named parameter destructuring (unlikely in TypeScript but possible in documentation/tests), consider a transition period where both parameter names are accepted via an options object pattern.