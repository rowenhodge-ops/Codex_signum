# Gnosis Intent Quality Fix — Creation Layer Repairs

**Pipeline:** `[PIPELINE-PREP]` — fixes to the computation/creation layer that produces intents
**Intent:** Fix the root causes of duplicate, undifferentiated, and structurally blind intent generation. Three creation-layer bugs plus one missing lifecycle operation.

**HEAD at prompt time:** `a192542`
**Tests at prompt time:** 1,781 passing, 0 failing
**Exports at prompt time:** 333

---

## Architectural Framing

The first `gnosis plan` run after the strategic uplift produced 645 intent Seeds. Analysis revealed:

- 573 pattern-topology intents are **duplicates** — the same ~20 ecosystem gaps detected once per surveyed Bloom (33 Blooms × ~20 gaps ≈ 600)
- `def:bloom:assayer` shows as a gap despite being absorbed into Gnosis as CE faculty — because nobody ran the graph mutation to retire it. The decision lived in prose, not structure.
- All constitutional gaps score identically (40) — no differentiation by structural impact
- Related gaps ("create Thompson Resonator" + "create LLM Invocation Resonator" + ...) are atoms when the work is a molecule

All four problems are **creation layer bugs** — fixes belong in the computation functions, not in post-hoc cleanup or manual graph mutations from outside the structure.

---

## Grounding Documents

| Document | Location | What to read |
|---|---|---|
| Constitutional delta | `src/patterns/cognitive/constitutional-delta.ts` | `computeConstitutionalDelta()` — gap ID generation, set subtraction logic |
| Planning cycle | `src/patterns/cognitive/planning.ts` | `computeScopedDelta()` — per-Bloom loop that causes duplication |
| Instantiation Protocol | `src/graph/instantiation.ts` | `updateMorpheme()`, `createLine()`, `VALID_LINE_TYPES` |
| Planning types | `src/patterns/cognitive/planning-types.ts` | `PlanningIntent` — intent builder types |
| Cognitive types | `src/patterns/cognitive/types.ts` | `GapSeed` — gap ID field |

---

## Fix 1: `retireDefinition()` — Structural Lifecycle Operation

### Why

The Assayer was absorbed into Gnosis as the CE faculty at M-25. The roadmap, memory, and every context transfer say "retired." But the definition Seed `def:bloom:assayer` is still `status: 'active'` in the graph because there's no structural operation for absorption/supersession. Gnosis correctly reports "active definition with no instance = gap" — it's right, the data is wrong.

This will happen again. Definitions evolve, get absorbed, get replaced. The system needs a structural operation for this lifecycle transition, just as `stampBloomComplete()` exists for Bloom completion.

### Implementation

Add `retireDefinition()` to `src/graph/instantiation.ts`:

```typescript
/**
 * Retire a constitutional definition that has been superseded.
 * 
 * This is a lifecycle operation like stampBloomComplete() — it enforces
 * invariants structurally so absorption/supersession can't be forgotten.
 * 
 * 1. Validates definition Seed exists and is 'active'
 * 2. Validates superseding morpheme exists
 * 3. Sets status: 'retired' via updateMorpheme()
 * 4. Creates SUPERSEDED_BY Line from retired def to absorbing morpheme
 * 5. Returns any active instances still pointing at this definition
 *    (they're now orphaned — caller decides what to do)
 */
export async function retireDefinition(
  defId: string,
  supersededById: string,
  reason: string,
): Promise<{
  retired: boolean;
  orphanedInstances: string[];  // Nodes with INSTANTIATES → this def
}> {
  // 1. Validate definition exists and is active
  const defNode = await readTransaction(async (tx) => {
    const res = await tx.run(
      `MATCH (d:Seed {id: $defId})
       WHERE d.seedType IN ['transformation-definition', 'bloom-definition',
                             'grid-definition', 'helix-definition']
       RETURN d.status AS status`,
      { defId },
    );
    return res.records[0] ?? null;
  });

  if (!defNode) {
    throw new Error(`retireDefinition: definition '${defId}' not found`);
  }
  if (defNode.get("status") !== "active") {
    throw new Error(`retireDefinition: definition '${defId}' is not active (status: ${defNode.get("status")})`);
  }

  // 2. Validate superseding morpheme exists
  const superseder = await readTransaction(async (tx) => {
    const res = await tx.run(
      `MATCH (n {id: $supersededById}) RETURN n.id AS id`,
      { supersededById },
    );
    return res.records[0] ?? null;
  });

  if (!superseder) {
    throw new Error(`retireDefinition: superseding morpheme '${supersededById}' not found`);
  }

  // 3. Retire the definition
  await updateMorpheme(defId, {
    status: "retired",
    retiredReason: reason,
    retiredAt: new Date().toISOString(),
    supersededBy: supersededById,
  });

  // 4. Create SUPERSEDED_BY Line
  await createLine(defId, supersededById, "SUPERSEDED_BY", {
    label: "definition-retirement",
    reason,
  });

  // 5. Find orphaned instances
  const orphans = await readTransaction(async (tx) => {
    const res = await tx.run(
      `MATCH (n)-[:INSTANTIATES]->(d:Seed {id: $defId})
       WHERE n.status IN ['active', 'planned']
       RETURN n.id AS id`,
      { defId },
    );
    return res.records.map(r => r.get("id") as string);
  });

  return { retired: true, orphanedInstances: orphans };
}
```

### Add `SUPERSEDED_BY` to `VALID_LINE_TYPES`

In `src/graph/instantiation.ts`, add `'SUPERSEDED_BY'` to the `VALID_LINE_TYPES` array. This is a genuine structural relationship — it records a constitutional lifecycle event, not a monitoring overlay.

### Export

Export `retireDefinition` from the barrel in `src/graph/instantiation.ts` and `src/graph/index.ts`.

### First Use: Retire `def:bloom:assayer`

After the function is implemented, run:

```typescript
import { retireDefinition } from '../src/graph/instantiation.js';

const result = await retireDefinition(
  'def:bloom:assayer',
  'resonator:compliance-evaluation',
  'Absorbed into Gnosis as Compliance Evaluation faculty at M-25. The Assayer is not a separate Bloom — it is the CE Resonator inside the Gnosis Bloom.',
);

console.log('Retired:', result.retired);
console.log('Orphaned instances:', result.orphanedInstances);
```

Expected: `retired: true`, `orphanedInstances: []` (no active instances of Assayer exist).

**Also check for other stale definitions while you're here:**

```cypher
MATCH (cb:Bloom {id: 'constitutional-bloom'})-[:CONTAINS]->(def:Seed)
WHERE def.seedType IN ['transformation-definition', 'bloom-definition'] AND def.status = 'active'
RETURN def.id, def.name, def.scope
ORDER BY def.id
```

Report the full list. Any definitions that have been superseded by existing morphemes should be retired using the same function.

---

## Fix 2: Deterministic Gap IDs

### Why

Gap IDs are currently `gap:${survey.bloomId}:${counter}` — sequential per survey. The same structural gap discovered from different Bloom surveys gets different IDs. The persistence layer can't deduplicate because the IDs diverge.

A gap's identity IS its content — "def:transformation:thompson-selection has no instance" is the same gap regardless of which Bloom's survey found it.

### Implementation

In `src/patterns/cognitive/constitutional-delta.ts`, replace the `nextGapId()` function with deterministic ID generation based on gap content:

```typescript
// Replace this:
let gapCounter = 0;
const nextGapId = (): string => {
  gapCounter++;
  return `gap:${survey.bloomId}:${gapCounter}`;
};

// With content-based IDs inline at each gap creation site:
```

For each gap type, the ID encodes the gap's structural identity:

- Missing instance: `gap:missing-instance:${def.id}` (e.g., `gap:missing-instance:def:transformation:thompson-selection`)
- Empty stage: `gap:empty-stage:${child.id}` (e.g., `gap:empty-stage:stage:survey`)
- Missing line: `gap:missing-line:${child.id}:${lineType}` (e.g., `gap:missing-line:stage:dispatch:FLOWS_TO`)
- Topological (lambda2=0): `gap:topological:disconnected:${survey.bloomId}` (these ARE per-Bloom — disconnected components is a property of a specific Bloom)
- Topological (chain): `gap:topological:chain:${survey.bloomId}`
- Topological (weak): `gap:topological:weak:${survey.bloomId}`

The key principle: ecosystem-level gaps (missing definitions, missing instances) get IDs based on the definition. Per-Bloom gaps (lambda2, chain topology) get IDs based on the Bloom. This matches reality — a missing definition is a fact about the ecosystem, lambda2=0 is a fact about a specific Bloom.

---

## Fix 3: Ecosystem-Level Dedup in `computeScopedDelta()`

### Why

`computeScopedDelta()` in `planning.ts` surveys each pattern Bloom independently and calls `computeConstitutionalDelta()` for each. Ecosystem-scoped definitions get checked against every Bloom's local INSTANTIATES edges. "def:transformation:thompson-selection has no instance" is an ecosystem fact — checking it 33 times is the bug.

### Implementation

After the for-loop in `computeScopedDelta()` that collects `allGaps`, deduplicate by gap ID:

```typescript
async function computeScopedDelta(
  definitions: TransformationDef[],
): Promise<GapSeed[]> {
  const patternBlooms = await readTransaction(async (tx) => {
    // ... existing query ...
  });

  const allGaps: GapSeed[] = [];
  for (const bloomId of patternBlooms) {
    try {
      const survey = await surveyBloomTopology(bloomId);
      const relevantScopes = inferScopesForBloom(bloomId, definitions);
      const scopedDefs = definitions.filter((d) => relevantScopes.includes(d.scope));
      const gaps = computeConstitutionalDelta(survey, scopedDefs, relevantScopes);
      allGaps.push(...gaps);
    } catch {
      console.warn(`  [Planning] Survey failed for ${bloomId}, skipping`);
    }
  }

  // Deduplicate by gap ID (deterministic IDs from Fix 2 make this work)
  const seen = new Map<string, GapSeed>();
  for (const gap of allGaps) {
    if (!seen.has(gap.gapId)) {
      seen.set(gap.gapId, gap);
    }
  }

  return Array.from(seen.values());
}
```

With Fix 2's deterministic IDs, the same ecosystem gap from 33 surveys produces the same ID 33 times, and the Map keeps only the first. Per-Bloom gaps (topology) have Bloom-specific IDs and are preserved.

---

## Fix 4: Gap Clustering into Composite Intents

### Why

"Create Thompson Resonator" + "Create Human Gate Resonator" + "Create LLM Invocation Resonator" are three intents for one piece of work. The Architect will decompose the work — Gnosis should produce molecular intents, not atomic ones.

### Implementation

In `planning.ts`, after building all gap intents but before scoring, cluster related missing-instance gaps:

```typescript
function clusterGapIntents(intents: PlanningIntent[]): PlanningIntent[] {
  // Separate gap intents from non-gap intents
  const gapIntents = intents.filter(i => i.intentId.startsWith('plan:gap:missing-instance:'));
  const otherIntents = intents.filter(i => !i.intentId.startsWith('plan:gap:missing-instance:'));

  if (gapIntents.length <= 1) return intents;

  // Group missing-instance gaps by definition type prefix
  // def:transformation:* → one cluster ("missing ecosystem Resonators")
  // def:bloom:* → one cluster ("missing Bloom instances")
  // def:grid:* → one cluster
  // def:helix:* → one cluster
  const clusters = new Map<string, PlanningIntent[]>();
  for (const intent of gapIntents) {
    const defId = intent.targetDefId ?? '';
    let clusterKey: string;
    if (defId.startsWith('def:transformation:')) clusterKey = 'missing-transformation-instances';
    else if (defId.startsWith('def:bloom:')) clusterKey = 'missing-bloom-instances';
    else if (defId.startsWith('def:grid:')) clusterKey = 'missing-grid-instances';
    else if (defId.startsWith('def:helix:')) clusterKey = 'missing-helix-instances';
    else clusterKey = 'missing-other-instances';
    
    if (!clusters.has(clusterKey)) clusters.set(clusterKey, []);
    clusters.get(clusterKey)!.push(intent);
  }

  // Build composite intents from clusters
  const composites: PlanningIntent[] = [];
  for (const [clusterKey, members] of clusters) {
    if (members.length === 1) {
      // Single-member cluster: keep as-is
      composites.push(members[0]);
      continue;
    }

    // Build composite description listing all missing definitions
    const defNames = members
      .map(m => m.targetDefId ?? m.description)
      .join(', ');
    const composite: PlanningIntent = {
      intentId: `plan:cluster:${clusterKey}`,
      category: 'pattern-topology',
      description: `${members.length} missing ${clusterKey.replace(/-/g, ' ')}: ${defNames}. ` +
                   `These are related ecosystem gaps — instantiate as a group and wire FLOWS_TO Lines.`,
      priorityScore: 0, // Scored below
      justification: {
        gapType: 'constitutional',
        lambda2Delta: members.reduce((sum, m) => sum + (m.justification.lambda2Delta ?? 0), 0),
      },
      // Preserve the first member's architectIntent as base, append others
      architectIntent: `[Gnosis Planning] pattern-topology: Instantiate ${members.length} ${clusterKey.replace(/-/g, ' ')}. ` +
                       `Definitions: ${defNames}. Wire FLOWS_TO from relevant Stage Blooms to each.`,
    };
    composites.push(composite);
  }

  return [...composites, ...otherIntents];
}
```

Call `clusterGapIntents(intents)` after building all intents but before scoring. The composite intent carries the aggregate lambda2 delta and lists all member definitions, giving the Architect enough context to decompose the work properly.

---

## Fix 5: Clean Up Existing Duplicate Intent Seeds

### Why

645 intent Seeds exist in the graph from the first run. After Fixes 2-4, re-running `gnosis plan` would create ~60-80 new intents with correct deterministic IDs, but the 645 old ones with bloom-specific IDs would remain as orphans (the idempotency check looks for matching IDs, and the old IDs don't match the new ones).

### Implementation — Protocol-Compliant

Do NOT use raw DETACH DELETE. Use `updateMorpheme()` to mark all existing intent Seeds as `resolved` before the first post-fix plan run:

```typescript
import { updateMorpheme } from '../src/graph/instantiation.js';
import { readTransaction } from '../src/graph/client.js';

// Find all existing intent Seeds
const existingIntents = await readTransaction(async (tx) => {
  const res = await tx.run(
    `MATCH (cb:Bloom {id: 'cognitive-bloom'})-[:CONTAINS]->(i:Seed {seedType: 'intent'})
     WHERE i.status = 'proposed'
     RETURN i.id AS id`,
  );
  return res.records.map(r => r.get('id') as string);
});

console.log(`Resolving ${existingIntents.length} pre-fix intent Seeds...`);

for (let i = 0; i < existingIntents.length; i++) {
  try {
    await updateMorpheme(existingIntents[i], { status: 'resolved' });
    if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${existingIntents.length}`);
  } catch { /* non-fatal */ }
}

console.log('Done. Re-run gnosis plan to generate fresh intents with deterministic IDs.');
```

Run this AFTER implementing Fixes 1-4, BEFORE running `gnosis plan` again.

---

## Files Modified

| File | Change |
|---|---|
| `src/graph/instantiation.ts` | Add `retireDefinition()`, add `'SUPERSEDED_BY'` to `VALID_LINE_TYPES`, export |
| `src/graph/index.ts` | Export `retireDefinition` |
| `src/patterns/cognitive/constitutional-delta.ts` | Deterministic gap IDs based on content |
| `src/patterns/cognitive/planning.ts` | Dedup in `computeScopedDelta()`, gap clustering via `clusterGapIntents()` |

---

## Execution Order

1. Implement `retireDefinition()` + `SUPERSEDED_BY` Line type (Fix 1)
2. Fix gap ID generation in `constitutional-delta.ts` (Fix 2)
3. Add dedup in `computeScopedDelta()` (Fix 3)
4. Add gap clustering in `planning.ts` (Fix 4)
5. Retire `def:bloom:assayer` using the new function (Fix 1 first use)
6. Check all definitions for other stale entries — report full list for review
7. Resolve existing duplicate intent Seeds (Fix 5)
8. Re-run `gnosis plan --top=20` and report: total intents, category breakdown, top 20 descriptions

**GATE after step 6:** Report the full definition list before resolving duplicates. Ro reviews for other retirements.

---

## What NOT to Do

- Do NOT use DETACH DELETE for cleanup. Use `updateMorpheme(status: 'resolved')`. The Protocol applies to cleanup too.
- Do NOT manually set `def:bloom:assayer` status from outside. Use the new `retireDefinition()` function — that's the whole point.
- Do NOT hardcode which definitions to retire. The function takes parameters. The Assayer is the first use; others are identified by querying the graph.
- Do NOT change the scoring function in this prompt. Tier 2 (severity differentiation, enrichment targeting) comes after the first clean cycle proves the dedup works.
- Do NOT remove the per-Bloom survey loop in `computeScopedDelta()`. The per-Bloom topology gaps (lambda2, chain detection) ARE per-Bloom and should stay. Only the ecosystem-level gaps need dedup.

---

## Exit Criteria

1. `retireDefinition()` exists in `instantiation.ts` with validation, SUPERSEDED_BY Line, orphan detection
2. `SUPERSEDED_BY` in `VALID_LINE_TYPES`
3. `def:bloom:assayer` retired via the function, SUPERSEDED_BY → `resonator:compliance-evaluation`
4. Gap IDs are deterministic (same gap from different surveys = same ID)
5. `computeScopedDelta()` deduplicates by gap ID
6. Related missing-instance gaps clustered into composite intents
7. Old duplicate intent Seeds resolved (status: 'resolved')
8. Re-run of `gnosis plan` produces ~60-80 unique intents (not 645)
9. All existing tests pass
10. Full definition list reported for review

---

## Commit Message

```
fix(gnosis): Intent quality — retireDefinition, dedup, gap clustering

Four creation-layer fixes for intent generation quality:

1. retireDefinition() — structural lifecycle operation for definition
   absorption/supersession. Creates SUPERSEDED_BY Line. Like
   stampBloomComplete() for definition lifecycle transitions.
   First use: retire def:bloom:assayer (absorbed into Gnosis CE).

2. Deterministic gap IDs — based on content (def ID, child ID)
   not survey context (bloom ID + counter). Same gap from different
   surveys produces same ID.

3. Ecosystem-level dedup in computeScopedDelta() — Map by gap ID
   after collecting from all Bloom surveys. Drops 573 duplicates
   to ~20 unique ecosystem gaps.

4. Gap clustering — related missing-instance gaps grouped into
   composite intents. "5 missing transformation instances" instead
   of 5 separate "create X Resonator" intents.

All fixes are in the creation/computation layer. No manual graph
mutations from outside the structure.
```
