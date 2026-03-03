# UX/UI Stage 4 Feedback, Accessibility and Responsive

## Objectives completed

- Add non-intrusive global feedback for key user actions.
- Improve keyboard/accessibility semantics in navigation and tables.
- Improve mobile navigation behavior without changing business flows.

## Feedback improvements

- New shared `ToastProvider` + `useToast` for ephemeral action feedback.
- Toast messages integrated in key mutations:
  - create/update/delete company
  - create journal entry
  - update role
  - save account chart visibility
- Toasts include `aria-live` for assistive technologies.

## Accessibility improvements

- Desktop dropdown menus in `Layout` now expose `aria-expanded` and `aria-controls`.
- Global `Escape` closes all open menus.
- Breadcrumb current item uses `aria-current="page"`.
- Key data tables now use `scope="col"` on headers.

## Responsive improvements

- Navigation now has dedicated mobile menu on `<md` screens.
- Desktop keeps dropdown navigation; mobile shows direct links for all sections.
- Company context remains visible and usable in mobile menu.

## Constraints respected

- No API changes.
- No role/permission changes.
- No flow/operation changes.
