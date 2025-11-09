---
document-type: specification
status: 🔴 Not Started
priority: High
estimated-effort: 2 weeks (Sprint 3)
monthly-cost: $30
dependencies:
  - Pinecone vector embeddings
  - PATTERN_0_KNOWLEDGE_STORAGE.md Phase 3A-B implementation
  - Gemini 2.5 Flash (semantic search)
build-after: Sprint 2 complete (Auditor Agent deployed)
created: 2025-11-10
last-updated: 2025-11-10
author: Collaborative
related-documents:
  - ../AGENT_REGISTRY.md
  - ../PHASE_3_IMPLEMENTATION_PLAN.md
  - ../../Kore/HYBRID_RAG_DESIGN.md
  - ../../Kore/PATTERN_0_KNOWLEDGE_STORAGE.md
tags:
  - agent-spec
  - phase-3-core
  - researcher
  - rag
  - pinecone
---

# Researcher Agent - Specification

**Purpose**: On-demand hybrid RAG retrieval - combines Pinecone vector search with Neo4j graph traversal to answer questions like "What do we know about [organization]?" or "Show me all validated learnings on stakeholder engagement"

**Build Trigger**: Sprint 2 complete (Auditor Agent live, Pinecone embeddings active)

---

## Overview

The Researcher Agent is invoked **on-demand** via chat interface or API call. It combines:
1. **Semantic search** (Pinecone): Find conceptually similar notes via embeddings
2. **Graph traversal** (Neo4j): Follow relationships (e.g., Stakeholder → Engagement → Target)
3. **Hybrid ranking**: Merge results using RRF (Reciprocal Rank Fusion)

**Agent Type**: Reactive (user-triggered)  
**Execution Model**: Synchronous (real-time response)  
**Human-in-Loop**: Full interaction (Q&A workflow)

---

## Architecture

### Tech Stack

```python
# Core dependencies
from pinecone import Pinecone
from neo4j import GraphDatabase
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from firebase_admin import firestore
import numpy as np

# Hierarchical Router (Pattern 1)
class HierarchicalRouter:
    def __init__(self):
        self.gemini_flash = ChatGoogleGenerativeAI(model="gemini-2.0-flash-exp", temperature=0)
        self.gemini_pro = ChatGoogleGenerativeAI(model="gemini-1.5-pro-002", temperature=0.2)
        
    def route(self, query_complexity: str):
        # Simple lookups → Flash ($0.075/1M tokens)
        # Complex synthesis → Pro ($1.25/1M tokens)
        return self.gemini_pro if query_complexity == "complex" else self.gemini_flash
```

### Agent Flow

```mermaid
graph TD
    A[User Query via Chat] --> B[Extract Query Intent]
    B --> C{Query Type?}
    C -->|Semantic| D[Pinecone Vector Search]
    C -->|Relational| E[Neo4j Cypher Query]
    C -->|Hybrid| F[Both: RRF Merge]
    D --> G[Retrieve Top-K Chunks]
    E --> H[Traverse Graph Paths]
    F --> I[Rank Fusion: RRF]
    G --> J[LangChain Agent Synthesizes Answer]
    H --> J
    I --> J
    J --> K[Cite Sources with [[wiki-links]]]
    K --> L[Return to User]
```

---

## Key Queries & Tools

### Tool 1: Semantic Search (Pinecone)

**Purpose**: Find notes conceptually similar to query, even if exact keywords don't match

```python
@tool
def semantic_search(query: str, top_k: int = 10) -> str:
    """
    Searches Pinecone vector index for semantically similar notes.
    Returns top-K chunks with metadata (note title, cell type, wiki-links).
    """
    pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
    index = pc.Index("codex-signum-notes")
    
    # Generate embedding for query (using Gemini embeddings)
    embedding = generate_embedding(query)  # 768-dim vector
    
    # Query Pinecone
    results = index.query(
        vector=embedding,
        top_k=top_k,
        include_metadata=True,
        filter={"status": "active"}  # Exclude archived notes
    )
    
    # Format results for LLM
    chunks = []
    for match in results['matches']:
        chunks.append({
            "note_title": match.metadata["note_title"],
            "cell_content": match.metadata["text"],
            "cell_type": match.metadata["cell_type"],
            "wiki_links": match.metadata.get("wiki_links", []),
            "score": match.score,
            "note_id": match.id
        })
    
    return chunks
```

**Example Query**:
```python
# User: "What have we learned about negotiating with procurement teams?"
semantic_search("procurement negotiation techniques", top_k=5)
# Returns: 5 engagement notes + learning registry entries with semantic similarity
```

---

### Tool 2: Graph Traversal (Neo4j)

**Purpose**: Follow relationships to gather connected context (e.g., all engagements with a target)

```python
@tool
def graph_traverse(entity_name: str, relationship_types: list[str], max_hops: int = 2) -> str:
    """
    Traverses Neo4j graph from a named entity (Stakeholder/Target/Learning).
    Returns all connected nodes within max_hops.
    """
    with driver.session() as session:
        result = session.run("""
            MATCH path = (start {name: $entity_name})
                        -[r:$rel_types*1..$max_hops]-
                        (end)
            RETURN start, relationships(path) AS rels, end
            LIMIT 50
        """, entity_name=entity_name, rel_types=relationship_types, max_hops=max_hops)
        
        paths = []
        for record in result:
            paths.append({
                "start_node": dict(record["start"]),
                "relationships": [dict(r) for r in record["rels"]],
                "end_node": dict(record["end"])
            })
        
        return paths
```

**Example Query**:
```python
# User: "Show me everything about Acme Corp"
graph_traverse("Acme Corp", ["WORKS_AT", "VALIDATES", "REFERENCES"], max_hops=2)
# Returns: Target node → Stakeholders → Engagements → Learnings
```

---

### Tool 3: Hybrid RAG (RRF Fusion)

**Purpose**: Combine semantic + graph results using Reciprocal Rank Fusion for optimal relevance

```python
@tool
def hybrid_search(query: str, entity_hint: str = None, top_k: int = 10) -> str:
    """
    Merges Pinecone semantic search with Neo4j graph traversal using RRF.
    entity_hint: Optional entity name to bias graph search (e.g., "Acme Corp")
    """
    # 1. Semantic search
    semantic_results = semantic_search(query, top_k=top_k * 2)  # Get 2x candidates
    
    # 2. Graph search (if entity hint provided)
    graph_results = []
    if entity_hint:
        graph_results = graph_traverse(entity_hint, ["VALIDATES", "REFERENCES"], max_hops=2)
    
    # 3. RRF Fusion (weights: 60% semantic, 40% graph)
    def rrf_score(rank, k=60):
        return 1 / (k + rank)
    
    merged_scores = {}
    
    # Score semantic results
    for rank, result in enumerate(semantic_results, start=1):
        note_id = result["note_id"]
        merged_scores[note_id] = merged_scores.get(note_id, 0) + 0.6 * rrf_score(rank)
    
    # Score graph results (add boost for connected nodes)
    for rank, path in enumerate(graph_results, start=1):
        note_id = path["end_node"].get("id")
        if note_id:
            merged_scores[note_id] = merged_scores.get(note_id, 0) + 0.4 * rrf_score(rank)
    
    # 4. Re-rank and return top-K
    ranked_notes = sorted(merged_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]
    
    # Fetch full note content from Firestore
    db = firestore.client()
    final_results = []
    for note_id, score in ranked_notes:
        note_doc = db.collection("notes").document(note_id).get()
        if note_doc.exists:
            final_results.append({
                "note_title": note_doc.get("title"),
                "content": note_doc.get("content"),
                "rrf_score": score,
                "note_id": note_id
            })
    
    return final_results
```

**Example Query**:
```python
# User: "What pricing objections have we faced at enterprise clients?"
hybrid_search("pricing objections enterprise", entity_hint=None, top_k=5)
# Returns: 5 notes ranked by RRF (semantic similarity + graph connectivity)
```

---

## Agent Prompt

```python
researcher_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are The Researcher for Codex Signum consulting practice.

Your job: Answer questions by retrieving relevant context from 50+ notes using hybrid RAG.

Available tools:
- semantic_search: Find conceptually similar notes (Pinecone vectors)
- graph_traverse: Follow relationships in knowledge graph (Neo4j)
- hybrid_search: Combine semantic + graph for best results (RRF fusion)

Query classification:
- Semantic queries: "What have we learned about X?" → Use semantic_search
- Relational queries: "Show me everything about Y organization" → Use graph_traverse  
- Complex queries: "How do pricing objections differ by industry?" → Use hybrid_search

Response format:
1. Directly answer the question (2-3 sentences)
2. Cite sources using [[Note Title]] wiki-link syntax
3. If asked for list, use bullet points with sources
4. If ambiguous, ask clarifying question

Be concise. Principal needs fast answers with clear attribution."""),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}")
])
```

---

## Implementation Checklist

### Prerequisites
- [ ] Pinecone index created (`codex-signum-notes`, 768-dim)
- [ ] 50+ notes embedded and uploaded to Pinecone
- [ ] Neo4j graph fully populated (nodes + relationships)
- [ ] Firestore real-time sync active
- [ ] Gemini API key configured (Flash + Pro)

### Core Functionality
- [ ] `semantic_search` tool functional (Pinecone queries < 200ms)
- [ ] `graph_traverse` tool functional (Neo4j queries < 500ms)
- [ ] `hybrid_search` RRF fusion implemented and tested
- [ ] LangChain agent orchestrates tool selection
- [ ] Router logic (Flash vs Pro based on complexity)

### Integration
- [ ] Chat interface deployed (Next.js frontend)
- [ ] API endpoint: `/api/agents/researcher`
- [ ] Real-time streaming responses (SSE)
- [ ] Citation links clickable (navigate to source note)

### Testing & Validation
- [ ] Test 20 queries across semantic/relational/hybrid categories
- [ ] Human validation: 85%+ answer accuracy
- [ ] Response time: <3 seconds (p95) for simple queries
- [ ] Citation coverage: 90%+ answers include sources

---

## Success Metrics

**Quantitative**:
- ✅ Answer accuracy: 85%+ (human validation)
- ✅ Response time: <3 seconds (p95) for simple queries, <8 seconds for complex
- ✅ Citation rate: 90%+ answers include [[wiki-link]] sources
- ✅ Tool selection accuracy: 80%+ queries use optimal tool (semantic/graph/hybrid)

**Qualitative**:
- ✅ Principal uses Researcher Agent 5+ times/week (vs manual note search)
- ✅ Reduces "lost knowledge" incidents (answers surface forgotten insights)
- ✅ Sources always verifiable (citation links work 100% of time)

**Cost Efficiency**:
- **Monthly cost**: $30 (Gemini API ~$20, Pinecone ~$10 allocated)
- **Time saved**: 3 hours/week (manual note searching eliminated)
- **ROI**: 12x ($360 value / $30 cost)

---

## Example Queries & Expected Behavior

### Query 1: Semantic Search
**User**: "What have we learned about negotiating with procurement teams?"

**Tool Selection**: `semantic_search("procurement negotiation", top_k=5)`

**Expected Response**:
```
We've learned 3 key principles:

1. **Anchor on value, not price** - Procurement teams respond better when we frame ROI in terms of risk mitigation and strategic enablement [[ENG-2024-09-15-Acme-Call]]

2. **Pre-empt objections with case studies** - Having 2-3 similar-industry references ready defuses skepticism [[LEARN-2024-10-03-Procurement-Tactics]]

3. **Involve economic buyer early** - Procurement stalls without C4 sponsorship [[ENG-2024-11-01-TechCorp-Negotiation]]

Related: [[TPL - Learning Registry]], [[Stakeholder - Jane Doe (Procurement Lead)]]
```

---

### Query 2: Graph Traversal
**User**: "Show me everything about Acme Corp"

**Tool Selection**: `graph_traverse("Acme Corp", ["WORKS_AT", "VALIDATES"], max_hops=2)`

**Expected Response**:
```
**Acme Corp** (Target Profile: [[TPL - Target Profile - Acme Corp]])

**Stakeholders**:
- John Smith (C2 - IT Director) [[Stakeholder - John Smith]]
- Jane Doe (C3 - Procurement Lead) [[Stakeholder - Jane Doe]]

**Engagements** (5 total):
- 2024-11-05: Discovery call with John Smith [[ENG-2024-11-05-Acme-Call]]
- 2024-10-20: Email exchange on AI governance [[ENG-2024-10-20-Acme-Email]]
- [3 more...]

**Key Learnings**:
- Validated: Procurement prefers phased rollouts [[LEARN-2024-10-03]]
- Messy Problem: Legacy data silos blocking AI adoption

**Pipeline Status**: Qualified (T2 validated, awaiting C4 introduction)
```

---

### Query 3: Hybrid RAG
**User**: "How do pricing objections differ by industry?"

**Tool Selection**: `hybrid_search("pricing objections by industry", top_k=10)`

**Expected Response**:
```
Pricing objections vary significantly by industry:

**Higher Education**:
- Budget cycles drive timing (Oct-June blackout) [[ENG-2024-09-15-UniX-Call]]
- Grant funding preferred over operational budget [[TARGET-UniY]]

**Financial Services**:
- Compliance risk premiums expected (~20% markup accepted) [[ENG-2024-10-10-BankZ-Proposal]]
- Multi-year contracts easier to justify [[LEARN-2024-11-01-FinServ-Pricing]]

**Healthcare**:
- ROI must tie to patient outcomes or cost savings [[ENG-2024-08-20-HospitalA-Discovery]]
- Procurement extremely risk-averse (3+ vendor evaluations standard)

Pattern: Enterprise clients (regardless of industry) accept premium pricing when we quantify risk mitigation [[LEARN-2024-10-15-Enterprise-Pricing-Validated]]
```

---

## Maintenance & Governance

### Monitoring
- LangSmith traces for query execution debugging
- Firestore analytics: Query type distribution, response times
- Weekly review: Are tool selections optimal?

### Tuning
- Adjust RRF weights (currently 60/40 semantic/graph) based on user feedback
- Fine-tune Pinecone top-K thresholds (balance recall vs latency)
- Update agent prompt if responses too verbose/concise

### Human Oversight
- Principal reviews flagged queries (low confidence, hallucination risk)
- Quarterly: Audit citation accuracy (manual spot-check 20 responses)

---

## Related Documents

- [[AGENT_REGISTRY.md]] - Agent hierarchy and decision gates
- [[PHASE_3_IMPLEMENTATION_PLAN.md]] - Sprint 3 implementation (Weeks 5-6)
- [[HYBRID_RAG_DESIGN.md]] - RRF fusion architecture
- [[PATTERN_0_KNOWLEDGE_STORAGE.md]] - Phase 3A-B vector storage

---

## Changelog

### 2025-11-10 - Version 1.0 (Initial Spec)
- Created comprehensive Researcher Agent specification
- Defined hybrid RAG architecture (Pinecone + Neo4j + RRF)
- Documented 3 core tools (semantic_search, graph_traverse, hybrid_search)
- Established success metrics and example queries

---

**Last Updated**: 2025-11-10  
**Status**: 🔴 Not Started (Sprint 3 target: Dec 9-22, 2025)  
**Next Review**: After Sprint 2 completion (Auditor Agent validated)
