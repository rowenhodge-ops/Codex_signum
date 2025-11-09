---
document-type: architecture
status: 🟢 Active
version: 1.0
created: 2025-11-10
last-updated: 2025-11-10
author: Collaborative
related-documents:
  - ARCHITECTURE_PATTERNS.md
  - PATTERN_0_KNOWLEDGE_STORAGE.md
  - ARCHITECTURE_ASSESSMENT.md
  - ../Codex Standards/PHASE_3_IMPLEMENTATION_PLAN.md
tags:
  - typescript
  - interfaces
  - type-definitions
  - phase-specific
---

# Core Types & Interfaces

**Purpose**: Define phase-specific TypeScript interfaces resolving ARCHITECTURE_ASSESSMENT Issue #6 (ambiguity in KnowledgeGraph definition)

**Scope**: 12 core types spanning Phase 2 (Obsidian), Phase 3A-B (Vector+Firestore), Phase 3C-D (Neo4j), and shared types

---

## Overview

**Critical Issue Resolved**: ARCHITECTURE_PATTERNS.md Pattern 1 uses `KnowledgeGraph` interface without distinguishing between:

- **Phase 2**: Obsidian wiki-links (no formal graph)
- **Phase 3A-B**: Firestore typed edges (simple graph)
- **Phase 3C-D**: Neo4j property graph (full graph intelligence)

**Solution**: Define phase-specific interfaces that evolve with implementation complexity.

---

## Shared Core Types

### ModelTier

```typescript
/**
 * LLM capability tier for hierarchical routing (Pattern 1)
 */
interface ModelTier {
  name: string; // Specific model (e.g., 'gpt-4o-mini', 'o1-mini')
  costPerMillionTokens: number; // Pricing for cost tracking
  maxTokens?: number; // Context window limit
  capabilities?: string[]; // ['reasoning', 'code', 'fast']
}
```

### ModelFleet

```typescript
/**
 * Collection of LLMs for hierarchical routing
 * Pattern 1 from ARCHITECTURE_PATTERNS.md
 */
interface ModelFleet {
  orchestrator: ModelTier; // Handles routing & synthesis (e.g., Jamba 1.5 Large)
  reasoning: ModelTier; // Complex analysis (e.g., o1-mini, Llama 3.3 70B)
  specialist: ModelTier; // Fast task execution (e.g., GPT-4o-mini, Llama 3.1 8B)
  tool?: ModelTier; // Code generation, data analysis (e.g., Claude 3.5 Sonnet)
}

/**
 * Environment-configured model fleet
 * Pattern 2 from ARCHITECTURE_PATTERNS.md - Configuration Management
 */
const DEFAULT_FLEET: ModelFleet = {
  orchestrator: {
    name: process.env.ORCHESTRATOR_MODEL || "gpt-4o-mini",
    costPerMillionTokens: parseFloat(process.env.ORCHESTRATOR_COST || "0.15"),
  },
  reasoning: {
    name: process.env.REASONING_MODEL || "o1-mini",
    costPerMillionTokens: parseFloat(process.env.REASONING_COST || "3.00"),
  },
  specialist: {
    name: process.env.SPECIALIST_MODEL || "gpt-4o-mini",
    costPerMillionTokens: parseFloat(process.env.SPECIALIST_COST || "0.15"),
  },
  tool: {
    name: process.env.TOOL_MODEL || "claude-3.5-sonnet",
    costPerMillionTokens: parseFloat(process.env.TOOL_COST || "3.00"),
  },
};
```

### ProvenanceInfo

```typescript
/**
 * Track creation and modification metadata
 * Pattern 9 from ARCHITECTURE_PATTERNS.md - Immutable Audit Architecture
 */
interface ProvenanceInfo {
  created_by: string; // User ID or agent name
  created_at: Date;
  updated_by: string;
  updated_at: Date;
  version: number; // Increment on each update
  change_summary?: string; // Human-readable description of change
}
```

---

## Phase 2: Obsidian Types (Current)

### ObsidianNote

```typescript
/**
 * Phase 2 note structure (Obsidian vault with YAML frontmatter)
 * Status: ✅ COMPLETE (50+ notes in production)
 */
interface ObsidianNote {
  file_path: string; // Relative path in vault (e.g., 'Stakeholder Engagement/Jane-Smith.md')
  file_name: string; // Filename without extension

  // YAML frontmatter
  frontmatter: {
    tags: string[]; // ['engagement', 'C2', 'demo']
    date?: string; // ISO 8601 date
    [key: string]: any; // Template-specific fields
  };

  // Markdown content
  markdown: string; // Full note content with wiki-links

  // Cell markers (Phase 2A)
  cells?: Record<string, CellContent>; // Parsed from <!-- CELL: --> markers
}

interface CellContent {
  cell_id: string; // e.g., 'key-language', 'messy-problems'
  type: CellType; // e.g., 'training-data', 'analysis'
  rag_priority: "high" | "medium" | "low";
  content: string; // Raw markdown between markers
  line_range?: [number, number]; // Start/end line numbers
}

type CellType =
  | "training-data" // Examples, templates
  | "inference-prompt" // Questions, frameworks
  | "validation-metrics" // Performance data
  | "analysis" // Strategic thinking
  | "context" // Background info
  | "raw-data" // Unprocessed notes
  | "relationships" // Connections
  | "action-items" // Tasks, CTAs
  | "summary"; // High-level overviews
```

### ObsidianKnowledgeGraph

```typescript
/**
 * Phase 2 "graph" = wiki-links extracted from Obsidian
 * Limitation: No relationship types, no multi-hop queries
 */
interface ObsidianKnowledgeGraph {
  notes: Map<string, ObsidianNote>;

  // Wiki-link extraction
  links: WikiLink[];
}

interface WikiLink {
  source: string; // Note filename (from)
  target: string; // Note filename (to)
  context?: string; // Surrounding text
}
```

---

## Phase 3A-B: Vector + Firestore Types

### FirestoreNote

```typescript
/**
 * Phase 3A-B note structure (Firebase/Firestore with vector embeddings)
 * Migration from Obsidian via sync script
 */
interface FirestoreNote {
  id: string; // Firestore document ID

  // Original Obsidian data
  file_path: string;
  title: string;
  markdown: string;
  frontmatter: Record<string, any>;

  // Cell marker extraction
  cells: Record<string, CellContent>;

  // Typed edges (inferred from wiki-links + cell context)
  edges: TypedEdge[];

  // Vector embedding (Pinecone)
  embedding?: number[]; // 1536-dim vector (OpenAI text-embedding-3-small)
  embedding_model?: string; // 'text-embedding-3-small'

  // Sync metadata
  synced_at: Date;
  obsidian_modified_at: Date;

  // Provenance
  provenance: ProvenanceInfo;
}
```

### TypedEdge

```typescript
/**
 * Relationship between notes with semantic type
 * Inferred by analyzing wiki-link context + cell markers
 */
interface TypedEdge {
  target: string; // Note ID
  type: EdgeType;
  confidence: number; // 0.0-1.0 (higher = more confident inference)
  inferred: boolean; // true if AI-inferred, false if explicit
  source_cell?: string; // Which cell contained this link
  reasoning?: string; // Why this type was inferred (for debugging)
}

type EdgeType =
  | "REFERENCES" // Generic link (default)
  | "BUILDS_UPON" // Learning builds on prior learning
  | "VALIDATES" // Research confirms T2/T3 hypothesis
  | "CONTRADICTS" // Conflicting information
  | "APPLIES_LEARNING" // Engagement applies learning principle
  | "TARGETS" // Engagement relates to target org
  | "INVOLVES_STAKEHOLDER" // Engagement involves person
  | "SUPERSEDES" // Newer version replaces old
  | "RELATES_TO"; // Generic semantic relationship
```

### FirestoreKnowledgeGraph

```typescript
/**
 * Phase 3A-B knowledge graph = Firestore docs + typed edges
 * Capabilities: 2-3 hop traversal, typed relationship queries
 */
interface FirestoreKnowledgeGraph {
  // Query notes by collection
  getNotes(collection: string): Promise<FirestoreNote[]>;

  // Traverse relationships
  getOutgoingEdges(noteId: string, edgeType?: EdgeType): Promise<TypedEdge[]>;
  getIncomingEdges(noteId: string, edgeType?: EdgeType): Promise<TypedEdge[]>;

  // Multi-hop traversal (limited to 2-3 hops for performance)
  findPath(
    fromId: string,
    toId: string,
    maxHops: number
  ): Promise<FirestoreNote[]>;

  // Vector search
  similarNotes(embedding: number[], topK: number): Promise<FirestoreNote[]>;
}
```

### HybridRAGContext

```typescript
/**
 * Result of hybrid RAG pipeline (vector + graph fusion)
 * Pattern from HYBRID_RAG_DESIGN.md
 */
interface HybridRAGContext {
  // Primary context
  relevant_notes: FirestoreNote[];

  // Graph expansion
  related_notes: FirestoreNote[]; // Discovered via edge traversal

  // Provenance
  vector_scores: Record<string, number>; // Note ID → similarity score
  graph_distances: Record<string, number>; // Note ID → hop distance
  fusion_scores: Record<string, number>; // Combined ranking

  // Citations
  citations: Citation[];
}

interface Citation {
  note_id: string;
  note_title: string;
  excerpt: string; // Relevant snippet
  cell_id?: string; // Which cell provided this info
  relevance_score: number;
}
```

---

## Phase 3C-D: Neo4j Types

### Neo4jNode

```typescript
/**
 * Phase 3C-D node structure (Neo4j property graph)
 * Replaces FirestoreNote as primary storage
 */
interface Neo4jNode {
  // Neo4j internals
  id: string; // Neo4j node ID
  labels: string[]; // e.g., ['Note', 'Engagement']

  // Properties
  properties: {
    type: "engagement" | "stakeholder" | "target" | "learning" | "insight";
    title: string;
    markdown: string;
    cells: Record<string, CellContent>;

    // Template-specific fields (from YAML frontmatter)
    [key: string]: any;

    // Temporal
    created_at: Date;
    updated_at: Date;
  };
}
```

### Neo4jRelationship

```typescript
/**
 * Neo4j relationship with properties
 * More expressive than TypedEdge (supports relationship metadata)
 */
interface Neo4jRelationship {
  id: string; // Neo4j relationship ID
  type: string; // e.g., 'BUILDS_UPON', 'VALIDATES'

  // Connected nodes
  start_node: string; // Node ID
  end_node: string; // Node ID

  // Properties
  properties: {
    confidence?: number;
    created_at?: Date;
    reasoning?: string;

    // Relationship-specific metadata
    [key: string]: any;
  };
}
```

### Neo4jKnowledgeGraph

```typescript
/**
 * Phase 3C-D knowledge graph = Neo4j Cypher queries
 * Capabilities: Multi-hop reasoning (4+ hops), strategic intelligence
 */
interface Neo4jKnowledgeGraph {
  // Cypher query interface
  query(cypher: string, params?: Record<string, any>): Promise<any[]>;

  // Common patterns
  findShortestPath(
    fromId: string,
    toId: string,
    relationshipTypes?: string[]
  ): Promise<Neo4jPath>;

  findNodesByLabel(
    label: string,
    filters?: Record<string, any>
  ): Promise<Neo4jNode[]>;

  getRelationships(
    nodeId: string,
    direction: "incoming" | "outgoing" | "both",
    relationshipType?: string
  ): Promise<Neo4jRelationship[]>;

  // Strategic queries (from agents)
  findStaleTargets(daysThreshold: number): Promise<Neo4jNode[]>;
  findWarmIntroPaths(targetId: string, maxHops: number): Promise<Neo4jPath[]>;
  analyzeLearningImpact(learningId: string): Promise<LearningImpactAnalysis>;
}

interface Neo4jPath {
  nodes: Neo4jNode[];
  relationships: Neo4jRelationship[];
  length: number; // Hop count
  weight?: number; // Weighted by relationship confidence
}

interface LearningImpactAnalysis {
  learning: Neo4jNode;
  applications: Neo4jNode[]; // Engagements using this learning
  avg_cta_success_rate: number;
  avg_sentiment: number;
  correlation_strength: number; // 0.0-1.0
}
```

---

## Agent-Specific Types

### AgentState

```typescript
/**
 * Persistent state for autonomous agents
 * Pattern 2 from ARCHITECTURE_PATTERNS.md - Async State Persistence
 */
interface AgentState {
  agent_name: string; // 'auditor', 'researcher', 'synthesizer', etc.

  // Current execution
  status: "idle" | "running" | "paused" | "error";
  current_task?: string;
  progress?: number; // 0-100

  // State data (agent-specific)
  state_data: Record<string, any>;

  // Execution history
  last_run_at?: Date;
  last_success_at?: Date;
  error_count: number;

  // Provenance
  provenance: ProvenanceInfo;
}
```

### AgentToolResult

```typescript
/**
 * Result from agent tool execution
 * Used by LangGraph/LangChain agents
 */
interface AgentToolResult {
  tool_name: string;
  success: boolean;
  data?: any;
  error?: string;
  execution_time_ms: number;
  cost?: {
    model: string;
    tokens_used: number;
    cost_usd: number;
  };
}
```

---

## Migration Interfaces

### ObsidianToFirestoreMigration

```typescript
/**
 * Migration tracking for Phase 2 → Phase 3A transition
 */
interface ObsidianToFirestoreMigration {
  total_notes: number;
  migrated_notes: number;
  failed_notes: string[]; // File paths that failed

  // Edge inference stats
  wiki_links_found: number;
  typed_edges_inferred: number;
  confidence_distribution: Record<string, number>; // EdgeType → count

  // Vector embedding stats
  notes_embedded: number;
  embedding_errors: string[];

  started_at: Date;
  completed_at?: Date;
}
```

### FirestoreToNeo4jMigration

```typescript
/**
 * Migration tracking for Phase 3B → Phase 3C transition
 */
interface FirestoreToNeo4jMigration {
  total_notes: number;
  nodes_created: number;
  relationships_created: number;

  // Schema validation
  constraints_created: string[];
  indexes_created: string[];

  // Data validation
  orphaned_edges: number; // Edges pointing to non-existent notes
  duplicate_nodes_merged: number;

  started_at: Date;
  completed_at?: Date;
}
```

---

## Usage Examples

### Phase 2 (Obsidian)

```typescript
// Read note from Obsidian vault
const note: ObsidianNote = {
  file_path: "Stakeholder Engagement/Jane-Smith-Demo-2025-11-10.md",
  file_name: "Jane-Smith-Demo-2025-11-10",
  frontmatter: {
    tags: ["engagement", "C4", "demo"],
    date: "2025-11-10",
    stakeholder_type: "C4",
    cta_success: true,
  },
  markdown: "# Jane Smith - Demo Call\n\n...",
  cells: {
    "key-language": {
      cell_id: "key-language",
      type: "training-data",
      rag_priority: "high",
      content: '"Legacy system integration" resonated strongly...',
    },
  },
};

// Dataview query (current Phase 2 capability)
// FROM #engagement WHERE stakeholder-type = "C4"
```

### Phase 3A-B (Firestore + Vector)

```typescript
// Sync Obsidian → Firestore
const syncedNote: FirestoreNote = {
  id: 'jane-smith-demo-2025-11-10',
  ...note,
  edges: [
    {
      target: 'jane-smith-stakeholder-profile',
      type: 'INVOLVES_STAKEHOLDER',
      confidence: 0.95,
      inferred: true,
      source_cell: 'stakeholder-context',
    },
    {
      target: 'university-of-wollongong-target',
      type: 'TARGETS',
      confidence: 0.90,
      inferred: true,
    },
  ],
  embedding: [0.023, -0.015, ...], // 1536 dimensions
  synced_at: new Date(),
};

// Hybrid RAG query
const context: HybridRAGContext = await hybridRAG.query(
  'What have I learned about C4 buyers?',
  { topK: 20, maxHops: 2 }
);
```

### Phase 3C-D (Neo4j)

```typescript
// Cypher query via Neo4j driver
const warmIntroPaths = await neo4j.query(`
  MATCH path = shortestPath(
    (me:Stakeholder {name: 'Principal'})
    -[:KNOWS*1..4]-
    (buyer:Stakeholder {type: 'C4'})
  )
  WHERE buyer.last_contact < date() - duration({days: 60})
  RETURN path, length(path) as hops
  ORDER BY hops ASC
  LIMIT 10
`);

// Strategic query via typed interface
const staleTargets = await neo4j.findStaleTargets(30);
const learningImpact = await neo4j.analyzeLearningImpact("L-019");
```

---

## Related Documents

- [[ARCHITECTURE_PATTERNS.md]] - Pattern 1 (ModelFleet), Pattern 2 (AgentState)
- [[PATTERN_0_KNOWLEDGE_STORAGE.md]] - Knowledge graph evolution strategy
- [[ARCHITECTURE_ASSESSMENT.md]] - Issue #6 resolved by this document
- [[PHASE_3_IMPLEMENTATION_PLAN.md]] - Implementation timeline

---

## Changelog

### 2025-11-10 - Version 1.0 (Initial)

- Created comprehensive type definitions for all 3 phases
- Resolved ARCHITECTURE_ASSESSMENT Issue #6 (KnowledgeGraph ambiguity)
- Defined 12 core interfaces with usage examples
- Established migration tracking types
- Documented agent-specific types for LangGraph integration

---

**Last Updated**: 2025-11-10  
**Status**: 🟢 Active (baseline type definitions)  
**Next Review**: 2025-11-25 (after Sprint 1 implementation validates types)
