# Architecture rules for gpa-cal

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