# ASIENTA

Frontend web para simulación contable basada en conceptos de SIC (Angrisani), orientado a uso educativo para estudiantes, docentes y administradores.

El proyecto está construido como una SPA en React con rutas protegidas por rol, soporte de demo completa sobre MSW y una suite de validación que cubre testing unitario, integración y e2e.

## TL;DR

- Stack principal: `React 19`, `Vite 6`, `TypeScript 5`, `Tailwind CSS 4`, `React Router 7`, `TanStack Query 5`, `Zustand 5`.
- Modo de desarrollo por defecto: `MSW` activo, sin backend real.
- Calidad esperada antes de mergear:
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test`
  - `pnpm test:e2e`

## Tabla de contenidos

- [Visión general](#visión-general)
- [Stack](#stack)
- [Primer arranque](#primer-arranque)
- [Variables de entorno](#variables-de-entorno)
- [Scripts](#scripts)
- [Arquitectura](#arquitectura)
- [Rutas y roles](#rutas-y-roles)
- [Testing y calidad](#testing-y-calidad)
- [Mock API y modo demo](#mock-api-y-modo-demo)
- [Documentación adicional](#documentación-adicional)

## Visión general

La aplicación cubre estos dominios principales:

- `Auth`: login, registro, bootstrap autenticado y perfil.
- `Companies`: listado de empresas, selector activo, alta/edición/baja, demos, shared companies y cierres.
- `Accounts`: plan de cuentas por empresa y restricciones de edición según contexto.
- `Journal`: registro manual, actividad reciente y reversión de asientos.
- `Reports`: libro diario, mayor, balance de comprobación, balance general y cierres.
- `Teacher`: cursos, enrolamiento, supervisión de alumnos, visibilidad de demos y empresas compartidas.
- `Settings`: visibilidad del plan de cuentas para alumnos.
- `Admin`: administración de roles.
- `Glossary`: glosario público navegable y filtrable.

## Stack

| Capa                     | Tecnología               |
| ------------------------ | ------------------------ |
| UI                       | React 19                 |
| Build                    | Vite 6                   |
| Lenguaje                 | TypeScript 5 (`strict`)  |
| Estilos                  | Tailwind CSS 4           |
| Routing                  | React Router 7           |
| Estado cliente           | Zustand 5                |
| Server state             | TanStack Query 5         |
| Formularios              | React Hook Form + Zod    |
| HTTP                     | Axios                    |
| Búsqueda local           | MiniSearch               |
| Mocking                  | MSW 2                    |
| Unit / integration tests | Vitest + Testing Library |
| E2E                      | Playwright               |
| Lint                     | ESLint 9 flat config     |
| Format                   | Prettier                 |
| Releases                 | semantic-release         |

## Primer arranque

### Requisitos

- `Node.js >= 20`
- `pnpm >= 9`

### Instalación

```bash
pnpm install
```

### Desarrollo local

```bash
pnpm dev
```

La app queda disponible en `http://localhost:3000`.

Por defecto corre con:

- `VITE_USE_MOCK_API=true`
- `VITE_API_BASE_URL=/api/v1`

Eso significa que el frontend funciona completamente contra MSW, sin necesidad de un backend real para desarrollo o demo.

## Variables de entorno

Partí de `.env.example`.

| Variable              | Default                 | Propósito                |
| --------------------- | ----------------------- | ------------------------ |
| `VITE_APP_NAME`       | `ASIENTA`               | Nombre visible de la app |
| `VITE_ENV`            | `production` en example | Entorno lógico de la app |
| `VITE_API_BASE_URL`   | `/api/v1`               | Base URL de la API       |
| `VITE_USE_MOCK_API`   | `true`                  | Activa MSW en runtime    |
| `VITE_MOCK_SCENARIO`  | `demo`                  | Dataset mock a usar      |
| `VITE_SENTRY_ENABLED` | `false`                 | Activa Sentry            |
| `VITE_SENTRY_DSN`     | vacío                   | DSN de Sentry            |

La validación de entorno está centralizada en [env.ts](/home/gastong256/projects/mono256_sic_web/src/shared/config/env.ts).

## Scripts

| Script               | Descripción                               |
| -------------------- | ----------------------------------------- |
| `pnpm dev`           | Levanta Vite en desarrollo                |
| `pnpm build`         | Build de producción                       |
| `pnpm preview`       | Preview del build                         |
| `pnpm typecheck`     | Type-check con TypeScript                 |
| `pnpm lint`          | ESLint                                    |
| `pnpm lint:fix`      | ESLint con autofix                        |
| `pnpm test`          | Suite Vitest                              |
| `pnpm test:watch`    | Vitest en watch                           |
| `pnpm test:coverage` | Cobertura Vitest                          |
| `pnpm test:e2e`      | Suite Playwright                          |
| `pnpm test:e2e:ui`   | Playwright UI mode                        |
| `pnpm format`        | Formatea con Prettier                     |
| `pnpm format:check`  | Verifica formateo                         |
| `pnpm init`          | Inicializa placeholders del template base |
| `pnpm release`       | Release automatizado                      |

## Arquitectura

El repo sigue una organización **feature-based**, con dos capas transversales:

- `src/app`: composición de aplicación, layout, providers y router.
- `src/shared`: utilidades, tipos, configuración y componentes reutilizables.

La lógica de dominio vive en `src/features/*`.

```text
src/
├── app/
│   ├── components/
│   ├── providers/
│   ├── App.tsx
│   └── router.tsx
├── features/
│   ├── accounts/
│   ├── admin/
│   ├── auth/
│   ├── companies/
│   ├── glossary/
│   ├── journal/
│   ├── reports/
│   ├── settings/
│   └── teacher/
├── mocks/
├── pages/
├── shared/
├── index.css
└── vite-env.d.ts
```

### Reglas de dependencia

```text
app      -> features, shared
pages    -> features, shared
features -> shared
shared   -> sin dependencias hacia features
```

### Patrón técnico predominante

Dentro de cada feature se reutiliza, cuando aplica, esta secuencia:

```text
api -> adapters -> hooks -> pages/components
```

Eso permite:

- aislar contratos backend en `api/`
- normalizar payloads en `adapters/`
- encapsular fetch/cache en `hooks/`
- mantener componentes más declarativos

### Ruteo

El ruteo está centralizado en [router.tsx](/home/gastong256/projects/mono256_sic_web/src/app/router.tsx) y usa:

- `Layout` como shell general
- `ProtectedRoute` para autenticación
- `RequireRole` para restricciones por rol
- `lazy()` + `Suspense` para code splitting por página

## Rutas y roles

### Públicas

| Ruta        | Descripción                                                       |
| ----------- | ----------------------------------------------------------------- |
| `/`         | Inicio. Si hay sesión muestra Home; sin sesión invita a loguearse |
| `/login`    | Inicio de sesión                                                  |
| `/register` | Registro                                                          |
| `/glosario` | Glosario público                                                  |

### Protegidas para cualquier usuario autenticado

| Ruta                                                  | Descripción                          |
| ----------------------------------------------------- | ------------------------------------ |
| `/companies`                                          | Listado de empresas                  |
| `/companies/:companyId`                               | Detalle de empresa / plan de cuentas |
| `/profile`                                            | Perfil                               |
| `/journal`                                            | Registro manual                      |
| `/reports/journal-book`                               | Libro Diario                         |
| `/reports/ledger`                                     | Libro Mayor                          |
| `/reports/trial-balance`                              | Balance de comprobación              |
| `/reports/closing`                                    | Balance General y Cierres            |
| `/reports/closing/latest-snapshot`                    | Último cierre confirmado             |
| `/reports/closing/snapshots/:snapshotId`              | Snapshot histórico                   |
| `/companies/:companyId/closing/latest-snapshot`       | Ruta legacy/alternativa a snapshot   |
| `/companies/:companyId/closing/snapshots/:snapshotId` | Ruta legacy/alternativa a snapshot   |

### Teacher / Admin

| Ruta                           | Descripción                                  |
| ------------------------------ | -------------------------------------------- |
| `/teacher/dashboard`           | Dashboard docente                            |
| `/teacher/students/:studentId` | Detalle de alumno                            |
| `/settings/chart-visibility`   | Visibilidad del plan de cuentas para alumnos |

### Admin

| Ruta           | Descripción      |
| -------------- | ---------------- |
| `/admin/roles` | Gestión de roles |

## Testing y calidad

La estrategia actual combina tres niveles:

- **Unit / integration** con Vitest
  - hooks
  - adapters
  - pages/componentes con Testing Library
- **E2E** con Playwright
  - flujos críticos cross-feature
  - navegación real de la aplicación
- **Análisis estático**
  - TypeScript estricto
  - ESLint flat config

Estado actual esperado:

- `pnpm test` -> `44 passed`
- `pnpm test:e2e` -> `28 passed`

### Convención práctica para cambios

Antes de dar por cerrado un cambio relevante:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
```

## Mock API y modo demo

El proyecto tiene soporte completo de MSW en desarrollo y demo.

Entradas principales:

- [browser.ts](/home/gastong256/projects/mono256_sic_web/src/mocks/browser.ts)
- [server.ts](/home/gastong256/projects/mono256_sic_web/src/mocks/server.ts)
- `src/mocks/handlers/*`
- [mockDb.ts](/home/gastong256/projects/mono256_sic_web/src/mocks/data/mockDb.ts)

MSW hoy no cubre solo auth/companies/journal: también modela teacher, reports, closings, settings, admin, glossary y permisos de lectura/escritura por contexto.

## Documentación adicional

La documentación detallada del repo vive en `docs/`:

- [Índice de documentación](/home/gastong256/projects/mono256_sic_web/docs/README.md)
- [Arquitectura](/home/gastong256/projects/mono256_sic_web/docs/architecture.md)
- [Features, roles y rutas](/home/gastong256/projects/mono256_sic_web/docs/features-and-routes.md)
- [Workflow de desarrollo](/home/gastong256/projects/mono256_sic_web/docs/development-workflow.md)
- [Testing y calidad](/home/gastong256/projects/mono256_sic_web/docs/testing.md)

## Deploy demo

Para una demo frontend-only en Vercel:

1. Importar el repo en Vercel.
2. Framework preset: `Vite`.
3. Build command: `pnpm build`.
4. Output directory: `dist`.
5. Variables:
   - `VITE_APP_NAME=ASIENTA`
   - `VITE_ENV=production`
   - `VITE_API_BASE_URL=/api/v1`
   - `VITE_USE_MOCK_API=true`
   - `VITE_MOCK_SCENARIO=demo`
   - `VITE_SENTRY_ENABLED=false`

`vercel.json` ya contiene rewrites para deep links de SPA.

## Licencia

MIT © gastong256
