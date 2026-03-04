import { useId } from 'react'

type BrandMarkVariant = 'horizontal' | 'compact' | 'icon'

interface BrandMarkProps {
  variant?: BrandMarkVariant
  className?: string
  decorative?: boolean
}

function Glyph({ gradientId }: { gradientId: string }) {
  return (
    <g>
      <rect
        x="6"
        y="6"
        width="52"
        height="52"
        rx="14"
        fill={`url(#${gradientId})`}
        opacity="0.16"
      />
      <rect x="12" y="12" width="40" height="40" rx="10" fill={`url(#${gradientId})`} />
      <path
        d="M23 40.5 31.4 22h2.9l8.7 18.5h-5.6l-1.7-3.8h-8.3l-1.6 3.8H23Zm6.3-7.7h4.8l-2.4-5.8-2.4 5.8Z"
        fill="white"
      />
      <path d="M42.2 42.7h-20" stroke="white" strokeOpacity="0.52" strokeWidth="1.8" />
    </g>
  )
}

export function BrandMark({
  variant = 'horizontal',
  className = '',
  decorative = true,
}: BrandMarkProps) {
  const gradientId = useId()

  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 64 64"
        className={['brand-mark-enter', className].join(' ')}
        role={decorative ? undefined : 'img'}
        aria-hidden={decorative ? 'true' : undefined}
        aria-label={decorative ? undefined : 'ASIENTA icon'}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--brand-500)" />
            <stop offset="100%" stopColor="var(--accent-500)" />
          </linearGradient>
        </defs>
        <Glyph gradientId={gradientId} />
      </svg>
    )
  }

  if (variant === 'compact') {
    return (
      <svg
        viewBox="0 0 222 52"
        className={['brand-mark-enter', className].join(' ')}
        role={decorative ? undefined : 'img'}
        aria-hidden={decorative ? 'true' : undefined}
        aria-label={decorative ? undefined : 'ASIENTA'}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--brand-500)" />
            <stop offset="100%" stopColor="var(--accent-500)" />
          </linearGradient>
        </defs>
        <g transform="translate(0,-1) scale(0.82)">
          <Glyph gradientId={gradientId} />
        </g>
        <text
          x="56"
          y="30"
          fill="var(--text-strong)"
          fontFamily="var(--font-display)"
          fontSize="23"
          fontWeight="700"
          letterSpacing="0.1em"
        >
          ASIENTA
        </text>
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 332 86"
      className={['brand-mark-enter', className].join(' ')}
      preserveAspectRatio="xMidYMid meet"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? 'true' : undefined}
      aria-label={decorative ? undefined : 'ASIENTA Sistema de Informacion Contable'}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--brand-500)" />
          <stop offset="100%" stopColor="var(--accent-500)" />
        </linearGradient>
      </defs>
      <g transform="translate(0,10)">
        <g transform="translate(-2,-2) scale(1.12)">
          <Glyph gradientId={gradientId} />
        </g>
        <text
          x="80"
          y="35"
          fill="var(--text-strong)"
          fontFamily="var(--font-display)"
          fontSize="31"
          fontWeight="700"
          letterSpacing="0.11em"
        >
          ASIENTA
        </text>
        <text
          x="80"
          y="56"
          fill="var(--text-muted)"
          fontFamily="var(--font-sans)"
          fontSize="10.8"
          fontWeight="600"
          letterSpacing="0.025em"
        >
          Sistema de Informacion Contable
        </text>
      </g>
    </svg>
  )
}
