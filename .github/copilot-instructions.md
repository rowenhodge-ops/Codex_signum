# Kore - AI Coding Agent Instructions

<!-- markdownlint-disable MD024,MD050 -->

## 🎯 Quick Mode Shortcuts

When the user types these hashtags, apply the corresponding specialized prompt:

- **#plan** → Load `.vscode/prompts/planning.prompt.md` - Feature planning and architecture
- **#debug** → Load `.vscode/prompts/debugging.prompt.md` - Systematic debugging workflow
- **#review** → Load `.vscode/prompts/code-review.prompt.md` - Pre-commit quality checklist
- **#ui** → Load `.vscode/prompts/ui-consistency.prompt.md` - Design system guidelines
- **#workflow** → Load `.vscode/prompts/workflow.prompt.md` - Best practices and regression prevention

These files contain detailed checklists and frameworks for each mode.

## Project Overview

**Kore** is a personal knowledge management system combining Obsidian-style note-taking with AI-powered chat, graph visualization, and RAG search. Built as a single-user tool with modular architecture for business app integration.

**Tech Stack**: TypeScript, Next.js 15, React 18, Firebase/Firestore, External LLM Router (TBD), Tailwind CSS, Shadcn/ui

**Architecture Philosophy**: Kore Core provides knowledge management foundation. Business apps (separate repos) integrate via shared SDK (`@kore/sdk`) for bidirectional context sync.

⚠️ **Important**: This is NOT a Python project. Python language server/tooling should be disabled (configured in `.vscode/settings.json`).

## 🎯 Current Phase: Architecture Pivot (Oct 2025)

**Status**: Transitioning from commercial multi-tenant product to personal knowledge management tool

**Active Research Tasks**:

- [Task-010](docs/tasks/task-010-llm-router-evaluation.md): LLM Router selection (Portkey vs LiteLLM vs OpenRouter)
- [Task-011](docs/tasks/task-011-obsidian-vs-custom.md): UI strategy (Obsidian plugin vs custom Next.js UI)

**Key Changes**:

- ✅ Removed multi-tenant architecture
- ✅ Simplified to single-user mode (no auth complexity)
- ✅ Keeping GitHub + Firebase integrations
- ✅ All data stays in Google Cloud (Firestore + Cloud Storage)
- ⏸️ LLM router decision pending (see Task-010)
- ⏸️ UI strategy decision pending (see Task-011)

**See**: [ADR-005](docs/decisions/ADR-005-simplified-kore-architecture.md) for full architecture decision rationale.

## � CRITICAL: Documentation Workflow Protocol

**STOP and READ**: Before editing ANY documentation file (`docs/` directory), you MUST follow the comprehensive workflow policies in `docs/WORKFLOW_POLICIES.md`.

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
'use server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

export async function createNote(noteData) {
	const docRef = doc(collection(db, 'notes'));
	await setDoc(docRef, noteData);

	revalidatePath('/'); // ⚠️ Required: Trigger client re-fetch
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
'use client';
const INITIAL_LIMIT = 50;

export function useNotes() {
	const [notes, setNotes] = useState<Note[]>([]);

	useEffect(() => {
		const q = query(collection(db, 'notes'), orderBy('updatedAt', 'desc'), limit(currentLimit));

		const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
			const notesData = snapshot.docs.map(
				(doc) =>
					({
						id: doc.id,
						...doc.data(),
					}) as Note
			);
			setNotes(notesData);
		});
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
import { db } from '@/lib/firebase';
import type { Note } from '@/types';
```

## Style & UI Conventions

- **Design system**: Black background with modern, minimal Perplexity-inspired aesthetic
- **Component library**: Shadcn/ui with `cn()` utility for conditional classes
- **Icons**: Lucide React (`import { Icon } from 'lucide-react'`)

## Firebase Deployment

App uses Firebase App Hosting with auto-deployment via GitHub Actions (`.github/workflows/`). Configuration in `apphosting.yaml` manages scaling and environment variables.
