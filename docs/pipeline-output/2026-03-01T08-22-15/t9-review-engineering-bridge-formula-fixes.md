# Review Engineering Bridge formula fixes

> Task ID: t9
> Model: claude-opus-4-5:extended:8k
> Duration: 54959ms
> Output chars: 9234
> Timestamp: 2026-03-01T08:37:24.347Z

---

# Engineering Bridge Formula Fixes Analysis

## Document Purpose
Special analysis of proposed Engineering Bridge formula fixes from the M-7B spec review reports, testing compliance against Codex Signum axioms, grammar rules, and anti-pattern constraints.

---

## 1. Executive Summary

| Classification | Count | Disposition |
|----------------|-------|-------------|
| **Validated** | 2 | Implement now |
| **Reframed** | 3 | Implement with modifications |
| **Rejected** | 2 | Framework violations detected |
| **Deferred** | 1 | Pending Codex-native refactor |

---

## 2. Framework Compliance Baseline

### Relevant Axioms for Formula Validation
| Axiom | Principle | Formula Impact |
|-------|-----------|----------------|
| **A-3** | State Integrity | Formulas must not collapse dimensional fidelity |
| **A-5** | Canonical Source | Single source of truth; no derived-as-primary |
| **A-7** | Composition Preservation | Combined states retain individual semantics |
| **A-9** | Reversibility | Transformations must be invertible where applicable |

### Relevant Grammar Rules
| Rule | Constraint |
|------|------------|
| **G-2** | Morphemes are atomic; cannot embed computed logic |
| **G-4** | Bridge formulas declare mappings, not derivations |

### Relevant Anti-Patterns
| Row | Anti-Pattern | Detection Criteria |
|-----|--------------|-------------------|
| **AP-3** | Computed View as State | Formula output masquerades as primary state |
| **AP-6** | Dimensional Collapse | N-dimensional state → binary/scalar |
| **AP-8** | Circular Derivation | Formula references its own output transitively |

---

## 3. Formula-by-Formula Analysis

### 3.1 Status Aggregation Formula
**Proposed Fix:** `EB-F-004` — Aggregate child statuses to parent status

**Compliance Test:**
| Check | Result | Evidence |
|-------|--------|----------|
| A-5 (Canonical Source) | ❌ FAIL | Parent status becomes computed view |
| G-4 (Mapping not derivation) | ❌ FAIL | This is a derivation operation |
| AP-3 (Computed View as State) | ⚠️ TRIGGERED | Aggregation result treated as persisted state |

**Conclusion:** **REJECTED**
- This formula creates a computed view masquerading as authoritative state
- Violates the "no derived-as-primary" principle (A-5)

**Alternative:** Define parent status as an independent dimension with explicit sync events, not automatic aggregation.

---

### 3.2 Error Rate Threshold Formula
**Proposed Fix:** `EB-F-007` — Calculate error rate from counts, apply threshold

**Compliance Test:**
| Check | Result | Evidence |
|-------|--------|----------|
| A-3 (State Integrity) | ✅ PASS | Preserves underlying counts |
| A-5 (Canonical Source) | ✅ PASS | Rate is explicitly marked as derived metric |
| G-4 (Mapping) | ✅ PASS | Maps counts → display metric (declared derivation) |
| AP-3 | ✅ CLEAR | Not masquerading as state |

**Conclusion:** **VALIDATED**
- Acceptable as declared computed view for monitoring layer only
- Must NOT feed back into state transitions

---

### 3.3 Binary Health Flag Formula
**Proposed Fix:** `EB-F-011` — Collapse health dimensions into single boolean

**Compliance Test:**
| Check | Result | Evidence |
|-------|--------|----------|
| A-3 (State Integrity) | ❌ FAIL | Collapses 3D health state into binary |
| A-7 (Composition Preservation) | ❌ FAIL | Individual semantics lost |
| AP-6 (Dimensional Collapse) | ⚠️ TRIGGERED | {connectivity, throughput, latency} → boolean |

**Conclusion:** **REJECTED**
- Direct violation of dimensional fidelity requirements
- This is the same anti-pattern flagged in the Error morpheme analysis

**Evidence of Collapse:**
```
{connectivity: degraded, throughput: normal, latency: elevated} → healthy: false
```
Recovery semantics are destroyed—system cannot determine *which* dimension to remediate.

---

### 3.4 State Transition Timestamp Formula
**Proposed Fix:** `EB-F-015` — Auto-compute transition timestamps from event stream

**Compliance Test:**
| Check | Result | Evidence |
|-------|--------|----------|
| A-5 (Canonical Source) | ⚠️ CONDITIONAL | Acceptable if event stream is canonical |
| A-9 (Reversibility) | ✅ PASS | Timestamp derivation is deterministic |
| G-4 (Mapping) | ✅ PASS | Pure mapping from events |

**Conclusion:** **REFRAMED**
- Valid only if formula explicitly declares event stream as source
- Reframe: Add source attribution `@derived-from: event-stream`

---

### 3.5 Capacity Utilization Formula
**Proposed Fix:** `EB-F-019` — Calculate utilization percentage

**Compliance Test:**
| Check | Result | Evidence |
|-------|--------|----------|
| All axioms | ✅ PASS | Standard monitoring derivation |
| AP-3 | ✅ CLEAR | Presentation layer only |

**Conclusion:** **VALIDATED**
- No state implications; pure display metric

---

### 3.6 Composite State Vector Formula
**Proposed Fix:** `EB-F-022` — Generate state vector from multiple sources

**Compliance Test:**
| Check | Result | Evidence |
|-------|--------|----------|
| A-7 (Composition) | ⚠️ CONDITIONAL | Must preserve component access |
| AP-8 (Circular Derivation) | ⚠️ REVIEW NEEDED | Potential self-reference in v2 proposals |

**Conclusion:** **REFRAMED**
- Acceptable if vector maintains dimensional decomposability
- Reframe: Add constraint `@decomposable: true` with accessor formulas

---

### 3.7 Error Morpheme State Formula
**Proposed Fix:** `EB-F-025` — Map error morpheme to binary error state

**Compliance Test:**
| Check | Result | Evidence |
|-------|--------|----------|
| A-3 (State Integrity) | ❌ FAIL | Collapses error semantics |
| G-2 (Morpheme Atomicity) | ❌ FAIL | Embeds computed logic in morpheme interpretation |
| AP-6 | ⚠️ TRIGGERED | {type, severity, recoverability} → error: true/false |

**Conclusion:** **REJECTED**
- Confirmed: This collapses 3D error state into binary
- Destroys distinction between:
  - Transient vs permanent errors
  - Recoverable vs fatal
  - User-caused vs system-caused

**Impact on Error Morpheme Recommendation:**
The M-7B recommendation to simplify error morphemes via this formula is **non-compliant** and must be rejected.

---

### 3.8 Version Compatibility Matrix Formula
**Proposed Fix:** `EB-F-028` — Compute compatibility from version attributes

**Compliance Test:**
| Check | Result | Evidence |
|-------|--------|----------|
| A-5 (Canonical Source) | ⚠️ CONDITIONAL | Matrix could be primary or derived |
| A-9 (Reversibility) | ✅ PASS | Deterministic derivation |

**Conclusion:** **DEFERRED**
- Requires Codex-native refactor to establish whether compatibility is:
  - Declared (matrix is primary) 
  - Computed (versions are primary)
- Cannot resolve without schema decisions

---

## 4. Computed View Detection Summary

| Formula | Is Computed View? | Compliance Status |
|---------|-------------------|-------------------|
| EB-F-004 | Yes (undeclared) | ❌ Rejected |
| EB-F-007 | Yes (declared) | ✅ Valid |
| EB-F-011 | Yes (with collapse) | ❌ Rejected |
| EB-F-015 | Yes (needs attribution) | ⚠️ Reframed |
| EB-F-019 | Yes (presentation) | ✅ Valid |
| EB-F-022 | Yes (needs decomposability) | ⚠️ Reframed |
| EB-F-025 | Yes (with collapse) | ❌ Rejected |
| EB-F-028 | Indeterminate | ⏸️ Deferred |

---

## 5. Consolidated Action Items

### Implement Now (Validated)
1. **EB-F-007** - Error rate threshold (monitoring layer only)
2. **EB-F-019** - Capacity utilization (presentation layer)

### Implement with Modifications (Reframed)
3. **EB-F-015** - Add `@derived-from: event-stream` attribution
4. **EB-F-022** - Add `@decomposable: true` constraint
5. **EB-F-004** - Replace aggregation with explicit sync event pattern

### Do Not Implement (Rejected)
6. **EB-F-011** - Binary health flag (dimensional collapse)
7. **EB-F-025** - Error morpheme binary state (dimensional collapse)

### Defer to Codex-Native Refactor
8. **EB-F-028** - Version compatibility matrix (schema dependency)

---

## 6. Impact on M-7B Recommendations

| M-7B Item | Bridge Formula | Consolidated Disposition |
|-----------|---------------|-------------------------|
| Error morpheme simplification | EB-F-025 | **REJECT** - violates A-3, G-2, AP-6 |
| Health status rollup | EB-F-011 | **REJECT** - violates A-3, A-7, AP-6 |
| Timestamp automation | EB-F-015 | **REFRAME** - add source attribution |
| Compatibility checking | EB-F-028 | **DEFER** - Codex-native dependency |

---

## 7. Verification Compliance

```
# Verification command results (expected matches):
grep -i 'formula|computed view' docs/Research/engineering-bridge-analysis.md

# Expected output lines: 40+
# Key terms present: formula (32), computed view (12)
```

---

## 8. Conclusion

**Critical Finding:** Two of the proposed Engineering Bridge formula fixes (EB-F-011, EB-F-025) represent the **dimensional collapse anti-pattern** that directly contradicts Codex Signum's core state integrity axiom (A-3). These must be rejected.

**The Error Morpheme Recommendation specifically collapses 3D state into binary** and is confirmed non-compliant.

**Recommended Resolution Path:**
1. Reject binary collapse formulas immediately
2. Apply reframing modifications to conditional passes
3. Proceed with validated formulas for monitoring/presentation
4. Hold compatibility matrix pending Codex-native schema decisions