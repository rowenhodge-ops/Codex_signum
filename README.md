# Codex Signum

**A semantic encoding where state is structural.**

Codex Signum is a substrate-agnostic governance protocol for complex systems — agentic workflows, knowledge graphs, distributed processes — where health, relationships, and learning dynamics are encoded directly in graph topology rather than monitored externally.

The core insight: if you encode state structurally, governance becomes intrinsic. You don't bolt on monitoring — the representation *is* the monitoring. You don't enforce rules from outside — the constitutional layer evolves from within, shaped by three heuristic imperatives: reduce suffering, increase prosperity, increase understanding.

18 months of research and specification. The implementation is recent — the architecture is not. The research corpus in `docs/research/` and specification history in `docs/specs/` predate the code by over a year. The implementation velocity reflects the depth of the design work, not its absence.

## What's Here

A TypeScript implementation with:

- **Thompson Sampling Router** — Multi-model selection using Bayesian updating with context-blocked posteriors. The system learns which model performs best for which task type through every execution.
- **Architect Pattern** — Recursive problem decomposition: SURVEY → DECOMPOSE → CLASSIFY → SEQUENCE → GATE → DISPATCH → ADAPT. Applied at every level of abstraction, including to its own development.
- **Signal Conditioning Pipeline** — Inline health computation (ΦL, ΨH, εR) with dampening, hysteresis, and cascade prevention derived from control systems theory.
- **Constitutional Evolution** — Governance rules that adapt under formal amendment protocols with statistical confidence thresholds, rate limiting, and minimum stability periods.
- **Neo4j Graph Backend** — Every decision, outcome, and learning event is a node in a persistent graph. The topology *is* the system state.

## Numbers

- **763** passing tests across 5 test levels (unit, contract, pipeline, outcome, safety)
- **192** barrel exports
- **TypeScript** core, strict mode, zero `any` leaks
- **Neo4j** graph backend with full Cypher query layer
- **Multi-provider** — Anthropic, Google, Mistral through substrate-agnostic interfaces

## Architecture

```
src/
├── computation/           # State dimension calculators (ΦL, ΨH, εR)
│   └── signals/           # 7-stage signal conditioning pipeline
├── patterns/
│   ├── architect/         # 7-stage planning pipeline (SURVEY→ADAPT)
│   ├── dev-agent/         # SCOPE→EXECUTE→REVIEW→VALIDATE pipeline
│   └── thompson-router/   # Bayesian model selection
├── constitutional/        # Rule engine, cascade prevention, evolution
├── memory/                # 4-stratum memory (ephemeral → institutional)
├── resilience/            # Circuit breaker with exponential backoff + jitter
├── graph/                 # Neo4j connection, schema, queries
├── types/                 # Core type definitions
└── index.ts               # Public API

scripts/                   # Self-hosting CLI — runs Architect on itself
tests/                     # 5 test levels: conformance, pipeline, safety
docs/                      # Specification corpus consumed by SURVEY
```

## Documentation

The `docs/` directory contains the full research and specification corpus:

- **`docs/specs/`** — Core specification (v3.0), engineering bridge, pattern designs, implementation plans
- **`docs/research/`** — Validated research papers covering spectral graph theory, cybernetic homeostasis, constitutional AI evolution, percolation theory, complex adaptive systems, and operational excellence mappings
- **`docs/hypotheses/`** — Pre-registered hypothesis tracking with validation status against implementation
- **`docs/journal/`** — Development journal: session notes, architectural decisions, lessons learned

## Research Foundation

This isn't a weekend project with a manifesto. The framework synthesises established research traditions into a governance architecture that — as far as we can determine through systematic literature review — hasn't been attempted as an integrated system:

- **Spectral graph theory** (Olfati-Saber) for consensus and coordination
- **Cybernetic homeostasis** (Pihlakas) for safety through dampening and hysteresis
- **Constitutional AI** (Anthropic) extended with formal evolution mechanisms
- **Percolation theory** for cascade safety with budget-capped dampening
- **Topological data analysis** for memory structure observability
- **Lean Six Sigma / Shingo Model** for operational excellence mappings

See [`docs/research/`](docs/research/) for the full corpus and [`docs/hypotheses/`](docs/hypotheses/) for validation tracking.

## The Heuristic Imperatives

Three meta-imperatives direct system evolution as gradient signals, not hard constraints:

| Imperative | Function |
| --- | --- |
| **Ω₁ — Reduce Suffering** | Minimise harm from failures, cascades, wasted resources |
| **Ω₂ — Increase Prosperity** | Distribute capability, reward contribution, expand access |
| **Ω₃ — Increase Understanding** | Make the invisible visible, the complex comprehensible |

These are coupled: when one plateaus, progress requires advancing another. Safety isn't constraining the recursion — it's generating it.

## Quick Start

```bash
# Clone
git clone https://github.com/rowenhodge-ops/Codex_signum.git
cd Codex_signum

# Install dependencies
npm install

# One-time setup: activate checked-in git hooks for any editor/agent
git config core.hooksPath .githooks

# Copy environment template and configure
cp .env.example .env
# Edit .env with your API keys and Neo4j credentials

# Run tests (no Neo4j required for most tests)
npm test

# Type check
npx tsc --noEmit

# Build
npm run build

# Run the Architect pipeline on itself (requires API keys + Neo4j)
npx tsx scripts/architect.ts plan "<your intent>"

# Run reconciliation report (no LLM, pure analysis)
npx tsx scripts/reconcile.ts
```

### As a dependency

```json
{
  "dependencies": {
    "@codex-signum/core": "github:rowenhodge-ops/Codex_signum#main"
  }
}
```

```typescript
import {
  computePhiL,
  computePsiH,
  computeEpsilonR,
  selectModel,
  recordOutcome,
  executePlan,
} from "@codex-signum/core";
```

## Consumer Application

[DND-Manager](https://github.com/rowenhodge-ops/DND-Manager) is a D&D character sheet manager that exercises the full Codex Signum pipeline — routing, architect decomposition, agent execution, and governance — as a working integration test.

## License

- **Specification** (`docs/specs/codex-signum-v3_0.md`): CC0 / Public Domain
- **Implementation**: Apache License 2.0 — see [LICENSE](LICENSE)

## Author

**Rowen Hodge** — [codexsignum.com](https://codexsignum.com)
