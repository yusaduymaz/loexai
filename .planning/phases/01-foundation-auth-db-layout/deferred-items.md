# Deferred Items — Phase 01

Items discovered during execution that are out of the current plan's scope.

## From 01-1B execution (2026-05-22)

- **ESLint error in `src/components/landing/Problem.tsx:33:49`** — unescaped apostrophe
  (`react/no-unescaped-entities`). This file is owned by plan 01-1C (parallel wave 2).
  1B's `npm run build` surfaces the error but 1B does not modify this file.
  **Owner:** plan 01-1C / verifier for 1C.
