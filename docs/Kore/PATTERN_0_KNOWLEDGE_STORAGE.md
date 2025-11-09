---
document-type: architecture
status: 🟢 Active
version: 1.0
created: 2025-11-10
last-updated: 2025-11-10
author: Collaborative
related-documents:
  - ARCHITECTURE_PATTERNS.md
  - ARCHITECTURE_ASSESSMENT.md
  - HYBRID_RAG_DESIGN.md
  - SEMANTIC_KNOWLEDGE_GRAPH.md
  - ../Codex Standards/PHASE_3_IMPLEMENTATION_PLAN.md
tags:
  - pattern-0
  - knowledge-storage
  - decision-matrix
  - vector-vs-graph
  - progressive-enhancement
---

# Pattern 0: Knowledge Storage Decision Matrix

**Purpose**: Resolve ARCHITECTURE_ASSESSMENT Issue #1 (CRITICAL) - Define authoritative knowledge storage strategy

**Scope**: 3-phase progressive enhancement from Obsidian wiki-links → vector + typed edges → Neo4j graph intelligence

---

## Executive Summary

**Critical Issue Resolved**: ARCHITECTURE_PATTERNS.md conflated two fundamentally different storage paradigms:

- **Vector Database** (AlloyDB/Pinecone): Similarity search ("what is _like_ this?")
- **Semantic Graph** (Neo4j/RDF): Formal logic and reasoning ("how is this _related_ to this?")

**Decision**: Use **progressive enhancement** strategy - start simple, scale to complexity as data volume and use cases justify investment.

---

## Decision: 3-Phase Progressive Enhancement

### Phase 2 (Current - Obsidian MVP) ✅ COMPLETE

**Technology**: Obsidian wiki-links + YAML frontmatter + Dataview queries

**Capabilities**:

- Tag-based queries (`FROM #engagement WHERE stakeholder-type = "C2"`)
- 1-hop wiki-link traversal
- Manual relationship tracking
- 50+ notes captured with 8 production templates

**Limitations**:

- No semantic search (can't find "similar" notes)
- No multi-hop reasoning (can't discover indirect relationships)
- No typed relationships (all links are generic `[[reference]]`)

**Status**: ✅ Complete (Phase 2C committed Nov 10, 2025)

**Next**: Transition to Phase 3A

---

### Phase 3A-B (Weeks 1-4 - Hybrid Vector + Typed Edges)

**Technology**: Pinecone vectors + Firestore typed edges + Obsidian sync

**Architecture**:

```
Obsidian (authoring) → Firestore (structured storage) → Pinecone (semantic search)
                    ↓
            Neo4j (strategic queries - deferred to 3C)
```

**Capabilities Unlocked**:

1. **Semantic Search**: "Find engagements similar to this stakeholder conversation"
2. **Citation-Backed RAG**: Vector prefilter → context assembly with source links
3. **Typed Relationships**: `BUILDS_UPON`, `VALIDATES`, `CONTRADICTS`, `APPLIES_LEARNING`
4. **2-3 Hop Traversal**: Follow relationship chains in Firestore

**Implementation**:

```typescript
// Firestore document structure
interface Note {
  id: string;
  title: string;
  markdown: string;
  cells: Record<string, CellContent>; // Extracted from <!-- CELL: --> markers
  edges: TypedEdge[]; // Inferred from wiki-links + cell context
  embedding?: number[]; // 1536-dim vector from Pinecone
  tags: string[];
  frontmatter: Record<string, any>;
}

interface TypedEdge {
  target: string; // Note ID
  type: EdgeType; // BUILDS_UPON, VALIDATES, CONTRADICTS, etc.
  confidence: number; // 0.0-1.0
  inferred: boolean; // true if AI-inferred, false if explicit
  source_cell?: string; // Which cell contained this relationship
}

type EdgeType =
  | "REFERENCES" // Generic link
  | "BUILDS_UPON" // Learning builds on prior learning
  | "VALIDATES" // Research confirms T2/T3 hypothesis
  | "CONTRADICTS" // Conflicting information
  | "APPLIES_LEARNING" // Engagement applies learning principle
  | "TARGETS" // Engagement relates to target organization
  | "INVOLVES_STAKEHOLDER"; // Engagement involves person
```

**Hybrid RAG Pipeline**:

```text
User Query: "What have I learned about C4 economic buyers?"
    ↓
1. Embed query (1536-dim vector)
    ↓
2. Pinecone similarity search (Top 20 candidates)
    ↓
3. Firestore edge traversal (expand to related notes)
    ↓
4. Fusion & rerank (combine vector scores + graph proximity)
    ↓
5. Context assembly (markdown + cell extracts + citations)
    ↓
6. LLM synthesis with source attribution
```

**Limitations**:

- Can't do complex graph queries (warm intro paths require 4+ hops)
- Limited relationship inference (basic pattern matching)
- No strategic intelligence (pipeline concentration, learning impact analysis)

**Investment**:

- Pinecone Starter: $70/month (1M vectors, managed)
- Firebase Firestore: $25/month (real-time sync, serverless)
- **Total**: $95/month

**Status**: 🔴 Not Started (Sprint 1 Week 1-2)

---

### Phase 3C-D (Weeks 5-12 - Neo4j Graph Intelligence)

**Technology**: Neo4j Aura + Pinecone text index + Firestore real-time sync

**Architecture**:

```
Obsidian (authoring) → Firestore (sync layer) → Neo4j (graph primary)
                                              ↘ Pinecone (text index)
```

**Capabilities Unlocked**:

1. **Multi-Hop Reasoning**: Find warm intro paths (4+ hops, relationship-weighted)
2. **Strategic Queries**: Pipeline concentration, learning impact correlation
3. **Entity Resolution**: Merge duplicate stakeholders across notes
4. **Pattern Discovery**: Emergent relationships via graph algorithms (PageRank, community detection)
5. **Temporal Analysis**: How relationships evolve over time

**Neo4j Schema**:

```cypher
// Node types
(:Note {type: 'engagement|stakeholder|target|learning|insight'})
(:Stakeholder {type: 'C1|C2|C3|C4'})
(:Target {status: 'research|qualified|engaged|client'})
(:Learning {validation_status: 'untested|validated|superseded'})

// Relationship types (with properties)
(:Note)-[:REFERENCES {confidence: 0.8}]->(:Note)
(:Note)-[:BUILDS_UPON {reasoning: "..."}]->(:Learning)
(:Note)-[:VALIDATES {confirmed_at: date()}]->(:Target)
(:Stakeholder)-[:WORKS_AT {since: date()}]->(:Target)
(:Stakeholder)-[:KNOWS {strength: 'weak|medium|strong'}]->(:Stakeholder)
(:Learning)-[:APPLIED_IN {outcome: 'success|failure'}]->(:Note)
```

**Strategic Queries Enabled**:

```cypher
// Query 1: Warm intro path to C4 buyer
MATCH path = shortestPath(
  (me:Stakeholder {name: 'Principal'})
  -[:KNOWS*1..4]-
  (buyer:Stakeholder {type: 'C4'})
)
WHERE buyer.last_contact < date() - duration({days: 60})
  AND (buyer)-[:WORKS_AT]->(:Target {status: 'research'})
RETURN path, length(path) as hops
ORDER BY hops ASC, buyer.influence DESC
LIMIT 10;

// Query 2: Learning impact correlation
MATCH (l:Learning)-[:APPLIED_IN]->(e:Note {type: 'engagement'})
WHERE e.cta_success IS NOT NULL
WITH l, avg(CASE WHEN e.cta_success THEN 1.0 ELSE 0.0 END) as success_rate
WHERE success_rate > 0.7
RETURN l.principle, success_rate, count(*) as applications
ORDER BY success_rate DESC;

// Query 3: Stale targets with warm intro paths
MATCH (t:Target)
WHERE t.last_updated < date() - duration({days: 30})
  AND t.status IN ['engaged', 'qualified']
OPTIONAL MATCH path = shortestPath(
  (:Stakeholder {name: 'Principal'})
  -[:KNOWS*1..3]-
  (contact)-[:WORKS_AT]->(t)
)
RETURN t.name, t.priority, length(path) as intro_hops, contact.name
ORDER BY t.priority DESC, intro_hops ASC;
```

**Agent Queries** (Auditor, Researcher, Strategist):

```python
# Auditor Agent - System Health
def query_stale_targets(session):
    """Find targets not updated in 30+ days, prioritized by pipeline value"""
    result = session.run("""
        MATCH (t:Target)
        WHERE t.last_updated < date() - duration({days: 30})
          AND t.status IN ['engaged', 'qualified']
        RETURN t.name, t.priority, t.estimated_value,
               duration.inDays(t.last_updated, date()).days as staleness
        ORDER BY t.priority DESC, staleness DESC
        LIMIT 10
    """)
    return [dict(record) for record in result]

# Researcher Agent - Validation Discovery
def find_contradictions(session, target_id):
    """Find conflicting information about a target"""
    result = session.run("""
        MATCH (n1:Note)-[:VALIDATES]->(t:Target {id: $target_id})
        MATCH (n2:Note)-[:CONTRADICTS]->(n1)
        RETURN n1.title as claim, n2.title as contradiction,
               n1.date as claim_date, n2.date as contradiction_date
    """, target_id=target_id)
    return [dict(record) for record in result]

# Strategist Agent - Gap Analysis
def query_pipeline_concentration(session):
    """Identify revenue concentration risk"""
    result = session.run("""
        MATCH (t:Target {status: 'client'})
        WITH sum(t.contract_value) as total_revenue
        MATCH (t:Target {status: 'client'})
        RETURN t.name, t.contract_value,
               round((t.contract_value * 100.0) / total_revenue) as revenue_pct
        ORDER BY revenue_pct DESC
        LIMIT 10
    """)
    return [dict(record) for record in result]
```

**Investment**:

- Neo4j Aura Professional: $65/month (500K nodes, 5M relationships)
- Pinecone Starter: $70/month (text index only, vectors in Neo4j)
- Firebase Firestore: $25/month (sync layer)
- **Total**: $160/month

**ROI Calculation**:

- **Cost**: $160/month = $1,920/year
- **Consultant hourly rate**: $150
- **Break-even**: 12.8 hours/year saved (1.1 hours/month)
- **Conservative estimate**: 8 hours/week = 32 hours/month = $4,800/month value
- **ROI**: 30x ($4,800 / $160)

**Status**: 🔴 Not Started (Sprint 2-7, Weeks 5-12)

---

### Phase 4+ (Optional - RDF Triple Store for Formal Ontologies)

**Technology**: Apache Jena + SPARQL + Neo4j property graph (coexist)

**Use Case**: If Codex Signum scales to multi-consultant firm requiring formal ontologies, inference rules, and federated knowledge sharing across teams.

**Capabilities**:

- Formal ontology reasoning (OWL, RDFS)
- Federated SPARQL queries across multiple graphs
- Inference rules (if X and Y, infer Z)

**Investment**: +$50/month (Jena hosting)

**Decision Gate**: Build ONLY if:

1. ✅ 3+ consultants using system
2. ✅ 500+ notes with complex cross-referencing
3. ✅ Need for formal reasoning (compliance, audit trails, regulatory)

**Status**: 🔵 Parked (evaluate Q2 2026)

---

## Decision Rationale

### Why Progressive Enhancement?

**Avoid Over-Engineering**: Don't build Neo4j infrastructure for 50 notes when Obsidian + Dataview suffices.

**Validate Use Cases First**: Discover which graph queries matter via agent usage in Phase 3A-B before investing in Neo4j.

**Learn Incrementally**: Master vector RAG (Phase 3A-B) before adding graph complexity (Phase 3C-D).

**Cost Discipline**: Start at $95/month (Phase 3A-B), scale to $160/month (Phase 3C-D) only when ROI validated.

### Why Not Pure Vector Search?

**Limitation**: Vectors can't answer:

- "Who can introduce me to this C4 buyer?" (requires relationship traversal)
- "Which learnings correlate with successful outcomes?" (requires causal reasoning)
- "Show me contradictory information about this target" (requires explicit relationship types)

### Why Not Pure Graph from Day 1?

**Premature Optimization**: Neo4j infrastructure costs $65/month + learning curve when 50 notes don't justify it.

**Data Volume**: Strategic queries (warm intros, learning impact) require 100+ notes to be meaningful.

**Agent Development**: Build agents (Auditor, Researcher, Strategist) in Phase 3A-B using Firestore queries, then upgrade to Neo4j in 3C-D when complexity demands it.

---

## Implementation Checklist

### ✅ Phase 2 (Complete)

- [x] 8 production templates with YAML frontmatter
- [x] Jupyter-style cell markers (52 cells)
- [x] Dataview dashboard with 8 dynamic sections
- [x] 50+ notes captured

### 🔴 Phase 3A (Sprint 1 Weeks 1-2)

- [ ] Obsidian → Firestore sync script (`scripts/obsidian-sync.js`)
- [ ] Cell marker extraction (parse `<!-- CELL: -->` into structured JSON)
- [ ] Wiki-link → TypedEdge inference (context-aware relationship typing)
- [ ] Pinecone index creation (1536-dim embeddings)
- [ ] Validate sync (50+ notes migrated, queryable)

### 🔴 Phase 3B (Sprint 2 Weeks 3-4)

- [ ] Hybrid RAG pipeline (vector prefilter → edge traversal → fusion)
- [ ] Citation-backed context assembly
- [ ] Auditor Agent v1 (Firestore queries for stale targets, unvalidated T2/T3)
- [ ] Dashboard integration (real-time query results)

### 🔴 Phase 3C (Sprint 3-5 Weeks 5-10)

- [ ] Neo4j Aura instance setup
- [ ] Schema design (5 node types, 7 relationship types)
- [ ] Firestore → Neo4j migration script
- [ ] Strategic queries (warm intros, learning impact, scope creep)
- [ ] Auditor Agent v2 (Neo4j-powered multi-hop queries)

### 🔴 Phase 3D (Sprint 6-7 Weeks 11-12)

- [ ] Researcher Agent (T2/T3 validation via web search + Neo4j contradiction detection)
- [ ] Synthesizer Agent (cell-aware extraction, Learning Registry drafts)
- [ ] Strategist Agent (Business Plan compliance, gap analysis)
- [ ] COO Agent (workflow optimization, billable utilization tracking)
- [ ] CFO Agent (revenue forecasting, margin analysis)

---

## Success Metrics

### Phase 3A-B Success Criteria

- ✅ 100% of notes synced to Firestore within 5 seconds
- ✅ Semantic search returns relevant results (80%+ user validation)
- ✅ Typed edges inferred with 85%+ accuracy
- ✅ Dashboard queries respond in <2 seconds

### Phase 3C-D Success Criteria

- ✅ Neo4j queries execute in <2 seconds (p95)
- ✅ 10+ strategic insights per month (warm intros, learning validations)
- ✅ Agent accuracy 95%+ (human validation)
- ✅ 8+ hours/week time savings (COO agent tracks)

---

## Related Documents

- [[ARCHITECTURE_PATTERNS.md]] - Pattern 1 (router), Patterns 10-12 (semantic graph)
- [[ARCHITECTURE_ASSESSMENT.md]] - Issue #1 (this pattern resolves)
- [[HYBRID_RAG_DESIGN.md]] - Phase 3A-B pipeline implementation
- [[SEMANTIC_KNOWLEDGE_GRAPH.md]] - Phase 3C-D Neo4j/RDF details
- [[PHASE_3_IMPLEMENTATION_PLAN.md]] - 12-week sprint roadmap
- [[CORE_TYPES.md]] - TypeScript interfaces for each phase

---

## Changelog

### 2025-11-10 - Version 1.0 (Initial)

- Created Pattern 0 to resolve ARCHITECTURE_ASSESSMENT Issue #1
- Defined 3-phase progressive enhancement strategy
- Documented Obsidian → Vector+Firestore → Neo4j evolution
- Provided implementation checklists and success metrics
- Established decision gates for Phase 4+ (RDF triple store)

---

**Last Updated**: 2025-11-10  
**Status**: 🟢 Active (authoritative knowledge storage strategy)  
**Next Review**: 2025-11-25 (Sprint 1 completion)
