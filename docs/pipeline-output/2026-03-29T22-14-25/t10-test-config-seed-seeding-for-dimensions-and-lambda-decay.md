# Test Config Seed seeding for dimensions and lambda decay

> Task ID: t10
> Model: claude-opus-4-6:adaptive:medium
> Duration: 661187ms
> Output chars: 7217
> Timestamp: 2026-03-29T23:01:24.353Z

> **⚠️ Hallucination flags (5):**
> - [content/warning] Task t10 references "../../src/bootstrap.js" but this file was not in its context
> - [content/warning] Task t10 references "src/bootstrap.ts" but this file was not in its context
> - [content/warning] Task t10 references "src/config-seeds.ts" but this file was not in its context
> - [content/warning] Task t10 references "bootstrap.ts" but this file was not in its context
> - [content/warning] Task t10 references "bootstrap.test.ts" but this file was not in its context

---

# Analysis: Test Config Seed Seeding for Dimensions and Lambda Decay (t10)

## 1. Scope & Requirements

The test must verify **5 Config Seeds** that implement M-10.1 requirements 2 and 3:

| Config Seed ID | Type | Key Property | Expected Value |
|---|---|---|---|
| `config:dimensional-phi-profiles` | Dimensional | `dimensions` | `[code, analysis, creative, structured_output, classification, synthesis]` |
| `config:lambda:model-performance` | Lambda Decay | `halfLifeMs` | 216,000,000 (2.5 days) |
| `config:lambda:schema-definition` | Lambda Decay | `halfLifeMs` | 7,776,000,000 (90 days) |
| `config:lambda:threat-archive` | Lambda Decay | `halfLifeMs` | 1,814,400,000 (21 days) |
| `config:lambda:remedy-archive` | Lambda Decay | `halfLifeMs` | 7,776,000,000 (90 days) |

## 2. Millisecond Value Derivation

All half-life values must be expressed in milliseconds:

- **2.5 days**: `2.5 × 24 × 60 × 60 × 1000 = 216_000_000`
- **21 days**: `21 × 24 × 60 × 60 × 1000 = 1_814_400_000`
- **90 days**: `90 × 24 × 60 × 60 × 1000 = 7_776_000_000`

**Recommendation:** The test should assert exact values, not approximate ranges. The spec says "~2.5 days" etc., but the implementation should pin to exact day counts. If the implementation rounds differently (e.g., 2.5 days to some other precision), the test values must match exactly. Using numeric separator literals (`216_000_000`) improves readability.

**Finding:** The 90-day values for `schema-definition` and `remedy-archive` are identical (`7_776_000_000`). This is intentional per spec — both have the same ~90-day half-life but apply to different decay contexts.

## 3. Test Placement & Structure

### 3.1 File Location

The verification command is `npm run test -- bootstrap`, which pattern-matches against filenames. The existing file `tests/conformance/bootstrap.test.ts` already matches this pattern. The new test `describe` block should be **appended to this same file** to keep all bootstrap conformance assertions co-located and to avoid creating a second file that could cause ambiguity about which bootstrap test set is canonical.

### 3.2 Import Requirements

The existing file imports only `ALL_ARMS` from `../../src/bootstrap.js`. The new test will need access to Config Seed definitions. This implies:

- **Either** the Config Seeds are exported from the same `src/bootstrap.ts` module (e.g., as `CONFIG_SEEDS`, `DIMENSIONAL_PHI_PROFILES`, `LAMBDA_CONFIGS`, or a combined registry), **or**
- They live in a dedicated module (e.g., `src/config-seeds.ts`) that `bootstrap.ts` re-exports.

**Recommendation:** Follow the existing pattern — `ALL_ARMS` is a flat registry array. The Config Seeds should be similarly exported as a queryable collection (e.g., `CONFIG_SEEDS` as an array or map keyed by ID). The test should import and query by seed ID.

### 3.3 Prerequisite: Config Seed Source Must Exist

**Critical finding:** The existing `bootstrap.test.ts` tests only `ALL_ARMS`. There is no evidence in the provided context of Config Seed data structures existing yet. The Config Seed definitions (requirement 2 and 3 of M-10.1) must be **implemented first** before this test can pass. The test is a conformance gate for those implementations.

## 4. Test Design Recommendations

### 4.1 Dimensional Phi Profiles Test

```
describe block: "Config Seed: dimensional-phi-profiles"
```

- Query the seed by ID `config:dimensional-phi-profiles`
- Assert the seed exists (is not `undefined`)
- Assert it contains a `dimensions` property that is an array
- Assert the array has exactly **6** entries
- Assert each expected dimension is present: `code`, `analysis`, `creative`, `structured_output`, `classification`, `synthesis`
- **Consider ordering:** If dimension order is significant for downstream ΦL computation, assert order too. If not, use a set-based comparison.

**Finding:** The dimension list uses `structured_output` (snake_case) while others are single words. This is a potential consistency concern but matches the spec verbatim. The test should enforce this exact casing.

### 4.2 Lambda Decay Config Tests

```
describe block: "Config Seeds: lambda decay profiles"
```

For each of the 4 lambda configs:
- Query by full ID (e.g., `config:lambda:model-performance`)
- Assert existence
- Assert `halfLifeMs` (or whatever the property name is) equals the exact millisecond value
- Optionally assert the seed has a `type` or `category` field identifying it as a lambda decay config

**Recommendation:** Use parameterized/table-driven test style (e.g., `it.each` or a loop) to reduce boilerplate across the 4 lambda seeds while maintaining clear failure messages per seed.

### 4.3 Structural Assertions

Beyond the specific values, the test should assert:

- All 5 seeds have a consistent `id` field matching the `config:*` naming convention
- Lambda seeds follow the `config:lambda:*` namespace pattern
- No duplicate IDs exist among Config Seeds (mirrors the existing `ALL_ARMS` duplicate check)

## 5. Relationship to Other M-10.1 Tasks

| Dependency | Direction | Notes |
|---|---|---|
| Config Seed data definitions (impl) | **Blocks this test** | Seeds must be defined before test can import them |
| `assemblePatternHealthContext()` (req 4) | **Downstream consumer** | Will read dimensional profiles; this test validates the source data |
| `getDecayWeightedPosteriors()` (req 5) | **Downstream consumer** | Lambda decay values feed into γ-recursive posterior computation |
| Bloom node γ-recursive properties (req 1) | **Parallel** | Uses λ from these configs to compute `γ = e^(-λt)` where `λ = ln(2)/halfLifeMs` |

## 6. Edge Cases & Risks

1. **Large number precision:** `7_776_000_000` exceeds 32-bit integer range (max ~2.147B). The test must ensure these are stored and compared as 64-bit numbers (standard JS `number` is fine up to `Number.MAX_SAFE_INTEGER ≈ 9.007 × 10^15`). No risk here, but worth documenting.

2. **Duplicate half-life values:** `schema-definition` and `remedy-archive` share the same `halfLifeMs`. The test must query by **seed ID**, not by value, to avoid false passes.

3. **Naming convention consistency:** The dimensional seed uses `dimensional-phi-profiles` (kebab-case) while lambda seeds use `lambda:model-performance` (colon-separated namespace + kebab). The test should validate these exact IDs to catch any drift.

## 7. Summary of Recommendations

1. **Add a new `describe` block** to `tests/conformance/bootstrap.test.ts` rather than creating a separate file.
2. **Import Config Seeds** from `src/bootstrap.ts` (or wherever they'll be exported — this must be coordinated with the implementation task).
3. **Assert exact millisecond values**, not ranges, for all 4 lambda configs.
4. **Assert exact dimension strings** including `structured_output` casing for dimensional-phi-profiles.
5. **Use table-driven tests** for the 4 lambda configs to reduce duplication.
6. **Include a seed-existence guard assertion** (`expect(seed).toBeDefined()`) before property checks to produce clear error messages if the seed data hasn't been implemented yet.
7. **Ensure the implementation of Config Seed data structures is completed first** — this test is a verification gate, not a standalone deliverable.