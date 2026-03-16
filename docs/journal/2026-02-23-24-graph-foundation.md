# Graph Foundation and Early Patterns

**Date:** 2026-02-23 to 2026-02-24
**Sessions:** ~15 across both days
**Phase:** Model registry, hallucination detection, circuit breaker, governance infrastructure

## What Happened

Day two opened with the model registry. A D&D character sheet manager running AI agents needs to route across multiple providers — OpenAI, Anthropic, Google, Mistral, DeepSeek. The single source of truth for model configuration (`agent/routing/models.ts`) grew to ~32KB: 20+ active models with context windows, token limits, provider metadata, cost tiers, and capability tags. A DeepSeek OpenAI-compatible provider was added. Agent nodes were seeded in Neo4j from the registry, each model becoming a first-class graph entity with Thompson sampling arms.

The hallucination detection pipeline came next. The core's type system is deliberately substrate-agnostic — `StageResult` carries output, quality score, duration, but not hallucination data. Hallucination detection belongs in the consumer's adapter layer. DND-Manager already had an `OutputValidator` with 9 pattern checks (wrong SDK usage, unknown Firestore collections, fabricated references). The task was to wire it into the new pipeline: validator called inside the assessor, hallucination records accumulated via an `afterStage` hook, persisted to Neo4j through the graph feeder.

The circuit breaker followed — provider-level CLOSED/OPEN/HALF_OPEN with a 5-minute cooldown. When a provider starts failing, the breaker opens and Thompson sampling routes around it. When the cooldown expires, HALF_OPEN allows a single probe. If it succeeds, the breaker closes. Infrastructure errors (network timeouts, 429s) are classified separately from model errors — infrastructure failures don't penalise the Thompson arm, because the model didn't fail, the pipe did.

The biggest shift happened on Feb 24: the transition from GitHub Copilot to Claude Code. Copilot had been the coding agent for the first two days. It worked — tasks got done, commits got pushed — but scope drift was constant, and the prompt engineering overhead to prevent hallucinations was growing. Claude Code offered something Copilot didn't: `CLAUDE.md`. A persistent governance file that the agent reads at session start and consults during execution. Not a prompt preamble that fades from attention after 20 tasks. A structural fixture.

The first `CLAUDE.md` was deployed to DND-Manager along with four shell hooks: `pre-edit-guard.sh` (8 anti-pattern checks including Firebase import blocking), `post-edit-typecheck.sh` (`tsc --noEmit` after every edit), `pre-commit-gate.sh` (full gate before commit), and `on-stop-summary.sh` (session end report). This was commit `bcc6193` — the moment governance became structural rather than prompt-dependent.

## What We Learned

**Infrastructure vs. model error classification matters for Thompson sampling.** If a 429 rate limit from OpenAI penalises the Thompson arm, the system "learns" that GPT-4 is bad when the actual problem is transient infrastructure. The fix: tag errors at the executor level, skip arm updates for infrastructure errors, let the circuit breaker handle provider-level failures. The arm only learns from genuine model performance.

**Copilot's context window is a liability for novel architectures.** Over a 100-task session, Copilot's attention drifts. By task 40, it's referencing file paths that don't exist, importing from packages that aren't installed, and reimplementing functions that are already exported from core. The best practices document written after this period catalogues the specific failure modes: invented file paths (the #1 hallucination vector), parallel registries, verification loops, and scope creep.

**`CLAUDE.md` changed the economics of prompt engineering.** Before: every prompt needed 200+ lines of context injection. After: the persistent file handles architecture, constraints, and anti-patterns. Prompts shrink to task specifications. The agent arrives with context instead of being force-fed it.

## What Changed

The governance stack for AI-assisted development crystallised: `CLAUDE.md` for persistent context ("should do"), hooks for structural enforcement ("must do"), and phase-gated prompts for task specification ("what to do"). This three-layer model would govern every subsequent session. The commit-per-task discipline from Feb 22 was now enforced by hooks rather than prompt instructions.

DND-Manager went from 22 tests to 150+ tests passing across Phases 1-3. The pipeline had working model routing, hallucination detection, quality assessment, and circuit-breaking — all wired through the graph, all computing health metrics, all feeding Thompson sampling arms.
