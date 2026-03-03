import type { SVGProps } from 'react'

export type AppIconName =
  | 'companies'
  | 'journal'
  | 'book'
  | 'ledger'
  | 'balance'
  | 'teacher'
  | 'student'
  | 'settings'
  | 'admin'
  | 'profile'

interface AppIconProps extends SVGProps<SVGSVGElement> {
  name: AppIconName
}

export function AppIcon({ name, className = 'size-4', ...props }: AppIconProps) {
  const common = {
    className,
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    ...props,
  }

  switch (name) {
    case 'companies':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="14" height="12" rx="2" />
          <path d="M7 8h6M7 11h6M7 14h3" />
        </svg>
      )
    case 'journal':
      return (
        <svg {...common}>
          <path d="M5 3.5h10a1.5 1.5 0 0 1 1.5 1.5v11.5L13 14.8 9.5 16.5 6 14.8 3.5 16.5V5A1.5 1.5 0 0 1 5 3.5Z" />
          <path d="M7 7h6M7 10h6" />
        </svg>
      )
    case 'book':
      return (
        <svg {...common}>
          <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H16v14H6.5A2.5 2.5 0 0 0 4 18V4.5Z" />
          <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H16" />
        </svg>
      )
    case 'ledger':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="14" height="14" rx="2" />
          <path d="M3 8h14M8 3v14" />
        </svg>
      )
    case 'balance':
      return (
        <svg {...common}>
          <path d="M10 4v11" />
          <path d="M4 7h12" />
          <path d="M6 7 4.2 10h3.6L6 7Zm8 0-1.8 3h3.6L14 7Z" />
        </svg>
      )
    case 'teacher':
      return (
        <svg {...common}>
          <path d="m3 8.5 7-4 7 4-7 4-7-4Z" />
          <path d="M6.5 10.5V13c0 1.2 1.8 2.2 3.5 2.2S13.5 14.2 13.5 13v-2.5" />
        </svg>
      )
    case 'student':
      return (
        <svg {...common}>
          <circle cx="10" cy="7" r="3" />
          <path d="M4 17c1.5-2.4 3.5-3.5 6-3.5s4.5 1.1 6 3.5" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="2.5" />
          <path d="M10 4.2v1.3M10 14.5v1.3M15.8 10h-1.3M5.5 10H4.2M14.1 5.9l-.9.9M6.8 13.2l-.9.9M14.1 14.1l-.9-.9M6.8 6.8l-.9-.9" />
        </svg>
      )
    case 'admin':
      return (
        <svg {...common}>
          <path d="M10 3.5 15.5 6v4.2c0 3.2-2.3 5.5-5.5 6.3-3.2-.8-5.5-3.1-5.5-6.3V6L10 3.5Z" />
          <path d="M7.8 9.9 9.4 11.5l2.8-2.8" />
        </svg>
      )
    case 'profile':
      return (
        <svg {...common}>
          <circle cx="10" cy="7" r="3" />
          <rect x="4" y="12" width="12" height="5" rx="2.5" />
        </svg>
      )
  }
}
