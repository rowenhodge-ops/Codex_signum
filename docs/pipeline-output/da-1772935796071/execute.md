# EXECUTE (claude-opus-4-5:extended:16k)

Quality: 0.70 | Duration: 50481ms

# Graph-Native Representation Solution

## 1. Graph Schema Definition (Neo4j Cypher)

```cypher
// schema.cypher - Graph Schema Definition for M-17 Pipeline

// ============================================
// CONSTRAINT DEFINITIONS
// ============================================

CREATE CONSTRAINT task_id_unique IF NOT EXISTS
FOR (t:Task) REQUIRE t.id IS UNIQUE;

CREATE CONSTRAINT artifact_id_unique IF NOT EXISTS
FOR (a:Artifact) REQUIRE a.id IS UNIQUE;

CREATE CONSTRAINT pipeline_run_unique IF NOT EXISTS
FOR (p:PipelineRun) REQUIRE p.timestamp IS UNIQUE;

// ============================================
// INDEX DEFINITIONS
// ============================================

CREATE INDEX task_status_idx IF NOT EXISTS FOR (t:Task) ON (t.status);
CREATE INDEX task_type_idx IF NOT EXISTS FOR (t:Task) ON (t.taskType);
CREATE INDEX artifact_type_idx IF NOT EXISTS FOR (a:Artifact) ON (a.type);

// ============================================
// NODE LABELS & PROPERTIES
// ============================================

// :PipelineRun { timestamp, version, status, sourceDir }
// :Task { id, title, description, status, complexity, taskType, sequence }
// :Artifact { id, name, type, path, checksum }
// :Tag { name }
// :Metadata { key, value }
```

---

## 2. Data Migration Script

```python
#!/usr/bin/env python3
"""
graph_migrator.py - Migrate M-17 Pipeline Output to Neo4j Graph
"""

import json
import re
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional
from neo4j import GraphDatabase


# ============================================
# DATA MODELS
# ============================================

@dataclass
class Artifact:
    id: str
    name: str
    artifact_type: str
    path: str
    checksum: Optional[str] = None


@dataclass
class Task:
    id: str
    title: str
    description: str
    status: str
    complexity: str
    task_type: str
    sequence: int
    dependencies: list[str] = field(default_factory=list)
    produces: list[Artifact] = field(default_factory=list)
    consumes: list[str] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)


@dataclass
class PipelineRun:
    timestamp: str
    version: str
    status: str
    source_dir: str
    tasks: list[Task] = field(default_factory=list)


# ============================================
# PARSERS
# ============================================

class ManifestParser:
    """Parse _manifest.json metadata."""
    
    def parse(self, manifest_path: Path) -> dict:
        with open(manifest_path, 'r') as f:
            return json.load(f)
    
    def extract_pipeline_run(self, data: dict) -> PipelineRun:
        return PipelineRun(
            timestamp=data.get('timestamp', ''),
            version=data.get('version', '2.1'),
            status=data.get('status', 'unknown'),
            source_dir=data.get('sourceDirectory', '')
        )


class MarkdownTaskParser:
    """Extract structured task data from markdown files."""
    
    PATTERNS = {
        'title': re.compile(r'^#\s+(.+)$', re.MULTILINE),
        'task_id': re.compile(r'\*\*Task ID\*\*:\s*`?([^`\n]+)`?'),
        'status': re.compile(r'\*\*Status\*\*:\s*(\w+)'),
        'complexity': re.compile(r'\*\*Complexity\*\*:\s*(\w+)'),
        'task_type': re.compile(r'\*\*Type\*\*:\s*(\w+)'),
        'dependencies': re.compile(r'##\s*Dependencies\s*\n([\s\S]*?)(?=\n##|\Z)'),
        'artifacts': re.compile(r'##\s*Artifacts\s*\n([\s\S]*?)(?=\n##|\Z)'),
        'description': re.compile(r'##\s*Description\s*\n([\s\S]*?)(?=\n##|\Z)'),
    }
    
    def parse(self, md_path: Path, sequence: int) -> Task:
        content = md_path.read_text()
        
        task = Task(
            id=self._extract('task_id', content) or md_path.stem,
            title=self._extract('title', content) or 'Untitled',
            description=self._extract('description', content) or '',
            status=self._extract('status', content) or 'pending',
            complexity=self._extract('complexity', content) or 'unknown',
            task_type=self._extract('task_type', content) or 'general',
            sequence=sequence
        )
        
        task.dependencies = self._extract_list(
            self._extract('dependencies', content)
        )
        task.produces = self._extract_artifacts(
            self._extract('artifacts', content)
        )
        
        return task
    
    def _extract(self, key: str, content: str) -> Optional[str]:
        match = self.PATTERNS[key].search(content)
        return match.group(1).strip() if match else None
    
    def _extract_list(self, section: Optional[str]) -> list[str]:
        if not section:
            return []
        items = re.findall(r'[-*]\s*`?([^`\n]+)`?', section)
        return [item.strip() for item in items if item.strip()]
    
    def _extract_artifacts(self, section: Optional[str]) -> list[Artifact]:
        if not section:
            return []
        
        artifacts = []
        for match in re.finditer(r'[-*]\s*`([^`]+)`\s*(?:\((\w+)\))?', section):
            artifacts.append(Artifact(
                id=f"artifact-{len(artifacts)}",
                name=match.group(1),
                artifact_type=match.group(2) or 'file',
                path=match.group(1)
            ))
        return artifacts


# ============================================
# GRAPH WRITER
# ============================================

class GraphWriter:
    """Write parsed data to Neo4j."""
    
    def __init__(self, uri: str, user: str, password: str):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
    
    def close(self):
        self.driver.close()
    
    def write_pipeline(self, pipeline: PipelineRun):
        with self.driver.session() as session:
            # Create PipelineRun node
            session.execute_write(self._create_pipeline_run, pipeline)
            
            # Create Task nodes and relationships
            for task in pipeline.tasks:
                session.execute_write(self._create_task, task, pipeline.timestamp)
            
            # Create dependency edges (second pass)
            for task in pipeline.tasks:
                session.execute_write(self._create_dependencies, task)
    
    @staticmethod
    def _create_pipeline_run(tx, pipeline: PipelineRun):
        tx.run("""
            MERGE (p:PipelineRun {timestamp: $timestamp})
            SET p.version = $version,
                p.status = $status,
                p.sourceDir = $source_dir
        """, 
            timestamp=pipeline.timestamp,
            version=pipeline.version,
            status=pipeline.status,
            source_dir=pipeline.source_dir
        )
    
    @staticmethod
    def _create_task(tx, task: Task, pipeline_timestamp: str):
        # Create task node
        tx.run("""
            MERGE (t:Task {id: $id})
            SET t.title = $title,
                t.description = $description,
                t.status = $status,
                t.complexity = $complexity,
                t.taskType = $task_type,
                t.sequence = $sequence
            
            WITH t
            MATCH (p:PipelineRun {timestamp: $pipeline_ts})
            MERGE (p)-[:CONTAINS]->(t)
        """,
            id=task.id,
            title=task.title,
            description=task.description,
            status=task.status,
            complexity=task.complexity,
            task_type=task.task_type,
            sequence=task.sequence,
            pipeline_ts=pipeline_timestamp
        )
        
        # Create artifact nodes
        for artifact in task.produces:
            tx.run("""
                MERGE (a:Artifact {id: $id})
                SET a.name = $name,
                    a.type = $type,
                    a.path = $path
                
                WITH a
                MATCH (t:Task {id: $task_id})
                MERGE (t)-[:PRODUCES]->(a)
            """,
                id=artifact.id,
                name=artifact.name,
                type=artifact.artifact_type,
                path=artifact.path,
                task_id=task.id
            )
    
    @staticmethod
    def _create_dependencies(tx, task: Task):
        for dep_id in task.dependencies:
            tx.run("""
                MATCH (t:Task {id: $task_id})
                MATCH (dep:Task {id: $dep_id})
                MERGE (t)-[:DEPENDS_ON]->(dep)
            """,
                task_id=task.id,
                dep_id=dep_id
            )


# ============================================
# ORCHESTRATOR
# ============================================

class PipelineMigrator:
    """Main orchestrator for pipeline migration."""
    
    def __init__(self, source_dir: Path, graph_writer: GraphWriter):
        self.source_dir = source_dir
        self.writer = graph_writer
        self.manifest_parser = ManifestParser()
        self.task_parser = MarkdownTaskParser()
    
    def migrate(self):
        # Parse manifest
        manifest_path = self.source_dir / '_manifest.json'
        manifest_data = self.manifest_parser.parse(manifest_path)
        pipeline = self.manifest_parser.extract_pipeline_run(manifest_data)
        
        # Parse all markdown task files
        md_files = sorted(self.source_dir.glob('*.md'))
        for seq, md_file in enumerate(md_files, start=1):
            task = self.task_parser.parse(md_file, seq)
            pipeline.tasks.append(task)
        
        # Write to graph
        self.writer.write_pipeline(pipeline)
        
        return pipeline


# ============================================
# ENTRY POINT
# ============================================

def main():
    source = Path('docs/pipeline-output/2026-03-06T01-06-52/')
    
    writer = GraphWriter(
        uri='bolt://localhost:7687',
        user='neo4j',
        password='password'
    )
    
    try:
        migrator = PipelineMigrator(source, writer)
        pipeline = migrator.migrate()
        print(f"Migrated {len(pipeline.tasks)} tasks to graph")
    finally:
        writer.close()


if __name__ == '__main__':
    main()
```

---

## 3. Schema Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        GRAPH SCHEMA                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  :PipelineRun    │
├──────────────────┤
│ timestamp (UK)   │──────────┐
│ version          │          │
│ status           │          │ :CONTAINS
│ sourceDir        │          │
└──────────────────┘          ▼
                      ┌──────────────────┐
                      │     :Task        │
                      ├──────────────────┤
        ┌────────────▶│ id (UK)          │◀───────────┐
        │             │ title            │            │
        │             │ description      │            │
   :DEPENDS_ON       │ status           │       :DEPENDS_ON
        │             │ complexity       │            │
        │             │ taskType         │            │
        └─────────────│ sequence         │────────────┘
                      └────────┬─────────┘
                               │
                               │ :PRODUCES
                               ▼
                      ┌──────────────────┐
                      │   :Artifact      │
                      ├──────────────────┤
                      │ id (UK)          │
                      │ name             │
                      │ type             │
                      │ path             │
                      │ checksum         │
                      └──────────────────┘

Legend: (UK) = Unique Key Constraint
```

---

## 4. Example Queries

```cypher
-- Find all tasks dependent on a specific task
MATCH (t:Task)-[:DEPENDS_ON*]->(dep:Task {id: 'task-001'})
RETURN t.id, t.title, t.status;

-- Get full dependency chain for a task
MATCH path = (t:Task {id: 'task-013'})-[:DEPENDS_ON*]->(root:Task)
WHERE NOT (root)-[:DEPENDS_ON]->()
RETURN path;

-- Find tasks that produce artifacts consumed by other tasks
MATCH (producer:Task)-[:PRODUCES]->(a:Artifact)<-[:CONSUMES]-(consumer:Task)
RETURN producer.title AS produces, 
       a.name AS artifact, 
       consumer.title AS consumes;

-- Detect circular dependencies
MATCH (t:Task)-[:DEPENDS_ON*]->(t)
RETURN DISTINCT t.id AS circular_task;

-- Pipeline execution order (topological sort)
MATCH (t:Task)
OPTIONAL MATCH (t)-[:DEPENDS_ON]->(dep:Task)
WITH t, count(dep) AS dependency_count
RETURN t.id, t.title, dependency_count
ORDER BY dependency_count ASC;

-- Task status summary by complexity
MATCH (t:Task)
RETURN t.complexity, t.status, count(*) AS count
ORDER BY t.complexity, t.status;
```

---

## 5. Validation Script

```python
def validate_graph(driver):
    """Run validation checks on migrated graph."""
    
    checks = [
        ("Task count", "MATCH (t:Task) RETURN count(t) AS n"),
        ("Orphan tasks", """
            MATCH (t:Task) 
            WHERE NOT ()-[:CONTAINS]->(t) 
            RETURN count(t) AS n
        """),
        ("Circular deps", """
            MATCH (t:Task)-[:DEPENDS_ON*]->(t) 
            RETURN count(DISTINCT t) AS n
        """),
    ]
    
    with driver.session() as session:
        for name, query in checks:
            result = session.run(query).single()
            print(f"{name}: {result['n']}")
```

**Ready for deployment.** Adjust connection parameters and file paths as needed.