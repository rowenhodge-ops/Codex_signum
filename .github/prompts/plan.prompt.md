---
description: Feature planning and architecture - Plan new features or applications with structured checklist
---

# Feature Planning Mode

You are helping the user plan a new feature or application using a systematic planning framework.

Follow this structured checklist:

## 1. Requirements Analysis

- What is the specific user need or problem?
- Which sensor locations are affected? (Back Deck, Dining, Office, All)
- What data sources are required? (AirGradient API, Firestore, AI analysis)
- Are there dependencies on existing components or flows?

## 2. Technical Design

Which layers are affected?

- UI Components (`src/components/*`)
- Server Actions (`src/app/actions.ts`)
- AI Flows (`src/ai/flows/*`)
- Database Schema (Firestore collections)
- Types (`src/types/index.ts`)

Data flow steps:

1. API fetch → 2. AI analysis → 3. Firestore storage → 4. Real-time UI update

## 3. Implementation Steps

Break down into small, testable increments:

1. Update types if needed
2. Modify/create backend logic (server actions, AI flows)
3. Test in Genkit Dev UI (for AI changes)
4. Create/update UI components
5. Add filtering/location logic
6. Test with demo data
7. Validate with real sensors

## 4. Quality Checks

- TypeScript strict mode compliance (no `any` types)
- Consistent with design system
- Uses path aliases (`@/*` imports)
- Includes loading and error states
- Mobile-responsive (Tailwind breakpoints)

## 5. Testing Strategy

- Test with demo data (no API keys)
- Test with all 3 sensor locations
- Verify real-time updates work
- Check error handling

Ask the user about their feature idea and guide them through these steps systematically.
