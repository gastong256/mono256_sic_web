import type { SVGProps } from 'react'

interface ManualIconProps extends SVGProps<SVGSVGElement> {
  name: string
}

export function ManualIcon({ name, className = 'size-4', ...props }: ManualIconProps) {
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
    case 'Building2':
      return (
        <svg {...common}>
          <path d="M4 16V5.5L10 3l6 2.5V16" />
          <path d="M7 7.5h.01M10 7.5h.01M13 7.5h.01M7 10.5h.01M10 10.5h.01M13 10.5h.01M8.5 16v-3h3v3" />
        </svg>
      )
    case 'ListTree':
      return (
        <svg {...common}>
          <path d="M6 4.5v11M6 7h4M6 12h4M10 7h4M10 12h4" />
          <circle cx="4.5" cy="4.5" r="1" />
          <circle cx="4.5" cy="7" r="1" />
          <circle cx="4.5" cy="12" r="1" />
          <circle cx="14.5" cy="7" r="1" />
          <circle cx="14.5" cy="12" r="1" />
        </svg>
      )
    case 'PenLine':
      return (
        <svg {...common}>
          <path d="M4 15.5 6.5 15l7.8-7.8a1.8 1.8 0 0 0-2.5-2.5L4 12.5l-.5 3Z" />
          <path d="M10.8 5.2 14.8 9.2M4.5 4h11" />
        </svg>
      )
    case 'BookOpen':
      return (
        <svg {...common}>
          <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H16v14H6.5A2.5 2.5 0 0 0 4 18V4.5Z" />
          <path d="M10 4v12" />
        </svg>
      )
    case 'CheckCircle':
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="6.5" />
          <path d="m7.2 10.2 1.9 1.9 3.7-4.1" />
        </svg>
      )
    case 'Users':
      return (
        <svg {...common}>
          <path d="M6.5 8a2.5 2.5 0 1 0 0-.01ZM13.5 8a2.5 2.5 0 1 0 0-.01ZM3.5 16c.7-2.1 2.3-3.2 4.5-3.2 1 0 1.9.2 2.7.6M10 13.4c.8-.4 1.7-.6 2.7-.6 2.2 0 3.8 1.1 4.5 3.2" />
        </svg>
      )
    case 'Settings':
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="2.5" />
          <path d="M10 4.2v1.3M10 14.5v1.3M15.8 10h-1.3M5.5 10H4.2M14.1 5.9l-.9.9M6.8 13.2l-.9.9M14.1 14.1l-.9-.9M6.8 6.8l-.9-.9" />
        </svg>
      )
    case 'GraduationCap':
      return (
        <svg {...common}>
          <path d="m3 8.5 7-4 7 4-7 4-7-4Z" />
          <path d="M6.5 10.5V13c0 1.2 1.8 2.2 3.5 2.2S13.5 14.2 13.5 13v-2.5" />
        </svg>
      )
    case 'Clock':
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="6.5" />
          <path d="M10 6.7v3.7l2.4 1.4" />
        </svg>
      )
    case 'Search':
      return (
        <svg {...common}>
          <circle cx="8.5" cy="8.5" r="4.5" />
          <path d="m12 12 4 4" />
        </svg>
      )
    case 'ChevronDown':
      return (
        <svg {...common}>
          <path d="m5 7 5 6 5-6" />
        </svg>
      )
    case 'ChevronRight':
      return (
        <svg {...common}>
          <path d="m8 5 4 5-4 5" />
        </svg>
      )
    case 'Lightbulb':
      return (
        <svg {...common}>
          <path d="M7.5 13.5h5M8.4 16h3.2M10 3.5A4.5 4.5 0 0 0 7 11.3c.6.5 1 1.3 1 2.2h4c0-.9.4-1.7 1-2.2A4.5 4.5 0 0 0 10 3.5Z" />
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
