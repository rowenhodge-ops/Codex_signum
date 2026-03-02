# Codex Signum — Agent Instructions

This file provides governance constraints for any coding agent working on this repository.
The authoritative source is `CLAUDE.md` — read that for full context.

## Critical Rules

1. **This is a library.** Core is substrate-agnostic. No consumer app imports (DND-Manager, etc.).
2. **dist/ is committed.** Run `npm run build && git add dist/` before committing if src/ changed. Do NOT add a `prepare` script to package.json.
3. **State is structural.** No monitoring overlays, observation pipelines, or separate health databases. The Neo4j graph IS the state store.
4. **ΦL is always composite.** Never pass health as a bare number. Use `PhiLOutput` type.
5. **Dampening is topology-aware.** `γ_effective = min(0.7, 0.8/k)`. Never hardcode γ=0.7.
6. **Hysteresis = 2.5×.** Recovery is 2.5× slower than degradation.
7. **Cascade limit = 2.** Degradation propagates at most 2 levels.
8. **Use .js extensions** on all relative TypeScript imports.
9. **Commit + push after every task.** Never accumulate uncommitted work.

## Eliminated Entities — NEVER Reference These

These were removed or renamed. Coding agents frequently hallucinate references to them.

- `Observer` class / `observer/` directory → eliminated (use `feedback/`)
- `ModelSentinel` → never existed (hallucinated entity)
- `Agent` (Neo4j label) → renamed to `Seed`
- `Pattern` (Neo4j label) → renamed to `Bloom`
- `SELECTED` (relationship) → renamed to `ROUTED_TO`
- `MADE_BY` (relationship) → renamed to `ORIGINATED_FROM`
- `OBSERVED_BY` (relationship) → renamed to `OBSERVED_IN`
- `selectedAgentId` → `selectedSeedId`
- `madeByPatternId` → `madeByBloomId`
- `sourcePatternId` → `sourceBloomId`
- `src/health/`, `src/agent/`, `src/config/`, `src/services/`, `src/monitoring/` → do not exist

## Files That Do Not Exist

- `src/health/` → computation is in `src/computation/`
- `src/agent/` → patterns are in `src/patterns/`
- `src/config/` → no config directory
- `src/monitoring/` → monitoring is structural, not separate
- `src/services/` → no services directory

## Verification Commands

```bash
npx tsc --noEmit          # Type check (run after every edit)
npm test                   # Run tests (run before every commit)
npm run build              # Build dist/ (run before committing src/ changes)
git add dist/ && git commit  # Always commit dist/ with src/ changes
```

## Specification References

- Core protocol: `docs/specs/codex-signum-v3_0.md`
- Implementation authority: `docs/specs/codex-signum-engineering-bridge-v2_0.md`
- Full agent instructions: `CLAUDE.md` (read this for complete context)
