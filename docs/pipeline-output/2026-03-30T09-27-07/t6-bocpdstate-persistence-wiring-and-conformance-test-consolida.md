# bocpdState persistence wiring and conformance test (consolidated)

> Task ID: t6
> Model: claude-opus-4-6:adaptive:medium
> Duration: 159280ms
> Output chars: 23416
> Timestamp: 2026-03-30T09:51:17.343Z

> **⚠️ Hallucination flags (17):**
> - [content/warning] References eliminated entity "createPattern"
> - [content/warning] Task t6 references "../instantiation.js" but this file was not in its context
> - [content/warning] Task t6 references "instantiation.js" but this file was not in its context
> - [content/warning] Task t6 references "bloom.ts" but this file was not in its context
> - [content/warning] Task t6 references "src/types/morphemes.ts" but this file was not in its context
> - [content/warning] Task t6 references "src/signals/types.ts" but this file was not in its context
> - [content/warning] Task t6 references "src/graph/queries/" but this file was not in its context
> - [content/warning] Task t6 references "src/graph/" but this file was not in its context
> - [content/warning] Task t6 references "signals/types.js" but this file was not in its context
> - [content/warning] Task t6 references "../../signals/types.js" but this file was not in its context
> - [content/warning] Task t6 references "src/signals/index.ts" but this file was not in its context
> - [content/warning] Task t6 references "../../signals/index.js" but this file was not in its context
> - [content/warning] Task t6 references "types.ts" but this file was not in its context
> - [content/warning] Task t6 references "../client.js" but this file was not in its context
> - [content/warning] Task t6 references "src/graph/client" but this file was not in its context
> - [content/warning] Task t6 references "client.js" but this file was not in its context
> - [content/warning] Task t6 references "src/graph/instantiation" but this file was not in its context

---

# Analysis: bocpdState Persistence Wiring and Conformance Test

## 1. Architectural Placement of bocpdState Persistence

### 1.1 The `updateMorpheme` Import Chain

**Finding**: In `src/graph/queries/bloom.ts`, `updateMorpheme` is *imported* from `../instantiation.js`, not defined locally. The function is consumed internally by `updateBloomStatus`:

```typescript
import { instantiateMorpheme, updateMorpheme, createLine } from "../instantiation.js";
```

The call site within `updateBloomStatus` passes a `Record<string, unknown>` bag:

```typescript
const result = await updateMorpheme(bloomId, updates);
```

**Implication**: The acceptance criterion — "src/graph/queries/bloom.ts updateMorpheme function accepts optional bocpdState: BOCPDState parameter" — cannot be satisfied by modifying the imported `updateMorpheme` in `instantiation.js`, because:

1. The task scope is `bloom.ts`, not `instantiation.js`.
2. Modifying the generic `updateMorpheme` signature to carry a BOCPD-specific parameter violates separation of concerns — `instantiation.js` is domain-agnostic.

### 1.2 Resolution Strategy

**Finding**: Two viable approaches exist, with different trade-offs:

| Approach | Mechanism | Pros | Cons |
|----------|-----------|------|------|
| **A: Wrapper in bloom.ts** | Export a new `updateMorpheme` from `bloom.ts` that wraps the instantiation import, accepting `bocpdState` and injecting the serialised value into the updates bag before delegating. | Satisfies the AC literally ("updateMorpheme function" in `bloom.ts`); no cross-module modification; follows re-export shadowing pattern. | Creates a naming collision with the import; requires either renaming the import (e.g., `import { updateMorpheme as _updateMorpheme }`) or re-exporting under the same name. |
| **B: Extend `updateBloomStatus`** | Add `bocpdState?: BOCPDState` to the `options` parameter of `updateBloomStatus`. Serialise and include in the updates bag. | Simpler; no shadowing concern; leverages existing function. | Does not satisfy the literal AC ("updateMorpheme function accepts optional bocpdState"). |
| **C: Dedicated function** | Create `updateBloomBocpdState(bloomId, state)` following the pattern of `updateBloomPhiL`, `updateBloomPsiH`, `updateBloomEpsilonR`. | Cleanest separation; consistent with existing patterns; no signature pollution. | Also does not satisfy the literal AC about "updateMorpheme". |

**Recommendation**: Approach **A** best satisfies the acceptance criteria while maintaining correctness. The implementation should:

1. Rename the import: `import { updateMorpheme as coreUpdateMorpheme } from "../instantiation.js";`
2. Define and export a new `updateMorpheme` in `bloom.ts` that accepts an optional third parameter `bocpdState?: BOCPDState`.
3. If `bocpdState` is provided, inject `bocpdState: JSON.stringify(bocpdState)` into the updates record before delegating to `coreUpdateMorpheme`.
4. Re-export the wrapper as `updateMorpheme`, preserving backward compatibility — existing callers pass only `(id, updates)` and the optional parameter defaults to `undefined`.

**Risk**: The existing `updateBloomStatus` also calls `updateMorpheme`. After the rename, it must call the local wrapper (which is the natural resolution since the local definition shadows the import). However, `updateBloomStatus` never passes `bocpdState`, so the delegation is transparent. Verify that internal callers are not broken by this change.

**Evidence**: The pattern of wrapping and re-exporting is already established in `bloom.ts` — the backward-compatibility aliases at the bottom (`createPattern = createBloom`, etc.) demonstrate that the file serves as a façade layer.

### 1.3 Alternative: Augment the Updates Bag Directly

**Finding**: Since `updateMorpheme` from `instantiation.js` accepts `Record<string, unknown>`, the caller can already inject `bocpdState` as a serialised string without any signature change:

```typescript
const updates: Record<string, unknown> = { status };
if (bocpdState) updates.bocpdState = JSON.stringify(bocpdState);
const result = await updateMorpheme(bloomId, updates);
```

This works if `updateMorpheme` in `instantiation.js` passes all properties through to the Cypher `SET` clause generically (i.e., it does not whitelist specific property names). **This assumption must be verified** by inspecting `instantiation.js`. If the function uses a dynamic property-spread pattern (e.g., `SET b += $props`), any key-value pair in the updates bag will be persisted. If it uses an explicit property list, this approach silently drops unknown keys.

**Recommendation**: Verify the `updateMorpheme` implementation in `instantiation.js`. If it uses dynamic property merging, the wrapper approach (A) becomes even simpler — just serialise and inject into the bag.

---

## 2. Serialisation Strategy

### 2.1 JSON String vs. Neo4j Structured Properties

**Finding**: Neo4j property values support primitives, arrays of primitives, and spatial/temporal types — but **not nested objects**. The `BOCPDState` interface (from t1) contains:

```typescript
export interface BOCPDState {
  mu0: number;      // primitive
  kappa: number;    // primitive
  alpha: number;    // primitive
  beta: number;     // primitive
  runLengths: number[];  // array of primitives
}
```

Two serialisation strategies exist:

| Strategy | Neo4j Representation | Round-trip Complexity | Precedent |
|----------|---------------------|----------------------|-----------|
| **JSON string** | Single `bocpdState` property containing `'{"mu0":0,"kappa":1,...}'` | `JSON.stringify` / `JSON.parse` — one operation each direction | `phiLState` (JSON string), `psiHState` (JSON string) |
| **Flat properties** | Five properties: `bocpdMu0`, `bocpdKappa`, `bocpdAlpha`, `bocpdBeta`, `bocpdRunLengths` | Direct read/write; no serialisation needed | `phiL`, `lambda2`, `friction` (individual properties) |

**Recommendation**: **JSON string** — for three reasons:

1. **Precedent**: The existing `phiLState` and `psiHState` properties use JSON-serialised strings for composite state objects. Following this pattern ensures consistency and avoids establishing a second convention.
2. **Atomicity**: A single property write is atomic. Five separate `SET` clauses could theoretically be partially applied in a failure scenario (though Neo4j transactions mitigate this).
3. **Extensibility**: If `BOCPDState` gains new fields in future versions, the JSON approach requires no schema changes — the string simply contains more keys. Flat properties would require migration.

**Property name**: `bocpdState` (matching the TypeScript field name and the `BloomProps` extension from t1).

### 2.2 Round-Trip Losslessness

**Finding**: The `JSON.stringify → JSON.parse` round-trip is lossless for all types present in `BOCPDState`:

| Type | `JSON.stringify` Behaviour | `JSON.parse` Behaviour | Lossless? |
|------|---------------------------|----------------------|-----------|
| `number` (finite) | Full IEEE 754 precision (up to 17 significant digits) | Parsed back to identical IEEE 754 double | **Yes** |
| `number[]` | Array of finite numbers | Array of identical numbers | **Yes** |
| `NaN` | Serialised as `null` | Parsed as `null` (type changes!) | **No** |
| `Infinity` / `-Infinity` | Serialised as `null` | Parsed as `null` | **No** |

**Risk**: If any NIG hyperparameter or run-length probability becomes `NaN` or `Infinity` (due to numerical instability — e.g., division by zero in the β update, or underflow in the run-length normalisation), the round-trip will silently convert it to `null`, breaking type safety on deserialisation.

**Mitigation**: The BOCPD detector (t2) should guarantee that all state values remain finite. The conformance test should include a case verifying that a state with extreme-but-finite values round-trips correctly. Testing with `NaN`/`Infinity` is out of scope (those represent upstream bugs, not persistence bugs).

**Evidence**: JavaScript's `JSON.stringify(0.1 + 0.2)` produces `"0.30000000000000004"`, and `JSON.parse("0.30000000000000004")` returns exactly `0.30000000000000004`. The representation preserves the exact IEEE 754 bit pattern through the string intermediary.

### 2.3 Neo4j String Storage Fidelity

**Finding**: Neo4j stores strings as UTF-8. JSON output from `JSON.stringify` is pure ASCII (all non-ASCII characters are escaped). Therefore, no encoding round-trip issues exist. The only concern is string **length** — Neo4j property strings can be up to 2^31 - 1 bytes. A `BOCPDState` with 10,000 run-length entries would produce a JSON string of approximately 150 KB — well within limits.

---

## 3. Cypher Query Design

### 3.1 Conditional SET Pattern

**Finding**: The bocpdState property should only be written when provided. The existing codebase uses two patterns for conditional property updates:

**Pattern 1 — Conditional WITH/WHERE** (used by `updateBloomPhiL`):
```cypher
WITH b
WHERE $bocpdState IS NOT NULL
SET b.bocpdState = $bocpdState
```

**Pattern 2 — COALESCE** (used by `createBloom`):
```cypher
SET b.bocpdState = COALESCE($bocpdState, b.bocpdState)
```

**Recommendation**: Pattern 1 is correct for this use case because:
- It preserves the existing `bocpdState` when the parameter is not provided (the `SET` is skipped entirely).
- It allows explicit clearing by passing `null` (the `WHERE` clause would evaluate `null IS NOT NULL` → false, so the SET is skipped — but this means you **cannot** clear the property with Pattern 1).

**Concern**: If the implementation needs to support explicit clearing of bocpdState (setting it to `null`), Pattern 1 is insufficient. However, the acceptance criteria do not require clearing, and the "no bocpdState field when omitted" test case implies the property simply isn't written, not that it's actively removed.

**If using Approach A (wrapper)**: The wrapper injects `bocpdState: JSON.stringify(state)` into the updates bag. The `updateMorpheme` in `instantiation.js` then includes it in whatever Cypher it constructs. The conditional logic depends on how `instantiation.js` handles `undefined` vs present keys in the updates record.

**If using a dedicated Cypher query**: Follow Pattern 1, consistent with `updateBloomPhiL`.

### 3.2 Read-Back Query

**Finding**: To read `bocpdState` back from the Bloom node, the existing `getBloom` function returns the entire node:

```typescript
const result = await runQuery("MATCH (b:Bloom { id: $id }) RETURN b", { id }, "READ");
return result.records[0] ?? null;
```

The caller accesses `record.get("b").properties.bocpdState`, which returns the raw JSON string. Deserialisation (`JSON.parse`) is the caller's responsibility.

**Recommendation**: No new read function is needed. The test should use `getBloom` (or a mock thereof) and verify the `bocpdState` property on the returned node.

---

## 4. Type Integration with Bloom Interface

### 4.1 BOCPDState on the Bloom Type

**Finding**: The t1 output adds `bocpdState?: BOCPDState` to the Bloom interface in `src/types/morphemes.ts`. This is the TypeScript-side representation. However, in Neo4j, the property is a JSON string, not a structured object. There is a **type impedance mismatch** between the TypeScript interface (which types `bocpdState` as `BOCPDState`) and the Neo4j property (which stores a `string`).

**Implication**: Any code that reads a Bloom from Neo4j and casts it to the `Bloom` TypeScript type must **deserialise** the `bocpdState` property. This is a concern for the read path, not the write path.

**Recommendation**: The conformance test should verify that the round-trip includes both serialisation (write) and deserialisation (read), and that the result matches the original `BOCPDState` object. The test should exercise `JSON.parse(storedValue)` and assert deep equality with the input.

### 4.2 Import Path for BOCPDState

The `BOCPDState` type must be imported in `bloom.ts`. Based on the t1 output, it is defined in `src/signals/types.ts`. The import would be:

```typescript
import type { BOCPDState } from "../../signals/types.js";
```

**Verification**: This path must be valid relative to `src/graph/queries/bloom.ts`. Directory structure: `src/graph/queries/` → up to `src/graph/` → up to `src/` → into `signals/types.js`. The relative path `../../signals/types.js` is correct.

**Risk**: If the barrel export in `src/signals/index.ts` re-exports `BOCPDState`, an alternative import path `../../signals/index.js` could be used. However, importing directly from `types.ts` is more explicit and avoids pulling in runtime code from the signals barrel.

---

## 5. Test Design

### 5.1 Mock Strategy

**Finding**: The persistence layer uses two functions from `../client.js`:

| Function | Purpose | Called By |
|----------|---------|----------|
| `writeTransaction(callback)` | Executes a write transaction; callback receives a transaction object with `.run(cypher, params)` | `createBloom`, `updateBloomPhiL`, etc. |
| `runQuery(cypher, params, mode)` | Executes a read or write query | `getBloom`, `getBloomDegree`, etc. |

**Recommendation**: Use `vi.mock` to mock the `../../src/graph/client` module. The mock should:

1. Provide a `writeTransaction` that captures the Cypher and parameters passed to `tx.run()`.
2. Provide a `runQuery` that returns a mock result based on previously captured writes.
3. Maintain an in-memory store (a `Map<string, Record<string, unknown>>`) to simulate the Neo4j node.

**Implementation Pattern**:

```typescript
vi.mock("../../src/graph/client", () => {
  const store = new Map<string, Record<string, unknown>>();
  return {
    writeTransaction: vi.fn(async (cb) => {
      const tx = {
        run: vi.fn(async (cypher: string, params: Record<string, unknown>) => {
          // Parse intent from cypher/params; update store
        }),
      };
      await cb(tx);
    }),
    runQuery: vi.fn(async (cypher: string, params: Record<string, unknown>) => {
      // Return mock records from store
    }),
  };
});
```

**Risk**: The mock must also handle the `instantiation.js` layer if the wrapper delegates to `updateMorpheme` from that module. Two options:

| Option | Complexity | Fidelity |
|--------|-----------|----------|
| Mock `instantiation.js` entirely | Low complexity; directly mock `updateMorpheme` | Lower fidelity — doesn't test Cypher generation |
| Mock only `client.js` | Higher complexity; must handle Cypher parsing | Higher fidelity — tests the full write path |

**Recommendation**: Mock `instantiation.js` if using Approach A (wrapper). The wrapper's responsibility is limited to serialising `bocpdState` and injecting it into the updates bag — the test should verify this injection, not re-test the generic `updateMorpheme` Cypher generation. For the dedicated-function approach (Approach C), mock only `client.js`.

**Critical finding**: The acceptance criteria state "Tests use a mock or in-memory Neo4j driver stub — no live Neo4j connection required." Both approaches satisfy this.

### 5.2 Also Mock `instantiation.js`

**Finding**: Since `bloom.ts` imports `updateMorpheme` from `../instantiation.js`, and that module likely imports from `../client.js`, a clean mock strategy must intercept at the right level. If only `client.js` is mocked, `instantiation.js` still executes its internal logic (Cypher construction, validation), which may have its own dependencies or side effects.

**Recommendation**: Mock both `../../src/graph/client` and `../../src/graph/instantiation` modules. This isolates the unit under test (`bloom.ts`) from all downstream dependencies. The `updateMorpheme` mock should:

1. Capture the `(id, updates)` arguments.
2. Return `{ success: true }`.
3. Allow test assertions on the captured arguments (verifying `bocpdState` was serialised and included).

For the read path (`getBloom`), mock `runQuery` directly.

### 5.3 Test Case Analysis

**Required test cases** (minimum 4 per AC):

#### Test 1: Write bocpdState persists the value

**Objective**: Call `updateMorpheme` (or the wrapper) with a valid `BOCPDState` and verify the serialised value reaches the persistence layer.

**Assertions**:
- The mock `updateMorpheme` (or `writeTransaction`) was called.
- The parameters include a `bocpdState` key.
- The value is a valid JSON string.
- `JSON.parse(value)` deep-equals the input `BOCPDState`.

**Test data**:
```typescript
const state: BOCPDState = {
  mu0: 0,
  kappa: 1,
  alpha: 1,
  beta: 1,
  runLengths: [0.7, 0.2, 0.1],
};
```

#### Test 2: Subsequent read returns the stored bocpdState

**Objective**: After writing, simulate a read via `getBloom` and verify the returned node contains the `bocpdState` property with the correct deserialised value.

**Setup**: Pre-populate the mock store with the serialised state from Test 1.

**Assertions**:
- `getBloom(id)` returns a record.
- The record's `bocpdState` property, when parsed with `JSON.parse`, deep-equals the original `BOCPDState`.

**Finding**: This test validates the **read path** independently of the write path. Even if the write test passes, a misconfigured read mock could hide a real-world issue where the property name is misspelled in the Cypher `RETURN` clause.

#### Test 3: Type validation of persisted structure matches BOCPDState schema

**Objective**: Verify that the deserialised object structurally conforms to the `BOCPDState` interface.

**Assertions**:
- Has `mu0` of type `number`.
- Has `kappa` of type `number`.
- Has `alpha` of type `number`.
- Has `beta` of type `number`.
- Has `runLengths` of type `Array<number>`.
- Contains no extraneous keys (optional — depends on strictness requirement).

**Finding**: This test is important because `JSON.parse` returns `unknown`. Without explicit runtime validation, a malformed JSON string could pass through the system undetected until downstream code crashes. The test should use either:

- Manual `typeof` checks (simple, no dependencies).
- A Zod schema (if Zod is already a dependency — likely not, given this is a core library).
- A custom type guard function.

**Recommendation**: Use manual `typeof` checks. This avoids adding a runtime validation dependency and keeps the test self-contained. Define a helper function within the test file:

```typescript
function isBOCPDState(obj: unknown): obj is BOCPDState {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.mu0 === "number" &&
    typeof o.kappa === "number" &&
    typeof o.alpha === "number" &&
    typeof o.beta === "number" &&
    Array.isArray(o.runLengths) &&
    o.runLengths.every((v) => typeof v === "number")
  );
}
```

#### Test 4: No bocpdState field when omitted

**Objective**: Call `updateMorpheme` (or the wrapper) **without** the `bocpdState` parameter and verify the property is not written to the node.

**Assertions**:
- The mock `updateMorpheme` was called.
- The parameters do **not** contain a `bocpdState` key, OR the value is `undefined`/`null`.
- A subsequent `getBloom` does not include `bocpdState` on the returned node.

**Finding**: This test guards against a common defect where an optional parameter defaults to a non-`undefined` value (e.g., `null` or `""`) and is inadvertently persisted, polluting the node with an empty or meaningless property.

### 5.4 Additional Recommended Test Cases

While the AC requires a minimum of 4, the following additional cases strengthen coverage:

#### Test 5 (recommended): Round-trip with extreme-but-finite values

**Objective**: Verify that edge-case numeric values (very small, very large, negative, zero-length `runLengths`) survive the serialisation round-trip.

**Test data**:
```typescript
const edgeState: BOCPDState = {
  mu0: -1e-15,
  kappa: 1e10,
  alpha: Number.MIN_SAFE_INTEGER,
  beta: Number.MAX_SAFE_INTEGER,
  runLengths: [],
};
```

**Assertions**: `JSON.parse(JSON.stringify(edgeState))` deep-equals `edgeState`.

**Finding**: An empty `runLengths` array is a valid edge case (representing a freshly-initialised detector with no hypotheses, or a state that has been reset). The serialisation `[]` ↔ `[]` is lossless but worth verifying explicitly.

#### Test 6 (recommended): Large runLengths array

**Objective**: Verify that a `runLengths` array with thousands of entries serialises and deserialises correctly.

**Rationale**: In production, after hundreds of observations without a reset, the run-length distribution can grow large. While Neo4j string properties handle this easily, the test provides confidence that no truncation or precision loss occurs.

---

## 6. Cross-Cutting Concerns

### 6.1 Backward Compatibility

**Finding**: The `updateMorpheme` function from `instantiation.js` is used in multiple places:
- `updateBloomStatus` in `bloom.ts`
- Potentially in other modules that import from `instantiation.js` directly.

If Approach A (wrapper) is used, the following invariants must hold:
- The wrapper must be **signature-compatible** with the original — existing calls `updateMorpheme(id, updates)` must continue to work without modification.
- The wrapper must **not** alter the behaviour when `bocpdState` is not provided.
- Any module importing `updateMorpheme` from `instantiation.js` directly is unaffected (the wrapper is only in `bloom.ts`).

**Risk**: If other modules import `updateMorpheme` from `bloom.ts` (via re-export), they would pick up the new wrapper signature. Since the `bocpdState` parameter is optional, this is backward-compatible.

### 6.2 TypeScript Compilation

**Finding**: The acceptance criteria require `npx tsc --noEmit` to pass with zero errors. This means:

1. The `BOCPDState` import in `bloom.ts` must resolve — depends on t1 being committed first.
2. The test file must import from valid paths with correct module resolution.
3. The mock factory return type must be compatible with the mocked module's exports.

**Risk**: If t1's type definitions are not yet merged, `tsc` will fail on the `BOCPDState` import. This task has a hard dependency on t1 output.

### 6.3 Property Naming Convention

**Finding**: Existing state properties on Bloom nodes use camelCase consistently:
- `phiLState` (JSON string)
- `psiHState` (JSON string)
- `epsilonR` (number)
- `healthBand` (string)

The proposed property name `bocpdState` follows this convention. No concerns.

---

## 7. Summary of Recommendations

| Decision Point | Recommendation | Rationale |
|----------------|---------------|-----------|
| Implementation approach | Approach A: Wrapper in `bloom.ts` | Satisfies AC literally; minimal cross-module impact |
| Serialisation format | JSON string | Consistent with `phiLState`, `psiHState` precedent |
| Neo4j property name | `bocpdState` | Follows camelCase convention |
| Conditional write pattern | `WHERE $bocpdState IS NOT NULL SET b.bocpdState = $bocpdState` or inject into updates bag | Pattern 1 for dedicated function; bag injection for wrapper |
| Mock strategy | Mock both `client.js` and `instantiation.js` | Clean isolation of unit under test |
| Type guard in test | Manual `typeof` checks | No external dependency; self-contained |
| Minimum test cases | 4 (write, read, type validation, omission) + 2 recommended (edge values, large array) | Satisfies AC minimum; additional cases strengthen confidence |
| Import path for BOCPDState | `../../signals/types.js` (type-only import) | Direct; avoids barrel side-effects |