# Feature Planning Prompt

## Context

Project: Kore - Personal Knowledge Management System
Stack: Next.js 15, TypeScript, Firebase/Firestore, External LLM Router (TBD), Tailwind CSS, Shadcn/ui
Architecture: Obsidian-style note-taking with AI-powered chat, graph visualization, and RAG search

## Planning Checklist

### 1. Requirements Analysis

- [ ] What is the specific user need or problem?
- [ ] Which components are affected? (Notes, Chat, Graph, Search)
- [ ] What data sources are required? (Firestore, LLM API, embeddings)
- [ ] Are there dependencies on existing components or flows?

### 2. Technical Design

- [ ] Which layers are affected?
  - [ ] UI Components (`src/components/*`)
  - [ ] Server Actions (`src/app/actions/*`)
  - [ ] AI Flows (LLM router integration)
  - [ ] Database Schema (Firestore collections)
  - [ ] Types (`src/types/*`)
- [ ] What are the data flow steps?
  1. User input → 2. Server action → 3. LLM/AI processing → 4. Firestore storage → 5. Real-time UI update
- [ ] Which existing patterns should be followed?
  - Server actions with `'use server'` and `revalidatePath()`
  - LLM router calls with proper error handling
  - Real-time hooks with `onSnapshot` and cleanup
  - Component patterns from Shadcn/ui library

### 3. Implementation Steps

Break down into small, testable increments:

1. Update types if needed
2. Modify/create backend logic (server actions, LLM calls)
3. Create/update UI components
4. Add real-time data subscription
5. Test with sample data
6. Validate edge cases and error handling

### 4. Quality Checks

- [ ] TypeScript strict mode compliance (no `any` types)
- [ ] Consistent with design system (black background, Perplexity-inspired aesthetic)
- [ ] Uses path aliases (`@/*` imports)
- [ ] Follows server action pattern (proper return types, revalidatePath)
- [ ] Includes loading and error states
- [ ] Mobile-responsive (Tailwind breakpoints)

### 5. Testing Strategy

- [ ] Test with sample note data
- [ ] Test real-time updates (Firestore listener)
- [ ] Test AI integration with LLM router
- [ ] Test edge cases (no data, API errors, timeout)
- [ ] Test responsive design on different screen sizes

## Anti-Patterns to Avoid

- ❌ Mixing client and server code without `'use server'` directive
- ❌ Direct Firestore writes from client (use server actions)
- ❌ Forgetting `revalidatePath()` after mutations
- ❌ Calling LLM APIs synchronously in UI (always server-side)
- ❌ Hardcoding API keys or secrets in client code
- ❌ Inline styles instead of Tailwind classes
- ❌ Creating new UI primitives (use Shadcn/ui components)

## File Impact Checklist

Mark files that will be modified:

- [ ] `src/app/actions/*` - Server actions
- [ ] `src/app/page.tsx` or route pages - UI entry points
- [ ] `src/components/notes/*` - Note components
- [ ] `src/components/chat/*` - Chat interface
- [ ] `src/components/graph/*` - Graph visualization
- [ ] `src/components/ui/*` - Shadcn/ui components
- [ ] `src/hooks/*` - Custom React hooks
- [ ] `src/types/*` - Type definitions
- [ ] `src/lib/*` - Utility functions

## Success Criteria

Define what "done" looks like:

- User can [specific action]
- Data displays correctly for [scenario]
- Performance: [metric] completes in < [time]
- No TypeScript errors
- No console warnings
- Responsive on mobile/tablet/desktop
