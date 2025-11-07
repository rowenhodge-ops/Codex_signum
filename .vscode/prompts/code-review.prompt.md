# Code Review Checklist

## Pre-Commit Review

### TypeScript Quality

- [ ] No `any` types (use specific types or `unknown`)
- [ ] All functions have return type annotations
- [ ] Props interfaces exported and documented
- [ ] Enums used for string literals with >3 values
- [ ] Imports use `@/*` path aliases

### React Best Practices

- [ ] Components are single-responsibility
- [ ] `'use client'` only when necessary (interactivity, hooks, browser APIs)
- [ ] `'use server'` on all server actions
- [ ] No prop drilling (use context or composition)
- [ ] Loading and error states handled
- [ ] Keys on mapped elements are stable (not array index)

### Performance

- [ ] `useMemo` for expensive computations
- [ ] `useCallback` for functions passed to child components
- [ ] Large lists use virtualization (if >100 items)
- [ ] Images optimized (Next.js `<Image>` component)
- [ ] API calls debounced/throttled where appropriate

### UI Consistency

- [ ] Uses Shadcn/ui components and Tailwind CSS
- [ ] Black background with modern, minimal aesthetic (Perplexity-inspired)
- [ ] Consistent spacing between sections (16px/24px/32px)
- [ ] Responsive breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- [ ] Lucide React icons used for all icons
- [ ] `cn()` utility for conditional classes

### Accessibility

- [ ] All interactive elements keyboard-accessible
- [ ] ARIA labels on icon-only buttons
- [ ] Form inputs have associated labels
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Focus indicators visible

### Error Handling

- [ ] Try/catch blocks on async operations
- [ ] User-friendly error messages (not raw API errors)
- [ ] Errors logged to console for debugging
- [ ] Firestore operations handle permission errors
- [ ] LLM API failures show retry option or fallback

### Data Flow

- [ ] Server actions call `revalidatePath()` after mutations
- [ ] Firestore listeners cleaned up in useEffect return
- [ ] No direct Firestore writes from client (use server actions)
- [ ] LLM calls are server-side only
- [ ] Proper return types on server actions: `{ success: boolean; error?: string }`

### Security

- [ ] No API keys in client code (use server actions)
- [ ] User inputs sanitized (especially for Firestore queries)
- [ ] Firestore rules prevent unauthorized writes
- [ ] No sensitive data in console.log statements

## Code Style

### Naming Conventions

- Components: `PascalCase` (e.g., `NoteEditor`, `ChatInterface`)
- Files: `kebab-case.tsx` or `PascalCase.tsx` for components
- Functions: `camelCase` (e.g., `createNote`, `analyzeContent`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_NOTES_PER_PAGE`)
- Types/Interfaces: `PascalCase` (e.g., `Note`, `ChatMessage`)

### File Organization

```
component/
  ComponentName.tsx         # Main component
  component-utils.ts        # Helper functions
  component-types.ts        # Local types
  index.ts                  # Re-export
```

### Import Order

1. React/Next.js
2. Third-party libraries
3. `@/components/*`
4. `@/lib/*`, `@/hooks/*`
5. `@/types/*`
6. Relative imports (`./`)
7. CSS imports

### Comment Guidelines

- [ ] Complex logic has explanatory comments
- [ ] TODOs include name and date: `// TODO (Name, 2025-10-27): Description`
- [ ] Public functions have JSDoc comments
- [ ] Hacks/workarounds documented with reasoning

## Project-Specific Checks

### Knowledge Management Features

- [ ] Notes stored in Firestore with proper metadata
- [ ] Real-time listeners properly handle Firestore snapshots
- [ ] Pagination implemented for large note lists (limit 50)
- [ ] Search functionality integrates with embeddings/RAG
- [ ] Graph visualization handles bidirectional links

### AI Integration

- [ ] LLM calls are server-side only (never from client)
- [ ] Proper error handling for API timeouts and rate limits
- [ ] AI responses validated before storage in Firestore
- [ ] Context window limits considered for long notes
- [ ] Costs tracked and optimized (prefer faster models when appropriate)

### Firebase/Firestore

- [ ] Server actions use `revalidatePath()` after mutations
- [ ] Firestore rules prevent unauthorized access
- [ ] Indexes created for complex queries (check Firebase Console)
- [ ] Real-time listeners have cleanup in useEffect return
- [ ] Batch operations used for multiple writes

## Pre-Deployment Checklist

- [ ] `npm run typecheck` passes
- [ ] `npm run build` succeeds
- [ ] No console errors in production build
- [ ] Environment variables documented in `apphosting.yaml`
- [ ] Firestore indexes created (check Firebase Console)
- [ ] Tested on mobile device (or responsive mode)

## Regression Prevention

Before merging:

1. Test existing features still work (smoke test)
2. Check no new TypeScript errors introduced
3. Verify styling consistency with current design
4. Ensure real-time updates still trigger
5. Confirm server actions return proper types

