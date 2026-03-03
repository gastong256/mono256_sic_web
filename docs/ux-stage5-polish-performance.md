# UX/UI Stage 5 Visual Polish and Perceived Performance

## Objectives completed

- Add final visual polish with subtle motion and stronger card interaction language.
- Improve perceived loading speed using skeleton placeholders.
- Improve startup chunk distribution to reduce main bundle pressure.

## Visual polish

- Added reusable motion utilities:
  - `ui-fade-in` for gentle content reveal
  - `ui-lift` for hover elevation on key cards
- Applied to high-impact surfaces:
  - journal entry cards
  - report cards/lists
  - company table container
- Added `prefers-reduced-motion` fallback for accessibility.

## Perceived performance

- New shared `Skeleton` UI component for loading placeholders.
- Replaced spinner-only loading in key screens with skeleton structures:
  - route-level fallback (`PageLoader`)
  - companies list page
  - journal list page
  - teacher dashboard summary blocks

## Bundling optimization

- Added `manualChunks` strategy in `vite.config.ts` to split:
  - `react-vendor`
  - `query-vendor`
  - `mock-vendor`
  - `vendor`

This improves cacheability and lowers the blast radius of future bundle changes.

## Constraints respected

- No business flow changes.
- No API contract changes.
- No auth/permission model changes.
