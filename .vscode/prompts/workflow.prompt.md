# Workflow Best Practices

## Preventing Regression Issues

### 1. Pre-Commit Workflow

**ALWAYS run before committing:**

```powershell
# Step 1: Type check
npm run typecheck

# Step 2: Lint check
npm run lint

# Step 3: Test build
npm run build
```

If any fail, fix errors before committing.

### 2. Feature Branch Strategy

```powershell
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes, test locally
npm run dev

# Before committing, check for issues
npm run typecheck
npm run lint

# Commit with descriptive message
git add .
git commit -m "feat: add [feature description]"

# Push and create PR
git push origin feature/your-feature-name
```

### 3. Testing Checklist

Before marking feature as complete:

- [ ] Works with sample data
- [ ] Works across all features (Notes, Chat, Graph)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No ESLint warnings (`npm run lint`)
- [ ] UI matches design system (check `prompts/ui-consistency.md`)
- [ ] Responsive on mobile/tablet/desktop
- [ ] No console errors or warnings
- [ ] Loading and error states handled
- [ ] Real-time updates still work (Firestore listeners)

### 4. Code Review Process

Use `prompts/code-review.md` checklist:

1. **TypeScript Quality**: No `any` types, proper return types
2. **React Best Practices**: Proper hooks usage, no prop drilling
3. **UI Consistency**: Design tokens, proper spacing, Shadcn components
4. **Performance**: Memoization where needed, optimized images
5. **Accessibility**: Keyboard navigation, ARIA labels
6. **Error Handling**: Try/catch, user-friendly messages

### 5. Git Hooks (Optional)

Create pre-commit hook to automatically check quality:

```powershell
# Create .git/hooks/pre-commit file
npm run typecheck && npm run lint
```

## High-Quality Debugging Workflow

### Phase 1: Information Gathering (5 min)

1. Copy FULL error message (don't truncate)
2. Copy entire stack trace
3. Note when error started (which change?)
4. Check browser console for additional errors
5. Check terminal for server-side errors

### Phase 2: Reproduce & Isolate (10 min)

1. Can you reproduce consistently?
2. Does it happen with sample data?
3. Specific to one feature area?
4. Happens in dev, build, or both?

### Phase 3: Systematic Debugging (15 min)

**Use binary search approach:**

```typescript
// Comment out half the code
// Does error still occur?
// If yes → problem is in remaining code
// If no → problem is in commented code
// Repeat until you find exact line
```

**Add strategic logging:**

```typescript
console.log('🔍 Component mounted', { props });
console.log('🔍 State updated', { newState });
console.log('🔍 API response', { data });
```

### Phase 4: AI-Assisted Debugging (20 min)

**If stuck after 15 minutes, escalate to AI with proper context:**

```
I'm getting this error:
[PASTE FULL ERROR + STACK TRACE]

Here's the relevant code:
[PASTE CODE WITH 10 LINES BEFORE/AFTER ERROR LINE]

What I've tried:
1. [What you tried]
2. [What you tried]
3. [What you tried]

Expected behavior:
[What should happen]

Actual behavior:
[What's happening instead]
```

**IMPORTANT**: If AI debugging goes in circles for >15 minutes:

1. **STOP** and start fresh chat
2. Use different AI model (GPT-4 → Claude Sonnet, or vice versa)
3. Provide complete context in first message
4. Ask for root cause analysis, not quick fixes

### Phase 5: Root Cause Analysis

Don't just fix symptoms:

**Bad**: "Added `|| []` to fix undefined error"
**Good**: "Events array wasn't initialized before Firestore listener connected. Added default empty array to useState."

### Phase 6: Prevention

After fixing:

1. Document why error occurred (code comment)
2. Add validation to prevent similar errors
3. Update type definitions if needed
4. Add to `prompts/debugging.md` if common issue

## Using Multiple AI Models

### When to Switch Models

| Scenario                 | Recommended Model | Why                     |
| ------------------------ | ----------------- | ----------------------- |
| Complex TypeScript types | Claude Sonnet 4.5 | Best at type inference  |
| React debugging          | GPT-4 Turbo       | Strong React knowledge  |
| Architecture decisions   | Claude Sonnet 4.5 | Better at reasoning     |
| Quick syntax fixes       | GitHub Copilot    | Fast inline suggestions |
| UI/UX improvements       | GPT-4             | Strong design sense     |

### Model-Specific Prompts

#### For Claude Sonnet 4.5

```
Analyze this error and explain the root cause:
[ERROR]

Break down:
1. What's causing this error?
2. Why did my previous fix not work?
3. What's the correct solution?
4. How to prevent this in the future?
```

#### For GPT-4 Turbo

```
I need help debugging this React component.
Here's the error: [ERROR]
Here's the component: [CODE]

Walk me through step-by-step what's wrong and how to fix it.
```

#### For GitHub Copilot Chat

```
/fix [select code with error]

or

/explain [select confusing code]
```

## Common Regression Patterns & Solutions

### Pattern 1: Breaking Data Flow

**Symptom**: Feature works for some data but not all

**Prevention**:

```typescript
// BAD: Hardcoded values
if (note.type === 'daily') { ... }

// GOOD: Handle all types
noteTypes.forEach(type => {
  if (note.type === type) { ... }
})
```

**Test**: Always test with different data types and edge cases

### Pattern 2: Breaking Real-Time Updates

**Symptom**: Data doesn't update automatically

**Prevention**:

```typescript
// BAD: Forgetting cleanup
useEffect(() => {
  const unsubscribe = onSnapshot(query, (snapshot) => { ... });
  // Missing return
}, []);

// GOOD: Proper cleanup
useEffect(() => {
  const unsubscribe = onSnapshot(query, (snapshot) => { ... });
  return () => unsubscribe(); // Cleanup
}, []);
```

**Test**: Make changes in Firestore, verify UI updates without refresh

### Pattern 3: TypeScript Errors in Build

**Symptom**: Dev works but build fails

**Prevention**:

```powershell
# Always run before committing
npm run typecheck
npm run build
```

**Common causes**:

- Using `any` types (forces you to use proper types in production)
- Accessing properties that might be undefined
- Incorrect import paths

### Pattern 4: UI Inconsistency

**Symptom**: New components don't match existing design

**Prevention**:

```typescript
// Import design tokens
import { TYPOGRAPHY, SPACING, COLOR_CLASSES } from '@/styles/design-tokens';

// Use consistently
<h1 className={TYPOGRAPHY.pageTitle}>Title</h1>
<div className={`p-${SPACING.card}`}>Content</div>
```

**Test**: Compare new component to existing ones, check `prompts/ui-consistency.md`

### Pattern 5: Performance Regressions

**Symptom**: App becomes slow after changes

**Prevention**:

```typescript
// Memoize expensive calculations
const result = useMemo(() => expensiveCalculation(data), [data]);

// Memoize callbacks passed to children
const handleClick = useCallback(() => { ... }, [dependencies]);

// Virtualize long lists (>100 items)
import { VirtualList } from '@/components/ui/virtual-list';
```

**Test**: Use React DevTools Profiler, check for unnecessary re-renders

## Documentation Requirements

### When Adding New Features

Create or update:

1. Component JSDoc comments
2. Type definitions with descriptions
3. README if adding new section
4. Update `docs/` folder if architecture changes

### When Fixing Bugs

Add comment explaining:

```typescript
// FIX: Events array was undefined when component mounted before
// Firestore listener connected. Initialize with empty array.
const [events, setEvents] = useState<PollutionEvent[]>([]);
```

### When Making Workarounds

Document why:

```typescript
// WORKAROUND: Genkit sometimes returns null for empty responses.
// Using ?? {} to provide default empty object until Genkit v2 fixes this.
const response = (await analyzeFlow(input)) ?? {};
```

## Quality Gates

Before merging to main:

1. ✅ All TypeScript errors resolved
2. ✅ No ESLint warnings
3. ✅ Build succeeds (`npm run build`)
4. ✅ Works with sample data
5. ✅ Works across all features
6. ✅ UI matches design system
7. ✅ Responsive design verified
8. ✅ No console errors/warnings
9. ✅ Loading states implemented
10. ✅ Error handling implemented

## Emergency Debugging

If production is broken:

1. Check Firebase Console for errors
2. Check Firestore rules (permission issues?)
3. Check environment variables in `apphosting.yaml`
4. Roll back to last working commit
5. Debug in isolated environment

```powershell
# Create debug branch
git checkout -b debug/issue-name

# Isolate problem
# Fix and test

# Once confirmed, merge back
git checkout main
git merge debug/issue-name
```
