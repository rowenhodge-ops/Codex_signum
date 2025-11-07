---
description: Pre-commit code review - Quality checks before committing changes
---

# Code Review Mode

You are helping the user review their code before committing.

## Pre-Commit Checklist

### TypeScript Quality

- [ ] No `any` types (strict mode)
- [ ] All props have proper types
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] Path aliases used (`@/*` not relative paths)

### React Best Practices

- [ ] No console.log (use console.info, console.warn, console.error)
- [ ] Hooks not called conditionally
- [ ] Keys provided for all mapped elements
- [ ] Proper dependency arrays in useEffect/useMemo
- [ ] Loading and error states included

### Performance

- [ ] Expensive calculations wrapped in useMemo
- [ ] Event handlers wrapped in useCallback
- [ ] Images optimized (use Next.js Image component)
- [ ] No unnecessary re-renders

### UI Consistency (Design System)

- [ ] Colors: Soft blue (#90AFC5), Light gray (#F0F4F8), Muted green (#A2BCA2)
- [ ] Fonts: Belleza (headlines), Alegreya (body)
- [ ] Spacing: Multiples of 4 (p-4, m-8, gap-6)
- [ ] Uses Shadcn/ui components with `cn()` utility
- [ ] Mobile-responsive (sm:, md:, lg: breakpoints)

### Project-Specific

- [ ] Server actions have `'use server'` directive
- [ ] Firestore queries use proper error handling
- [ ] Events filtered by locationId (not locationName)
- [ ] Genkit flows have input/output schemas
- [ ] Real-time listeners cleaned up in useEffect return

### Testing

- [ ] Tested with demo data (no API keys)
- [ ] Tested with all 3 sensor locations
- [ ] No ESLint errors: `npm run lint`
- [ ] Build succeeds: `npm run build`

Ask the user what code they want reviewed and work through this checklist systematically.
