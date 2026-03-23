# Development Workflow

## Purpose

Este documento resume cómo trabajar en el repo de forma consistente con las convenciones ya establecidas.

## Local setup

### Requirements

- `Node >= 20`
- `pnpm >= 9`

### Install

```bash
pnpm install
```

### Run

```bash
pnpm dev
```

La aplicación queda disponible en `http://localhost:3000`.

## Default runtime mode

Por defecto el proyecto corre sobre MSW:

- `VITE_USE_MOCK_API=true`
- `VITE_MOCK_SCENARIO=demo`

Eso permite:

- desarrollo desacoplado de backend
- demos completas
- e2e consistentes

## Coding conventions

### General

- TypeScript estricto
- imports vía alias `@/`
- preferencia por `type imports`
- evitar `any`
- evitar lógica de negocio en componentes visuales

### Components

- reutilizar `shared/ui` antes de crear componentes paralelos
- usar `PageHeader` para páginas
- usar `Alert` y `EmptyState` para mensajes/estados
- usar tonos semánticos globales cuando el estado lo amerite

### Data access

- no hacer requests inline en páginas si ya existe un patrón de `api + hook`
- centralizar query keys
- invalidar queries de manera explícita y acotada

### State

- Zustand solo para estado cliente de larga vida o transversal
- TanStack Query para estado remoto

## How to add or change a feature

### Step 1: locate the owning feature

Antes de crear archivos nuevos, identificar si el cambio pertenece a:

- una feature existente
- `shared`
- `app`

En general:

- si conoce backend o reglas de negocio de un dominio, va en `features/<domain>`
- si es reusable y agnóstico, va en `shared`

### Step 2: follow the feature pattern

Si el cambio toca datos:

1. `types`
2. `api`
3. `adapters` si hace falta
4. `hooks`
5. `components/pages`
6. tests

### Step 3: keep demo parity

Si la feature necesita datos nuevos y el repo debe seguir andando sin backend, actualizar:

- handlers MSW
- `mockDb.ts`
- tests que cubran el comportamiento

### Step 4: validate

Antes de cerrar el cambio:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
```

## UI / design conventions

La UI actual prioriza:

- consistencia de componentes compartidos
- mensajes y badges semánticos globales
- misma jerarquía visual entre features comparables
- layouts responsivos pensados para desktop y mobile

Cuando agregues una pantalla:

- usar los tokens y clases existentes
- no duplicar estilos de badges, alerts o botones
- verificar si ya existe un patrón equivalente en otra feature

## Mock-first development guidance

Si el backend todavía no está listo:

1. definir contrato esperado
2. modelarlo en MSW
3. implementar hooks/feature
4. cubrirlo con tests

Esto ya es un patrón real del repo y no una excepción.

## Git and delivery

El repo usa:

- Conventional Commits
- commitlint
- husky
- semantic-release

Conviene mantener commits temáticos y relativamente acotados.

## What usually breaks when refactoring

Áreas donde conviene ser especialmente cuidadoso:

- navegación autenticada y rehidratación de sesión
- invalidaciones de React Query
- selector de empresa activa
- modo solo lectura vs writable por viewer
- coherencia entre UI real, MSW y e2e

## Maintenance guideline

Si una mejora visual o funcional afecta varios módulos:

- extraer primero el patrón compartido
- migrar después los consumidores

Evitar:

- soluciones locales repetidas
- overrides CSS por pantalla cuando el patrón debería ser global
- duplicar lógica entre features que ya comparten flujo
