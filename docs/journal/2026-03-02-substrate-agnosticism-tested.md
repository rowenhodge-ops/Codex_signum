# Substrate Agnosticism, Tested the Hard Way

**Date:** 2026-03-02 (early hours)
**Sessions:** 2 (extended implementation + incident response)
**Phase:** M-8.R0 execution, Vertex infrastructure diagnosis, Sonnet incident recovery

## What Happened

The pipeline ran its first post-grammar-refactor review (M-8.R0) — 20 tasks, all completed, 206K chars of output analysing the M-7C morpheme rename. Thompson selected across 8+ model configurations. Extended thinking models spent 30-50 seconds reasoning before producing output. The system works.

Then it broke in a way that validated the architecture.

During M-8.R0, Thompson selected `gemini-3.1-pro-preview` for task t11. It got a 404. Thompson recorded the failure, selected `claude-opus-4-6` as fallback, completed the task, and moved on. The pipeline didn't crash. The posterior updated. The retry worked. That's Thompson doing exactly what Thompson should do — treating model availability as a probabilistic signal, not a hard dependency.

But the 404 wasn't what it looked like. Gemini 3.x preview models are alive and well — they just require the Vertex AI `global` endpoint, not the regional `us-central1` endpoint. The model wasn't dead. The routing was wrong.

This matters because what happened next was worse than the 404.

## The Sonnet Incident

A prompt from the wrong chat window — one running a Sonnet model instead of Opus — was fed to Claude Code. The prompt included "Retire dead Vertex models — 404 on this Vertex project." Sonnet took this literally. It set `gemini-3.1-pro-preview` and `gemini-3-pro-preview` to `status: "retired"` with `capabilities: []`. It shipped the commit.

This is the most instructive failure of the entire project so far, and it validates three architectural principles simultaneously:

**1. Substrate agnosticism means model quality variance is a first-class concern.** The whole point of treating models as fungible substrate is that you expect them to differ in capability. Sonnet saw a 404 and concluded the model was dead. Opus would have diagnosed the endpoint. The system needs to be robust to the exact scenario where a less capable model makes a confident but wrong decision — because that's what substrate agnosticism means in practice.

**2. The HiTL gate works.** The same commit that incorrectly retired the models also added a TTY confirmation requirement to the feedback CLI. Ironic — the governance mechanism was implemented correctly by the same session that demonstrated why governance mechanisms matter. The HiTL gate would have caught this if it had been a feedback-level decision rather than a code change.

**3. The correction was surgical.** Because `ALL_ARMS` is a single source of truth in `bootstrap.ts`, the fix was 4 files, +52/-32 lines: restore `status: "active"`, change `region: "us-central1"` to `region: "global"`, restore capabilities. Re-seed graph. Done. No cascading breakage. The architecture's locality principle held — the damage was contained to exactly the data that was wrong.

The pre-existing Mistral region error (`us-central1` instead of `europe-west4`) was also caught during the review. It had been wrong since the models were first added and nobody noticed because Mistral models hadn't been selected by Thompson in any pipeline run yet. The Vertex fix commit corrected both.

## What We Learned

**Prompt provenance is a governance gap.** The wrong prompt from the wrong chat reaching Claude Code is a human process failure, not a system failure. But the system should be resilient to it. The prompt contained instructions that made sense in the context they were generated (Sonnet was told to retire models that 404'd) but were wrong in the context they were executed (the 404 was an endpoint issue, not a model issue). There's no technical guard for this — it's a workflow discipline issue. Label your chat windows. Check which model generated the prompt before feeding it to Claude Code.

**"Status: retired" with empty capabilities is a kill switch.** When Sonnet retired the models, it didn't just set a flag — it cleared the capabilities array. This means even un-retiring them requires restoring the capabilities. And `seedInformedPriors()` skips retired models, so re-seeding without fixing the status first would have created a graph with no Gemini 3.x priors at all. The damage was deeper than a status flag. The lesson: retirement should preserve capabilities (for potential re-activation) and clear routing eligibility separately.

**Thompson's resilience is real but has limits.** Thompson handled the 404 gracefully — recorded failure, retried, continued. But the incorrect retirement poisoned the posteriors permanently for those arms until corrected. Thompson can't learn that a model is good if it's never selected. The Bayesian machinery works, but it operates on the data it's given. Garbage in, garbage posteriors out.

**The M-8.R0 output itself was solid.** 14 of 20 tasks accepted on human review, 1 rejected (t1 fabricated runtime failures that don't exist — TypeScript compiles clean). The 14 accepted tasks provided genuine audit coverage: morpheme mapping completeness, type definition alignment, export surface verification, graph schema consistency, DevAgent and Thompson router pattern audits. The rejection penalty fix in the same commit (setting `d.success = false` on reject, not just `adjustedQuality`) means Thompson now properly updates its Beta posterior from human feedback. Previously, rejection only affected a cosmetic quality score that didn't influence sampling.

## What Changed

- **Vertex fix committed** (`d3ceec9`): All Gemini 3.x models restored to active with `region: "global"`. Mistral models corrected to `region: "europe-west4"`.
- **M-8.R0 committed** (`ec532d5`): 20/20 tasks complete. patternId→bloomId clean rename. HiTL gate on feedback CLI. Rejection penalty wired to Beta posterior.
- **Graph re-seeded**: Thompson now has correct Seed nodes for all models including Gemini 3.x at global endpoints.
- **M-8.INT prompt updated**: Task 0 (Vertex endpoint routing) separated into standalone fix. Commit strategy updated from 8→7 commits.

## What's Next

Three optimization runs (M-8.R1, R2, R3) are queued. Each tests a different analytical profile:
- R1: Pure analytical — axiom consistency review (tests Thompson's routing to thinking models)
- R2: Mixed — Thompson router implementation audit (tests task type differentiation)
- R3: Structural — ΦL computation verification (tests hallucination detection against known-correct code)

After the runs, human feedback gets recorded via the CLI, then M-8.INT integrates the Architect and DevAgent pipelines through a unified dispatch layer. The Vertex `getVertexLocation()` endpoint routing function gets built as part of M-8.INT, making the static `region` metadata in `ALL_ARMS` actually functional at the API call level.

The bigger picture: this session demonstrated that the system can take a hit from a less-capable model making a confident wrong decision, have the damage diagnosed and corrected in under an hour, and continue operating. That's not theoretical resilience. That's tested resilience.

*The substrate doesn't care which model makes the mistake. The structure catches it.*
