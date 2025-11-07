# Systematic Debugging Prompt

## Before You Start

**CRITICAL**: If debugging in circles for >15 minutes, STOP and try:

1. Start fresh chat with different AI model (GPT-4, Claude Sonnet, etc.)
2. Provide full error context + relevant file contents
3. Ask for root cause analysis, not quick fixes

## Debugging Framework

### Step 1: Error Collection

Gather ALL error information:

- [ ] Full error message (copy exact text)
- [ ] Stack trace (all frames, not just first line)
- [ ] Browser console logs (Network, Console, React DevTools)
- [ ] Terminal output (Next.js compilation errors)
- [ ] VS Code Problems panel (`Ctrl+Shift+M`)

**Commands to run:**

```bash
# Check TypeScript errors
npm run typecheck

# Check for runtime errors
npm run dev

# View Firestore rules errors
# Check Firebase Console → Firestore → Rules
```

### Step 2: Context Analysis

- [ ] When did this error first appear? (after which change?)
- [ ] Does it happen in dev, build, or both?
- [ ] Is it specific to a component or feature (Notes, Chat, Graph)?
- [ ] Can you reproduce it consistently?
- [ ] Does it occur with sample data or only live data?

### Step 3: Isolate the Problem

Use binary search to narrow down:

1. Comment out half the code → Does error persist?
2. If yes, problem is in remaining code
3. If no, problem is in commented code
4. Repeat until you find the exact line

**For React errors:**

- Wrap components in `<ErrorBoundary>`
- Use `console.log` at component mount/render
- Check for infinite re-render loops (watch console)

**For TypeScript errors:**

- Run `npm run typecheck` to see all errors
- Fix from bottom to top (dependencies first)
- Use `// @ts-expect-error` temporarily to isolate

**For Server Action errors:**

- Check terminal output (server-side logs)
- Verify `'use server'` directive is present
- Ensure async/await is used correctly
- Check Firestore permissions (`firestore.rules`)

### Step 4: Common Next.js/React Issues

#### React Hydration Errors

**Symptom**: "Text content does not match server-rendered HTML"
**Cause**: Client/server rendering mismatch
**Fix**:

- Use `'use client'` for interactive components
- Avoid `Date.now()` or random values in SSR
- Use `useEffect` for client-only logic

#### Firestore Permission Denied

**Symptom**: "Missing or insufficient permissions"
**Cause**: Security rules or unauthenticated access
**Fix**:

- Check `firestore.rules` allows read/write
- Verify Firebase is initialized (`src/lib/firebase.ts`)
- Ensure server actions have proper credentials

#### AI/LLM Errors

**Symptom**: "API rate limit exceeded" or "Model timeout"
**Cause**: LLM API issues or configuration
**Fix**:

- Check LLM router configuration and API keys
- Implement retry logic with exponential backoff
- Use fallback models when primary fails
- Monitor token usage and costs

#### TypeScript "Cannot find module" Errors

**Symptom**: Import paths not resolving
**Cause**: Path aliases misconfigured
**Fix**:

- Use `@/*` imports (defined in `tsconfig.json`)
- Restart TypeScript server: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
- Check `next-env.d.ts` exists

#### Infinite Re-render Loop

**Symptom**: Browser freezes, thousands of console logs
**Cause**: State update in render function
**Fix**:

- Move state updates to `useEffect`
- Check dependency arrays in `useEffect`
- Avoid creating new objects/arrays in JSX

### Step 5: Verification

After fix, confirm:

- [ ] Error no longer appears in console
- [ ] TypeScript compiles without errors: `npm run typecheck`
- [ ] App builds successfully: `npm run build`
- [ ] Feature works as expected in dev mode
- [ ] No new warnings introduced

### Step 6: Prevention

Document the fix:

- Add comment explaining non-obvious code
- Update types if schemas changed
- Add validation/error handling for edge cases
- Consider adding to this debugging guide

## Debugging Tools

### VS Code Commands

- `Ctrl+Shift+M` - Problems panel
- `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
- `Ctrl+Shift+P` → "Developer: Reload Window"
- `F12` - Go to definition
- `Shift+F12` - Find all references

### Browser DevTools

- React Developer Tools (Components tab)
- Network tab (API calls, status codes)
- Console (filter by Error/Warning)
- Application tab (Firestore cache, LocalStorage)

### Terminal Commands

```bash
# Clear Next.js cache
Remove-Item -Recurse -Force .next

# Reinstall dependencies
Remove-Item -Recurse -Force node_modules; npm install

# Check for port conflicts
netstat -ano | findstr :9002

# View Git changes
git status
git diff
```

## When to Escalate

Use a different AI model (Claude Sonnet 4.5, GPT-4, etc.) if:

- Debugging for >20 minutes with no progress
- Error message is cryptic/unhelpful
- Multiple unrelated errors appear simultaneously
- Need architecture-level guidance (not just syntax fixes)

**Provide to new AI:**

1. Full error message + stack trace
2. Relevant file contents (use `@file` mention)
3. What you've tried so far
4. Desired outcome (not just "fix error")
