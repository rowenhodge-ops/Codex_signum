# Maintaining Your Prompt Files

## 📌 Important: These Files Are Living Documents

The markdown files in `.vscode/prompts/` are **static reference guides** that you should update as your project evolves. They won't update automatically - think of them as your project's knowledge base that grows with experience.

## When to Update Prompt Files

### Update `planning.md` When:

- ✏️ You discover new anti-patterns to avoid
- ✏️ You add new architectural layers (e.g., new database collections)
- ✏️ You change the data flow patterns
- ✏️ You add new sensor locations beyond the current 3
- ✏️ You modify the server action → AI → Firestore pipeline

**Example update:**

```markdown
## Anti-Patterns to Avoid

- ❌ [Existing patterns...]
- ❌ NEW: Don't use locationName for filtering (names can change, use locationId)
```

### Update `debugging.md` When:

- 🐛 You encounter a NEW type of error not covered
- 🐛 You find a better solution to a common problem
- 🐛 You discover a recurring issue specific to your setup
- 🐛 You learn a new debugging technique that works well

**Example update:**

```markdown
#### New: Firestore Index Missing Error

**Symptom**: "The query requires an index"
**Cause**: Complex queries need composite indexes
**Fix**:

- Check Firebase Console → Firestore → Indexes
- Click the link in the error message to auto-create index
- Wait 2-5 minutes for index to build
```

### Update `code-review.md` When:

- ✅ You add new quality standards to your team
- ✅ You discover checks you wish you'd done before
- ✅ You add new components that need specific patterns
- ✅ You implement new testing requirements

**Example update:**

```markdown
### Project-Specific Checks

- [ ] [Existing checks...]
- [ ] NEW: All analytics components accept timeRange filter prop
- [ ] NEW: Chart components have data validation (min 2 data points)
```

### Update `ui-consistency.md` When:

- 🎨 You add new colors to the design system
- 🎨 You create new reusable component patterns
- 🎨 You change spacing/typography standards
- 🎨 You add new chart types with specific styling

**Example update:**

```typescript
// Add new color
export const COLORS = {
	// ... existing colors
	alertOrange: '#F4A582', // NEW: For outdoor air quality alerts
} as const;
```

### Update `workflow.md` When:

- 🔄 You discover new regression patterns
- 🔄 You find better prevention strategies
- 🔄 You add new pre-commit checks
- 🔄 Team grows and needs more formal processes

**Example update:**

```markdown
### Pattern 6: Breaking Genkit AI Flows

**Symptom**: AI analysis returns null or errors
**Prevention**: Always test flows in Genkit Dev UI before deploying
**Test**: `npm run genkit:dev` → Test with sample data
```

## How to Update Files

### 1. Document Lessons Learned

After fixing a tricky bug:

```markdown
<!-- Add to debugging.md -->

#### [Date: 2025-10-13] TypeScript Module Resolution Issue

**What happened**: Imports worked in dev but failed in build
**Root cause**: Using relative imports instead of @/_ aliases
**Solution**: Updated all imports to use @/components/_ pattern
**Prevention**: ESLint rule added to catch relative imports
```

### 2. Update Design Tokens

When you add new UI components:

```typescript
// Update src/styles/design-tokens.ts
export const COMPONENT_PATTERNS = {
	// ... existing patterns

	// NEW: Alert banner pattern
	alertBanner: 'bg-warning/10 border-l-4 border-warning p-4',
} as const;
```

Then document in `ui-consistency.md`:

````markdown
#### Alert Banners

```tsx
<div className={COMPONENT_PATTERNS.alertBanner}>
	<p className="text-warning">Alert message</p>
</div>
```
````

### 3. Add to Anti-Patterns

When you make a mistake (we all do!):

````markdown
<!-- Add to planning.md or code-review.md -->

## Anti-Patterns to Avoid

❌ **DON'T: Use array index as React key when sorting**

```typescript
// BAD
{
	items.map((item, index) => <Card key={index} />);
}

// GOOD
{
	items.map((item) => <Card key={item.id} />);
}
```
````

**Why**: Sorting breaks when keys are indexes
**When discovered**: 2025-10-13 during event sorting feature

````

## Recommended Update Schedule

### Weekly (Every Friday)
- Review what you learned this week
- Add 1-2 new tips to relevant prompt files
- Update design tokens if UI changed

### After Major Features
- Document new patterns in `planning.md`
- Add component examples to `ui-consistency.md`
- Update workflow if process changed

### After Debugging Sessions >30min
- Add the issue to `debugging.md`
- Document the solution
- Note prevention strategies

### Monthly
- Review all prompt files
- Remove outdated information
- Reorganize if files get too long
- Share updates with team (if applicable)

## Version Control for Prompt Files

**Commit prompt file updates** just like code:

```powershell
# After updating prompt files
git add .vscode/prompts/
git commit -m "docs: update debugging guide with Genkit flow issues"
````

**Why**:

- Track evolution of your knowledge base
- Share learnings with team
- Revert if you remove something useful

## Example Update Workflow

Let's say you just fixed a bug with real-time Firestore updates:

### 1. Identify the Issue

- Firestore listener wasn't cleaning up
- Caused memory leaks and duplicate events

### 2. Update `debugging.md`

````markdown
#### Firestore Listener Memory Leaks

**Symptom**: Events appear multiple times, performance degrades
**Cause**: useEffect missing cleanup function
**Fix**:

```typescript
useEffect(() => {
	const unsubscribe = onSnapshot(query, callback);
	return () => unsubscribe(); // ← This line is critical!
}, []);
```
````

**How to detect**: Check React DevTools → Components → Look for multiple listeners

````

### 3. Update `code-review.md`
```markdown
### Data Flow
- [ ] Server actions revalidate paths after mutations
- [ ] Firestore listeners cleaned up in useEffect return  ← Make bold/emphasize
- [ ] NEW: Check React DevTools for multiple listeners (memory leak indicator)
````

### 4. Update `workflow.md`

```markdown
### Pattern 7: Firestore Listener Memory Leaks

**Symptom**: Performance degrades over time, duplicate events
**Prevention**:

- Always return cleanup function from useEffect
- Test by navigating away and back to page
  **Test**: React DevTools → Profiler → Check listener count
```

### 5. Commit Changes

```powershell
git add .vscode/prompts/debugging.md .vscode/prompts/code-review.md .vscode/prompts/workflow.md
git commit -m "docs: add Firestore listener cleanup pattern"
```

## Using AI to Help Update

When you've learned something new, ask AI to help update the files:

```
I just discovered that [issue]. Can you help me update:
1. .vscode/prompts/debugging.md with the solution
2. .vscode/prompts/workflow.md with prevention strategy
3. .vscode/prompts/code-review.md with a checklist item

Here's what happened: [description]
Here's how I fixed it: [solution]
```

## Keep It Practical

### ✅ DO:

- Add real examples from your codebase
- Include code snippets that actually work
- Date entries so you know when they were added
- Keep language concise and scannable

### ❌ DON'T:

- Copy generic advice from the internet
- Add everything you read (only what you've actually encountered)
- Let files get too long (split into sub-sections if needed)
- Forget to remove outdated information

## Template for Adding New Patterns

Use this template when adding new content:

````markdown
### [Category]: [Brief Title]

**Date Added**: 2025-10-13
**Symptom**: What you see when the problem occurs
**Cause**: Why it happens
**Solution**: Step-by-step fix
**Prevention**: How to avoid in the future
**Related**: Links to other sections or docs

**Example**:

```[language]
// Code example showing the fix
```
````

```

## Making Files Searchable

Use consistent keywords so you can quickly find info:

- **Symptom**: For errors/issues
- **Cause**: For root causes
- **Solution**: For fixes
- **Prevention**: For avoiding issues
- **Example**: For code samples
- **NEW**: For recently added content
- **UPDATED**: For modified content

## Sharing Knowledge

If working with a team:
1. Update prompt files after team discussions
2. Share learnings in commit messages
3. Reference prompt files in pull request descriptions
4. Review prompt files during onboarding

## Your Prompt Files = Your Second Brain

Think of these files as your:
- 🧠 **Personal knowledge base**
- 📚 **Project-specific documentation**
- 🎓 **Learning journal**
- 🛡️ **Protection against future mistakes**

The more you update them, the more valuable they become!

## Quick Update Checklist

After solving a problem:
- [ ] Was this a NEW issue? → Add to `debugging.md`
- [ ] Is there a pattern to avoid? → Add to `planning.md` or `workflow.md`
- [ ] Did I create a new UI component? → Update `ui-consistency.md` and `design-tokens.ts`
- [ ] Should this be checked before commit? → Add to `code-review.md`
- [ ] Commit the updates with descriptive message

---

**Remember**: These files are tools to help YOU. Update them in a way that makes sense for your workflow. There's no "wrong" way to maintain them as long as they're useful to you! 🚀
```
