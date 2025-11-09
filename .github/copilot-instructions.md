# Codex Signum - AI Agent Instructions

<!-- markdownlint-disable MD024,MD050 -->

## Project Overview

**Codex Signum** is an Obsidian vault for business development, sales engagement tracking, and knowledge management. Built around a sophisticated template system with Dataview queries, it captures stakeholder relationships, learning insights, and market intelligence.

**Tech Stack**: Obsidian (Markdown), Dataview Plugin, Templater Plugin, Git (version control)

**Core Philosophy**: Systematic capture → structured analysis → actionable intelligence. Every interaction is documented, every learning is tracked, every insight is queryable.

**NOT a coding project**: This is a documentation/knowledge management system. No TypeScript, no Next.js, no Python.

---

## 🎯 Current Phase: Phase 2 Complete (Nov 2025)

**Status**: Template system with Jupyter-style cell markers and structured task management

**Recent Changes**:

- ✅ Phase 1: Template overhaul (8 templates with standardized metadata)
- ✅ Phase 2A: Jupyter-style cell markers for future RAG integration (52 cells)
- ✅ Phase 2B: Structured `tasks:` blocks for Dataview task management
- ✅ Control Center Dashboard with dynamic queries
- ✅ Comprehensive USER_GUIDE.md (800+ lines)

**See**:

- [[TEMPLATE_CHANGELOG]] for Phase 2 implementation details
- [[USER_GUIDE]] for daily workflow documentation
- [[JUPYTER_STYLE_EVOLUTION]] for cell marker technical docs

---

## � CRITICAL: Documentation Standards

### Obsidian Vault Guidelines

**This entire `docs/` folder is an Obsidian vault.** Respect Obsidian-specific syntax:

**DO**:

- ✅ Use `[[wiki-links]]` for internal references
- ✅ Use `#tags` for categorization (e.g., `#engagement`, `#stakeholder`, `#learning-registry`)
- ✅ Preserve Templater syntax: `<% tp.date.now("YYYY-MM-DD") %>`
- ✅ Keep YAML frontmatter intact (metadata critical for Dataview)
- ✅ Respect HTML comment cell markers (`<!-- CELL: -->`)

**DON'T**:

- ❌ Modify `.obsidian/` directory (user-specific settings, git-ignored)
- ❌ Convert wiki-links to markdown links
- ❌ Remove or modify cell markers without explicit permission
- ❌ Delete YAML frontmatter fields (breaks Dataview queries)
- ❌ Reformat for "style" reasons (preserve existing structure)

### Archiving Workflow

When files become deprecated:

1. **Create archive subdirectory** (e.g., `docs/archive/dashboards/`)
2. **Move (don't copy)** file to archive with timestamp
3. **Add archive header** with date, reason, superseded-by link
4. **Delete from original location** (archive becomes source of truth)
5. **Archive is immutable** - never modify archived content

Example archive header:

```markdown
---
archived-date: 2025-11-10
archived-reason: Brief explanation
superseded-by: ../Current-File.md
---

# [ARCHIVED] Original Title

**See current version: [[Current File]]**

---

[Original content follows...]
```

---

## 🤖 AI Agent Validation Protocol

Before EVERY file modification:

### Phase 1: Intent Check (10 seconds)

- [ ] What is the user requesting? (One sentence)
- [ ] Which files will be affected? (Specific paths)
- [ ] Is this additive or destructive? (Adding vs deleting)
- [ ] Do I need permission? (Template changes, dashboard edits, deletions)

**If unsure → ASK user first**

### Phase 2: Context Gathering (30 seconds)

- [ ] Read current file with `read_file` (don't assume)
- [ ] Check git status if uncertain
- [ ] Verify templates still follow standard structure
- [ ] Confirm Dataview queries reference correct tags

### Phase 3: Change Planning (30 seconds)

- [ ] What sections will be modified? (Line ranges)
- [ ] Will I delete content? (Requires permission for templates/dashboard)
- [ ] Metadata updates needed? (Tags, frontmatter, change logs)
- [ ] Related docs to update? (Cross-references, changelog)

### Phase 4: Quality Gates (30 seconds)

**For Template Changes**:

- [ ] YAML frontmatter valid? (No syntax errors)
- [ ] Tags present for Dataview? (e.g., `tags: [engagement]`)
- [ ] Templater syntax preserved? (e.g., `<% tp.date.now() %>`)
- [ ] Cell markers intact? (Don't remove `<!-- CELL: -->` comments)

**For Dashboard Changes**:

- [ ] Dataview queries valid? (Syntax correct)
- [ ] Tags match template frontmatter? (e.g., `FROM #stakeholder`)
- [ ] Archive old version first? (If major restructure)

**For Documentation**:

- [ ] Change log updated? (For template system changes)
- [ ] Links still valid? (No broken `[[wiki-links]]`)
- [ ] Cross-references updated? (Related templates, guides)

### Phase 5: Pre-Commit Checklist (30 seconds)

- [ ] Commit message follows convention?
  - ✅ `docs: Update template frontmatter`
  - ✅ `feat: Add new dashboard section`
  - ✅ `fix: Correct Dataview query syntax`
  - ❌ "changes" (too vague)
  - ❌ "update files" (not descriptive)
- [ ] Related docs referenced? (e.g., `Related: TEMPLATE_CHANGELOG`)
- [ ] No debug artifacts? (No test data, temporary notes)
- [ ] Confident this works? (Tested queries if modified dashboard)

**If ANY checkbox unchecked → REVIEW before proceeding**

---

## 📋 Template System Architecture

### 8 Core Templates

1. **TPL - Engagement Note.md** (Daily workhorse)

   - Captures every interaction (calls, meetings, emails)
   - Tracks CTA success, sentiment, edit distance
   - Links to Stakeholder Profiles, Target Profiles, Learning Registry
   - **Tag**: `#engagement`

2. **TPL - Stakeholder Profile.md** (Relationship memory)

   - Comprehensive person records (C1/C2/C3/C4 types)
   - Key language, messy problems, network connections
   - Links to Engagement Notes, Target Profiles
   - **Tag**: `#stakeholder`

3. **TPL - Target Profile.md** (T1/T2/T3 analysis)

   - Organization-level strategic research
   - Strategic/Technical/Operational context
   - Killer question, contact strategy
   - **Tag**: `#target-profile`

4. **TPL - Learning Registry.md** (Knowledge compound interest)

   - Actionable principles from engagements
   - Validation status (untested/validated/superseded)
   - Application count tracking
   - **Tag**: `#learning-registry`

5. **TPL - Market Insight.md** (Intelligence assets)

   - Patterns across multiple engagements
   - Stakeholder-specific talking points
   - Strategic implications
   - **Tag**: `#market-insight`

6. **TPL - Weekly Review.md** (System health check)

   - Performance metrics (engagements, CTA success, edit distance)
   - C1/C2/C3/C4 breakdown
   - Wins, challenges, insights, action items
   - **Tag**: `#weekly-review`

7. **TPL - Event Debrief.md** (Multi-contact capture)

   - Conference/networking event documentation
   - C2 qualification, C3 market intel
   - Performance metrics, follow-up plan
   - **Tag**: `#event`

8. **TPL - Research Note.md** (Exploratory workflow)
   - Investigative research documentation
   - Confidence levels, findings, analysis
   - Can be promoted to Market Insights
   - **Tag**: `#research-note`

### Structured Tasks System

**All templates (except Learning Registry) have:**

```yaml
tasks:
  - description: ""
    status: not-started # not-started, in-progress, completed, blocked
    priority: medium # low, medium, high, urgent
    due-date: YYYY-MM-DD
```

**Critical**: Dashboard queries depend on this structure. Don't modify field names.

### Cell Markers (Phase 2)

Templates include HTML comment cell markers for future RAG integration:

```markdown
<!-- CELL: cell-id | type: cell-type | rag-priority: priority -->

Content here...

<!-- END CELL -->
```

**9 Cell Types**:

- `training-data`: Examples, templates
- `inference-prompt`: Questions, frameworks
- `validation-metrics`: Performance data
- `analysis`: Strategic thinking
- `context`: Background info
- `raw-data`: Unprocessed notes
- `relationships`: Connections
- `action-items`: Tasks, CTAs
- `summary`: High-level overviews

**3 RAG Priority Levels**:

- `high`: Primary retrieval targets
- `medium`: Supporting context
- `low`: Reference only

**Critical**: Don't remove or modify cell markers without explicit permission.

---

## 📊 Dashboard & Dataview Queries

### Control Center Dashboard

Located at: `Codex Signum - Dashboard.md`

**8 Dynamic Sections**:

1. Quick Status (last 7 days from Weekly Reviews)
2. Urgent & High-Priority Tasks (structured tasks with `priority: high|urgent`)
3. Hot Prospects & Stalled Deals (C2/C4 without contact in 14+ days)
4. Pipeline Status (Target Profiles by stage)
5. Untested Learnings (Learning Registry entries needing validation)
6. Key Language Repository (last 15 captures from Engagement Notes)
7. Performance & Funnel (8-week rolling metrics)
8. Pipeline Funnel (stakeholder count by type)

**Critical Query Patterns**:

```dataview
// Task queries
FROM !"Codex Standards/Templates"
WHERE tasks AND any(tasks, (t) => t.priority = "high")

// Stakeholder queries
FROM #stakeholder
WHERE stakeholder-type = "C2"

// Weekly review queries
FROM #weekly-review
WHERE week-of >= date(today) - dur(7 days)
```

**Common Issues**:

- ❌ `FROM #action_item` (tag doesn't exist - use `tasks` structure instead)
- ❌ `FROM "Templates"` (should be `FROM !"Codex Standards/Templates"` to exclude)
- ❌ Missing `link()` function (use `link(file.name)` for clickable links)

---

## 🔧 Development Workflow

### Daily Template Usage

1. **After every interaction**: Create Engagement Note
2. **New person?**: Create Stakeholder Profile
3. **Learned something?**: Create Learning Registry entry
4. **Researching org?**: Create Target Profile
5. **Friday/Monday**: Create Weekly Review (mandatory)

### Git Workflow

```bash
# Check status
git status

# Stage changes
git add docs/

# Commit with descriptive message
git commit -m "docs: Add structured tasks to templates"

# Push to remote
git push origin main
```

**Commit Message Convention**:

- `docs:` Documentation/template changes
- `feat:` New features (new templates, dashboard sections)
- `fix:` Bug fixes (broken queries, syntax errors)
- `refactor:` Structure changes (template reorganization)
- `chore:` Maintenance (archive cleanup, folder structure)

### Change Tracking

**Always update when modifying templates/dashboard**:

- `docs/Codex Standards/Templates/TEMPLATE_CHANGELOG.md`

**Format**:

```markdown
## YYYY-MM-DD - Change Title

### Overview

Brief description of what changed and why.

### Changes Made

- Template 1: What was added/modified
- Template 2: What was added/modified

### New Capabilities

- What new features are enabled
- What queries now work

### Migration Notes

- What users need to know
- Backward compatibility status
```

---

## 🎯 Common Tasks & Patterns

### Adding a New Template

1. Create file: `docs/Codex Standards/Templates/TPL - New Template.md`
2. Add YAML frontmatter with:
   - Template-specific fields
   - `tasks:` block
   - `tags:` array
3. Add cell markers for semantic sections
4. Document in TEMPLATE_CHANGELOG.md
5. Update QUICK_REFERENCE.md decision tree
6. Add example to USER_GUIDE.md

### Modifying Dashboard Queries

1. Archive current dashboard to `docs/archive/dashboards/` with timestamp
2. Modify `Codex Signum - Dashboard.md`
3. Test queries (create sample notes if needed)
4. Document in TEMPLATE_CHANGELOG.md

### Archiving Deprecated Content

1. Create archive subdirectory: `docs/archive/category/`
2. Add archive header to file
3. Move file to archive
4. Delete from original location
5. Update cross-references in active docs

### Updating Frontmatter Across Templates

1. Read all affected templates first
2. Plan changes (what fields to add/modify)
3. Update templates systematically
4. Test Dataview queries
5. Document in TEMPLATE_CHANGELOG.md
6. Commit with descriptive message

---

## 📚 Key Documentation Files

### For Users

- **USER_GUIDE.md**: 800+ line comprehensive usage guide
- **QUICK_REFERENCE.md**: Template decision trees, cheat sheets
- **TEMPLATE_SYSTEM_UPDATE.md**: Phase 1 technical documentation

### For Developers (AI Agents)

- **TEMPLATE_CHANGELOG.md**: Change history and migration notes
- **JUPYTER_STYLE_EVOLUTION.md**: Cell marker technical specs
- **copilot-instructions.md** (this file): AI agent guidelines

### Archived

- `docs/archive/dashboards/`: Old dashboard versions
- `.github/archive/`: Archived config files (e.g., Kore instructions)

---

## 🚨 Critical Constraints

### NEVER Do This

- ❌ **Delete YAML frontmatter fields** (breaks Dataview queries)
- ❌ **Remove cell markers** (needed for future RAG)
- ❌ **Modify Templater syntax** (e.g., `<% tp.date.now() %>`)
- ❌ **Change tag names** without updating dashboard queries
- ❌ **Reformat templates** for "style" reasons
- ❌ **Modify `.obsidian/` directory** (user-specific settings)
- ❌ **Modify archived files** (immutable by definition)

### Always Do This

- ✅ **Read file before editing** (use `read_file` tool)
- ✅ **Update TEMPLATE_CHANGELOG** (when modifying templates)
- ✅ **Archive before major restructure** (preserve history)
- ✅ **Test Dataview queries** (if dashboard/template changes)
- ✅ **Add change logs** (explain what/why)
- ✅ **Commit with descriptive messages** (no "changes" or "update")

---

## 🎓 Learning Resources

### Understanding the System

1. **Start here**: Read `USER_GUIDE.md` (Quick Start section)
2. **Template decision tree**: See `QUICK_REFERENCE.md`
3. **Technical details**: Read `TEMPLATE_SYSTEM_UPDATE.md`
4. **Change history**: Review `TEMPLATE_CHANGELOG.md`
5. **Cell markers**: See `JUPYTER_STYLE_EVOLUTION.md`

### Obsidian Plugins

**Required**:

- **Dataview**: Powers dashboard queries
- **Templater**: Template automation

**Recommended**:

- **Linter**: Metadata validation
- **Kanban**: Task board visualization

### Dataview Query Syntax

```dataview
TABLE field1, field2
FROM #tag
WHERE condition
SORT field ASC
LIMIT 10
```

**Key Functions**:

- `link(file.name)`: Clickable file links
- `choice(condition, if-true, if-false)`: Conditional display
- `date(today)`, `dur(7 days)`: Date calculations
- `any(array, condition)`: Array filtering

---

## 💡 Pro Tips

1. **Before modifying templates**: Always read USER_GUIDE.md to understand user workflows
2. **Dashboard queries failing?**: Check template tags match query `FROM #tag`
3. **Archiving files**: Include superseded-by link so users can find replacement
4. **Git commits**: Reference related docs (e.g., `Related: TEMPLATE_CHANGELOG`)
5. **Cell markers**: They're invisible in Obsidian - users won't see them
6. **Tasks structure**: Field names must match exactly for queries to work
7. **Testing changes**: Create sample notes from templates, verify dashboard updates

---

**Last Updated**: 2025-11-10  
**Version**: 2.0 (Phase 2 Complete)  
**Maintained By**: AI Agents (following validation protocol)  
**Related**: [[TEMPLATE_CHANGELOG]], [[USER_GUIDE]], [[JUPYTER_STYLE_EVOLUTION]]

### Quick Rules by Document Type

**Architecture Decision Records (ADRs)**:

- ✅ Status 🟡 Proposed or 🔵 Draft: Can update with proper change log
- ❌ Status 🟢 Accepted: IMMUTABLE - create new ADR to supersede
- ❌ Status 🔴 Rejected or ⚫ Deprecated: ARCHIVE ONLY - do not modify

**Tasks**:

- ✅ Status 🔴 Not Started or 🟡 In Progress: Update research notes, add findings
- ✅ Status 🟢 Completed: Add post-completion notes, never change objectives/criteria
- ❌ Never rewrite success criteria or objectives after task starts

**Planning & Design**:

- ✅ Add new sections, expand ideas, update roadmaps
- ❌ Remove baseline specifications without explicit approval
- ❌ Replace design decisions with assumptions

**Archives**:

- ✅ Read for historical context
- ✅ MOVE files to `docs/archive/` subdirectories when deprecated (don't keep in active folders)
- ✅ DELETE files from active locations after archiving (archived copy becomes the source of truth)
- ❌ NEVER modify archived content (immutable by definition)

**Archiving Definition**: Moving supplementary/deprecated files to organized `docs/archive/` subdirectories and removing them from active folders. Files are NOT deleted permanently - they are preserved in archive with explanatory README files documenting why they were archived.

**Error Prevention Checklist** (run before EVERY doc edit):

1. Read current version with `read_file`
2. Check git history with `git_log_or_diff` if uncertain
3. Identify document category (ADR/Task/Planning/Archive/Design)
4. Check status/version if applicable
5. If baseline content affected → ASK user permission first
6. Add change log entry with timestamp

**For Complete Policies**: See `docs/WORKFLOW_POLICIES.md` (3,500+ words, comprehensive workflows)

---

## 🤖 AI Agent Self-Validation Protocol (MANDATORY)

**CRITICAL**: Before EVERY code or documentation change, I MUST complete this 6-phase checklist.

### Phase 1: Intent Verification (30 seconds)

- [ ] What is user requesting? (One sentence summary)
- [ ] Which files will be affected? (List specific paths)
- [ ] Is this a baseline document? (Check status field in file)
- [ ] Do I need permission first? (Baseline mod, major restructure, deletions)

**If uncertain about ANY checkbox → STOP and ASK user**

### Phase 2: Context Gathering (1-2 minutes)

- [ ] Read existing file content FIRST (use `read_file`, don't assume)
- [ ] Check git history if uncertain (use `git_log_or_diff`)
- [ ] Verify no duplicate task numbers (if creating task: `node scripts/validate-task-numbers.js`)
- [ ] Confirm folder is in approved list:
  - ✅ docs/decisions/ (ADRs)
  - ✅ docs/tasks/ (Research tasks)
  - ✅ docs/guides/ (How-tos)
  - ✅ docs/config/ (Standards)
  - ✅ docs/templates/ (Templates)
  - ✅ docs/archive/ (Historical)
  - ❌ docs/planning/ (FORBIDDEN)
  - ❌ docs/research/ (FORBIDDEN)
  - ❌ docs/design/ (FORBIDDEN)

**Validation Scripts Available**:

```bash
node scripts/validate-task-numbers.js       # Check task numbering
node scripts/check-baseline-mutations.js    # Verify no locked doc edits
node scripts/enforce-folder-structure.js    # Validate folder usage
```

### Phase 3: Change Planning (1 minute)

- [ ] What sections will be modified? (Be specific, list line ranges)
- [ ] Will I delete any content? (REQUIRES permission if baseline)
- [ ] Metadata updates needed? (Date, status, change log, version)
- [ ] Related docs to update? (Cross-references, ADRs, tasks)

**Decision Matrix**:
| Change Type | Baseline? | Permission? | Action |
|-------------|-----------|-------------|---------|
| Add section to task | No | No | Proceed + update change log |
| Modify ADR (Proposed) | No | No | Proceed + update change log |
| Modify ADR (Accepted) | YES | YES | STOP - Create superseding ADR |
| Delete from archive | YES | YES | STOP - Archives immutable |
| Modify completed task objectives | YES | YES | STOP - Don't change scope |

### Phase 4: Code Quality Gates (2-3 minutes)

**For Code Changes Only**:

- [ ] TypeScript types correct? (No `any` without `// @ts-expect-error` comment)
- [ ] Error handling present? (Try/catch with timeouts, proper error types)
- [ ] Server actions follow pattern?
  - `'use server'` directive
  - `revalidatePath()` after Firestore mutations
  - Proper return types `{ success: boolean; error?: string }`
- [ ] React hooks follow pattern?
  - useEffect has cleanup (`return unsubscribe`)
  - Dependencies array complete
  - No async functions directly in useEffect
- [ ] Performance optimized?
  - Database queries use limits
  - No N+1 query patterns
  - Proper indexes on Firestore collections

**Automated Checks**:

```bash
npm run typecheck  # TypeScript validation (MUST pass before commit)
npm run lint       # ESLint rules (auto-fix with --fix)
npm test           # Unit tests (verify no regressions)
```

### Phase 5: Documentation Quality Gates (1-2 minutes)

**For Documentation Changes Only**:

- [ ] Status field current? (🔴 Not Started, 🟡 In Progress, 🟢 Complete)
- [ ] Change log updated with timestamp?

  ```markdown
  ### YYYY-MM-DD - [Change summary]

  - Added: [what was added]
  - Modified: [what changed]
  - Rationale: [why this change]
  ```

- [ ] Links still valid? (No broken `[[wiki-links]]` or markdown links)
- [ ] Follows template? (ADR/Task/Guide templates in `docs/templates/`)
- [ ] Cross-references updated? (Related tasks, ADRs mentioned)

**Validation Before Commit** (runs automatically in pre-commit hook):

```bash
node scripts/validate-task-numbers.js        # Duplicate detection
node scripts/check-baseline-mutations.js     # Immutability check
node scripts/enforce-folder-structure.js     # Folder governance
```

### Phase 6: Final Pre-Commit Checklist (1 minute)

- [ ] Commit message follows convention?
  - ✅ `feat: Add new feature`
  - ✅ `fix: Fix bug`
  - ✅ `docs: Update documentation`
  - ✅ `refactor: Code restructure`
  - ✅ `test: Add tests`
  - ✅ `chore: Maintenance`
  - ❌ "update files" (too vague)
  - ❌ "changes" (not descriptive)
- [ ] Related tasks/ADRs referenced in commit body?
  ```
  Related: Task-010, ADR-005
  ```
- [ ] No debug code left behind?
  - ❌ console.log statements
  - ❌ debugger statements
  - ❌ TODO comments without ticket reference
- [ ] Confident this won't break anything?
  - ✅ Followed all patterns
  - ✅ Ran validation scripts
  - ✅ Tests pass (or added tests)

**If ANY checkbox unchecked or uncertain → REVIEW before committing**

### Post-Commit Verification

After committing, I MUST verify in next response:

```markdown
✅ Commit successful: [commit hash]
✅ Files changed: [list]
✅ Pre-commit hooks passed
✅ Validation scripts passed
✅ Ready for push
```

### Error Recovery Protocol

**If Pre-Commit Hook Fails**:

1. **Documentation Validation Failure**:

   ```bash
   ❌ ERROR: Duplicate task numbers found: 10
   ```

   **Action**: Read both files, propose rename, wait for confirmation

2. **Baseline Mutation Detected**:

   ```bash
   ❌ ERROR: Cannot modify accepted ADR
   ```

   **Action**: Stop immediately, propose creating superseding ADR

3. **Code Quality Failure**:
   ```bash
   ❌ ESLint error: Promises must be awaited
   ```
   **Action**: Run `npm run lint -- --fix`, manually fix if needed, re-commit

### Autonomous Task Execution Pattern

**When User Says**: "Implement Task-010"

**AI Agent Workflow**:

1. Read `docs/tasks/task-010-*.md`
2. Parse: Objective, Success Criteria, Deliverables
3. Update Status: 🔴 Not Started → 🟡 In Progress
4. Execute research/implementation steps
5. Generate deliverables (link in task file)
6. Mark Complete: 🟡 In Progress → 🟢 Complete
7. Notify user with summary + links

---

## �📚 Documentation & Obsidian Vault Integration

### Obsidian Vault for Planning & Design

The `docs/` folder functions as an **Obsidian vault** used by humans for planning, design, and architecture documentation. AI agents read and update this content while respecting vault-specific metadata.

**For AI Agents**:

- ✅ **Read** all markdown files in `docs/` for context before implementing features
- ✅ **Update** markdown content (planning notes, decision logs, implementation status)
- ✅ **Create** new `.md` files when documenting new patterns or architecture decisions
- ✅ **Reference** ARCHITECTURE_PATTERNS.md and config standards to understand design intent

**DO NOT**:

- ❌ Modify `.obsidian/` directory (contains user-specific vault configuration - git-ignored)
- ❌ Remove Obsidian-specific syntax: wiki-links, tags, callout blocks
- ❌ Delete or rename markdown files without explicit instruction (ARCHIVE instead - move to `docs/archive/`)
- ❌ Reformat markdown files for stylistic reasons (preserve structure and syntax)

**Archiving Workflow**:
When a documentation file becomes deprecated or supplementary, archive it by:

1. Creating a subdirectory in `docs/archive/` explaining its purpose (e.g., `docs/archive/phase-2-implementation-notes/`)
2. Moving (not copying) the file to that subdirectory
3. Adding a `README.md` explaining why it was archived and when
4. **DELETING the original file** from its active location (e.g., `docs/guides/`, workspace root)
5. Archive is immutable - never modify archived files unless it's to add historical context

**For Complete Guidelines**: See `docs/OBSIDIAN_VAULT_POLICY.md` for detailed AI agent behavior, conflict resolution, and examples.

---

## Architecture & Data Flow

### Core Data Pipeline

1. **Server Actions** (`src/app/actions.ts`): Handle note creation, updates, and AI operations
2. **AI Flows** (`src/ai/flows/`): Genkit flows for RAG, embeddings, link suggestions, and content generation
3. **Firestore Storage**: Notes, conversations, and links stored with real-time listeners
4. **Client Rendering**: Custom hooks subscribe to Firestore updates with pagination

**Critical**: Server actions should always call `revalidatePath()` after mutations to trigger client re-fetch.

### Multi-Model AI Architecture

**Current AI Strategy** (pending Task-010 router decision):

- **Gemini 2.5 Flash**: Fast, cost-effective for note analysis, tagging ($0.075/1M input)
- **Gemini 2.5 Pro**: Deep reasoning, complex analysis ($1.25/1M input)
- **Claude 3.5 Sonnet**: High-quality reasoning, code tasks ($3.00/1M input)
- **GPT-4o**: Fallback for specific tasks ($2.50/1M input)

**Router Options** (evaluation in progress):

- **Portkey**: Production observability, multi-provider, semantic caching
- **LiteLLM**: Open-source, self-hosted, full control
- **OpenRouter**: Managed simplicity, pay-per-use
- **Genkit** (current): Firebase-native, limited routing features

**Critical**: LLM router will replace/augment current Genkit flows. See [Task-010](../docs/tasks/task-010-llm-router-evaluation.md) for evaluation criteria.

## Development Commands

```bash
# Development server
npm run dev

# Type checking (strict mode enabled)
npm run typecheck

# Build (ignores TS/ESLint errors - see next.config.ts)
npm run build
```

**Note**: The dev server uses Turbopack for fast refresh.

## VS Code Tasks Workflow

The project has comprehensive task automation configured in `.vscode/tasks.json`. Use these tasks for efficient development:

### Quick Access Shortcuts

- **`Ctrl+Shift+B`** → Starts default build task (Dev Server)
- **`Ctrl+Shift+T`** → Starts default test task (Type Check)
- **`Ctrl+Shift+P` → "Run Task"** → Shows all available tasks

### Available Tasks

1. **Dev Server** (Default Build Task)

   - Command: `npm run dev`
   - Background task with dedicated terminal
   - Auto-detects when server is ready (watches for "Local:" pattern)
   - Runs on port 9002 with Turbopack

2. **Type Check** (Default Test Task)

   - Command: `npm run typecheck`
   - Runs TypeScript compiler in check mode
   - Problem matcher highlights errors in Problems panel
   - **Use this before committing** to catch type errors

3. **Build**

   - Command: `npm run build`
   - Production build verification
   - Note: Ignores TS/ESLint errors (see `next.config.ts`)

4. **Lint**

   - Command: `npm run lint`
   - ESLint with Next.js config
   - Problem matcher for inline error highlighting

5. **Clean Next.js Cache**

   - Command: PowerShell cache cleanup
   - **Use when**: Strange build errors, stale data, or Turbopack issues
   - Removes `.next` directory completely

6. **Reinstall Dependencies**

   - Command: PowerShell dependency reinstall
   - **Use when**: Package conflicts, corrupted node_modules
   - Removes `node_modules` and runs fresh `npm install`

7. **Full Clean & Restart** (Composite Task)
   - Runs: Clean Cache → Dev Server (sequential)
   - **Use when**: Nuclear option for stubborn issues
   - Automatically restarts dev server after cleanup

### Task Workflow Best Practices

```
Development Flow:
1. Ctrl+Shift+B → Start Dev Server
2. Run Task → Genkit Dev UI (if working with AI)
3. Make changes
4. Ctrl+Shift+T → Type Check before commit

Troubleshooting Flow:
1. Run Task → Clean Next.js Cache
2. If issue persists → Full Clean & Restart
3. If still failing → Reinstall Dependencies
```

**Pro Tip**: Tasks with `isBackground: true` don't block the terminal. You can run Dev Server + Genkit Dev UI simultaneously for full-stack AI development.

### Common Issues & Fixes

**UV/Python Installation Prompts**

- **Problem**: VS Code asks to install UV or Python tooling, or error about `uvx` command not found for markitdown
- **Cause**: Python language server or MCP servers (like markitdown) trying to activate on a Node.js project
- **Fix**: Python tooling and problematic MCP servers are disabled in `.vscode/settings.json` via:
  ```jsonc
  "python.languageServer": "None",
  "python.analysis.exclude": ["**/*"],
  "github.copilot.chat.enableMCPServers": false,
  ```
- **Action**: Reload VS Code window (`Ctrl+Shift+P` → "Reload Window") if errors persist

**Turbopack/Next.js Cache Issues**

- Run the "Clean Next.js Cache" task
- If persists, use "Full Clean & Restart" composite task

**Type Errors in Build**

- Note: `next.config.ts` has `ignoreBuildErrors: true` for rapid development
- Always run Type Check task before committing

## Project-Specific Patterns

### Server Actions Pattern

All data mutations use Next.js server actions with `'use server'` directive. **Critical**: Always call `revalidatePath()` after database writes to trigger client re-fetch.

```typescript
// Example: src/app/actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc } from "firebase/firestore";

export async function createNote(noteData) {
  const docRef = doc(collection(db, "notes"));
  await setDoc(docRef, noteData);

  revalidatePath("/"); // ⚠️ Required: Trigger client re-fetch
  return { success: true };
}
```

### AI Integration Pattern

**Current State**: Evaluating external LLM routers (see Task-010)

AI calls should be made via server actions with proper error handling:

```typescript
// Example: src/app/actions/ai.ts
'use server';
import { revalidatePath } from 'next/cache';

export async function analyzeNote(noteId: string, content: string) {
	try {
		// Call LLM router (exact implementation TBD pending Task-010)
		const response = await llmRouter.complete({
			model: 'gemini-2.5-flash',
			messages: [
				{ role: 'system', content: 'You are a helpful note analyzer.' },
				{ role: 'user', content: `Analyze this note: ${content}` }
			]
		});

		// Store result in Firestore
		await updateDoc(doc(db, 'notes', noteId), {
			aiSummary: response.content,
			analyzedAt: serverTimestamp()
		});

		revalidatePath(`/notes/${noteId}`);
		return { success: true, summary: response.content };
	} catch (error) {
		console.error('AI analysis failed:', error);
		return { success: false, error: error.message };
	}
}
}

// 3. Define flow with prompt
const analyzeNoteFlow = ai.defineFlow(
	{
		name: 'analyzeNoteFlow',
		inputSchema: InputSchema,
		outputSchema: OutputSchema,
	},
	async (input) => {
		const { output } = await ai.definePrompt({
			name: 'analyzeNotePrompt',
			input: { schema: InputSchema },
			output: { schema: OutputSchema },
			prompt: `Analyze this note: {{{content}}}`,
		})(input);
		return output!;
	}
);
```

### Real-Time Data Hook Pattern

Custom hooks use Firestore `onSnapshot` for live updates with pagination support:

```typescript
// Example: src/hooks/use-notes.ts
"use client";
const INITIAL_LIMIT = 50;

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "notes"),
      orderBy("updatedAt", "desc"),
      limit(currentLimit)
    );

    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const notesData = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Note)
        );
        setNotes(notesData);
      }
    );
    return () => unsubscribe(); // Always cleanup
  }, [currentLimit]);
}
```

### Component Structure

- **Note components** (`src/components/notes/*`): Note editor, list, viewer
- **Graph components** (`src/components/graph/*`): Knowledge graph visualization
- **Chat components** (`src/components/chat/*`): AI conversation interface
- **UI components** (`src/components/ui/*`): Shadcn/ui primitives with Radix UI + Tailwind

## Configuration & Environment

### Firebase Setup

- **Client config**: `NEXT_PUBLIC_FIREBASE_*` vars in environment files (public, safe to expose)
- **Server secrets**: API keys via Firebase App Hosting secrets or environment variables
- **Firestore rules**: Configure based on authentication strategy

### Path Aliases

Always use `@/*` imports (TypeScript path mapping):

```typescript
import { db } from "@/lib/firebase";
import type { Note } from "@/types";
```

## Style & UI Conventions

- **Design system**: Black background with modern, minimal Perplexity-inspired aesthetic
- **Component library**: Shadcn/ui with `cn()` utility for conditional classes
- **Icons**: Lucide React (`import { Icon } from 'lucide-react'`)

## Firebase Deployment

App uses Firebase App Hosting with auto-deployment via GitHub Actions (`.github/workflows/`). Configuration in `apphosting.yaml` manages scaling and environment variables.
