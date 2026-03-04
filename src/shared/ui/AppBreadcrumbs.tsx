import { Link, useLocation } from 'react-router'

interface Crumb {
  label: string
  to?: string
}

const segmentLabels: Record<string, string> = {
  companies: 'Empresas',
  profile: 'Perfil',
  reports: 'Libros',
  'journal-book': 'Libro Diario',
  ledger: 'Libro Mayor',
  'trial-balance': 'Balance de comprobacion',
  teacher: 'Docencia',
  dashboard: 'Panel docente',
  students: 'Alumno',
  settings: 'Configuracion',
  'chart-visibility': 'Plan de cuentas',
  admin: 'Administracion',
  roles: 'Roles',
}

const routableStaticPaths = new Set([
  '/',
  '/companies',
  '/profile',
  '/reports/journal-book',
  '/reports/ledger',
  '/reports/trial-balance',
  '/teacher/dashboard',
  '/settings/chart-visibility',
  '/admin/roles',
])

function isRoutablePath(path: string): boolean {
  if (routableStaticPaths.has(path)) return true
  if (/^\/companies\/\d+$/.test(path)) return true
  if (/^\/teacher\/students\/\d+$/.test(path)) return true
  return false
}

function normalizeCrumbTarget(path: string): string | undefined {
  // Parent segments without dedicated routes should point to a valid landing route.
  if (path === '/teacher') return '/teacher/dashboard'
  if (path === '/settings') return '/settings/chart-visibility'
  if (path === '/admin') return '/admin/roles'

  return isRoutablePath(path) ? path : undefined
}

function buildCrumbs(pathname: string): Crumb[] {
  if (pathname === '/') return [{ label: 'Asientos' }]

  const segments = pathname.split('/').filter(Boolean)
  const crumbs: Crumb[] = []
  let currentPath = ''

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`

    const isNumeric = /^\d+$/.test(segment)
    const prev = segments[index - 1]

    let label = segmentLabels[segment]
    if (!label && isNumeric && prev === 'companies') label = 'Detalle empresa'
    if (!label && isNumeric && prev === 'students') label = `Alumno #${segment}`
    if (!label) label = segment

    const isLast = index === segments.length - 1
    const target = isLast ? undefined : normalizeCrumbTarget(currentPath)
    crumbs.push({ label, to: target })
  })

  return crumbs
}

export function AppBreadcrumbs() {
  const { pathname } = useLocation()
  const crumbs = buildCrumbs(pathname)

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="glass-panel inline-flex flex-wrap items-center gap-1 rounded-full px-2 py-1 text-xs text-[var(--text-muted)]">
        {crumbs.map((crumb, index) => (
          <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
            {crumb.to ? (
              <Link to={crumb.to} className="rounded px-1 py-0.5 hover:bg-[var(--bg-subtle)]">
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-semibold text-[var(--text-strong)]">
                {crumb.label}
              </span>
            )}
            {index < crumbs.length - 1 && <span aria-hidden="true">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}
