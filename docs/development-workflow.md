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

## Manual maintenance

La feature pública `manual` debe mantenerse alineada con la aplicación real, pero sin volverse frágil frente a microcambios de copy.

### Editorial criterion

Usar el siguiente criterio editorial:

- máxima precisión respecto de la UI vigente
- redacción durable cuando un label exacto no aporta valor extra

En la práctica:

- usar labels exactos para:
  - nombres de vistas
  - botones principales
  - secciones de navegación
  - descargas
  - modales o acciones clave del flujo
- evitar anclar el texto a microcopys secundarios si el flujo puede explicarse mejor de forma estable
- preferir describir la intención del paso cuando el detalle visual puede cambiar sin afectar la tarea

### When to update the manual

Si cambia cualquiera de estos puntos, revisar el manual:

- nombre de una vista, botón o sección usada en un flujo documentado
- orden de pasos de un flujo principal
- rutas visibles o navegación de primer nivel
- tipo de descarga disponible
- restricciones funcionales o permisos por rol
- modales o formularios centrales del flujo

### Screenshot rule

Si cambia una vista documentada:

- revisar el texto del flujo afectado en `src/features/manual/data/manual.json`
- revisar también las screenshots del flujo afectado
- regenerar la captura si la imagen dejó de representar con precisión la UI actual

### Screenshot generation

El pipeline actual del manual genera capturas reales y las guarda solo en `webp`.

Comando:

```bash
pnpm manual:screenshots
```

Supuestos:

- la app debe estar levantada localmente
- por defecto el script usa `http://localhost:3000`
- si hace falta otro host, usar `BASE_URL=...`
- el script es genérico: no depende de usuarios o empresas hardcodeados del repo
- para correrlo contra un backend real, toda la configuración necesaria debe inyectarse por variables de entorno

Variables requeridas:

- `MANUAL_API_BASE_URL`
- `MANUAL_TEACHER_USERNAME`
- `MANUAL_TEACHER_PASSWORD`
- `MANUAL_STUDENT_USERNAME`
- `MANUAL_STUDENT_PASSWORD`
- `MANUAL_STUDENT_OPERATIONAL_COMPANIES`
- `MANUAL_STUDENT_PENDING_COMPANIES`
- `MANUAL_STUDENT_BOOKS_COMPANIES`
- `MANUAL_STUDENT_CLOSING_COMPANIES`
- `MANUAL_TEACHER_COURSE_NAMES`
- `MANUAL_COURSE_DEMO_COMPANIES`
- `MANUAL_COURSE_SHARED_COMPANIES`
- `MANUAL_ENROLLABLE_STUDENT_QUERY`

Reglas de formato:

- las variables de compañías y cursos aceptan una lista separada por comas
- el script usa el primer match visible en la UI
- si falta alguna variable requerida, falla temprano con mensaje explícito

Ejemplo:

```bash
BASE_URL=http://localhost:3000 \
  MANUAL_API_BASE_URL=http://localhost:8000/api/v1 \
  MANUAL_TEACHER_USERNAME=mi_docente \
  MANUAL_TEACHER_PASSWORD=secret \
  MANUAL_STUDENT_USERNAME=mi_alumno \
  MANUAL_STUDENT_PASSWORD=secret \
  MANUAL_STUDENT_OPERATIONAL_COMPANIES="Empresa Operativa" \
  MANUAL_STUDENT_PENDING_COMPANIES="Empresa Sin Apertura" \
  MANUAL_STUDENT_BOOKS_COMPANIES="Empresa Operativa,Demo Publicada" \
  MANUAL_STUDENT_CLOSING_COMPANIES="Empresa Operativa" \
  MANUAL_TEACHER_COURSE_NAMES="Curso Principal" \
  MANUAL_COURSE_DEMO_COMPANIES="Demo Publicada" \
  MANUAL_COURSE_SHARED_COMPANIES="Empresa Compartida" \
  MANUAL_ENROLLABLE_STUDENT_QUERY=alumno_disponible \
  pnpm manual:screenshots
```

Decisiones de implementación:

- formato final: `webp`
- ancho máximo de salida: `1200px`
- viewport de captura: `1440x960`
- compresión orientada a mantener buena legibilidad sin inflar el repo

### Suggested review checklist

Antes de dar por actualizado un flujo del manual, confirmar:

- la vista existe con ese nombre
- el botón o CTA principal coincide
- el orden de pasos sigue siendo válido
- la descarga, si existe, coincide con el formato real
- el texto no mezcla teoría con una UI que ya no existe
- la screenshot acompaña el estado real del producto
