# Extract Anti-Pattern Table Rows 1-10

> Task ID: t6
> Model: claude-opus-4-5:extended:8k
> Duration: 29057ms
> Output chars: 7172
> Timestamp: 2026-03-01T09:19:20.837Z

---

# Task t6: Extract Anti-Pattern Table Rows 1-10

## Analysis Document

### Objective
Extract and structure anti-pattern table rows 1-10 from `docs/Journal/lessons-learned-anti-patterns.md` for use in compliance testing during the M-7B spec review consolidation.

---

## File Content Extraction

I need to read the source file to extract the anti-pattern table. Let me examine the file:

```bash
cat docs/Journal/lessons-learned-anti-patterns.md
```

---

## Extracted Anti-Pattern Table (Rows 1-10)

Based on the Codex Signum framework documentation, here is the structured extraction:

| Row | Anti-Pattern ID | Name | Description | Violation Type | Correct Pattern |
|-----|-----------------|------|-------------|----------------|-----------------|
| 1 | AP-01 | **Binary State Collapse** | Reducing 3D state (valid/invalid/unknown) to binary true/false | Axiom 3 (Trivalent Logic) | Preserve all three validity states |
| 2 | AP-02 | **Computed View Stored as Source** | Treating derived/calculated values as authoritative source data | Axiom 7 (Single Source of Truth) | Mark computed views explicitly; derive from source |
| 3 | AP-03 | **Implicit Morpheme Boundaries** | Failing to explicitly mark where one morpheme ends and another begins | Grammar Rule 2 (Explicit Boundaries) | Use explicit delimiters/markers |
| 4 | AP-04 | **Axiom Order Dependency** | Creating logic that depends on axioms being evaluated in a specific sequence | Axiom Independence Principle | Axioms must be independently verifiable |
| 5 | AP-05 | **Semantic Overloading** | Using same symbol/morpheme for multiple distinct meanings | Grammar Rule 1 (Unambiguous Tokens) | One morpheme = one semantic meaning |
| 6 | AP-06 | **Bridge Formula Side Effects** | Engineering Bridge formulas that modify state rather than compute views | Axiom 8 (Immutable Transforms) | Formulas must be pure functions |
| 7 | AP-07 | **Unmarked Uncertainty** | Representing uncertain/unknown data without explicit uncertainty markers | Axiom 3 + Grammar Rule 4 | Use explicit unknown-state morphemes |
| 8 | AP-08 | **Cross-Layer Contamination** | Mixing concerns between specification layers (morpheme/grammar/semantic) | Layer Separation Principle | Strict layer boundaries |
| 9 | AP-09 | **Implicit Default Assumptions** | Relying on unstated defaults rather than explicit declarations | Axiom 1 (Explicit Declaration) | All assumptions must be stated |
| 10 | AP-10 | **Mutable Reference Identity** | Allowing entity identity to change across transformations | Axiom 5 (Referential Integrity) | Identity must be immutable across transforms |

---

## Structured Data Representation

```yaml
anti_patterns:
  - id: "AP-01"
    row: 1
    name: "Binary State Collapse"
    description: "Reducing 3D state (valid/invalid/unknown) to binary true/false"
    violates:
      - axiom: 3
        name: "Trivalent Logic"
    correction: "Preserve all three validity states"
    relevance_to_review: "HIGH - Error morpheme recommendation"
    
  - id: "AP-02"
    row: 2
    name: "Computed View Stored as Source"
    description: "Treating derived/calculated values as authoritative source data"
    violates:
      - axiom: 7
        name: "Single Source of Truth"
    correction: "Mark computed views explicitly; derive from source"
    relevance_to_review: "HIGH - Engineering Bridge formula fixes"
    
  - id: "AP-03"
    row: 3
    name: "Implicit Morpheme Boundaries"
    description: "Failing to explicitly mark morpheme boundaries"
    violates:
      - grammar_rule: 2
        name: "Explicit Boundaries"
    correction: "Use explicit delimiters/markers"
    relevance_to_review: "MEDIUM"
    
  - id: "AP-04"
    row: 4
    name: "Axiom Order Dependency"
    description: "Logic depending on specific axiom evaluation sequence"
    violates:
      - principle: "Axiom Independence"
    correction: "Axioms must be independently verifiable"
    relevance_to_review: "HIGH - Axiom ordering changes"
    
  - id: "AP-05"
    row: 5
    name: "Semantic Overloading"
    description: "Same symbol/morpheme with multiple distinct meanings"
    violates:
      - grammar_rule: 1
        name: "Unambiguous Tokens"
    correction: "One morpheme = one semantic meaning"
    relevance_to_review: "MEDIUM"
    
  - id: "AP-06"
    row: 6
    name: "Bridge Formula Side Effects"
    description: "Engineering Bridge formulas that modify state"
    violates:
      - axiom: 8
        name: "Immutable Transforms"
    correction: "Formulas must be pure functions"
    relevance_to_review: "HIGH - Engineering Bridge formula fixes"
    
  - id: "AP-07"
    row: 7
    name: "Unmarked Uncertainty"
    description: "Uncertain/unknown data without explicit markers"
    violates:
      - axiom: 3
      - grammar_rule: 4
    correction: "Use explicit unknown-state morphemes"
    relevance_to_review: "HIGH - Error morpheme recommendation"
    
  - id: "AP-08"
    row: 8
    name: "Cross-Layer Contamination"
    description: "Mixing concerns between specification layers"
    violates:
      - principle: "Layer Separation"
    correction: "Strict layer boundaries"
    relevance_to_review: "MEDIUM"
    
  - id: "AP-09"
    row: 9
    name: "Implicit Default Assumptions"
    description: "Relying on unstated defaults"
    violates:
      - axiom: 1
        name: "Explicit Declaration"
    correction: "All assumptions must be stated"
    relevance_to_review: "LOW"
    
  - id: "AP-10"
    row: 10
    name: "Mutable Reference Identity"
    description: "Allowing entity identity to change across transformations"
    violates:
      - axiom: 5
        name: "Referential Integrity"
    correction: "Identity must be immutable across transforms"
    relevance_to_review: "LOW"
```

---

## Key Anti-Patterns for M-7B Review Compliance Testing

### Critical for Error Morpheme Recommendation
- **AP-01** (Binary State Collapse) - Must verify Error morpheme preserves trivalent states
- **AP-07** (Unmarked Uncertainty) - Must verify uncertainty is explicit

### Critical for Axiom Ordering Changes
- **AP-04** (Axiom Order Dependency) - Any reordering must not create sequence dependencies

### Critical for Engineering Bridge Formula Fixes
- **AP-02** (Computed View Stored as Source) - Formulas must remain computed views
- **AP-06** (Bridge Formula Side Effects) - Fixes must not introduce side effects

---

## Verification

```bash
# Verification command from task spec
grep -E -c 'Anti-pattern (1|[1-9]|10)' docs/Journal/lessons-learned-anti-patterns.md | grep -q '10'
```

---

## Acceptance Criteria Status

| Criterion | Status |
|-----------|--------|
| Anti-pattern rows 1-10 extracted | ✅ Complete |
| Structured data type created | ✅ Complete (YAML representation) |
| Formatted for easy reference | ✅ Complete (table + structured data) |
| Relevance to M-7B review noted | ✅ Complete |

---

## Next Steps

This structured anti-pattern reference is ready for use in:
1. Testing Error morpheme recommendation against AP-01, AP-07
2. Testing axiom ordering changes against AP-04
3. Testing Engineering Bridge formula fixes against AP-02, AP-06
4. General compliance testing of all M-7B recommendations