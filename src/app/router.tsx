import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { createBrowserRouter } from 'react-router'
import { Layout } from '@/app/components/Layout'
import { PageLoader } from '@/app/components/PageLoader'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { RequireRole } from '@/features/auth/components/RequireRole'

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
const TeacherDashboardPage = lazy(() =>
  import('@/features/teacher/pages/TeacherDashboardPage').then((m) => ({
    default: m.TeacherDashboardPage,
  }))
)
const TeacherStudentDetailPage = lazy(() =>
  import('@/features/teacher/pages/TeacherStudentDetailPage').then((m) => ({
    default: m.TeacherStudentDetailPage,
  }))
)
const AccountChartVisibilityPage = lazy(() =>
  import('@/features/settings/pages/AccountChartVisibilityPage').then((m) => ({
    default: m.AccountChartVisibilityPage,
  }))
)
const AdminRolesPage = lazy(() =>
  import('@/features/admin/pages/AdminRolesPage').then((m) => ({ default: m.AdminRolesPage }))
)
const JournalBookReportPage = lazy(() =>
  import('@/features/reports/pages/JournalBookReportPage').then((m) => ({
    default: m.JournalBookReportPage,
  }))
)
const LedgerReportPage = lazy(() =>
  import('@/features/reports/pages/LedgerReportPage').then((m) => ({
    default: m.LedgerReportPage,
  }))
)
const TrialBalanceReportPage = lazy(() =>
  import('@/features/reports/pages/TrialBalanceReportPage').then((m) => ({
    default: m.TrialBalanceReportPage,
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
          {
            path: 'reports/journal-book',
            element: page(<JournalBookReportPage />),
          },
          {
            path: 'reports/ledger',
            element: page(<LedgerReportPage />),
          },
          {
            path: 'reports/trial-balance',
            element: page(<TrialBalanceReportPage />),
          },
          {
            element: <RequireRole roles={['teacher', 'admin']} />,
            children: [
              {
                path: 'teacher/dashboard',
                element: page(<TeacherDashboardPage />),
              },
              {
                path: 'teacher/students/:studentId',
                element: page(<TeacherStudentDetailPage />),
              },
              {
                path: 'settings/chart-visibility',
                element: page(<AccountChartVisibilityPage />),
              },
            ],
          },
          {
            element: <RequireRole roles={['admin']} />,
            children: [
              {
                path: 'admin/roles',
                element: page(<AdminRolesPage />),
              },
            ],
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
