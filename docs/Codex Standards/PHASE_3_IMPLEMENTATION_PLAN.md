---
document-type: planning
status: 🟡 In Progress
version: 1.0
created: 2025-11-10
last-updated: 2025-11-10
author: Collaborative
related-documents:
  - AGENT_REGISTRY.md
  - ../Kore/ARCHITECTURE_PATTERNS.md
  - ../Kore/PATTERN_0_KNOWLEDGE_STORAGE.md
  - ../Kore/CORE_TYPES.md
  - ../Business Plan/Business Plan - Codex Signum (V5.4).md
tags:
  - phase-3
  - implementation-plan
  - 12-week-sprint
  - neo4j
  - agent-architecture
---

# Phase 3: AI-Native Intelligence Layer - Implementation Plan

**Purpose**: 12-week sprint roadmap transforming Codex Signum from Obsidian vault to AI-native consulting platform

**Scope**: 6 core agents, Neo4j graph intelligence, Pinecone vector search, Firebase sync, LiteLLM routing

**Start Date**: 2025-11-11  
**Target Completion**: 2026-02-02 (12 weeks)  
**Budget**: $1,500 infrastructure setup + $210/month operational

---

## Executive Summary

Transform Codex Signum from manual knowledge management system into **autonomous AI-native consulting platform** with 6 intelligent agents providing:

1. **10x Productivity**: Autonomous agents handle research, auditing, synthesis
2. **Graph Intelligence**: Neo4j enables "impossible queries" for strategic insights
3. **Trusted Advisor Capability**: Learn advanced AI/graph tech to advise clients on similar systems
4. **Production-Grade Architecture**: Move beyond Obsidian to scalable Firebase + Neo4j + Pinecone stack

**Success Criteria**:

- ✅ 8+ hours/week time savings (validated by COO agent tracking)
- ✅ 10+ strategic insights per month (warm intro paths, learning validations)
- ✅ $75/month cost breakeven (0.5 hours consultant time saved)
- ✅ Neo4j graph queries operational (4+ hop multi-relationship traversal)

---

## Strategic Objectives

### Business Objectives

1. **Increase Billable Utilization**: From 45% → 60%+ (6+ additional hours/week)
2. **Improve Conversion Rates**: Initium → Fabrica from 25% → 40% (via better T2/T3 validation)
3. **Accelerate Revenue**: Hit $500k Year 1 target (currently tracking 89%)
4. **Scale Operations**: Prepare for 2+ consultants by Q4 2026

### Technical Objectives

1. **Knowledge Storage Evolution**: Obsidian → Firebase + Neo4j + Pinecone hybrid
2. **Agent Architecture**: Deploy 6 autonomous agents with hierarchical intelligence
3. **Graph Reasoning**: Enable multi-hop queries (warm intros, conceptual bridges)
4. **Cost Optimization**: LLM routing reduces API costs by 77%

### Learning Objectives

1. **Master Neo4j**: Become expert in graph database design + Cypher queries
2. **Production AI**: Learn LangChain, LangGraph, agentic workflows
3. **Client Advisory**: Gain expertise to advise clients on similar AI systems

---

## Technology Stack

| Component               | Technology              | Cost       | Rationale                                                     |
| ----------------------- | ----------------------- | ---------- | ------------------------------------------------------------- |
| **Graph Database**      | Neo4j Aura Professional | $65/month  | Multi-hop reasoning, strategic intelligence, Cypher queries   |
| **Vector Store**        | Pinecone Starter        | $70/month  | Managed vector search, semantic retrieval, no DevOps          |
| **LLM Router**          | LiteLLM + OpenAI        | $50/month  | Multi-model orchestration, 77% cost reduction vs single model |
| **Orchestration**       | LangGraph + LangChain   | Free (OSS) | State machines for complex agent workflows                    |
| **Observability**       | LangSmith Free Tier     | Free       | Debug multi-step agents, trace optimization                   |
| **Application Runtime** | Firebase + Firestore    | $25/month  | Real-time sync, existing stack, serverless                    |
| **Sync Tool**           | Obsidian (transitional) | Free       | Author notes in Obsidian → auto-sync to Firebase              |

**Total Monthly Cost**: $210/month  
**Break-Even**: 1.4 hours/month saved (conservative: expect 32+ hours/month)

---

## Architecture Decisions

### Knowledge Storage Strategy (Pattern 0)

Based on ARCHITECTURE_ASSESSMENT.md Issue #1, we use **progressive enhancement**:

#### Phase 2 (Current - Obsidian MVP)

- **Technology**: Obsidian wiki-links + YAML frontmatter + Dataview
- **Capabilities**: Tag-based queries, 1-hop traversal
- **Limitations**: No semantic search, no multi-hop reasoning
- **Status**: ✅ Complete (50+ notes captured)

#### Phase 3A-B (Weeks 1-4 - Hybrid Vector + Typed Edges)

- **Technology**: Pinecone vectors + Firestore typed edges + Obsidian sync
- **Capabilities**: Semantic search, 2-3 hop traversal, citation-backed RAG
- **Limitations**: Can't do complex graph queries (warm intro paths require Neo4j)
- **Status**: 🔴 Not Started

#### Phase 3C-D (Weeks 5-12 - Neo4j Graph Intelligence)

- **Technology**: Neo4j Cypher queries + Pinecone text index + RDF (optional)
- **Capabilities**: Multi-hop reasoning (4+ hops), strategic insights, warm intro paths
- **Optional**: RDF triple store for formal ontologies (if complex reasoning needed)
- **Status**: 🔴 Not Started

**Decision Rationale**: Start simple (validate hybrid), scale to Neo4j when data volume justifies strategic queries.

---

## 12-Week Sprint Plan

### Sprint 1: Foundation & Knowledge Storage (Weeks 1-2)

**Dates**: Nov 11-24, 2025

#### Deliverable 1: Resolve Architecture Ambiguities

**Create 3 foundational documents**:

1. **Pattern 0: Knowledge Storage Decision Matrix**

   - File: `docs/Kore/PATTERN_0_KNOWLEDGE_STORAGE.md`
   - Content: 3-phase knowledge storage strategy (Obsidian → Hybrid → Neo4j)
   - Explicit phase boundaries and technology choices

2. **Core Types & Interfaces**

   - File: `docs/Kore/CORE_TYPES.md`
   - Define 12 missing types: `PersistentState`, `KnowledgeGraph`, `ModelFleet`, etc.
   - Phase-specific type definitions (Phase 2 vs Phase 3)

3. **Update ARCHITECTURE_PATTERNS.md**
   - Split Pattern 1 into phase-specific implementations
   - Add cross-references to Pattern 0 and Core Types
   - Remove roadmap duplication (defer to project-plan.md)

**Time Estimate**: 6 hours

---

#### Deliverable 2: System Health Dashboard

**Create**: `docs/Codex Signum - System Health Dashboard.md`

**6 Dataview Queries**:

```dataview
<!-- Query 1: Stale Targets -->
TABLE WITHOUT ID
    link(file.name) as "Target",
    status,
    last-updated,
    choice(date(today) - last-updated > dur(30 days), "🚨 STALE", "✅ Fresh") as "Status"
FROM #target-profile
WHERE status IN ["engaged", "qualified"]
SORT last-updated ASC

<!-- Query 2: Unvalidated T2/T3 -->
TABLE WITHOUT ID
    link(file.name) as "Target",
    t2-validated,
    t3-validated,
    choice(!t2-validated OR !t3-validated, "⚠️ NEEDS VALIDATION", "✅ Validated") as "Status"
FROM #target-profile
WHERE status = "engaged"

<!-- Query 3: Uncommitted Learnings -->
TABLE WITHOUT ID
    link(file.name) as "Engagement",
    engagement-date,
    learning-id,
    choice(!learning-id, "❌ NOT EXTRACTED", "✅ Committed") as "Status"
FROM #engagement
WHERE status = "completed" AND !learning-id
SORT engagement-date DESC

<!-- Query 4: Learning Impact Validation -->
TABLE WITHOUT ID
    link(file.name) as "Learning",
    validation-status,
    application-count,
    choice(application-count >= 3 AND validation-status = "untested", "🔬 READY TO VALIDATE", "⏳ More data needed") as "Status"
FROM #learning-registry
WHERE validation-status = "untested"
SORT application-count DESC

<!-- Query 5: Pipeline Health -->
TABLE WITHOUT ID
    status as "Stage",
    length(rows) as "Count",
    sum(rows.estimated-value) as "Pipeline Value"
FROM #target-profile
WHERE status != "archived"
GROUP BY status

<!-- Query 6: Billable Utilization (Weekly) -->
TABLE WITHOUT ID
    week-of,
    total-engagements,
    (total-engagements * 2.0) as "Est Billable Hours",
    choice((total-engagements * 2.0) >= 24, "✅ >60%", "⚠️ <60%") as "Utilization"
FROM #weekly-review
SORT week-of DESC
LIMIT 8
```

**Time Estimate**: 4 hours

---

#### Deliverable 3: Add Validation Metadata to Templates

**Update 3 template files**:

1. **TPL - Target Profile.md**

   ```yaml
   # Add to frontmatter
   t2-validated: false # Technical Reality confirmed via research
   t3-validated: false # Operational Context validated
   last-updated: <% tp.date.now("YYYY-MM-DD") %>
   ```

2. **TPL - Engagement Note.md**

   ```yaml
   # Add to frontmatter
   learning-id: "" # Links to Learning Registry entry (L-###)
   time-spent-hours: 0 # For COO utilization tracking
   ```

3. **TPL - Weekly Review.md**
   ```yaml
   # Existing fields are sufficient
   # Verify: total-engagements, cta-success-rate, avg-edit-distance
   ```

**Update**: `docs/Codex Standards/Templates/TEMPLATE_CHANGELOG.md`

```markdown
## 2025-11-11 - Phase 3 Sprint 1: Validation Metadata

### Changes Made

- Added `t2-validated`, `t3-validated`, `last-updated` to Target Profile
- Added `learning-id`, `time-spent-hours` to Engagement Note
- Updated TEMPLATE_CHANGELOG with Phase 3 integration notes

### Rationale

These fields enable agent automation:

- Auditor: Detect stale targets, unvalidated assumptions
- Researcher: Track validation status
- Synthesizer: Link engagements to learnings
- COO: Measure billable utilization
```

**Time Estimate**: 2 hours

---

#### Deliverable 4: Obsidian → Firestore Sync Script

**Create**: `scripts/obsidian-sync.js`

```javascript
// obsidian-sync.js - Watch docs/ folder, sync to Firestore
const chokidar = require("chokidar");
const matter = require("gray-matter");
const admin = require("firebase-admin");
const fs = require("fs");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "codex-signum",
});
const db = admin.firestore();

// Watch docs/ folder for changes
const watcher = chokidar.watch("docs/**/*.md", {
  ignored: /(^|[\/\\])\../, // Ignore .obsidian/
  persistent: true,
  ignoreInitial: false, // Process existing files on startup
});

watcher
  .on("add", (path) => syncFile(path, "created"))
  .on("change", (path) => syncFile(path, "updated"))
  .on("unlink", (path) => deleteFile(path));

async function syncFile(filePath, action) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const { data: frontmatter, content: markdown } = matter(content);

    // Parse cell markers
    const cells = extractCellMarkers(markdown);

    // Extract wiki-links as typed edges
    const links = extractWikiLinks(markdown);
    const typedEdges = inferEdgeTypes(links, cells, frontmatter);

    // Determine collection from tags
    const collection = getCollectionFromTags(frontmatter.tags);

    // Generate document ID from file path
    const docId = filePath
      .replace("docs/", "")
      .replace(/\\/g, "/")
      .replace(".md", "");

    // Sync to Firestore
    await db
      .collection(collection)
      .doc(docId)
      .set(
        {
          ...frontmatter,
          markdown,
          cells,
          edges: typedEdges,
          file_path: filePath,
          synced_at: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    console.log(`✅ Synced [${action}]: ${filePath} → ${collection}/${docId}`);
  } catch (error) {
    console.error(`❌ Error syncing ${filePath}:`, error.message);
  }
}

function extractCellMarkers(markdown) {
  const cellRegex =
    /<!-- CELL: ([\w-]+) \| type: ([\w-]+) \| rag-priority: ([\w-]+) -->([\s\S]*?)<!-- END CELL -->/g;
  const cells = {};

  let match;
  while ((match = cellRegex.exec(markdown)) !== null) {
    const [, cellId, cellType, priority, content] = match;
    cells[cellId] = {
      type: cellType,
      priority,
      content: content.trim(),
    };
  }

  return cells;
}

function extractWikiLinks(markdown) {
  const linkRegex = /\[\[([^\]]+)\]\]/g;
  const links = [];

  let match;
  while ((match = linkRegex.exec(markdown)) !== null) {
    links.push(match[1]);
  }

  return links;
}

function inferEdgeTypes(links, cells, frontmatter) {
  // Infer relationship type based on context
  return links.map((link) => {
    let edgeType = "REFERENCES"; // Default

    // Check if link appears in specific cells
    for (const [cellId, cell] of Object.entries(cells)) {
      if (cell.content.includes(`[[${link}]]`)) {
        if (cell.type === "analysis") edgeType = "BUILDS_UPON";
        if (cell.type === "validation-metrics") edgeType = "VALIDATES";
        if (cellId === "related-learnings") edgeType = "REFERENCES";
      }
    }

    // Check frontmatter
    if (frontmatter["learning-id"] === link) edgeType = "APPLIES_LEARNING";
    if (frontmatter["target-id"] === link) edgeType = "TARGETS";

    return {
      target: link,
      type: edgeType,
      confidence: 0.8,
      inferred: true,
    };
  });
}

function getCollectionFromTags(tags = []) {
  if (tags.includes("engagement")) return "notes";
  if (tags.includes("stakeholder")) return "stakeholders";
  if (tags.includes("target-profile")) return "targets";
  if (tags.includes("learning-registry")) return "learnings";
  if (tags.includes("market-insight")) return "insights";
  if (tags.includes("weekly-review")) return "reviews";
  return "notes"; // Default
}

async function deleteFile(filePath) {
  // Soft delete - mark as archived
  const docId = filePath.replace("docs/", "").replace(".md", "");
  const collections = [
    "notes",
    "stakeholders",
    "targets",
    "learnings",
    "insights",
    "reviews",
  ];

  for (const collection of collections) {
    try {
      await db.collection(collection).doc(docId).update({
        archived: true,
        archived_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`🗑️  Archived: ${filePath}`);
    } catch (error) {
      // Document might not exist in this collection, continue
    }
  }
}

console.log("🔄 Obsidian sync started. Watching docs/ folder...");
```

**Package dependencies** (`package.json`):

```json
{
  "dependencies": {
    "chokidar": "^3.5.3",
    "gray-matter": "^4.0.3",
    "firebase-admin": "^12.0.0"
  }
}
```

**Run script**:

```powershell
# Install dependencies
npm install

# Run sync (keep running in background)
node scripts/obsidian-sync.js
```

**Time Estimate**: 8 hours (development + testing)

---

#### Deliverable 5: Neo4j Schema Design + Data Migration

**Create**: `scripts/neo4j-schema.cypher`

```cypher
// Neo4j schema for Codex Signum
// Run via Neo4j Browser after setting up Aura instance

// ========================================
// 1. CONSTRAINTS (Data Quality)
// ========================================

// Unique identifiers
CREATE CONSTRAINT note_id IF NOT EXISTS
FOR (n:Note) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT stakeholder_id IF NOT EXISTS
FOR (s:Stakeholder) REQUIRE s.id IS UNIQUE;

CREATE CONSTRAINT target_id IF NOT EXISTS
FOR (t:Target) REQUIRE t.id IS UNIQUE;

CREATE CONSTRAINT learning_id IF NOT EXISTS
FOR (l:Learning) REQUIRE l.id IS UNIQUE;

CREATE CONSTRAINT insight_id IF NOT EXISTS
FOR (i:Insight) REQUIRE i.id IS UNIQUE;

// ========================================
// 2. INDEXES (Query Performance)
// ========================================

// Date-based queries
CREATE INDEX note_date IF NOT EXISTS
FOR (n:Note) ON (n.date);

CREATE INDEX engagement_date IF NOT EXISTS
FOR (n:Note) ON (n.engagement_date);

// Status-based queries
CREATE INDEX target_status IF NOT EXISTS
FOR (t:Target) ON (t.status);

CREATE INDEX stakeholder_type IF NOT EXISTS
FOR (s:Stakeholder) ON (s.type);

CREATE INDEX learning_status IF NOT EXISTS
FOR (l:Learning) ON (l.validation_status);

// Full-text search
CREATE FULLTEXT INDEX note_content IF NOT EXISTS
FOR (n:Note) ON EACH [n.title, n.markdown];

// ========================================
// 3. NODE LABELS & PROPERTIES
// ========================================

// Note node (base class for all notes)
// (:Note {
//   id: "engagement-2025-11-10-jane-smith",
//   type: "engagement",  // engagement, event, research, market-insight
//   title: "Jane Smith - Demo Call",
//   date: date("2025-11-10"),
//   markdown: "...",
//   cells: {...},  // JSON object of cell markers
//   tags: ["engagement", "C2", "demo"],
//
//   // Engagement-specific
//   stakeholder_id: "jane-smith",
//   target_id: "university-of-wollongong",
//   stakeholder_type: "C2",
//   cta_success: true,
//   sentiment: 0.8,
//   edit_distance: 1.2,
//   time_spent_hours: 1.5,
//
//   // Metadata
//   created_at: datetime(),
//   updated_at: datetime()
// })

// Stakeholder node
// (:Stakeholder {
//   id: "jane-smith",
//   name: "Jane Smith",
//   type: "C2",  // C1/C2/C3/C4
//   organization: "University of Wollongong",
//   relationship_strength: "warm",  // cold/warm/hot
//   last_contact: date("2025-11-10"),
//   email: "jane.smith@uow.edu.au",
//   phone: "+61 2 4221 3555",
//   linkedin: "https://linkedin.com/in/janesmith"
// })

// Target node
// (:Target {
//   id: "university-of-wollongong",
//   name: "University of Wollongong",
//   status: "engaged",  // research/qualified/engaged/client/archived
//   priority: "high",  // low/medium/high/strategic
//   estimated_value: 150000,
//
//   // Validation flags
//   t2_validated: false,
//   t3_validated: false,
//   last_updated: date("2025-11-01"),
//
//   // Strategic context
//   messy_problems: ["Manual data integration", "15-year-old SIS"],
//   killer_question: "If you could eliminate manual data exports entirely, which decision would you make first?",
//
//   // Business metrics
//   initium_completed: false,
//   fabrica_started: false,
//   contract_value: 0,
//   contract_date: null
// })

// Learning node
// (:Learning {
//   id: "L-019",
//   principle: "Frame T2 solutions around legacy integration pain",
//   why_it_matters: "C4 buyers respond positively to 'integration' language",
//   validation_status: "untested",  // untested/validated/superseded
//   application_count: 0,
//   stakeholder_type: "C4",  // When to apply
//   vertical: "HEI",  // Higher Education Institutions
//   created_at: date("2025-11-08")
// })

// Insight node
// (:Insight {
//   id: "INS-20251110-001",
//   category: "stakeholder-pattern",
//   title: "C4 Economic Buyers prioritize integration over AI capabilities",
//   relevance: "high",
//   status: "validated"
// })

// ========================================
// 4. RELATIONSHIP TYPES
// ========================================

// General relationships
// (:Note)-[:REFERENCES]->(:Note)
// (:Note)-[:BUILDS_UPON]->(:Learning)
// (:Note)-[:VALIDATES]->(:Target)  // Research confirms T2/T3
// (:Note)-[:CONTRADICTS]->(:Note)  // Conflicting information

// Organizational relationships
// (:Stakeholder)-[:WORKS_AT]->(:Target)
// (:Stakeholder)-[:KNOWS]->(:Stakeholder)  // Network connections

// Learning relationships
// (:Learning)-[:APPLIED_IN]->(:Note)  // Track impact
// (:Learning)-[:SUPERSEDES]->(:Learning)  // Evolution

// Temporal relationships
// (:Note)-[:PRECEDES]->(:Note)
// (:Note)-[:FOLLOWS]->(:Note)

// ========================================
// 5. SAMPLE DATA (For Testing)
// ========================================

// Create sample stakeholder
CREATE (s:Stakeholder {
  id: "jane-smith",
  name: "Jane Smith",
  type: "C4",
  organization: "University of Wollongong",
  relationship_strength: "warm",
  last_contact: date("2025-11-10")
});

// Create sample target
CREATE (t:Target {
  id: "university-of-wollongong",
  name: "University of Wollongong",
  status: "engaged",
  priority: "high",
  estimated_value: 150000,
  t2_validated: false,
  t3_validated: false,
  last_updated: date("2025-11-01"),
  messy_problems: ["Manual data integration", "15-year-old SIS"]
});

// Create sample engagement note
CREATE (e:Note {
  id: "engagement-2025-11-10-jane-smith",
  type: "engagement",
  title: "Jane Smith - Demo Call",
  date: date("2025-11-10"),
  stakeholder_id: "jane-smith",
  target_id: "university-of-wollongong",
  stakeholder_type: "C4",
  cta_success: true,
  sentiment: 0.8,
  edit_distance: 1.2,
  time_spent_hours: 1.5,
  tags: ["engagement", "C4", "demo"]
});

// Create sample learning
CREATE (l:Learning {
  id: "L-019",
  principle: "Frame T2 solutions around legacy integration pain",
  why_it_matters: "C4 buyers respond positively to 'integration' language",
  validation_status: "untested",
  application_count: 0,
  stakeholder_type: "C4",
  vertical: "HEI"
});

// Create relationships
MATCH (s:Stakeholder {id: "jane-smith"}), (t:Target {id: "university-of-wollongong"})
CREATE (s)-[:WORKS_AT]->(t);

MATCH (e:Note {id: "engagement-2025-11-10-jane-smith"}), (t:Target {id: "university-of-wollongong"})
CREATE (e)-[:VALIDATES]->(t);

MATCH (l:Learning {id: "L-019"}), (e:Note {id: "engagement-2025-11-10-jane-smith"})
CREATE (l)-[:APPLIED_IN]->(e);
```

**Create**: `scripts/firestore-to-neo4j.js`

```javascript
// firestore-to-neo4j.js - Migrate existing notes to Neo4j
const admin = require("firebase-admin");
const neo4j = require("neo4j-driver");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "codex-signum",
});
const db = admin.firestore();

// Initialize Neo4j driver
const driver = neo4j.driver(
  "neo4j+s://YOUR_AURA_INSTANCE.databases.neo4j.io",
  neo4j.auth.basic("neo4j", "YOUR_PASSWORD")
);

async function migrateAllData() {
  const session = driver.session();

  try {
    // Migrate stakeholders
    console.log("Migrating stakeholders...");
    const stakeholders = await db.collection("stakeholders").get();
    for (const doc of stakeholders.docs) {
      await createStakeholderNode(session, doc.id, doc.data());
    }

    // Migrate targets
    console.log("Migrating targets...");
    const targets = await db.collection("targets").get();
    for (const doc of targets.docs) {
      await createTargetNode(session, doc.id, doc.data());
    }

    // Migrate notes (engagements, events, research)
    console.log("Migrating notes...");
    const notes = await db.collection("notes").get();
    for (const doc of notes.docs) {
      await createNoteNode(session, doc.id, doc.data());
    }

    // Migrate learnings
    console.log("Migrating learnings...");
    const learnings = await db.collection("learnings").get();
    for (const doc of learnings.docs) {
      await createLearningNode(session, doc.id, doc.data());
    }

    // Create relationships from edges
    console.log("Creating relationships...");
    for (const doc of notes.docs) {
      const data = doc.data();
      if (data.edges) {
        await createRelationships(session, doc.id, data.edges);
      }
    }

    console.log("✅ Migration complete!");
  } finally {
    await session.close();
  }
}

async function createStakeholderNode(session, id, data) {
  await session.run(
    `
    MERGE (s:Stakeholder {id: $id})
    SET s += $properties
  `,
    {
      id,
      properties: {
        name: data.name || "",
        type: data["stakeholder-type"] || "C1",
        organization: data.organization || "",
        relationship_strength: data["relationship-strength"] || "cold",
        last_contact: data["last-contact-date"]
          ? neo4j.types.Date.fromStandardDate(
              new Date(data["last-contact-date"])
            )
          : null,
        email: data.email || "",
        phone: data.phone || "",
        linkedin: data.linkedin || "",
      },
    }
  );
}

async function createTargetNode(session, id, data) {
  await session.run(
    `
    MERGE (t:Target {id: $id})
    SET t += $properties
  `,
    {
      id,
      properties: {
        name: data.name || "",
        status: data.status || "research",
        priority: data.priority || "medium",
        estimated_value: data["estimated-value"] || 0,
        t2_validated: data["t2-validated"] || false,
        t3_validated: data["t3-validated"] || false,
        last_updated: data["last-updated"]
          ? neo4j.types.Date.fromStandardDate(new Date(data["last-updated"]))
          : null,
        messy_problems: data["messy-problems"] || [],
        killer_question: data["killer-question"] || "",
      },
    }
  );
}

async function createNoteNode(session, id, data) {
  await session.run(
    `
    MERGE (n:Note {id: $id})
    SET n += $properties
  `,
    {
      id,
      properties: {
        type: data.tags?.includes("engagement")
          ? "engagement"
          : data.tags?.includes("event")
          ? "event"
          : data.tags?.includes("research-note")
          ? "research"
          : "note",
        title: data.title || "",
        date:
          data.date || data["engagement-date"]
            ? neo4j.types.Date.fromStandardDate(
                new Date(data.date || data["engagement-date"])
              )
            : null,
        markdown: data.markdown || "",
        tags: data.tags || [],
        stakeholder_id: data["stakeholder-id"] || "",
        target_id: data["target-id"] || "",
        stakeholder_type: data["stakeholder-type"] || "",
        cta_success: data["cta-success"] || null,
        sentiment: data["sentiment-score"] || 0,
        edit_distance: data["edit-distance-score"] || 0,
        time_spent_hours: data["time-spent-hours"] || 0,
      },
    }
  );
}

async function createLearningNode(session, id, data) {
  await session.run(
    `
    MERGE (l:Learning {id: $id})
    SET l += $properties
  `,
    {
      id,
      properties: {
        principle: data.principle || "",
        why_it_matters: data["why-it-matters"] || "",
        validation_status: data["validation-status"] || "untested",
        application_count: data["application-count"] || 0,
        stakeholder_type: data["stakeholder-type"] || "",
        vertical: data.vertical || "",
      },
    }
  );
}

async function createRelationships(session, sourceId, edges) {
  for (const edge of edges) {
    await session.run(
      `
      MATCH (source {id: $sourceId})
      MATCH (target {id: $targetId})
      MERGE (source)-[r:${edge.type}]->(target)
      SET r.confidence = $confidence, r.inferred = $inferred
    `,
      {
        sourceId,
        targetId: edge.target,
        confidence: edge.confidence || 0.8,
        inferred: edge.inferred || false,
      }
    );
  }
}

// Run migration
migrateAllData()
  .then(() => {
    console.log("Migration complete");
    driver.close();
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    driver.close();
    process.exit(1);
  });
```

**Time Estimate**: 12 hours (schema design + migration script + testing)

---

#### Sprint 1 Summary

**Total Time**: 32 hours (2 weeks @ 16 hours/week)

**Deliverables**:

1. ✅ Architecture ambiguities resolved (Pattern 0, Core Types)
2. ✅ System Health Dashboard (6 Dataview queries)
3. ✅ Validation metadata added to templates
4. ✅ Obsidian → Firestore sync script operational
5. ✅ Neo4j schema designed + existing data migrated

**Success Criteria**:

- ✅ All 50+ existing notes synced to Firestore
- ✅ Neo4j graph has 100+ nodes, 200+ relationships
- ✅ Dashboard surfaces 5+ gaps requiring action

---

### Sprint 2: The Auditor Agent (Weeks 3-4)

**Dates**: Nov 25 - Dec 8, 2025

#### Deliverable: Autonomous System Health Monitoring

**Create**: `agents/auditor/auditor_agent.py`

```python
# auditor_agent.py - Neo4j-powered system health monitoring
from neo4j import GraphDatabase
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
import firebase_admin
from firebase_admin import firestore
from datetime import datetime

# Initialize Firebase
if not firebase_admin._apps:
    firebase_admin.initialize_app()
db = firestore.client()

# Initialize Neo4j
driver = GraphDatabase.driver(
    "neo4j+s://YOUR_AURA_INSTANCE.databases.neo4j.io",
    auth=("neo4j", "YOUR_PASSWORD")
)

@tool
def query_stale_targets() -> str:
    """Finds Target Profiles not updated in 30+ days with priority weighting"""
    with driver.session() as session:
        result = session.run("""
            MATCH (t:Target)
            WHERE t.last_updated < date() - duration({days: 30})
              AND t.status IN ['engaged', 'qualified']
            OPTIONAL MATCH (t)<-[:WORKS_AT]-(s:Stakeholder)
            RETURN t.name AS target,
                   t.priority,
                   t.last_updated,
                   duration.inDays(t.last_updated, date()).days AS staleness,
                   collect(s.name) AS stakeholders,
                   t.estimated_value AS pipeline_value
            ORDER BY
              CASE t.priority
                WHEN 'strategic' THEN 1
                WHEN 'high' THEN 2
                WHEN 'medium' THEN 3
                ELSE 4
              END,
              staleness DESC
            LIMIT 10
        """)
        return [dict(record) for record in result]

@tool
def query_unvalidated_assumptions() -> str:
    """Finds engaged targets with unvalidated T2/T3 hypotheses"""
    with driver.session() as session:
        result = session.run("""
            MATCH (t:Target)
            WHERE t.status = 'engaged'
              AND (t.t2_validated = false OR t.t3_validated = false)
            OPTIONAL MATCH (t)<-[:WORKS_AT]-(s:Stakeholder)
            OPTIONAL MATCH (t)<-[:VALIDATES]-(e:Note {type: 'engagement'})
            RETURN t.name AS target,
                   t.messy_problems,
                   t.t2_validated,
                   t3_validated,
                   collect(DISTINCT s.name) AS stakeholders,
                   count(DISTINCT e) AS engagement_count,
                   t.estimated_value AS pipeline_value
            ORDER BY engagement_count DESC, t.estimated_value DESC
            LIMIT 10
        """)
        return [dict(record) for record in result]

@tool
def find_warm_intro_paths() -> str:
    """Discovers warm introduction paths to C4 Economic Buyers"""
    with driver.session() as session:
        result = session.run("""
            MATCH path = shortestPath(
                (me:Stakeholder {name: 'Principal'})
                -[:KNOWS*1..4]-
                (buyer:Stakeholder {type: 'C4'})
            )
            MATCH (buyer)-[:WORKS_AT]->(org:Target)
            WHERE buyer.last_contact < date() - duration({days: 60})
              AND org.status IN ['research', 'qualified']
            RETURN buyer.name AS economic_buyer,
                   org.name AS target_org,
                   [node IN nodes(path) | node.name] AS intro_path,
                   length(path) AS path_length,
                   org.messy_problems AS pain_points,
                   org.priority AS priority,
                   org.estimated_value AS pipeline_value
            ORDER BY path_length ASC, org.estimated_value DESC
            LIMIT 10
        """)
        return [dict(record) for record in result]

@tool
def query_learning_impact() -> str:
    """Tracks learning application → outcome correlation"""
    with driver.session() as session:
        result = session.run("""
            MATCH (l:Learning)-[:APPLIED_IN]->(e:Note {type: 'engagement'})
            WHERE e.cta_success IS NOT NULL AND e.sentiment IS NOT NULL
            WITH l,
                 avg(CASE WHEN e.cta_success = true THEN 1.0 ELSE 0.0 END) AS avg_cta,
                 avg(e.sentiment) AS avg_sentiment,
                 count(e) AS applications
            WHERE applications >= 3
            RETURN l.id AS learning_id,
                   l.principle,
                   l.validation_status,
                   round(avg_cta * 100) AS cta_success_rate,
                   round(avg_sentiment, 2) AS avg_sentiment,
                   applications
            ORDER BY avg_cta DESC
            LIMIT 10
        """)
        return [dict(record) for record in result]

@tool
def query_scope_creep_risk() -> str:
    """Identifies engagements with hours exceeding estimates"""
    with driver.session() as session:
        result = session.run("""
            MATCH (t:Target)
            WHERE t.initium_completed = true OR t.fabrica_started = true
            OPTIONAL MATCH (t)<-[:VALIDATES]-(e:Note {type: 'engagement'})
            WITH t, sum(e.time_spent_hours) AS total_hours
            WHERE total_hours > t.estimated_hours * 1.2
            RETURN t.name AS target,
                   t.contract_value,
                   t.estimated_hours,
                   total_hours,
                   round((total_hours - t.estimated_hours) / t.estimated_hours * 100) AS overage_pct,
                   round(t.contract_value / total_hours) AS effective_rate
            ORDER BY overage_pct DESC
            LIMIT 10
        """)
        return [dict(record) for record in result]

# Hierarchical Router (Pattern 1 from ARCHITECTURE_PATTERNS.md)
class HierarchicalRouter:
    def __init__(self):
        self.quick_responder = ChatOpenAI(model="gpt-4o-mini", temperature=0)
        self.deep_thinker = ChatOpenAI(model="o1-mini", temperature=1)

    def route(self, complexity: str):
        """Route to appropriate model based on task complexity"""
        return self.deep_thinker if complexity == "complex" else self.quick_responder

# Auditor prompt
auditor_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are The Auditor for Codex Signum consulting practice.

Your job: Analyze system health using Neo4j graph queries, prioritize gaps, surface strategic opportunities.

Available tools:
- query_stale_targets: Find outdated research (30+ days without update)
- query_unvalidated_assumptions: Find unconfirmed T2/T3 hypotheses
- find_warm_intro_paths: Discover network opportunities (paths to C4 buyers)
- query_learning_impact: Validate which principles drive success
- query_scope_creep_risk: Identify engagements exceeding estimates

For each finding:
1. Assess business impact (High/Medium/Low based on pipeline value and urgency)
2. Suggest specific action (what consultant should do)
3. Estimate effort (hours)
4. Flag strategic opportunities (warm intros, validated learnings)

Output format:
- Prioritized task list sorted by (impact × urgency)
- Use Neo4j query evidence to support recommendations
- Include pipeline value to quantify business impact"""),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}")
])

# Create agent
router = HierarchicalRouter()
tools = [
    query_stale_targets,
    query_unvalidated_assumptions,
    find_warm_intro_paths,
    query_learning_impact,
    query_scope_creep_risk
]

agent = create_tool_calling_agent(router.quick_responder, tools, auditor_prompt)
auditor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# Cloud Function for nightly execution
def run_nightly_audit(request):
    """Cloud Function triggered by Cloud Scheduler at 3 AM"""
    try:
        result = auditor.invoke({"input": "Run full system audit"})

        # Store in Firestore for dashboard
        db.collection('system_health').document('daily_audit').set({
            'date': firestore.SERVER_TIMESTAMP,
            'findings': result['output'],
            'raw_data': {
                'stale_targets': query_stale_targets.invoke({}),
                'unvalidated': query_unvalidated_assumptions.invoke({}),
                'warm_intros': find_warm_intro_paths.invoke({}),
                'learning_impact': query_learning_impact.invoke({}),
                'scope_creep': query_scope_creep_risk.invoke({})
            }
        })

        # Send email digest (optional)
        # send_email_digest(result['output'])

        return {'status': 'success', 'audit_id': 'daily_audit'}
    except Exception as e:
        print(f"Error running audit: {e}")
        return {'status': 'error', 'message': str(e)}, 500

if __name__ == "__main__":
    # Test locally
    result = auditor.invoke({"input": "Run full system audit"})
    print(result)
```

**Deploy to Firebase Cloud Functions**:

```powershell
# Deploy Cloud Function
firebase deploy --only functions:runNightlyAudit

# Set up Cloud Scheduler (runs at 3 AM daily)
gcloud scheduler jobs create http nightly-audit \
  --schedule="0 3 * * *" \
  --uri="https://us-central1-codex-signum.cloudfunctions.net/runNightlyAudit" \
  --http-method=POST \
  --time-zone="Australia/Sydney"
```

**Time Estimate**: 16 hours (development + testing + deployment)

---

**Sprint 2-7 Details**: [Continue in next sections...]

---

## Budget Breakdown

### One-Time Costs

| Item             | Cost   | Notes                           |
| ---------------- | ------ | ------------------------------- |
| Neo4j Aura trial | $0     | 14-day free trial               |
| Pinecone trial   | $0     | Free tier (1M vectors)          |
| Development time | $0     | Internal investment (120 hours) |
| **TOTAL**        | **$0** |                                 |

### Monthly Recurring Costs (Phase 3 Complete)

| Component                        | Cost     | Justification                                   |
| -------------------------------- | -------- | ----------------------------------------------- |
| Neo4j Aura Professional          | $65      | 500K nodes, 5M relationships, strategic queries |
| Pinecone Starter                 | $70      | 1M vectors, 1 pod, semantic search              |
| LLM API costs (OpenAI)           | $50      | Hierarchical router (77% cost reduction)        |
| Firebase (Firestore + Functions) | $25      | Real-time sync, serverless compute              |
| **TOTAL**                        | **$210** |                                                 |

### ROI Calculation

- **Monthly cost**: $210
- **Consultant hourly rate**: $150
- **Break-even**: 1.4 hours/month saved
- **Conservative estimate**: 8 hours/week = 32 hours/month saved
- **Value delivered**: 32 × $150 = $4,800/month
- **ROI**: 23x ($4,800 / $210)

---

## Success Metrics

### Productivity Metrics (COO Agent Tracks)

- ✅ **Time savings**: 8+ hours/week validated
- ✅ **Billable utilization**: From 45% → 60%+
- ✅ **Task completion velocity**: 5+ high-value tasks/week

### Quality Metrics (Strategist Agent Validates)

- ✅ **Zero stale targets**: All engaged targets updated within 30 days
- ✅ **95% T2/T3 validation**: All qualified targets have validated hypotheses
- ✅ **Learning library growth**: 50+ validated principles by Year 1 end

### Business Metrics (CFO Agent Reports)

- ✅ **Conversion rate**: Initium → Fabrica from 25% → 40%
- ✅ **Revenue acceleration**: Hit $500k Year 1 target
- ✅ **Strategic insights**: 10+ graph-discovered opportunities per month

### Technical Metrics (Auditor Agent Monitors)

- ✅ **Neo4j query performance**: <2 seconds (p95)
- ✅ **Agent accuracy**: 95%+ (human validation)
- ✅ **Infrastructure uptime**: 99.5%+

---

## Risk Mitigation

### Technical Risks

| Risk                          | Likelihood | Impact | Mitigation                                              |
| ----------------------------- | ---------- | ------ | ------------------------------------------------------- |
| Neo4j learning curve steep    | Medium     | Medium | Start with simple queries, expand gradually             |
| Agent hallucinations          | Medium     | High   | Human-in-loop approval for all Learning Registry drafts |
| API cost overruns             | Low        | Medium | LangSmith monitoring, $200/month budget alert           |
| Firestore → Obsidian sync lag | Low        | Low    | Keep Obsidian as source of truth during Phase 3A-B      |

### Business Risks

| Risk                          | Likelihood | Impact | Mitigation                                           |
| ----------------------------- | ---------- | ------ | ---------------------------------------------------- |
| Time sink (not client-facing) | Medium     | High   | Budget max 10 hours/week, prioritize agents with ROI |
| Over-engineering              | Medium     | Medium | Build only agents with measurable productivity gain  |
| Obsidian dependency           | Low        | Medium | Maintain export script so vault is always portable   |

---

## Phase 4+ Future Enhancements

### Astral Script Foundation (Q2 2026)

**Lay groundwork now** (no UI yet):

1. **Visual metadata in YAML**:

   ```yaml
   visual_representation:
     type: graph # graph, timeline, hierarchy, flow
     node_color: "#4A90E2"
     layout: "force-directed"
   ```

2. **Cell marker extension**:

   ```markdown
   <!-- CELL: key-insight | type: analysis | visual: node | spatial: {x: 0, y: 0, z: 0} -->
   ```

3. **Neo4j visual properties**:
   ```cypher
   CREATE (n:Note {
     visual_type: "graph",
     visual_color: "#4A90E2",
     spatial_x: 100.5,
     spatial_y: 250.3
   })
   ```

**Trigger**: After 4 agents proven + 6 months production use

---

### Specialist Agents (Q2 2026+)

See [AGENT_REGISTRY.md](AGENT_REGISTRY.md) for full specs:

- 🟢 **Cybersecurity** (Q2): Security monitoring, threat detection
- 🟡 **Compliance** (Q2): Contract adherence, scope creep detection
- 🟡 **Risk Management** (Q3): Pipeline concentration, payment risk
- 🟡 **Legal** (Q3): Contract review, IP protection
- 🔵 **Marketing** (Q4): Content generation, campaign optimization
- 🔵 **Sales Development** (Q4): Lead qualification, outreach automation
- 🔵 **HR/Talent** (2027): Subcontractor sourcing, capacity forecasting
- 🔵 **Customer Success** (2027): Churn prediction, expansion opportunities

---

## Related Documents

- **Agent Registry**: [AGENT_REGISTRY.md](AGENT_REGISTRY.md) - Full agent catalog
- **Agent Specs**: [agents/\*.md](agents/) - Individual agent specifications
- **Architecture Patterns**: [../Kore/ARCHITECTURE_PATTERNS.md](../Kore/ARCHITECTURE_PATTERNS.md)
- **Architecture Assessment**: [../Kore/ARCHITECTURE_ASSESSMENT.md](../Kore/ARCHITECTURE_ASSESSMENT.md)
- **Business Plan**: [../Business Plan/Business Plan - Codex Signum (V5.4).md](<../Business%20Plan/Business%20Plan%20-%20Codex%20Signum%20(V5.4).md>)
- **Template System**: [Templates/TEMPLATE_CHANGELOG.md](Templates/TEMPLATE_CHANGELOG.md)

---

## Changelog

### 2025-11-10 - Version 1.0

- Initial Phase 3 implementation plan created
- Documented 12-week sprint plan with 6 core agents
- Defined technology stack (Neo4j, Pinecone, Firebase)
- Established success metrics and risk mitigation
- Integrated findings from ARCHITECTURE_ASSESSMENT.md

---

**Last Updated**: 2025-11-10  
**Next Review**: 2025-11-25 (Sprint 1 complete)  
**Status**: 🔴 Planning → Ready to Execute Sprint 1
