# Codex Signum — Core

> _A semantic encoding where state is structural._

**Version**: 0.1.0 (implements Codex Signum v3.0 specification)

---

## What Is This

Codex Signum is a formal compositional language for autonomous systems. Instead of configuring AI agents with YAML files and prompt templates, you describe **what things are** and the system derives **what to do** from structural properties.

Three state dimensions measure health continuously:

| Dimension              | Symbol | Measures                                     |
| ---------------------- | ------ | -------------------------------------------- |
| **Pattern Health**     | ΦL     | How well a composition performs its function |
| **Harmonic Signature** | ΨH     | How coherently components work together      |
| **Exploration Rate**   | εR     | Balance between exploitation and discovery   |

Ten axioms constrain behavior. Five grammar rules govern composition. Six morpheme types provide the building blocks. The graph IS the state.

## Architecture

```
src/
├── types/              # Morphemes, state dimensions, constitutional, memory
├── computation/        # ΦL, ΨH, εR, maturity, dampening, signal conditioning
├── graph/              # Neo4j client, schema, queries, health check, migration
├── memory/             # 4-strata memory system (ephemeral → institutional)
├── constitutional/     # Axiom evaluation, rule engine, ADR creation
├── patterns/
│   ├── thompson-router/ # Model routing (sampler, router, selectModel, cost)
│   ├── dev-agent/       # Pipeline (SCOPE→EXECUTE→REVIEW→VALIDATE)
│   └── observer/        # Validation, feedback, hypothesis evaluation
├── bootstrap.ts         # Agent arm seeding + informed priors
└── index.ts             # Public API exports

tests/
└── conformance/     # 115 tests verifying spec compliance
```

## Quick Start

```bash
# Install
npm install

# Run conformance tests
npm test

# Verbose test output
npm run test:conformance

# Build
npm run build

# Check Neo4j graph health (requires Neo4j connection)
npm run graph:check
```

## Consuming This Package

Add as a Git dependency in your project:

```json
{
  "dependencies": {
    "@codex-signum/core": "github:rowenhodge-ops/Codex_signum"
  }
}
```

Then import what you need:

```typescript
import {
  computePhiL,
  computePsiH,
  computeEpsilonR,
  route,
  EphemeralStore,
  evaluateConstitution,
} from "@codex-signum/core";
```

## State Dimensions

### ΦL (Pattern Health)

Weighted composite of axiom compliance, provenance clarity, usage success rate, and temporal stability — modulated by a two-component maturity factor:

```
ΦL_effective = (Σ wᵢ × fᵢ) × (1 - e^(-0.05 × observations)) × (1 - e^(-0.5 × connections))
```

### ΨH (Harmonic Signature)

Fiedler eigenvalue (algebraic connectivity) combined with runtime friction:

```
ΨH = 0.4 × normalize(λ₂) + 0.6 × (1 - friction)
```

### εR (Exploration Rate)

Thompson Sampling with floor enforcement and hysteresis:

```
εR = max(floor, exploratory_decisions / total_decisions)
```

## Memory System (4 Strata)

| Stratum | Type          | Lifecycle                            |
| ------- | ------------- | ------------------------------------ |
| 1       | Ephemeral     | Per-execution, auto-expires          |
| 2       | Observation   | Promoted from ephemeral, accumulates |
| 3       | Distillation  | Patterns extracted from observations |
| 4       | Institutional | Governance-level knowledge           |

Memory flows **upward only** (Stratum 1 → 4). Each promotion gate requires minimum volume and confidence.

## Constitutional Rules

Rules live in the graph as nodes with `GOVERNS` relationships to patterns. Three amendment tiers:

- **Tier 1**: Parameter refinement (weights, defaults)
- **Tier 2**: Structural refinement (axiom language, grammar exceptions)
- **Tier 3**: Foundational change (morphemes, axioms, grammar rules)

## Requirements

- Node.js 18+
- TypeScript 5.3+
- Neo4j Aura (for graph operations — computation works without it)

## License

MIT
