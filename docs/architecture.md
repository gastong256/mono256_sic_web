# Architecture

## Purpose

Este documento describe cómo está organizado el frontend, qué patrones usa y qué criterios seguir para mantenerlo consistente a futuro.

## High-level structure

El proyecto está organizado principalmente como una aplicación **feature-based**.

```text
src/
├── app/         # composición global de la app
├── features/    # dominios funcionales
├── pages/       # páginas transversales o entry points globales
├── shared/      # código transversal reutilizable
└── mocks/       # MSW y dataset local
```

## Responsibilities by top-level folder

### `src/app`

Responsable de la composición global:

- layout principal
- router
- suspense boundaries
- page loader
- providers de aplicación

Acá no debería vivir lógica de dominio.

### `src/features`

Cada carpeta representa un dominio de negocio o una capability principal:

- `auth`
- `companies`
- `accounts`
- `journal`
- `reports`
- `teacher`
- `settings`
- `admin`
- `glossary`

Cada feature mantiene cerca sus tipos, hooks, adapters, API y componentes.

### `src/pages`

Se usa para páginas transversales que no pertenecen claramente a una sola feature:

- `HomePage`
- `ProfilePage`
- `NotFoundPage`

### `src/shared`

Código transversal y agnóstico al dominio:

- `config`
- `lib`
- `types`
- `ui`

Regla clave:

- `shared` no importa desde `features`

### `src/mocks`

Infraestructura de demo y testing local:

- `handlers/`
- `data/mockDb.ts`
- `browser.ts`
- `server.ts`

## Dependency rules

```text
app      -> features, shared
pages    -> features, shared
features -> shared
shared   -> sin imports desde features
```

Esto ayuda a evitar acoplamiento circular y mantiene `shared` realmente reutilizable.

## Common module shape inside a feature

No todas las features necesitan todas las carpetas, pero el patrón predominante es:

```text
feature/
├── api/
├── adapters/
├── hooks/
├── components/
├── pages/
├── lib/
├── types/
└── __tests__/
```

### `api/`

Define la integración HTTP con backend:

- endpoints
- parsing básico
- named request functions

No debería contener lógica de UI.

### `adapters/`

Normaliza payloads del backend al shape que consume la UI.

Es especialmente útil cuando:

- el backend tiene aliases
- hay compatibilidad hacia atrás
- se necesita aplanar o enriquecer estructuras

### `hooks/`

Encapsulan:

- fetch con React Query
- mutations
- invalidaciones
- query keys
- lógica reusable de acceso a datos

### `components/`

Componentes de feature reusables dentro de ese dominio.

### `pages/`

Entry points principales de la feature, normalmente ligados a rutas.

### `lib/`

Lógica pura del dominio:

- helpers
- reglas de negocio de front
- mappings
- presentation helpers

### `types/`

Tipos propios del dominio.

## Runtime patterns

### Routing

El router está centralizado en `src/app/router.tsx` y usa:

- `createBrowserRouter`
- `lazy()` para code splitting por ruta
- `ProtectedRoute`
- `RequireRole`

### Data fetching

Patrón principal:

1. `api/` llama al endpoint
2. `adapters/` transforma el payload si hace falta
3. `hooks/` expone queries o mutations
4. `pages/components` consumen el hook

### Client state

Se usa `Zustand` para estado cliente acotado:

- autenticación
- empresa activa

No se usa como reemplazo de TanStack Query.

### Server state

`TanStack Query` es la fuente de verdad para:

- fetch
- cache
- revalidación
- invalidaciones de mutaciones

## Auth model

La autenticación usa un esquema dual:

- `accessToken`: memoria solamente
- `refreshToken`: persistido por Zustand

Esto tiene una consecuencia práctica importante:

- los tests e2e y ciertos flujos deben preferir navegación SPA luego del login cuando sea posible
- en reload completo, la app depende del refresh silencioso para reconstruir sesión

## Styling model

El proyecto usa:

- Tailwind CSS 4
- variables CSS en `index.css`
- componentes UI compartidos en `src/shared/ui`

Patrones fuertes:

- `PageHeader` para cabeceras de páginas
- `Alert` para mensajes semánticos
- `EmptyState` para estados vacíos
- `Button`, `Input`, `Modal`, `Spinner`, `Skeleton`

Además existe un sistema semántico global de tonos para:

- alerts
- badges
- chips
- summary cards

centralizado en `src/shared/ui/semanticTones.ts`.

## Mock architecture

MSW es parte estructural del repo, no un accesorio.

Se usa para:

- desarrollo sin backend
- demo deploy
- tests de integración/e2e

La fuente principal de estado mock es `mockDb.ts`.

Cuando agregues una feature nueva, si necesitás mantener la demo funcional, normalmente hay que tocar:

- handlers
- dataset
- tests

## What to preserve when extending the codebase

### Prefer

- lógica de dominio en la feature correspondiente
- hooks pequeños y específicos
- adapters explícitos cuando el backend lo justifique
- query keys centralizadas
- UI shared cuando el patrón ya exista

### Avoid

- meter fetch ad-hoc directo en páginas
- duplicar estilos semánticos por componente
- crear “utils globales” que en realidad pertenecen a una feature
- mover lógica de dominio a `shared` por comodidad

## Suggested checklist for new features

Al agregar una feature nueva:

1. Crear carpeta dentro de `src/features/<feature>`
2. Definir tipos del dominio
3. Crear `api/` y `hooks/`
4. Agregar adapters si el payload no es trivial
5. Reutilizar `shared/ui` antes de crear UI paralela
6. Agregar tests unitarios/integración
7. Agregar e2e si el flujo es crítico
8. Documentar ruta/alcance si cambia el mapa del producto
