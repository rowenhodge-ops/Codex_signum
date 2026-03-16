# How the AI-Assisted Development Workflow Evolved

**Date:** Synthesis (Feb 22–28, 2026)
**Phase:** Process evolution across the implementation sprint

## The Starting Point

The workflow started simple: paste a prompt into GitHub Copilot, hope for the best. Within two days, this was insufficient. Within a week, it had evolved into a multi-layered governance system that applied the project's own principles to its own development process.

The evolution wasn't planned. Each layer was added in response to a failure mode discovered in production.

## Phase 1: Copilot and Prompt Engineering (Feb 22-23)

GitHub Copilot was the first coding agent. The workflow: write a detailed prompt with task specifications, paste it into VS Code, let Copilot execute. Results were mixed.

What worked: Copilot could execute mechanical tasks — create files, write functions, run tests, commit changes. Given precise specifications (function name, parameters, return type, file path), it produced working code.

What didn't: scope drift, invented file paths, wrong database technology, missing commits, verification loops. The prompt was the only constraint surface, and it eroded over long sessions. By task 40 of a 100-task session, Copilot's attention to the architectural constraints in the preamble had degraded significantly.

The response was heavier prompts. Every prompt grew a "CRITICAL FILE PATHS" table, a "DO NOT TOUCH" list, a "HARD RULES" section, architectural context injection blocks. Prompts reached 200+ lines before a single task specification appeared. This worked — better than no constraints — but the engineering effort was high and the returns diminished with session length.

A best practices document was written during this period. Its core insight: Copilot is trained on millions of repos. Your repo is one. When your architecture diverges from common patterns, Copilot will hallucinate toward its training data unless you constrain it. The prompt is the constraint surface. Everything is about shaping that surface.

## Phase 2: Claude Code and CLAUDE.md (Feb 24)

The transition to Claude Code introduced a structural advantage: `CLAUDE.md`. A persistent governance file that Claude Code reads at session start and (critically) can be instructed to consult during execution. Not a prompt preamble that fades from attention. A fixture.

The first `CLAUDE.md` was deployed to DND-Manager at commit `bcc6193`. It contained: full architecture map, 10 non-negotiable rules, file path references, import conventions, database technology declaration (positive and negative: "Neo4j, NOT Firestore"), and a "What NOT to change" section.

Hooks followed immediately: `pre-edit-guard.sh` (8 anti-pattern checks), `post-edit-typecheck.sh`, `pre-commit-gate.sh`, `on-stop-summary.sh`. These moved governance from "should do" (prompt suggestions) to "must do" (structural enforcement). A Firebase import now fails at write time, not at review time. A type error is caught after every edit, not at the end of a 50-task session.

The workflow crystallised into three layers:
- `CLAUDE.md`: persistent context ("here is the architecture")
- Hooks: structural enforcement ("you cannot do this")
- Phase prompts: task specification ("here is what to build")

Prompts shrank dramatically. The architecture, constraints, and anti-patterns lived in `CLAUDE.md` and hooks. Prompts became task lists with acceptance criteria.

## Phase 3: The Architect Workflow (Feb 25-28)

The workflow matured into a clear separation of roles. Ro as architect: identifies gaps, makes design decisions, resolves ambiguities, reviews results at the architectural level. Claude (in chat) as session architect: designs sessions, produces prompts, audits results by checking git logs and system state, generates continuation prompts. Claude Code as coding agent: reads files, writes files, runs commands, commits per task, pushes to remote. Governed by CLAUDE.md + hooks. Autonomous — Ro walks away after pasting the prompt.

The interaction loop:

1. Ro describes what needs doing (in chat).
2. Claude designs the session, produces a prompt.
3. Ro pastes the prompt into Claude Code.
4. Ro walks away.
5. Ro returns, asks "did it work?"
6. Claude checks git log, reads actual files, verifies claims.
7. If gaps remain, Claude produces a continuation prompt. Go to 3.

This is not pair programming. It's not code review. It's architectural governance with automated execution. The human architect never reads diffs. The system governs itself through structural mechanisms.

## Phase 4: Prompt Template Evolution

The prompts themselves evolved through 10+ iterations, each discovering a new failure mode:

**Step 0: Rescue uncommitted work.** Added after the first session produced work but no commits. Every prompt now starts by checking `git status` and committing anything unsaved.

**"What's Done" sections with commit SHAs.** Added after a session re-did completed work because it didn't know what was already done. Explicit SHAs prevent re-execution.

**Phase gates.** Tasks grouped into phases with explicit gates ("after Phase 2, verify all tests pass before proceeding to Phase 3"). Added after error compounding — a mistake in task 5 broke tasks 6-25.

**"What NOT to change" sections.** Added after scope creep. Explicit lists of files, repos, and directories that are off-limits.

**Overnight execution guidance.** Added for sessions that run unattended. Includes: maximum retry count per task, "stop and report" triggers, explicit "do not loop more than N times."

The template isn't a style preference. It's a task execution protocol. Each section prevents a specific failure mode discovered through experience.

## Phase 5: Multi-Model Usage

Different models served different purposes across the sprint:

**Claude (chat/extended thinking):** Session architecture, prompt generation, design decisions, spec interpretation. Used for its long context window and ability to reason about complex architectural trade-offs.

**Claude Code:** Primary coding agent from Feb 24 onward. File operations, TypeScript compilation, git management, test execution. Governed by CLAUDE.md + hooks.

**GitHub Copilot:** Initial coding agent (Feb 22-23). Retained for quick, well-specified tasks in established patterns.

The multi-model approach reflects a Codex principle: models are fungible substrate. The governance layer (prompts, CLAUDE.md, hooks) is the constant. The model executing the task can change without changing the governance. This was demonstrated when the transition from Copilot to Claude Code preserved the task specification format while changing the enforcement mechanism.

## What This Teaches

The meta-observation: this workflow is the Codex Signum framework applied to its own development. `CLAUDE.md` is a constitutional document — it declares principles and constraints that all agents must respect. Hooks are the enforcement mechanism — structural checks that fire on every action. Phase prompts are task specifications within constitutional bounds. The Architect pattern (SURVEY → DECOMPOSE → PLAN → EXECUTE → REVIEW → ADAPT) governs the development process itself.

This wasn't intentional from the start. It was discovered through practice. The principles that govern AI agent systems also govern AI-assisted development. State encoding, structural enforcement, governance as infrastructure, substrate fungibility — they apply at every level.

For enterprise AI-assisted development, the implications are:

Governance infrastructure is a prerequisite, not an add-on. Deploy `CLAUDE.md` equivalents and structural hooks before writing the first prompt.

Prompts are protocols, not prose. Each section prevents a specific failure mode. Evolve them through documented experience, not intuition.

Context management is the bottleneck. The most expensive waste in AI-assisted development is rework caused by lost context between sessions. Invest in structural solutions (generated state snapshots, graph queries) rather than manual documentation.

Human architectural review remains irreplaceable for novel systems. AI agents execute well within known patterns and hallucinate outside them. The architect's job is to catch the hallucinations that hooks can't detect — spec violations that look like working code.

Fresh sessions beat extended sessions. When an agent enters a failure loop, the cheapest intervention is a new session with clean context. Accumulated failure signals create learned helplessness that no amount of in-session correction can overcome.
