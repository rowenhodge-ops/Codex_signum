---
document-type: architecture
status: 🟢 Active
version: 1.0
created: 2025-10-18
last-updated: 2025-11-10
author: Collaborative
related-documents:
  - ARCHITECTURE_PATTERNS.md
  - PATTERN_0_KNOWLEDGE_STORAGE.md
  - SEMANTIC_KNOWLEDGE_GRAPH.md
  - ../Codex Standards/PHASE_3_IMPLEMENTATION_PLAN.md
tags:
  - rag
  - hybrid-retrieval
  - vector-search
  - graph-traversal
  - citation-backed
---

# Hybrid RAG + Knowledge Graph Design

**Purpose**: Retrieval strategy combining vector search (semantic relevance) with graph traversal (precise relationships)

**Scope**: Pipeline stages, implementation details, performance optimization for Codex Signum consulting use case

---

## Overview

Kore uses a **hybrid retrieval strategy** combining vector search (broad semantic relevance) with knowledge graph traversal (precise, multi-hop relationships) to provide contextually rich, citation-backed answers.

This approach addresses limitations of pure vector search (no explicit relationships) and pure graph search (no semantic similarity ranking).

---

## Architecture

### Pipeline Stages

```text
User Query
    ↓
1. Entity Extraction
    ↓
2. Vector Prefilter (Top-K candidates)
    ↓
3. Graph Traversal (Multi-hop relationships)
    ↓
4. Fusion & Rerank (Combine + score)
    ↓
5. Context Assembly + Citation Mapping
    ↓
LLM Generation with inline citations
```

---

## Stage Details

### 1. Entity Extraction

**Purpose**: Identify key entities and concepts from the user query to anchor graph traversal.

**Implementation**:

- Use Llama 3 (quick responder) or Gemini 2.5 Flash for fast NER/concept extraction
- Extract: note titles, tags, people, dates, concepts
- Output: `{entities: ["Entity A", "Tag B", "Concept C"]}`

**Example**:

- Query: "What did I learn about React hooks last month?"
- Entities: `["React", "hooks", "learning"]`

---

### 2. Vector Prefilter

**Purpose**: Retrieve a broad set of semantically similar notes from AlloyDB Vector Search.

**Implementation**:

- Embed query using `text-embedding-004`
- Cosine similarity search against note embeddings
- Return top-K candidates (K=20-50)
- Threshold: similarity > 0.7

**Output**: List of candidate note IDs with similarity scores

---

### 3. Graph Traversal

**Purpose**: Discover explicit relationships and multi-hop connections between notes.

**Implementation**:

- Start from entities identified in Stage 1
- Traverse bidirectional links: `[[Note A]] ↔ [[Note B]]`
- Traverse tags, timestamps, and typed edges (e.g., "references", "contradicts")
- Max depth: 2-3 hops
- Prune: filter by recency, relevance score, or user preferences

**Graph Structure**:

- Nodes: Notes, Tags, Entities
- Edges: Bidirectional links, tag associations, temporal relationships
- Store: Firestore (lightweight) or RDF triple store (Phase 3 advanced option)

**Query Example** (conceptual):

```sparql
SELECT ?relatedNote ?edgeType ?distance
WHERE {
  ?startNote :hasLink ?relatedNote .
  ?relatedNote :hasTag "React" .
  FILTER (?distance <= 2)
}
```

---

### 4. Fusion & Rerank

**Purpose**: Combine vector and graph results; score and rank by relevance.

**Fusion Strategy**:

- Reciprocal Rank Fusion (RRF): `score = Σ(1 / (k + rank_i))` where k=60
- Weighted blend: `final_score = 0.6 * vector_score + 0.4 * graph_score`
- Boost: notes with multi-hop connections get +10% relevance boost

**Reranking Model** (optional):

- Use Gemini 2.5 Flash or cross-encoder for fine-grained rerank
- Input: query + top-N candidates
- Output: reordered list with confidence scores

---

### 5. Context Assembly + Citation Mapping

**Purpose**: Construct LLM context with precise, sentence-level citations.

**Implementation**:

- Extract relevant paragraphs from top-ranked notes
- Chunk by sentence or paragraph
- Assign citation IDs: `[1]`, `[2]`, `[3]` mapped to note IDs + paragraph offsets
- Format for LLM: `"Context: <chunk>[1] <chunk>[2] ... Query: {user_query}"`

**Citation Rendering**:

- In UI: Hover on citation → show source sentence + note title + direct link
- Visual confidence: Solid underline (direct quote) vs dashed (paraphrase/synthesis)

---

## Data Flow Example

**Query**: "What are my notes about React performance optimization?"

1. **Entity Extraction**: `["React", "performance optimization"]`
2. **Vector Search**: Returns 30 notes with similarity > 0.75
3. **Graph Traversal**: Find notes linked to "React" tag and "performance" concept; discover "Memoization" and "Virtual DOM" related notes 2 hops away
4. **Fusion**: Merge vector and graph results; boost notes with multi-hop connections
5. **Assembly**: Extract relevant paragraphs from top 5 notes; assign citations `[1]`-`[5]`
6. **LLM Generation**: Llama 3 generates answer with inline citations: "React.memo() `[1]` and useMemo() `[2]` reduce re-renders..."

---

## Implementation Notes

### Phase 3 (MVP)

- Vector search: AlloyDB pgvector
- Graph: Typed edges in Firestore (`notes/{id}/links`, `notes/{id}/tags`)
- Traversal: Client-side BFS/DFS (max 2 hops)
- Fusion: Simple weighted blend

### Phase 4 (Advanced)

- Graph: Optional RDF triple store + SPARQL for complex queries
- Reranker: Cross-encoder model for fine-grained relevance
- Adaptive fusion: Learn optimal weights per query type via RL

---

## Success Metrics

- **Relevance uplift**: Hybrid search outperforms vector-only by 25% (user ratings)
- **Citation accuracy**: >95% of citations map to correct source sentences
- **Retrieval recall**: Top-5 results contain correct answer in 85%+ of queries
- **Latency**: End-to-end retrieval < 2 seconds (p95)

---

## Security & Privacy

- All note embeddings and graph edges are user-scoped (Firestore security rules)
- Vector search queries filtered by `userId` in AlloyDB
- No cross-user data leakage in graph traversal

---

## References

- `docs/ARCHITECTURE_PATTERNS.md` - Stratified Cognition, System Resilience
- `docs/project-plan.md` - Phase 3 RAG deliverables and success metrics
