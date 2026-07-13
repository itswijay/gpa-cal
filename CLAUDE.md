# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (binds to all interfaces)
npm run build        # Type-check + Vite build + post-build SEO script
npm run lint         # ESLint
npm run test         # Run all tests once (Vitest)
npm run test:watch   # Watch mode for tests
npx tsc --noEmit     # Type-check only
```

To run a single test file:
```bash
npx vitest run src/domain/gpa/calculateSemesterGpa.test.ts
```

## Environment

Create `.env.local` with Firebase credentials:
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

The `api/notify-admin.ts` Vercel serverless function also requires `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` set in the Vercel project environment.

## Architecture rules

This project follows **Clean Architecture** with strict inward-only dependency flow:

```
UI / Adapters → Use Cases → Domain
```

Target structure:
- src/domain/    — pure business rules (GPA math, validation). NO React, NO Firebase imports.
- src/use-cases/ — orchestration functions that call domain + adapters together.
- src/adapters/  — Firebase & localStorage access. CRUD only, no business rules.
- src/ui/        — React pages, components, hooks, contexts.

Rules:
1. Anything in src/domain/ must be a plain function, unit-testable with no mocks.
2. Never put validation or calculation logic inside a React component or inside adapters/firebase/.
3. When moving code, write/adjust tests FIRST so behavior is proven unchanged before and after.
4. Small steps only — one concern per task. Do not refactor UI and domain in the same change.
5. NEVER modify, rewrite, or "improve" any file or function outside what the current task
   explicitly names — even if it looks like a related bug or a good idea. If you notice
   something like that, stop and describe it as a suggestion for a separate task instead
   of touching it.


### Layer Rules

| Layer | Path | Rule |
|---|---|---|
| **Domain** | `src/domain/` | Pure functions only. No React, no Firebase, no browser APIs. Fully testable without mocks. |
| **Use Cases** | `src/use-cases/` | Orchestration only. Calls domain functions and adapter methods. No UI concerns. |
| **Adapters** | `src/adapters/` | CRUD and data translation to/from external systems (Firestore, localStorage). No business logic. |
| **UI** | `src/ui/` | React pages, components, hooks. Page-level orchestration stays in pages; sub-components must remain stateless presentational units. |

**Never import from an outer layer into an inner one.** Domain must not import from adapters or UI.

### Key Data Flow

1. Static curriculum data lives in `src/data/subjects/` (one file per faculty), assembled in `src/data/subjects/index.ts`.
2. The user enters grades in `AddGradesPage` → `saveSemesterGrades` use case calls `prepareSemesterEntry` (domain) then `saveSemesterData` (Firebase adapter).
3. Locally-only path: `saveSemesterGradesLocally` use case calls `localGpaStore` adapter instead.
4. `MainPage` reads data via `useFirebaseData` hook (real-time Firestore subscription) or falls back to `localGpaStore`.
5. Cumulative GPA is calculated by `calculateCumulativeGpa` (credit-weighted, draft semesters excluded).

### Routing

Routes are defined in `App.tsx`:
- `/` — MainPage (summary + analytics)
- `/addGrades` — AddGradesPage (grade entry)
- `/login` — LoginPage
- `/custom-degree` — CustomDegreePage (visual degree builder)
- `/admin/moderation` — ModerationPage (admin-only)

### Path Alias

`@/` maps to `src/`. Use it for all internal imports.

### Serverless API

`api/notify-admin.ts` is a Vercel serverless function (POST only) that forwards a message to Telegram. It is called from `src/adapters/notifications/notifyAdmin.ts` when users submit or request deletion of curriculum suggestions.

### Testing

Tests live co-located with their source files (e.g. `calculateSemesterGpa.test.ts` next to `calculateSemesterGpa.ts`). All domain and use-case tests are pure unit tests — no mocking of external systems required. Test environment is `node` (see `vite.config.ts`).

### shadcn/ui

Base UI primitives are in `src/ui/components/ui/`. When adding new shadcn components, place them there. Custom composite components go in `src/ui/components/` sub-folders by concern (`auth/`, `analytics/`, `custom-degree/`).
