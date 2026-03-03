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
    crumbs.push({ label, to: isLast ? undefined : currentPath })
  })

  return crumbs
}

export function AppBreadcrumbs() {
  const { pathname } = useLocation()
  const crumbs = buildCrumbs(pathname)

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-[var(--text-muted)]">
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
