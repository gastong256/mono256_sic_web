import type { CSSProperties } from 'react'
import { ManualIcon } from '@/features/manual/components/ManualIcon'
import type { ManualRole } from '@/features/manual/types/manual.types'

interface RoleBadgeProps {
  role: ManualRole
  size?: 'sm' | 'md'
}

const sizeClassNames: Record<NonNullable<RoleBadgeProps['size']>, string> = {
  sm: 'gap-1 px-2 py-0.5 text-[0.7rem]',
  md: 'gap-1.5 px-2.5 py-1 text-xs',
}

function getRoleStyle(color: string): CSSProperties {
  return {
    borderColor: `${color}33`,
    backgroundColor: `${color}14`,
    color,
  }
}

export function RoleBadge({ role, size = 'sm' }: RoleBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border font-semibold',
        sizeClassNames[size],
      ].join(' ')}
      style={getRoleStyle(role.color)}
    >
      <ManualIcon name={role.icon} className={size === 'sm' ? 'size-3.5' : 'size-4'} />
      <span>{role.label}</span>
    </span>
  )
}
