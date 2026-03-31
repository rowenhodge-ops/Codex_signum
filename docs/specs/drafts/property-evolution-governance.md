> **Projection document.** This is a human-readable projection of constitutional
> structures in the Codex Signum graph. The graph is the source of truth.
> See: `def:governance:property-evolution`

# Property Evolution Governance

## Governed Properties

Dimensional properties on LLM Bloom nodes follow the constitutional dimension set defined by `config:dimensional-phi-profiles`:

| Dimension | Property | Description |
|---|---|---|
| code | `phiL_code` | Code generation affinity |
| analysis | `phiL_analysis` | Analytical task affinity |
| creative | `phiL_creative` | Creative/open-ended task affinity |
| structured_output | `phiL_structured_output` | Structured output task affinity |
| classification | `phiL_classification` | Classification task affinity |
| synthesis | `phiL_synthesis` | Cross-task synthesis affinity |

All initialised at **0.0** on creation. 0.0 means "no evidence", not "absence".

## Update Rule

gamma-recursive update:

```
alpha_new = gamma * alpha_old + outcome
```

Where:
- `gamma = e^(-lambda * elapsed)` — temporal decay factor
- `lambda` is per-context, sourced from Config Seeds (`config:lambda:*`)
- `outcome` is the observation (1 for success, 0 for failure)

The decay IS the forgetting. gamma unifies memory decay with Discounted Thompson Sampling (DTS).

## Adding New Dimensions

New dimensions require a **Gnosis-mediated constitutional amendment cycle**:

1. Propose the dimension with evidence (what task type does it distinguish?)
2. Amendment review under the constitutional engine
3. If approved: add to `config:dimensional-phi-profiles`, initialise at 0.0 on all Blooms

Ad hoc property additions are prohibited. The dimension set is a constitutional concern, not an implementation detail.

## Relationship to Thompson Routing

Thompson sampling reads `weightedSuccesses` / `weightedFailures` from LLM Blooms. The dimensional profiles provide per-task-type context that can shape cold-start priors via `computeColdStartPriors()`:

- High code affinity → strong success prior for code tasks
- Low analysis affinity → weaker prior for analytical tasks
- No data (0.0) → uninformative prior
