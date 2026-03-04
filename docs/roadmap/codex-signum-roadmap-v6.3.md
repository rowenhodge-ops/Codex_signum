# Codex Signum — Canonical Roadmap & Milestone Taxonomy v6.3

**Version:** 6.3
**Date:** 2026-03-04
**Status:** Living document — update as milestones complete

---

## Why This Version

v6.2 tracked M-9 Part 1 execution (schema, wiring, decisions, memory). v6.3 records the verification cycle (M-9.VA → M-9.VA-FIX → M-9.VA-V) and its findings:

1. **Pipeline self-diagnostic worked.** The pipeline's own analytical output identified 17 structural issues during M-9.VA. 5 were critical and fixed immediately. 12 absorbed into M-9.5. This is the strongest validation of "state is structural" to date — the system diagnosed its own architecture from its own structural output.
2. **Performance from structural correctness.** Fixing 5 wiring bugs (no optimisation) produced 100% task success (was 64%), quality average ~0.82 (was 0.49), and ~2× pipeline speed. Emergent improvement, not engineered.
3. **The state dimension gap is now visible.** ΦL/ΨH/εR computation modules exist and are tested in isolation. The signal conditioning pipeline exists and is tested. But they are NOT connected to the live pipeline. The pipeline writes raw Observations and uses `qualityScore` as a ΦL proxy. No hierarchical aggregation. No event-triggered structural review. This is the biggest gap between spec and running system and it needs to be on the map.
4. **Test baseline:** 1182 tests (1163 passed, 0 failed, 1 skipped, 18 todo). 18 `.todo()` tests flagged as governance gap — M-9.5 must convert to `@future(M-N)` with separate runner.
5. **M-9.8 promoted.** Ecosystem Bootstrap moved from end of Part 2 to immediately after M-9.5. The roadmap is the project's most-edited artifact and the only one not structurally represented. New Part 2 order: 9.5 → 9.8 → 9.6 → 9.7a → 9.7b.

**Changelog:**
**v6.3 (2026-03-04):** M-9.4 ✅, M-9.VA ✅ (gate PASS), M-9.VA-FIX ✅ (5 bugs), M-9.VA-V ✅ (post-fix verified). Tests: 1182. R-13 closed. State dimension gap documented. M-9.8 promoted (→ after M-9.5). M-9.5 ⏳.
**v6.2 (2026-03-04):** M-9.1–9.3 stamped ✅. M-9.VA structure defined (Part 1/Part 2 split). Agent annotations added.
**v6.1 (2026-03-04):** M-9.1 stamped ✅. Test baseline 1101.
**v6.0 (2026-03-04):** M-9.VA checkpoint introduced. M-9.7 split into 7a/7b. Gate failure path defined.

**Rule:** All future sessions, prompts, and context transfers reference milestones by their M-number. This document is the single source of truth for project sequencing.

*Full roadmap content at docs/roadmap/codex-signum-roadmap-v6.3.md in the repository.*