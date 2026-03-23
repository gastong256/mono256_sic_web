# Testing Strategy

## Purpose

Este documento explica cómo se valida el proyecto y qué tipo de cobertura aporta cada suite.

## Quality gates

Las validaciones esperadas antes de considerar sano el repo son:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
```

## Static validation

### TypeScript

`pnpm typecheck`

- usa `tsc -b --noEmit`
- valida tipos de toda la app

### ESLint

`pnpm lint`

Puntos relevantes del setup:

- flat config
- reglas TypeScript estrictas
- `no-floating-promises`
- `consistent-type-imports`
- relajación específica en tests y e2e

## Unit and integration tests

### Tooling

- `Vitest`
- `@testing-library/react`
- `@testing-library/user-event`
- `jsdom`

### Config

La configuración vive en [vite.config.ts](/home/gastong256/projects/mono256_sic_web/vite.config.ts), sección `test`.

Características:

- globals habilitados
- `jsdom`
- `vitest.setup.ts`
- coverage con `v8`

### Qué se cubre aquí

- adapters
- hooks
- stores
- páginas/componentes con interacción
- integración contra MSW server-side

Ejemplos:

- auth store y login hooks
- pages de companies y company detail
- dashboard docente
- glosario
- adapters de reports y closings

## E2E tests

### Tooling

- `Playwright`
- proyecto actual: `chromium`
- dev server levantado automáticamente con `pnpm dev`

Configuración en [playwright.config.ts](/home/gastong256/projects/mono256_sic_web/playwright.config.ts).

### Qué cubren

Los e2e actuales validan flujos críticos cross-feature, por ejemplo:

- auth base
- companies CRUD y demos
- accounts CRUD
- journal y reverse
- reports
- opening + books
- closings
- teacher flows
- home, profile y glossary
- settings visibility

### Consideraciones importantes

- la app usa `accessToken` en memoria y `refreshToken` persistido
- por eso algunos flujos son más estables cuando navegan por UI real después del login
- los helpers de `e2e/support/` ya encapsulan esas decisiones y conviene reutilizarlos

## MSW in tests

MSW es parte integral de la estrategia de testing:

- en Vitest se usa server-side
- en e2e se usa en runtime vía frontend

Si cambiás un contrato de backend mockeado, hay que revisar:

- handlers
- dataset (`mockDb.ts`)
- adapters/hooks
- tests afectados

## Coverage philosophy

La intención del repo no es testear cada detalle visual aislado, sino cubrir:

- reglas de negocio importantes
- contratos frontend/backend
- permisos
- flujos completos de alto valor

## Current suites

### `pnpm test`

Cobertura de:

- unit
- integration
- component behavior

### `pnpm test:e2e`

Cobertura de:

- happy paths críticos
- navegación real
- integraciones entre features
- descargas
- restricciones por rol

## Recommendations for future tests

### When adding a new feature

Agregar al menos:

1. tests de adapters/helpers si hay transformación de datos
2. tests de hook o page/component para comportamiento local
3. e2e si el flujo es crítico de negocio

### When changing an existing flow

Revisar:

- si el cambio rompe selectores e2e
- si cambian textos usados por tests
- si cambian nombres de archivos descargados
- si hay que endurecer tiempos de espera por mutaciones más lentas

## Anti-patterns to avoid

- tests e2e que dependan de detalles visuales demasiado frágiles
- assertions ambiguas que matcheen más de un elemento
- mutaciones compartidas en e2e sin restaurar estado o sin entender su impacto en paralelismo
- lógica compleja escondida en helpers sin cobertura
