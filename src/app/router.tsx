import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { createBrowserRouter } from 'react-router'
import { Layout } from '@/app/components/Layout'
import { PageLoader } from '@/app/components/PageLoader'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'

// ── Lazy-loaded pages — enables code splitting per route ──────────────────────

const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })))

const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage }))
)

const ItemsPage = lazy(() =>
  import('@/features/items/pages/ItemsPage').then((m) => ({ default: m.ItemsPage }))
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
        element: page(<HomePage />),
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
            path: 'items',
            element: page(<ItemsPage />),
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
