# Document Metadata Standard

**Version**: 1.0  
**Created**: 2025-11-10  
**Purpose**: Universal metadata template for all planning, architecture, and specification documents in Codex Signum

---

## Overview

All documentation files (architecture, planning, specifications, guides) **MUST** include a YAML frontmatter block with standardized metadata fields. This enables:

1. **Status Tracking**: Quick visual identification of document state
2. **Version Control**: Track evolution and superseding relationships
3. **Discovery**: Find related documents via tags and cross-references
4. **Governance**: Distinguish baseline documents from draft work

---

## Mandatory Metadata Template

Every documentation file should begin with:

```yaml
---
document-type: [architecture|planning|specification|guide|changelog|registry]
status: [🔴 Draft|🟡 In Progress|🟢 Active|🔵 Archived|⚫ Deprecated]
version: X.Y
created: YYYY-MM-DD
last-updated: YYYY-MM-DD
author: [Human|AI-Generated|Collaborative]
related-documents: [List of related file paths or wiki-links]
supersedes: [Previous version file path - if applicable]
superseded-by: [Newer version file path - if applicable]
tags: [Relevant categorization tags]
---

# Document Title

**Purpose**: One-sentence description of what this document achieves

**Scope**: What this document covers (and what it doesn't)

---

[Content follows...]
```

---

## Field Definitions

### document-type (Required)

Categorizes the document's purpose:

- **`architecture`**: Technical architecture patterns, design decisions (e.g., ARCHITECTURE_PATTERNS.md)
- **`planning`**: Implementation roadmaps, sprint plans (e.g., PHASE_3_IMPLEMENTATION_PLAN.md)
- **`specification`**: Detailed specs for agents, features, components (e.g., agent spec files)
- **`guide`**: How-to documentation, user guides (e.g., USER_GUIDE.md)
- **`changelog`**: Change history and audit trails (e.g., TEMPLATE_CHANGELOG.md)
- **`registry`**: Central catalogs or indexes (e.g., AGENT_REGISTRY.md)

### status (Required)

Visual status indicators using emoji for quick scanning:

- **🔴 Draft**: Work in progress, not yet reviewed, subject to major changes
- **🟡 In Progress**: Under active development, partially complete
- **🟢 Active**: Current version, approved for use, baseline reference
- **🔵 Archived**: Historical reference, superseded by newer version
- **⚫ Deprecated**: No longer relevant, kept for historical context only

**Critical Rules**:

- ✅ **🔴 Draft** and **🟡 In Progress** docs: Can be freely modified
- ⚠️ **🟢 Active** docs: Changes require change log entry (for architecture/specs)
- ❌ **🔵 Archived** and **⚫ Deprecated** docs: IMMUTABLE (never modify)

### version (Required)

Semantic versioning: `MAJOR.MINOR`

- **MAJOR**: Increment for breaking changes, complete rewrites
- **MINOR**: Increment for additions, clarifications, non-breaking updates

Examples:

- `1.0` - Initial approved version
- `1.1` - Minor additions or clarifications
- `2.0` - Major restructure or paradigm shift

### created (Required)

ISO 8601 date format: `YYYY-MM-DD`

Date when document was first created.

### last-updated (Required)

ISO 8601 date format: `YYYY-MM-DD`

Date of most recent modification. Update this every time content changes.

### author (Required)

Source of document creation:

- **`Human`**: Written entirely by human (Principal, consultants)
- **`AI-Generated`**: Created by AI agent (GitHub Copilot, Claude, GPT)
- **`Collaborative`**: Joint effort (human outlines, AI expands; or vice versa)

### related-documents (Optional)

Array of related file paths or wiki-links:

```yaml
related-documents:
  - ../Kore/ARCHITECTURE_PATTERNS.md
  - [[AGENT_REGISTRY]]
  - Templates/TEMPLATE_CHANGELOG.md
```

Use to create navigation trails and dependency mapping.

### supersedes (Optional)

File path to previous version if this document replaces an older one:

```yaml
supersedes: ../archive/phase-2-implementation-notes/OLD_PLAN_V1.md
```

### superseded-by (Optional)

File path to newer version if this document has been replaced:

```yaml
superseded-by: ../Codex Standards/NEW_PLAN_V2.md
```

**Note**: This field is added when archiving a document, pointing users to current version.

### tags (Optional but Recommended)

Array of categorization tags for discovery:

```yaml
tags:
  - phase-3
  - agent-architecture
  - neo4j
  - implementation-plan
```

---

## Status Lifecycle Examples

### Typical Document Lifecycle

```
🔴 Draft (v1.0)
  ↓ (review & approval)
🟢 Active (v1.0)
  ↓ (minor updates)
🟢 Active (v1.1, v1.2, etc.)
  ↓ (major restructure)
🔴 Draft (v2.0)
  ↓ (approval)
🟢 Active (v2.0) + Archive v1.x as 🔵 Archived
```

### Architecture Document Lifecycle

```
🔴 Draft → 🟡 In Progress → 🟢 Active → 🔵 Archived (when superseded)
```

### Planning Document Lifecycle

```
🔴 Draft → 🟡 In Progress → 🟢 Active → ⚫ Deprecated (when completed/obsolete)
```

---

## Document-Type Specific Guidelines

### Architecture Documents

**Examples**: ARCHITECTURE_PATTERNS.md, HYBRID_RAG_DESIGN.md, CORE_TYPES.md

**Metadata Focus**:

- Always include `version` (track pattern evolution)
- Use `related-documents` to link dependent architecture docs
- Add `supersedes` when introducing v2.0+ versions

**Change Protocol**:

1. Draft changes as **🔴 Draft** or **🟡 In Progress** in separate file
2. Review and approve
3. Update to **🟢 Active**
4. Archive old version as **🔵 Archived** with `superseded-by` link

### Planning Documents

**Examples**: PHASE_3_IMPLEMENTATION_PLAN.md, Sprint roadmaps

**Metadata Focus**:

- Update `last-updated` frequently (plans evolve weekly)
- Use `tags` for phase tracking (e.g., `phase-3`, `sprint-1`)
- Link to `related-documents` (architecture, specs, changelogs)

**Change Protocol**:

1. Start as **🔴 Draft** while planning
2. Move to **🟡 In Progress** when execution begins
3. Update to **🟢 Active** when baselined (reference version)
4. Mark **⚫ Deprecated** when phase completes

### Specification Documents

**Examples**: Agent spec files (auditor-agent-spec.md, researcher-agent-spec.md)

**Metadata Focus**:

- Include `status: 🔴 Parked` for future agents (not yet built)
- Add `dependencies` in related-documents
- Use `version` to track spec evolution as agent is refined

**Change Protocol**:

1. Create as **🔴 Parked** (future agents) or **🔴 Draft** (active dev)
2. Move to **🟡 In Progress** when building starts
3. Update to **🟢 Active** when agent is deployed and tested
4. Archive as **🔵 Archived** if agent is decommissioned

### Guide Documents

**Examples**: USER_GUIDE.md, QUICK_REFERENCE.md

**Metadata Focus**:

- Keep as **🟢 Active** once published
- Update `version` and `last-updated` with each modification
- Link to related templates, changelogs

**Change Protocol**:

1. Guides can be updated incrementally (no strict draft cycle)
2. Always update `last-updated` field
3. Increment `version` (minor) for additions, (major) for restructures

### Changelog Documents

**Examples**: TEMPLATE_CHANGELOG.md

**Metadata Focus**:

- Always **🟢 Active** (continuously append)
- Update `last-updated` with each entry
- No `supersedes` or `superseded-by` (changelogs are cumulative)

**Change Protocol**:

1. Always append new entries at top
2. Never delete historical entries
3. Use timestamps for each change log entry

### Registry Documents

**Examples**: AGENT_REGISTRY.md

**Metadata Focus**:

- Always **🟢 Active** (living document)
- Update `last-updated` when agents added/modified
- Link to individual specs via `related-documents`

**Change Protocol**:

1. Update registry whenever new agent specs created
2. Keep agent status in sync (Draft → Active → Archived)
3. Version increments when registry structure changes

---

## Migration Notes

### Backfilling Metadata on Existing Documents

When adding metadata to legacy docs:

1. **Read entire document** to understand current state
2. **Determine appropriate status**:
   - Actively referenced? → **🟢 Active**
   - Completed planning? → **⚫ Deprecated**
   - Superseded by newer version? → **🔵 Archived**
3. **Infer version**: Start at `1.0` if first metadata addition
4. **Set created date**: Use git history if available, else estimate
5. **Set last-updated**: Use today's date (when metadata added)
6. **Identify related documents**: Scan for cross-references
7. **Add change log entry** (if document has changelog section)

### Example Backfill Commit

```bash
git commit -m "docs: Backfill metadata standards across architecture docs

- Added YAML frontmatter to 6 architecture documents
- Established version baseline (all at 1.0)
- Linked related documents via cross-references
- Updated ARCHITECTURE_PATTERNS.md to v1.6 (existing version preserved)

Related: DOCUMENT_METADATA_STANDARD.md
Next: Archive consumer platform docs to docs/archive/kore-vision-2025/"
```

---

## Validation Checklist

Before committing any new documentation file:

- [ ] YAML frontmatter block present?
- [ ] All required fields included? (`document-type`, `status`, `version`, `created`, `last-updated`, `author`)
- [ ] Status emoji correct? (🔴🟡🟢🔵⚫)
- [ ] Related documents linked?
- [ ] Purpose and scope clearly stated?
- [ ] Tags added for discovery?

---

## Related Documents

- [[copilot-instructions.md]] - AI agent guidelines (includes validation protocol)
- [[TEMPLATE_CHANGELOG.md]] - Example changelog structure
- [[USER_GUIDE.md]] - Example guide structure with metadata

---

## Changelog

### 2025-11-10 - Version 1.0 (Initial)

- Created universal metadata standard for all documentation
- Defined 6 document types with specific guidelines
- Established 5-state status lifecycle (Draft → In Progress → Active → Archived → Deprecated)
- Provided backfilling instructions for legacy documents
- Added validation checklist for new documents

---

**Last Updated**: 2025-11-10  
**Maintained By**: AI Agents (following validation protocol)  
**Status**: 🟢 Active (baseline reference for all future docs)
