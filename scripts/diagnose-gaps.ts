/**
 * Diagnostic: what gaps does each Bloom produce?
 * Run: npx tsx scripts/diagnose-gaps.ts
 * Temporary — delete after analysis.
 */
import { readTransaction, closeDriver } from '../src/graph/client.js';
import { surveyBloomTopology } from '../src/patterns/cognitive/structural-survey.js';
import { queryTransformationDefinitions, computeConstitutionalDelta } from '../src/patterns/cognitive/constitutional-delta.js';

async function main() {
  const defs = await queryTransformationDefinitions();
  console.log(`Definitions: ${defs.length} active`);

  const blooms = await readTransaction(async (tx) => {
    const res = await tx.run(
      `MATCH (b:Bloom)-[:INSTANTIATES]->(def:Seed)
       WHERE def.seedType = 'bloom-definition'
         AND b.status IN ['active', 'planned']
         AND NOT b.id STARTS WITH 'M-'
         AND NOT b.id =~ '\\\\d{4}-\\\\d{2}-.*'
       RETURN b.id AS id`,
    );
    return res.records.map((r) => r.get('id') as string);
  });

  console.log(`Pattern Blooms to survey: ${blooms.length}`);
  console.log(`Blooms: ${blooms.join(', ')}\n`);

  let totalGaps = 0;
  const gapTypeTotals: Record<string, number> = {};

  for (const id of blooms) {
    try {
      const survey = await surveyBloomTopology(id);
      const scopes = ['ecosystem'];
      if (id.includes('architect')) scopes.push('architect');
      if (id.includes('cognitive')) scopes.push('cognitive');
      const scopedDefs = defs.filter((d) => scopes.includes(d.scope));
      const gaps = computeConstitutionalDelta(survey, scopedDefs, scopes);

      const byPrefix: Record<string, number> = {};
      for (const g of gaps) {
        const prefix = g.gapId.split(':').slice(0, 3).join(':');
        byPrefix[prefix] = (byPrefix[prefix] || 0) + 1;
        gapTypeTotals[prefix] = (gapTypeTotals[prefix] || 0) + 1;
      }
      totalGaps += gaps.length;
      console.log(`${id}: ${gaps.length} gaps ${JSON.stringify(byPrefix)}`);
    } catch (err) {
      console.log(`${id}: SURVEY FAILED — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`\n--- TOTALS ---`);
  console.log(`Total gaps (before dedup): ${totalGaps}`);
  console.log(`Gap types:`);
  for (const [k, v] of Object.entries(gapTypeTotals).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}`);
  }

  // Show unique gap IDs
  const uniqueIds = new Set<string>();
  for (const id of blooms) {
    try {
      const survey = await surveyBloomTopology(id);
      const scopes = ['ecosystem'];
      if (id.includes('architect')) scopes.push('architect');
      if (id.includes('cognitive')) scopes.push('cognitive');
      const scopedDefs = defs.filter((d) => scopes.includes(d.scope));
      const gaps = computeConstitutionalDelta(survey, scopedDefs, scopes);
      for (const g of gaps) uniqueIds.add(g.gapId);
    } catch { /* skip */ }
  }
  console.log(`\nUnique gap IDs after dedup would be: ${uniqueIds.size}`);
}

main().catch(console.error).finally(() => closeDriver());
