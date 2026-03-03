# UX/UI Stage 2 Navigation and Information

## Objectives completed

- Improve navigation hierarchy without changing permissions or route behavior.
- Make company context permanently visible in app shell.
- Standardize page-level information architecture (title + subtitle + actions).
- Add breadcrumb context for non-root authenticated routes.

## Changes introduced

- New shared `PageHeader` component for consistent title/subtitle/actions structure.
- New global `AppBreadcrumbs` component driven by pathname and segment labels.
- `Layout` navigation refined:
  - clearer visual active states (`NavLink` based)
  - grouped supervision options under a dedicated menu (`Panel docente`, `Plan de cuentas`, `Roles`)
  - explicit context bar with active company and current route
- `CompanySelector` now explicitly labels active company context.
- Main feature pages migrated to `PageHeader`:
  - companies, journal, reports, teacher dashboard/detail, chart visibility, admin roles, profile.

## Constraints respected

- No API contract changes.
- No data model changes.
- No permission logic changes.
- No workflow/operation changes.
