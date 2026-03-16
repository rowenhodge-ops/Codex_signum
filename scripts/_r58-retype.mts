import neo4j from 'neo4j-driver';
const d = neo4j.driver(process.env.NEO4J_URI!, neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!));
const s = d.session({ database: process.env.NEO4J_DATABASE });
try {
  // Step 1: Remove :Resonator, add :Bloom
  const r1 = await s.run('MATCH (n:Stage) WHERE n:Resonator REMOVE n:Resonator SET n:Bloom RETURN count(n) AS retyped');
  console.log('Step 1 — Retyped:', r1.records[0].get('retyped').toNumber(), 'Stage nodes from :Resonator to :Bloom');

  // Step 2: Update INSTANTIATES to point to Bloom definition
  const r2 = await s.run(`
    MATCH (n:Stage)-[old:INSTANTIATES]->(resDef:Seed {id: 'def:morpheme:resonator'})
    DELETE old
    WITH n
    MATCH (bloomDef:Seed {id: 'def:morpheme:bloom'})
    MERGE (n)-[:INSTANTIATES]->(bloomDef)
    RETURN count(n) AS rewired
  `);
  console.log('Step 2 — Rewired INSTANTIATES:', r2.records[0].get('rewired').toNumber(), 'edges to def:morpheme:bloom');

  // Step 3: Update content to reflect Bloom identity
  const r3 = await s.run(`
    MATCH (n:Stage)
    WHERE n.content IS NULL OR n.content CONTAINS 'stage:' OR n.content STARTS WITH 'Pipeline stage:'
    SET n.content = 'Pipeline stage Bloom — scope boundary containing model Resonator, prompt template, config Seeds, and observation Grid. Per Identity Map v2.0 constituent test: stages contain the things that transform, they do not transform themselves.'
    RETURN count(n) AS updated
  `);
  console.log('Step 3 — Updated content:', r3.records[0].get('updated').toNumber(), 'nodes');

  console.log('\nDone. All mutations complete.');
} catch(e) { console.error('ERROR:', e); } finally { await s.close(); await d.close(); }
