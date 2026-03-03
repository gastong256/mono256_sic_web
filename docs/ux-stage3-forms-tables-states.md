# UX/UI Stage 3 Forms, Tables and States

## Objectives completed

- Standardize feedback patterns for errors/warnings/success/info.
- Improve empty states with explicit next actions.
- Improve readability and behavior of operational tables.
- Improve forms with clearer hints and better inline feedback.

## New shared components

- `Alert`: single visual language for error/warning/success/info feedback.
- `EmptyState`: reusable empty-state block with optional action CTA.

## Forms improved

- Company form:
  - unified error surface with `Alert`
  - inline helper for optional CUIT format
- New journal entry form:
  - submit-level error handling (failed mutation now shows feedback)
  - clearer labels and helper text for debit/credit rule
  - improved numeric inputs and account select focus states
  - consistent action buttons
- Register page:
  - visual consistency with stage-1 card system
  - success/error messages moved to shared `Alert`

## Tables improved

- Company table:
  - sticky header, min width + horizontal overflow support
  - improved column typography and row scanability
  - action buttons with titles and consistent hover behavior
- Admin roles table:
  - empty state support
  - improved table hierarchy and select focus states

## Empty/error states standardized

- Companies, journal, teacher dashboard/detail, reports, settings, profile and admin roles now use shared `Alert`/`EmptyState` patterns.

## Constraints respected

- No business rules changed.
- No API contract changes.
- No permission behavior changes.
