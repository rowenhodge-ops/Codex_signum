# Codex Signum — Hypothesis Registry

## Purpose

Track scientific claims from research papers, their validation status against implementation,
and evidence trail. This is the methodical record of what we've claimed, what we've proven,
and what remains unvalidated.

## Status Definitions

| Status | Meaning |
|---|---|
| **proposed** | Claim extracted from research, not yet tested against implementation |
| **validated** | Implementation matches claim, test(s) prove it |
| **partially-validated** | Some aspects confirmed, others untested or divergent |
| **invalidated** | Implementation contradicts claim, with documented rationale |
| **superseded** | Replaced by a more refined claim |
| **deferred** | Cannot validate yet (missing infrastructure) |

## Registry Format

Each hypothesis file follows this structure:
- ID: H-{NNN}
- Source: Which research paper, section, page
- Claim: The specific assertion being tracked
- Status: Current validation state
- Evidence: What proves/disproves it (test files, code references, measurements)
- Notes: Rationale for status, known limitations

## How SURVEY Uses This

SURVEY reads this directory and cross-references hypothesis status against implementation.
Hypotheses with status "proposed" that have corresponding code are flagged for validation.
Hypotheses with status "validated" whose corresponding code has changed are flagged for re-validation.
