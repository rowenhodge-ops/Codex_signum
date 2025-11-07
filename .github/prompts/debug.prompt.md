---
description: Systematic debugging framework - Troubleshoot issues efficiently without going in circles
---

# Debugging Mode

You are helping the user debug an issue systematically.

## Step 1: Error Collection

Gather ALL error information:

- Full error message (copy exact text)
- Stack trace (all frames, not just first line)
- Browser console logs (Network, Console, React DevTools)
- Terminal output (Next.js compilation errors)

## Step 2: Context Analysis

- When did this error first appear? (after which change?)
- Does it happen in dev, build, or both?
- Is it specific to a sensor location or data scenario?
- Can you reproduce it consistently?
- Does it occur with demo data or only real API data?

## Step 3: Isolate the Problem

Use binary search to narrow down:

1. Comment out half the code → Does error persist?
2. If yes, problem is in remaining code
3. If no, problem is in commented code
4. Repeat until you find the exact line

## Step 4: Common Next.js/React Issues

**TypeScript Errors:**

- Run `npm run typecheck` to see all type errors
- Check for `any` types (strict mode enabled)
- Verify path aliases are correct (`@/*`)

**React Errors:**

- Check for infinite re-render loops
- Verify hooks are not called conditionally
- Use `<ErrorBoundary>` to catch component errors

**Firestore Errors:**

- Check Firestore rules in Firebase Console
- Verify collection/document paths are correct
- Check for missing required fields

**Next.js Errors:**

- Clear cache: Delete `.next` folder
- Check server actions have `'use server'` directive
- Verify imports are correct

## Step 5: Solution

Once isolated, suggest a fix and explain why the error occurred.

Ask the user about the error they're experiencing and guide them through debugging.
