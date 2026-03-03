import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { createBrowserRouter } from 'react-router'
import { Layout } from '@/app/components/Layout'
import { PageLoader } from '@/app/components/PageLoader'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'

// ── Lazy-loaded pages — enables code splitting per route ──────────────────────

const JournalPage = lazy(() =>
  import('@/features/journal/pages/JournalPage').then((m) => ({ default: m.JournalPage }))
)

const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage }))
)

const ProfilePage = lazy(() =>
  import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
)

const CompaniesPage = lazy(() =>
  import('@/features/companies/pages/CompaniesPage').then((m) => ({ default: m.CompaniesPage }))
)

const CompanyDetailPage = lazy(() =>
  import('@/features/accounts/pages/CompanyDetailPage').then((m) => ({
    default: m.CompanyDetailPage,
  }))
)

const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
)

// ── Page wrapper with Suspense ────────────────────────────────────────────────

function page(element: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>
}

// ── Router definition ─────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      // ── Public routes ──────────────────────────────────────
      {
        index: true,
        element: page(<JournalPage />),
      },
      {
        path: 'login',
        element: page(<LoginPage />),
      },

      // ── Protected routes — wrapped by ProtectedRoute ───────
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'companies',
            element: page(<CompaniesPage />),
          },
          {
            path: 'companies/:companyId',
            element: page(<CompanyDetailPage />),
          },
          {
            path: 'profile',
            element: page(<ProfilePage />),
          },
        ],
      },
    ],
  },

  // ── 404 — outside Layout (full-screen) ────────────────────
  {
    path: '*',
    element: page(<NotFoundPage />),
  },
])
