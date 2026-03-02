# __PROJECT_NAME__

> __DESCRIPTION__

A production-ready React application bootstrapped from [react-vite-ts-tailwind-base](https://github.com/__OWNER__/react-vite-ts-tailwind-base).

---

## Stack

| Layer | Technology |
|---|---|
| UI | React 19 |
| Build | Vite 6 |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 (CSS-first) |
| Routing | React Router 7 |
| State | Zustand 5 |
| Server state | TanStack Query 5 |
| Forms | React Hook Form + Zod |
| HTTP | Axios (via `shared/lib/http`) |
| Mocking | MSW v2 |
| Unit tests | Vitest + React Testing Library |
| E2E tests | Playwright |
| Linting | ESLint v9 flat config |
| Formatting | Prettier |
| Commits | Conventional Commits + commitlint |
| Releases | semantic-release |

---

## Getting Started

### Prerequisites

- **Node.js 20 LTS** (`nvm use` — uses `.nvmrc`)
- **pnpm 9+** (`npm i -g pnpm`)

### 1. Initialize the template

```bash
pnpm run init
```

This replaces all `__PLACEHOLDER__` values with your project-specific values and copies `.env.example` to `.env`.

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

> By default, `VITE_USE_MOCK_API=true` — the app runs entirely against MSW mocks. No backend required.

---

## Environment Variables

Copy `.env.example` to `.env` (done automatically by `pnpm run init`):

| Variable | Default | Description |
|---|---|---|
| `VITE_APP_NAME` | `__PROJECT_NAME__` | Application display name |
| `VITE_API_BASE_URL` | `__API_BASE_URL__` | Real backend base URL |
| `VITE_USE_MOCK_API` | `true` | Use MSW mocks instead of real API |
| `VITE_SENTRY_ENABLED` | `false` | Enable Sentry error tracking |
| `VITE_SENTRY_DSN` | — | Sentry DSN (required if enabled) |

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server (port 3000) |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Run ESLint with auto-fix |
| `pnpm typecheck` | TypeScript type-check |
| `pnpm test` | Run unit tests (single run) |
| `pnpm test:watch` | Run unit tests in watch mode |
| `pnpm test:coverage` | Run unit tests with coverage |
| `pnpm test:e2e` | Run Playwright e2e tests |
| `pnpm test:e2e:ui` | Run Playwright in interactive mode |
| `pnpm format` | Format all files with Prettier |
| `pnpm format:check` | Check formatting |
| `pnpm init` | Initialize template (idempotent) |

---

## Architecture

```
src/
├── app/                   # App wiring only (providers, router)
│   ├── App.tsx
│   ├── router.tsx
│   └── providers/
├── shared/                # Cross-cutting, feature-agnostic code
│   ├── config/env.ts      # Typed env config (Zod-parsed)
│   ├── lib/
│   │   ├── http.ts        # Axios instance (only HTTP entrypoint)
│   │   ├── logger.ts      # Structured logger
│   │   ├── tracing.ts     # Request ID generation
│   │   └── sentry.ts      # Sentry integration
│   ├── ui/                # Shared UI components
│   └── types/             # Global TypeScript types
├── features/              # Feature modules (self-contained)
│   ├── auth/              # Authentication (login, tokens, store)
│   └── items/             # Example CRUD feature
├── pages/                 # Route-level page components
└── mocks/                 # MSW handlers (dev only)
    ├── browser.ts
    ├── server.ts
    └── handlers/
```

### Import rules

```
app      → features, shared
features → shared
pages    → features, shared
shared   → (nothing internal)
```

`shared` must never import from `features`. Enforced by convention and ESLint.

---

## Authentication

The auth flow uses a dual-token model:

- **Access token** — stored in Zustand (memory only, never persisted)
- **Refresh token** — stored in `localStorage` (template purpose; use `HttpOnly` cookie in production)

The Axios interceptor (`shared/lib/http.ts`) automatically:

1. Attaches `Authorization: Bearer <token>` header
2. Attaches `X-Request-ID` header (session-scoped UUID)
3. On `401` — attempts a single token refresh
4. Queues concurrent requests while refreshing
5. Retries queued requests after a successful refresh
6. Logs out and redirects to `/login` on refresh failure

### Routes

| Path | Access |
|---|---|
| `/` | Public |
| `/login` | Public (redirects to `/` if authenticated) |
| `/items` | Protected |
| `/profile` | Protected |

---

## Mock API

MSW handlers are located in `src/mocks/handlers/`. Active when `VITE_USE_MOCK_API=true`.

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Returns access + refresh tokens |
| `POST` | `/auth/refresh` | Refreshes tokens |
| `GET` | `/me` | Returns current user |
| `GET` | `/items` | Returns list of items |
| `POST` | `/items` | Creates a new item |

**Default credentials (mock):** `user@example.com` / `password`

---

## Observability

- Every session generates a unique `request_id` (UUID v4) via `shared/lib/tracing.ts`
- All HTTP requests carry `X-Request-ID: <request_id>`
- All log messages include the `request_id`
- The `ErrorBoundary` displays the `request_id` to aid support/debugging
- Sentry is initialized but **disabled by default** (`VITE_SENTRY_ENABLED=false`)

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit using Conventional Commits: `git commit -m "feat: add my feature"`
4. Push and open a PR

All commits are linted by `commitlint`. The `pre-commit` hook runs `lint-staged`.

---

## License

MIT © __OWNER__
