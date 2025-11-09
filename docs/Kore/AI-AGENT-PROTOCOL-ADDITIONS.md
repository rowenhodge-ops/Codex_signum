# Copilot Instructions - Autonomous Agent Enhancement

**ADD THIS SECTION TO `.github/copilot-instructions.md`**

---

## 🤖 AI Agent Self-Validation Protocol (CRITICAL)

**MANDATORY**: Before EVERY code or documentation change, I MUST complete this checklist.

### Phase 1: Intent Verification (30 seconds)

```markdown
- [ ] What is user requesting? (One sentence summary)
- [ ] Which files will be affected? (List specific paths)
- [ ] Is this a baseline document? (Check status field in file)
- [ ] Do I need permission first? (Baseline mod, major restructure, deletions)
```

**If uncertain about ANY checkbox → STOP and ASK user**

---

### Phase 2: Context Gathering (1-2 minutes)

```markdown
- [ ] Read existing file content FIRST (use read_file, don't assume)
- [ ] Check git history if uncertain (use git_log_or_diff)
- [ ] Verify no duplicate task numbers (if creating task)
- [ ] Confirm folder is in approved list:
      ✅ docs/decisions/ (ADRs)
      ✅ docs/tasks/ (Research tasks)
      ✅ docs/guides/ (How-tos)
      ✅ docs/config/ (Standards)
      ✅ docs/templates/ (Templates)
      ✅ docs/archive/ (Historical)
      ❌ docs/planning/ (FORBIDDEN)
      ❌ docs/research/ (FORBIDDEN)
      ❌ docs/design/ (FORBIDDEN)
```

**Validation Scripts Available**:

- `node scripts/validate-task-numbers.js` - Check task numbering
- `node scripts/check-baseline-mutations.js` - Verify no locked doc edits
- `node scripts/enforce-folder-structure.js` - Validate folder usage

---

### Phase 3: Change Planning (1 minute)

```markdown
- [ ] What sections will be modified? (Be specific, list line ranges)
- [ ] Will I delete any content? (REQUIRES permission if baseline)
- [ ] Metadata updates needed? (Date, status, change log, version)
- [ ] Related docs to update? (Cross-references, ADRs, tasks)
```

**Decision Matrix**:
| Change Type | Baseline? | Permission? | Action |
|---|---|---|---|
| Add section to task | No | No | Proceed + update change log |
| Modify ADR (Proposed) | No | No | Proceed + update change log |
| Modify ADR (Accepted) | YES | YES | STOP - Create superseding ADR |
| Delete from archive | YES | YES | STOP - Archives immutable |
| Modify completed task objectives | YES | YES | STOP - Don't change scope |

---

### Phase 4: Code Quality Gates (2-3 minutes)

**For Code Changes Only**:

```markdown
- [ ] TypeScript types correct? (No `any` without `// @ts-expect-error` comment)
- [ ] Error handling present? (Try/catch with timeouts, proper error types)
- [ ] Server actions follow pattern? - 'use server' directive - revalidatePath() after Firestore mutations - Proper return types { success: boolean; error?: string }
- [ ] React hooks follow pattern? - useEffect has cleanup (return unsubscribe) - Dependencies array complete - No async functions directly in useEffect
- [ ] Performance optimized? - Database queries use limits - No N+1 query patterns - Proper indexes on Firestore collections
```

**Automated Checks**:

```bash
# Before committing code
npm run typecheck  # TypeScript validation
npm run lint       # ESLint rules
npm test           # Unit tests (when implemented)
```

---

### Phase 5: Documentation Quality Gates (1-2 minutes)

**For Documentation Changes Only**:

```markdown
- [ ] Status field current? (🔴 Not Started, 🟡 In Progress, 🟢 Complete)
- [ ] Change log updated with timestamp? ### YYYY-MM-DD - [Change summary] - Added: [what was added] - Modified: [what changed] - Rationale: [why this change]
- [ ] Links still valid? (No broken [[wiki-links]] or markdown links)
- [ ] Follows template? (ADR/Task/Guide templates in docs/templates/)
- [ ] Cross-references updated? (Related tasks, ADRs mentioned)
```

**Validation Before Commit**:

```bash
# Automatically runs in pre-commit hook
node scripts/validate-task-numbers.js
node scripts/check-baseline-mutations.js
node scripts/enforce-folder-structure.js
```

---

### Phase 6: Final Pre-Commit Checklist (1 minute)

```markdown
- [ ] Commit message follows convention?
      ✅ feat: Add new feature
      ✅ fix: Fix bug
      ✅ docs: Update documentation
      ✅ refactor: Code restructure
      ✅ test: Add tests
      ✅ chore: Maintenance
      ❌ "update files" (too vague)
      ❌ "changes" (not descriptive)
- [ ] Related tasks/ADRs referenced in commit body?
      Related: Task-010, ADR-005
- [ ] No debug code left behind?
      ❌ console.log statements
      ❌ debugger statements
      ❌ TODO comments without ticket reference
- [ ] Confident this won't break anything?
      ✅ Followed all patterns
      ✅ Ran validation scripts
      ✅ Tests pass (or added tests)
```

**If ANY checkbox unchecked or uncertain → REVIEW before committing**

---

## 🔧 Post-Commit Verification (AI Agent Responsibility)

After committing, I MUST verify in next response:

```markdown
✅ Commit successful: [commit hash]
✅ Files changed: [list]
✅ Pre-commit hooks passed
✅ Validation scripts passed
✅ Ready for push

OR

❌ Commit failed: [error message]
🔧 Fix applied: [description]
🔄 Retrying commit...
```

---

## 🚨 Error Recovery Protocol

### If Pre-Commit Hook Fails

**Documentation Validation Failure**:

```bash
❌ ERROR: Duplicate task numbers found: 10
   Conflicting files:
     - task-010-llm-router-evaluation.md
     - task-010-command-palette.md
```

**AI Agent Action**:

1. Read both files to understand purpose
2. Determine which should be renumbered (usually older/legacy)
3. Propose: "Rename task-010-command-palette.md → task-100-command-palette.md?"
4. Wait for user confirmation
5. Execute rename + commit

---

**Baseline Mutation Detected**:

```bash
❌ ERROR: Cannot modify accepted ADR: docs/decisions/ADR-005-simplified-kore-architecture.md
   Fix: Create superseding ADR instead
```

**AI Agent Action**:

1. Stop modification immediately
2. Inform user: "ADR-005 is accepted (immutable). Shall I create ADR-006 that supersedes it?"
3. Wait for user confirmation
4. Create new ADR with proper superseding links

---

**Code Quality Failure**:

```bash
❌ ESLint errors in src/app/actions.ts:
  5:3  error  Promises must be awaited  @typescript-eslint/no-floating-promises
```

**AI Agent Action**:

1. Run `npm run lint -- --fix` (auto-fix if possible)
2. If can't auto-fix, read the file and fix manually
3. Re-run lint to verify
4. Commit with: `fix: resolve linting error in actions.ts`

---

## 🎯 Autonomous Task Execution Pattern

### When User Says: "Implement Task-010"

**AI Agent Workflow**:

```markdown
1. Read Task File
   - Open docs/tasks/task-010-llm-router-evaluation.md
   - Parse: Objective, Success Criteria, Deliverables
   - Check: Status (must be 🔴 Not Started or 🟡 In Progress)

2. Update Status
   - Change: Status: 🔴 Not Started → 🟡 In Progress
   - Add: Research Notes section with timestamp
   - Commit: "docs: task-010 mark as in progress"

3. Execute Research Steps
   - Follow POC code examples in task
   - Create test files (src/ai/routers/poc-portkey.ts)
   - Run tests and capture results
   - Update task with findings

4. Generate Deliverables
   - Create docs/decisions/llm-router-comparison.md
   - Create cost analysis spreadsheet
   - Link deliverables in task file

5. Mark Complete
   - Update: Status: 🟡 In Progress → 🟢 Complete
   - Fill in: Deliverables section with links
   - Add: Completion notes with final recommendation
   - Commit: "docs: task-010 complete - Portkey selected"

6. Notify User
   - Summary of findings
   - Link to deliverables
   - Next steps (if any)
```

---

## 🔄 Multi-Agent Coordination (Future)

**Reserved for Phase 2**: When multiple AI agents work on same repo

```markdown
Agent Roles:

- @agent:code-generator - Writes implementation code
- @agent:qa-reviewer - Reviews code quality
- @agent:docs-maintainer - Updates documentation
- @agent:research-assistant - Evaluates technologies

Coordination Protocol:

1. Agent tags work items in task files
2. GitHub Actions orchestrate agent sequence
3. Each agent updates status field when done
4. Final agent marks task complete
```

**Not implemented yet** - single-agent mode only for now.

---

## 📊 Performance Metrics (Self-Monitoring)

**AI Agent tracks own performance**:

```markdown
Weekly Self-Assessment (auto-generated):

- Tasks completed: 5
- Average time to completion: 3.2 hours
- Pre-commit failures: 2 (down from 8 last week)
- Baseline violations prevented: 4
- Cost efficiency: $12.50 spent (under $20 budget)

Improvement Areas:

- Reduce pre-commit failures (better validation before commit)
- Faster research cycles (parallelize POCs)
```

**Stored in**: `docs/metrics/agent-performance-YYYY-MM.md` (auto-created monthly)

---

## ✅ Quality Checklist Summary

**Before EVERY action, verify**:

1. ✅ Read existing content first
2. ✅ Check if baseline (status field)
3. ✅ Validate folder structure
4. ✅ Plan changes explicitly
5. ✅ Update metadata/change logs
6. ✅ Run validation scripts
7. ✅ Write descriptive commit message
8. ✅ Reference related docs
9. ✅ Verify tests pass
10. ✅ Confirm no regressions

**If ANY step skipped → High risk of regression**

---

## 🎓 Training: Common Scenarios

### Scenario 1: User asks to "update the architecture doc"

❌ **Wrong Approach**:

```
AI: [Immediately rewrites ARCHITECTURE_PATTERNS.md without reading it]
```

✅ **Correct Approach**:

```
AI: "I'll update the architecture document. First, let me read it to understand current state."

[Reads file]

AI: "I see ARCHITECTURE_PATTERNS.md was last updated 2025-10-20.
What specifically should I update?
- Add new patterns?
- Modify existing patterns?
- Update decision rationale?

Please specify so I don't accidentally modify baselines."
```

---

### Scenario 2: User asks to "fix the duplicate task numbers"

❌ **Wrong Approach**:

```
AI: [Renames files without asking]
```

✅ **Correct Approach**:

```
AI: "I detected duplicate task numbers:
- task-010-llm-router-evaluation.md (2025-10-26, current research)
- task-010-command-palette.md (2025-10-15, pre-pivot feature)

Recommended fix: Rename task-010-command-palette.md → task-100-command-palette.md

This preserves git history and moves legacy features to 100+ range.
Shall I proceed?"

[Wait for confirmation]

AI: [Executes rename + updates cross-references + commits]
```

---

### Scenario 3: User asks to "implement the LLM router"

❌ **Wrong Approach**:

```
AI: [Writes code directly without reading task file or checking requirements]
```

✅ **Correct Approach**:

```
AI: "I'll implement the LLM router. Let me start by reading Task-010 requirements."

[Reads docs/tasks/task-010-llm-router-evaluation.md]

AI: "I see Task-010 is 🔴 Not Started. The objective is to evaluate 4 options and select one.

Before I start implementation, I need to:
1. Update task status to 🟡 In Progress
2. Run POC for each router (Portkey, LiteLLM, OpenRouter, Genkit)
3. Generate comparison matrix
4. Get your approval on final choice

Shall I start with Phase 1 (update task status) then proceed with POCs?"

[Wait for confirmation, then execute methodically]
```

---

**END OF ADDITIONS**

Save this content and integrate into `.github/copilot-instructions.md` after the "Documentation Workflow Protocol" section.
