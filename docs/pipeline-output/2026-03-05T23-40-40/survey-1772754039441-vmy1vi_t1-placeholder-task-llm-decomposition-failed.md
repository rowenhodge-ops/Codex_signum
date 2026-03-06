# Placeholder task — LLM decomposition failed

> Task ID: survey-1772754039441-vmy1vi_t1
> Model: claude-opus-4-6:adaptive:max
> Duration: 65830ms
> Output chars: 10659
> Timestamp: 2026-03-05T23:50:01.789Z

> **⚠️ Hallucination flags (23):**
> - [content/warning] Task survey-1772754039441-vmy1vi_t1 references "docs/specs/codex-signum-engineering-bridge-v2_0.md" but this file was not in its context
> - [content/warning] Task survey-1772754039441-vmy1vi_t1 references "docs/specs/codex-signum-v4_3-draft.md" but this file was not in its context
> - [content/warning] Task survey-1772754039441-vmy1vi_t1 references "src/computation/" but this file was not in its context
> - [content/warning] Task survey-1772754039441-vmy1vi_t1 references "src/computation/psi-h.ts" but this file was not in its context
> - [content/warning] Task survey-1772754039441-vmy1vi_t1 references "src/computation/epsilon-r.ts" but this file was not in its context
> - [content/warning] Task survey-1772754039441-vmy1vi_t1 references "src/patterns/" but this file was not in its context
> - [content/warning] Task survey-1772754039441-vmy1vi_t1 references "src/patterns/thompson-router/" but this file was not in its context
> - [content/warning] Task survey-1772754039441-vmy1vi_t1 references "scripts/bootstrap-task-executor.ts" but this file was not in its context
> - [content/warning] Task survey-1772754039441-vmy1vi_t1 references "CLAUDE.md" but this file was not in its context
> - [content/warning] Task survey-1772754039441-vmy1vi_t1 references "docs/specs/codex-signum-engineering-bridge-v2_1.md" but this file was not in its context
> - [content/warning] Task survey-1772754039441-vmy1vi_t1 references "src/pipeline/" but this file was not in its context
> - [content/warning] Task survey-1772754039441-vmy1vi_t1 references "src/computation/conditioning" but this file was not in its context
> - [content/warning] Task survey-1772754039441-vmy1vi_t1 references "src/computation/phi-l" but this file was not in its context
> - [content/warning] Task survey-1772754039441-vmy1vi_t1 references "src/computation/maturity" but this file was not in its context
> - [content/warning] Task survey-1772754039441-vmy1vi_t1 references "src/computation/node" but this file was not in its context
> - [content/warning] Task survey-1772754039441-vmy1vi_t1 references "src/computation/container" but this file was not in its context
> - [content/warning] Task survey-1772754039441-vmy1vi_t1 references "src/computation/graph" but this file was not in its context
> - [content/warning] Task survey-1772754039441-vmy1vi_t1 references "src/computation/psi-h" but this file was not in its context
> - [content/warning] Task survey-1772754039441-vmy1vi_t1 references "src/computation/state" but this file was not in its context
> - [content/warning] Task survey-1772754039441-vmy1vi_t1 references "src/events/" but this file was not in its context
> - [content/warning] Task survey-1772754039441-vmy1vi_t1 references "src/computation/recovery" but this file was not in its context
> - [content/warning] Task survey-1772754039441-vmy1vi_t1 references "src/computation/hysteresis" but this file was not in its context
> - [content/warning] Task survey-1772754039441-vmy1vi_t1 references a document ("docs/specs/05_codex-signum-engineering-bridge-v2_0.md") that was not in its context

---

# TaskGraph Decomposition — Engineering Bridge v2.1

## 1. Intent Analysis

The intent has **six explicit scope items** plus an implicit structural requirement (the document itself must be a coherent, publishable Markdown file). The work divides into three phases: **audit/read** (understanding current state), **author/write** (producing new content), and **integrate/verify** (assembling the document and validating it compiles).

Key dependencies:
- Scope items (1), (4), and (5) require reading source code before writing.
- Scope item (2) is a normative principle that constrains the output of (1), (4), and (5).
- Scope item (3) is largely standalone documentation of build experience.
- Scope item (6) is a trivial file edit gated on final document completion.

---

## 2. Structured TaskGraph

### Phase A — Survey & Audit (read-only, parallelizable)

| Task ID | Title | Reads | Produces | Dependencies |
|---------|-------|-------|----------|--------------|
| `A1` | **Audit Bridge v2.0 formulas** | `docs/specs/codex-signum-engineering-bridge-v2_0.md` | Inventory of every formula in v2.0 with section reference, variable names, and formula text. | — |
| `A2` | **Audit v4.3 spec formulas** | `docs/specs/codex-signum-v4_3-draft.md` | Canonical formula list from the spec: dampening, PhiL, PsiH, epsilon-R, maturity, axiom parameters (confirm 9 axioms), hub dampening. | — |
| `A3` | **Audit computation source — dampening** | `src/computation/` (all files referencing `gamma`, `dampening`, `budget`) | Actual implemented dampening formula. Confirm `min(gamma_base, s/k)` pattern, absence of `k-1` divisor. | — |
| `A4` | **Audit computation source — PsiH** | `src/computation/psi-h.ts` | Temporal decomposition internals: function signatures, layer structure, input/output types. | — |
| `A5` | **Audit computation source — epsilon-R** | `src/computation/epsilon-r.ts` | Spectral calibration internals: frequency bands, calibration constants, function signatures. | — |
| `A6` | **Audit vertical wiring — all 7 interface points** | `src/computation/`, `src/patterns/`, pipeline code | For each of the 7 interfaces: producer function, consumer function, data shape, glue status (present/missing), associated milestone. | — |
| `A7` | **Audit build experience artifacts** | `src/patterns/thompson-router/`, `scripts/bootstrap-task-executor.ts`, `CLAUDE.md`, M-9.VA logs/data | Thompson prior/posterior structure, hallucination detection layers, governance file format, convergence metrics. | — |

**Evidence required from A1–A2 cross-check (feeds B1):**
- Every v2.0 formula that disagrees with v4.3 or source code → tagged as `STALE`.
- Every v4.3 formula absent from v2.0 → tagged as `MISSING`.
- Axiom count discrepancy (10 → 9) confirmed with list of axioms.
- Hub dampening: confirm unified model in code vs. split model in v2.0.

---

### Phase B — Reconciliation & Content Authoring (sequential where noted)

| Task ID | Title | Inputs | Produces | Dependencies |
|---------|-------|--------|----------|--------------|
| `B1` | **Produce corrected formula table** | A1 + A2 + A3 | Section-by-section corrected formulas with diff annotations. Each formula annotated as "unchanged", "corrected", or "new". | A1, A2, A3 |
| `B2` | **Write Bridge View Principle section** | v4.3 spec (grammar + axiom definitions) | Normative text: definition, constraint statement ("every Bridge formula must be a pure function of grammar-defined morpheme states and axiom-defined parameters"), compliance checklist, counter-examples. | A2 |
| `B3` | **Write PsiH temporal decomposition section** | A4 | Technical documentation: decomposition layers, mathematical form, code-to-formula mapping, worked example. | A4 |
| `B4` | **Write epsilon-R spectral calibration section** | A5 | Technical documentation: spectral bands, calibration procedure, parameter table, code-to-formula mapping. | A5 |
| `B5` | **Write vertical wiring interface specification** | A6 | 7 interface-point subsections, each with: producer signature, consumer signature, data contract (TypeScript type), glue status, implementing milestone, sequence diagram fragment. | A6 |
| `B6` | **Write build experience section** | A7 | Narrative + technical documentation: Thompson routing (informed priors, context-blocked posteriors), three-layer hallucination detection (layer names, trigger conditions, mitigation actions), CLAUDE.md governance pattern, M-9.VA convergence data (table or chart description). | A7 |
| `B7` | **Validate every authored formula against Bridge View Principle** | B1, B2, B3, B4 | Compliance matrix: for each formula, list the morpheme states and axiom parameters it references. Flag any formula that references implementation-internal state not defined in grammar or axioms. | B1, B2, B3, B4 |

---

### Phase C — Assembly, Verification & Publication

| Task ID | Title | Inputs | Produces | Dependencies |
|---------|-------|--------|----------|--------------|
| `C1` | **Assemble Bridge v2.1 document** | B1–B7 | Single Markdown file at `docs/specs/codex-signum-engineering-bridge-v2_1.md` with front matter (title, version, date, supersedes notice), table of contents, all sections from Phase B in logical order. Clean UTF-8. | B1–B7 |
| `C2` | **Add supersession notice to v2.0** | C1 (confirms v2.1 exists) | Edit to `docs/specs/codex-signum-engineering-bridge-v2_0.md`: prepend deprecation/supersession notice pointing to v2.1, with date. | C1 |
| `C3` | **Verify TypeScript compilation** | C1, C2 | `npx tsc --noEmit` passes. (Document changes are Markdown-only, so this confirms no source files were inadvertently modified during audit.) | C1, C2 |

---

## 3. Dependency Graph (DAG)

```
A1 ──┐
A2 ──┼── B1 ──┐
A3 ──┘        │
              │
A2 ─── B2 ───┼── B7 ──┐
              │        │
A4 ─── B3 ───┘        │
                       │
A5 ─── B4 ────────────┤
                       │
A6 ─── B5 ────────────┼── C1 ── C2 ── C3
                       │
A7 ─── B6 ────────────┘
```

**Critical path:** A3 → B1 → B7 → C1 → C2 → C3 (longest chain due to formula correction depending on source audit, then Bridge View validation gating assembly).

**Maximum parallelism:** All 7 A-tasks can execute concurrently. B2–B6 can execute concurrently once their respective A-task completes. B7 must wait for B1–B4.

---

## 4. Stale Formula Corrections — Expected Findings

Based on the intent description, at minimum three corrections are known *a priori*:

| # | v2.0 (Stale) | v2.1 (Corrected) | Source of Truth |
|---|--------------|-------------------|-----------------|
| 1 | Dampening uses `γ / (k - 1)` divisor | Dampening uses `min(γ_base, s/k)` — budget-capped | `src/computation/` dampening module, v4.3 §dampening |
| 2 | References 10 axioms | 9 axioms (identify which was removed or merged) | v4.3 spec axiom enumeration |
| 3 | Hub dampening split into per-type formulas | Unified hub dampening formula | `src/computation/` hub dampening, v4.3 §hub-dampening |

Additional stale formulas are expected but cannot be enumerated without executing A1–A3. The audit tasks are specifically designed to surface them.

---

## 5. Vertical Wiring Interface Points — Enumeration

The 7 interface points to be documented in B5:

| # | Interface | Producer Side | Consumer Side | Expected Location |
|---|-----------|--------------|---------------|-------------------|
| 1 | Observation → Conditioning | Pipeline observation emitter | Conditioning input parser | `src/pipeline/` → `src/computation/conditioning` |
| 2 | Conditioning → PhiL | Conditioning output | PhiL input vector | `src/computation/conditioning` → `src/computation/phi-l` |
| 3 | PhiL → Maturity | PhiL score output | Maturity gate/threshold | `src/computation/phi-l` → `src/computation/maturity` |
| 4 | Node → Container | Node-level computation | Container aggregation | `src/computation/node` → `src/computation/container` |
| 5 | Graph → PsiH | Graph structure output | PsiH temporal input | `src/computation/graph` → `src/computation/psi-h` |
| 6 | State → Events | State dimension output | Event emission system | `src/computation/state` → `src/events/` |
| 7 | Recovery → Hysteresis | Recovery signal | Hysteresis state machine | `src/computation/recovery` → `src/computation/hysteresis` |

For each, B5 must document: **what function produces**, **what function consumes**, **what glue is missing**, **which milestone implements the connection**.

---

## 6. Bridge View Principle — Formalization

The principle to be codified in B2:

> **Bridge View Principle (Normative):** Every formula in the Engineering Bridge MUST be expressible as a pure function whose domain is limited to:
> 1. **Morpheme states** as defined by the Codex Signum grammar (v4.3 §Grammar), and
> 2. **Parameters** defined by the axiom system (v4.3 §Axioms, currently 9 axioms).
>
> No formula may reference implementation-internal variables (thread IDs, cache states, retry counters, etc.) unless those variables are themselves derived purely from morpheme states and axiom parameters via a documented transformation chain.

B7 validates compliance of all authored formulas against this principle.

---

## 7. Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Source files in `src/computation/` have diverged from v4.3 draft (spec is "draft") | Medium | A-tasks cross-reference both; discrepancies documented as spec-vs-implementation gaps, not silently resolved |
| M-9.VA convergence data is not machine-readable | Medium | B6 documents whatever format exists; recommends structured format for future runs |
| One or more of the 7 interface points has no code on one side yet | High | B5 explicitly documents "glue is missing" and which milestone fills the gap — this is expected and valuable |
| `npx tsc --noEmit` fails for reasons unrelated to Bridge work | Low | C3 is a no-regression check; failures are triaged, not fixed in this task |

---

## 8. Recommendation

**Execute this TaskGraph in three waves:**

1. **Wave 1 (A1–A7):** Pure survey. All tasks read-only. Can be fully parallelized. Output: 7 audit artifacts.
2. **Wave 2 (B1–B7):** Authoring. B1 requires A1+A2+A3. B2–B6 each require one A-task. B7 gates on B1–B4. Output: 7 authored sections + compliance matrix.
3. **Wave 3 (C1–C3):** Assembly and verification. Strictly sequential. Output: published v2.1 document, deprecated v2.0, green `tsc` check.

Each task should be scoped to produce a single artifact (Markdown section or structured data file) that the assembly task (C1) consumes. This keeps individual tasks small enough for reliable LLM execution and makes re-runs of individual tasks cheap.