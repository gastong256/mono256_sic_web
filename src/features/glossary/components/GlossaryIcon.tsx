import type { SVGProps } from 'react'

interface GlossaryIconProps extends SVGProps<SVGSVGElement> {
  name: string
}

export function GlossaryIcon({ name, className = 'size-4', ...props }: GlossaryIconProps) {
  const common = {
    className,
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  }

  switch (name) {
    case 'Monitor':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="14" height="9" rx="1.8" />
          <path d="M8 16h4M10 13v3" />
        </svg>
      )
    case 'Building2':
      return (
        <svg {...common}>
          <path d="M4 16V5.5L10 3l6 2.5V16" />
          <path d="M7 7.5h.01M10 7.5h.01M13 7.5h.01M7 10.5h.01M10 10.5h.01M13 10.5h.01M8.5 16v-3h3v3" />
        </svg>
      )
    case 'FileText':
      return (
        <svg {...common}>
          <path d="M6 3.5h5l3 3V16H6z" />
          <path d="M11 3.5V7h3M8 10h4M8 12.8h4" />
        </svg>
      )
    case 'CreditCard':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="14" height="10" rx="2" />
          <path d="M3 8.5h14M6 12h3" />
        </svg>
      )
    case 'Scale':
      return (
        <svg {...common}>
          <path d="M10 4v11M6 6.5h8M5.5 6.5 3.8 9.5h3.4L5.5 6.5Zm9 0-1.7 3h3.4l-1.7-3ZM7 16h6" />
        </svg>
      )
    case 'BookOpen':
      return (
        <svg {...common}>
          <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H16v14H6.5A2.5 2.5 0 0 0 4 18V4.5Z" />
          <path d="M10 4v12" />
        </svg>
      )
    case 'GitBranch':
      return (
        <svg {...common}>
          <path d="M7 4.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm9 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM5.5 6v4a4 4 0 0 0 4 4h3.5M14.5 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM13 8v2" />
        </svg>
      )
    case 'Library':
      return (
        <svg {...common}>
          <path d="M4.5 16V6.5M8 16V4.5M11.5 16V6M15 16V5M3 16h14" />
        </svg>
      )
    case 'Receipt':
      return (
        <svg {...common}>
          <path d="M6 3.5h8v13l-2-1-2 1-2-1-2 1z" />
          <path d="M8 7.5h4M8 10h4" />
        </svg>
      )
    case 'Users':
      return (
        <svg {...common}>
          <path d="M6.5 8a2.5 2.5 0 1 0 0-.01ZM13.5 8a2.5 2.5 0 1 0 0-.01ZM3.5 16c.7-2.1 2.3-3.2 4.5-3.2 1 0 1.9.2 2.7.6M10 13.4c.8-.4 1.7-.6 2.7-.6 2.2 0 3.8 1.1 4.5 3.2" />
        </svg>
      )
    case 'BarChart3':
      return (
        <svg {...common}>
          <path d="M4 16V9M10 16V5M16 16v-7M3 16h14" />
        </svg>
      )
    case 'Search':
      return (
        <svg {...common}>
          <circle cx="8.5" cy="8.5" r="4.5" />
          <path d="m12 12 4 4" />
        </svg>
      )
    case 'X':
      return (
        <svg {...common}>
          <path d="m5 5 10 10M15 5 5 15" />
        </svg>
      )
    case 'ChevronRight':
      return (
        <svg {...common}>
          <path d="m8 5 4 5-4 5" />
        </svg>
      )
    case 'ChevronDown':
      return (
        <svg {...common}>
          <path d="m5 7 5 6 5-6" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="6" />
        </svg>
      )
  }
}
