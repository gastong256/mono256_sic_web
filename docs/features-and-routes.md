# Features and Routes

## Purpose

Este documento resume qué hace cada feature, qué roles la usan y qué rutas la exponen.

## Roles

El sistema trabaja principalmente con tres roles efectivos:

- `student`
- `teacher`
- `admin`

Helpers relevantes:

- `resolveEffectiveRole`
- `hasRole`
- `canViewTeacherDashboard`
- `canManageRoles`

ubicados en [authorization.ts](/home/gastong256/projects/mono256_sic_web/src/shared/lib/authorization.ts).

## Public surfaces

| Ruta        | Feature          | Descripción                                                                                      |
| ----------- | ---------------- | ------------------------------------------------------------------------------------------------ |
| `/`         | `pages/HomePage` | Landing/Home contextual. Con sesión muestra actividad reciente; sin sesión invita a autenticarse |
| `/login`    | `auth`           | Inicio de sesión                                                                                 |
| `/register` | `auth`           | Registro                                                                                         |
| `/glosario` | `glossary`       | Glosario público                                                                                 |

## Authenticated surfaces

| Ruta                                                  | Feature                  | Roles | Descripción                           |
| ----------------------------------------------------- | ------------------------ | ----- | ------------------------------------- |
| `/companies`                                          | `companies`              | all   | Listado de empresas                   |
| `/companies/:companyId`                               | `accounts` + `companies` | all   | Detalle de empresa y plan de cuentas  |
| `/profile`                                            | `pages/ProfilePage`      | all   | Perfil                                |
| `/journal`                                            | `journal`                | all   | Registro manual                       |
| `/reports/journal-book`                               | `reports`                | all   | Libro Diario                          |
| `/reports/ledger`                                     | `reports`                | all   | Libro Mayor                           |
| `/reports/trial-balance`                              | `reports`                | all   | Balance de comprobación               |
| `/reports/closing`                                    | `reports` + `companies`  | all   | Balance General y Cierres             |
| `/reports/closing/latest-snapshot`                    | `companies`              | all   | Último cierre confirmado              |
| `/reports/closing/snapshots/:snapshotId`              | `companies`              | all   | Snapshot histórico                    |
| `/companies/:companyId/closing/latest-snapshot`       | `companies`              | all   | Ruta alternativa a snapshot latest    |
| `/companies/:companyId/closing/snapshots/:snapshotId` | `companies`              | all   | Ruta alternativa a snapshot histórico |

## Teacher / Admin surfaces

| Ruta                           | Feature    | Roles          | Descripción                                     |
| ------------------------------ | ---------- | -------------- | ----------------------------------------------- |
| `/teacher/dashboard`           | `teacher`  | teacher, admin | Cursos, enrolamientos, demos y shared companies |
| `/teacher/students/:studentId` | `teacher`  | teacher, admin | Supervisión de alumno                           |
| `/settings/chart-visibility`   | `settings` | teacher, admin | Visibilidad del plan de cuentas para alumnos    |

## Admin surfaces

| Ruta           | Feature | Roles | Descripción      |
| -------------- | ------- | ----- | ---------------- |
| `/admin/roles` | `admin` | admin | Gestión de roles |

## Feature map

### `auth`

Responsable de:

- login
- register
- `/auth/me`
- bootstrap autenticado
- profile update
- registration code
- logout

Puntos fuertes:

- `auth.store.ts`
- `useAuthenticatedBootstrap`
- `ProtectedRoute`
- `RequireRole`

### `companies`

Responsable de:

- listado de empresas
- creación/edición/baja
- selector de empresa activa
- publicación de demos
- logical exercises
- current balances
- preview/execute closing
- snapshots y descarga XLSX

### `accounts`

Responsable de:

- árbol de cuentas por empresa
- CRUD de cuentas
- detalle de empresa
- restricciones de edición según contexto de la empresa y permisos del viewer

### `journal`

Responsable de:

- consulta paginada de asientos
- creación manual
- reversión
- cards/listas de asientos
- actividad reciente

### `reports`

Responsable de:

- libro diario
- mayor
- balance de comprobación
- integración con ejercicios y snapshots
- exportación Excel

### `teacher`

Responsable de:

- dashboard docente
- crear curso
- enrolar alumnos
- ver detalle de alumno
- visibilidad de demos por curso
- shared companies por curso

### `settings`

Responsable de:

- visibilidad del plan de cuentas para alumnos de un docente

### `admin`

Responsable de:

- administración de roles

### `glossary`

Responsable de:

- glosario público
- búsqueda client-side
- filtros por categoría, dificultad e inicial

## Cross-feature behaviors worth knowing

### Empresa activa

La empresa activa se resuelve desde store + bootstrap y gobierna:

- Home
- Journal
- Reports
- Closing

No todas las rutas muestran el selector de empresa; eso es deliberado según contexto.

### Read-only vs writable

Hay una diferencia entre:

- `is_demo`
- `is_read_only`
- `viewer_can_write`

La capacidad real de edición visible para el usuario se deriva con helpers de `companyWriteAccess.ts`.

### Pending opening

Una empresa pendiente de apertura:

- bloquea operaciones contables
- restringe el árbol visible a lo permitido para apertura
- cambia los CTAs disponibles en journal y reportes

### Closings

El flujo de cierre cruza:

- `companies` para API/hooks
- `reports` para la vista consolidada de ejercicios
- `accounts/journal` por impacto posterior en snapshot y asientos generados
