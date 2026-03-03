# UX/UI Stage 1 Foundation

## Scope

This stage establishes a consistent visual baseline without changing existing business flows.

## Screen inventory (current)

- Public: `/login`, `/register`.
- Core student flow: `/`, `/companies`, `/companies/:companyId`, `/reports/journal-book`, `/reports/ledger`, `/reports/trial-balance`.
- Shared account: `/profile`.
- Teacher/admin supervised views: `/teacher/dashboard`, `/teacher/students/:studentId`, `/settings/chart-visibility`.
- Admin only: `/admin/roles`.

## Global states to standardize in next stages

- Loading: page-level loading + section-level loading skeletons.
- Empty: no companies, no entries, no report rows, no students.
- Errors: auth/session, forbidden, validation, business conflicts (409), rate limit (429).
- Success feedback: create/update/delete toasts and contextual confirmations.

## Design tokens introduced

- Typography: `--font-sans` stack for consistent non-default app identity.
- Surfaces: `--bg-canvas`, `--bg-surface`, `--bg-subtle`.
- Borders: `--border-soft`, `--border-strong`.
- Text: `--text-strong`, `--text-muted`.
- Actions: `--brand-500/600/700`, `--danger-500/600`.
- Elevation: `--shadow-soft`.

## Utility classes introduced

- `.surface-card`: primary card container for forms/panels.
- `.subtle-panel`: low emphasis contextual container.
- `.section-title`: consistent section heading styling.
- `.muted-text`: consistent secondary text styling.

## Component baseline updated

- `Button`: unified variants, stronger focus rings, normalized visual weight.
- `Input`: consistent label weight, borders/focus, and error styling.
- `Modal`: improved backdrop, panel border/radius/shadow consistency.
- `Layout` and `Login`: updated to use shared visual language and tokens.

## Non-goals for Stage 1

- No route/menu behavior changes.
- No permission/model changes.
- No API changes.
- No workflow or data model changes.
