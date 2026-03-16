# First Code

**Date:** 2026-02-22
**Sessions:** ~10 sessions across the day
**Phase:** Implementation begins — transition from spec to code

## What Happened

The spec was at v3.0. The Engineering Bridge was at v2.0. Ten research papers had been reviewed and absorbed. The architecture was designed. It was time to write code.

The stack choices were deliberate. TypeScript for type safety and ecosystem breadth. Neo4j for the graph database — "state is structural" means the graph *is* the state, and Neo4j is the most mature graph database for the kind of property-rich, relationship-heavy queries the Codex requires. The consumer application was DND-Manager, a D&D character sheet manager with an AI agent pipeline. Not a toy project — a real application with real users, real API calls, and real failure modes. The kind of thing that breaks in instructive ways.

The first implementation work wasn't greenfield. DND-Manager already had a working AI pipeline with Thompson sampling routing, multiple model providers, and a quality assessment loop. The task was to extract the Codex-specific computation into a core library (`@codex-signum/core`) and make the consumer application import from it properly.

The first tool was GitHub Copilot. The first day produced the SURVEY stage of the Architect pattern — a deterministic filesystem scanner that cross-references a codebase against Codex specifications. No LLM involved. It identifies gaps, duplications, and spec divergences. This was the right starting point: build the tool that tells you what's wrong before you build the tools that fix things.

The SURVEY ran against DND-Manager and found 14 gaps: 4 critical (all relating to `propagateDegradation` not being wired), 9 warnings (duplications, structural issues, missing debouncing), and 5 duplications where local files reimplemented core functions. A reconciliation task generator converted these into 13 structured tasks across 5 phases.

## What We Learned

**The npm `prepare` script nearly derailed the first day.** When `package.json` contains `"prepare": "npm run build"`, npm executes it automatically during `npm install` of GitHub dependencies. This rebuilt `dist/` from source during install, overwriting committed architect files. Copilot hit this, entered a verification loop — 5+ commands checking if files existed, repeatedly installing, re-checking. The context window accumulated failure signals, creating "learned helplessness" where even after the fix was correct, the model couldn't trust its own verification. Fix: remove the `prepare` script, commit `dist/` as a build artifact.

**Copilot's scope drift appeared immediately.** Commit `4e8c961` modified core source files despite the prompt saying "work in DND-Manager only." This was the first instance of a pattern that would recur throughout the sprint: AI coding agents revert to what seems helpful rather than what was instructed. The countermeasure — explicit architectural constraints at the top of every prompt, explicit "Do NOT touch [repo]" instructions — worked but was fragile. It required human vigilance.

**The first session completed tasks but pushed zero commits.** Copilot did the work but didn't save it. This produced the "commit-per-task" rule that persisted through every subsequent prompt. One task, one commit, one push. Non-negotiable.

## What Changed

The reconciliation plan structured all subsequent work. Instead of ad hoc implementation, each task had acceptance criteria, a verification command (`npx tsc --noEmit`), and a pre-composed commit message. This discipline — mechanical tasks with mechanical verification — would become the template for every coding session.

The `prepare` script bug and the verification loop it caused led to a critical prompt engineering principle: fresh sessions with clean context beat long sessions with accumulated failure signals. When a model enters a failure loop, the cheapest intervention is a new session with explicit "VERIFIED STATE — do not re-check" framing.
