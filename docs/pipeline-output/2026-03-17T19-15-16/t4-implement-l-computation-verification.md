# Implement ΦL computation verification

> Task ID: t4
> Model: claude-opus-4-6:adaptive:medium
> Duration: 53343ms
> Output chars: 7448
> Timestamp: 2026-03-17T19:18:39.081Z

---

# Analysis: ΦL Computation Verification (t4)

## 1. Problem Statement

The M-22 vertical wiring test suite (`tests/pipeline/m22-vertical-wiring.test.ts`) does not currently exist. Task t4 requires adding a test case within this suite that verifies **ΦL (health) computation** — specifically that:

1. Leaf-node ΦL values are correctly derived from conditioned signals.
2. Parent-node ΦL values are correctly aggregated from their children's ΦL values.
3. Hierarchical propagation flows bottom-up without loss or distortion.

## 2. Dependency Analysis

### 2.1 Upstream Dependencies

| Dependency | Status | Impact |
|---|---|---|
| **Test file existence** | NOT FOUND | The file must be created (likely by t3 or a scaffolding task) before t4 can add its case. |
| **t3 — Signal Conditioning verification** | Output is empty/minimal | ΦL computation consumes conditioned signals as input. If signal conditioning isn't verified first, ΦL tests may fail for upstream reasons. The test design must either (a) depend on the same pipeline fixture that t3 uses, or (b) independently mock conditioned signals. |
| **Pipeline execution fixture** | Unknown | A shared `beforeAll` / `beforeEach` block is expected to run the M-22 pipeline on a known hierarchy before any assertions fire. |

### 2.2 Domain Model Requirements

To write meaningful assertions, the test must have access to:

- **A node hierarchy** — at minimum a two-level tree (parent → N children) so both leaf and aggregation behavior are testable. A three-level tree (root → intermediate → leaves) is preferable for verifying recursive propagation.
- **Conditioned signal values** — deterministic inputs whose expected ΦL outputs can be hand-calculated.
- **The ΦL computation function/module** — the production code that transforms conditioned signals into per-node health scores.
- **The aggregation strategy** — how parent ΦL is derived (weighted average, min, product, arithmetic mean, etc.). This must be known or discoverable to write correct expected values.

## 3. Key Findings

### 3.1 Missing Specification Detail

The specification references section is **empty**. This is a significant gap. Without a formal definition of:

- The ΦL formula for leaf nodes (e.g., `ΦL = f(conditioned_signals)`)
- The aggregation rule for parent nodes (e.g., `ΦL_parent = Σ(wᵢ · ΦLᵢ) / Σ(wᵢ)`)
- Edge cases (what happens when a child has `ΦL = 0`, or when a node has no children)

…the test author must reverse-engineer expected behavior from production code, which introduces risk of tautological testing (testing that code does what it does, rather than what it *should* do).

**Recommendation:** Before implementation, extract or document the ΦL computation rules from the core library source. Pin these as constants or comments in the test file so future maintainers understand the contract being verified.

### 3.2 Fixture Design Considerations

The test hierarchy should be **deterministic and minimal but sufficient**:

```
root (parent)
├── groupA (intermediate parent)
│   ├── leaf-1  (ΦL computed from signals)
│   └── leaf-2  (ΦL computed from signals)
└── groupB (intermediate parent)
    └── leaf-3  (ΦL computed from signals)
```

This structure enables verification of:
- **Leaf computation** — 3 independent leaf nodes with distinct signal profiles.
- **Symmetric aggregation** — `groupA` aggregates 2 children; verifies multi-child case.
- **Asymmetric aggregation** — `groupB` aggregates 1 child; verifies single-child passthrough.
- **Root aggregation** — `root` aggregates 2 intermediate nodes; verifies recursive roll-up.

### 3.3 Assertion Strategy

The test should assert at three tiers:

| Tier | What to Assert | Why |
|---|---|---|
| **Leaf nodes** | `ΦL(leaf-i) === expected_from_conditioned_signals` | Validates the base computation formula against known inputs. |
| **Intermediate parents** | `ΦL(groupA) === aggregate(ΦL(leaf-1), ΦL(leaf-2))` | Validates one level of aggregation with >1 child. |
| **Root** | `ΦL(root) === aggregate(ΦL(groupA), ΦL(groupB))` | Validates recursive/hierarchical propagation. |

Additionally:
- **Numerical tolerance** — If ΦL involves floating-point arithmetic, assertions should use `toBeCloseTo` (or equivalent) rather than strict equality.
- **Propagation ordering** — The test should confirm that parent values are computed *after* all children, not before (i.e., bottom-up traversal). This can be checked implicitly by correctness of aggregated values, or explicitly via execution trace/event ordering if the pipeline exposes it.

### 3.4 Relationship to Other Pipeline Stages

ΦL computation is stage 3 in the M-22 vertical pipeline:

```
Signal Input → [Signal Conditioning (t3)] → [ΦL Computation (t4)] → [ΨH Persistence] → [εR Aggregation] → [Immune Response]
```

The t4 test must be careful to:
- **Not re-test signal conditioning** — assume conditioned values are correct (t3's responsibility).
- **Not test downstream consumers** — ΨH and εR use ΦL but their correctness is out of scope here.
- **Isolate failures** — if ΦL values are wrong, the test should make it clear whether the issue is in leaf computation vs. aggregation. Separate `describe` blocks or labeled assertions help.

### 3.5 File-Level Coordination Risk

Since the test file doesn't exist and multiple tasks (t3, t4, t5, t6, t7, t8) likely contribute to it, there is a **merge/coordination risk**. Tasks may:
- Create conflicting file scaffolds.
- Define incompatible fixtures.
- Use inconsistent naming conventions.

**Recommendation:** Establish a canonical fixture and file structure (ideally in t3 or a dedicated scaffolding task) that all subsequent tasks append to. The t8 (finalization) task should reconcile any conflicts.

## 4. Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| No spec for ΦL formula | **High** | Extract from source code; document in test comments. |
| Unknown aggregation strategy | **High** | Inspect core library; parameterize test if multiple strategies exist. |
| File doesn't exist yet | **Medium** | Coordinate with t3/t8 on file creation order. |
| Floating-point precision | **Low** | Use tolerance-based assertions. |
| Fixture conflicts across tasks | **Medium** | Use shared fixture with additive (non-destructive) test blocks. |

## 5. Recommendations

1. **Discover and document the ΦL formula** from the Codex Signum core library before writing assertions. Without this, the test has no ground truth.

2. **Design the fixture hierarchy** as described in §3.2 (root → 2 intermediate → 3 leaves) and share it across all M-22 test cases to avoid redundant pipeline executions.

3. **Structure assertions in three tiers** (leaf, intermediate, root) within a dedicated `describe('ΦL computation')` block, with clear labels on each assertion indicating which node and which computation tier is being verified.

4. **Use numerical tolerances** for all ΦL comparisons. A tolerance of `1e-9` is standard unless the domain requires otherwise.

5. **Coordinate file creation** with t3 and t8 to prevent scaffold conflicts. If t3 has not yet created the file, t4 should define its test block as a self-contained `describe` that can be inserted into the eventual file structure.

6. **Add a negative/boundary test**: verify that a node with no valid conditioned signals produces a well-defined ΦL value (e.g., `0`, `NaN` handling, or a sentinel), and that a parent with a zero-ΦL child aggregates correctly.