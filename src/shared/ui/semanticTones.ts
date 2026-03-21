export type SemanticTone =
  | 'neutral'
  | 'info'
  | 'warning'
  | 'error'
  | 'success'
  | 'gain'
  | 'loss'
  | 'open'
  | 'closed'
  | 'current'
  | 'visible'
  | 'hidden'
  | 'published'
  | 'unpublished'
  | 'demo'
  | 'readonly'

type SemanticToneConfig = {
  toneClassName: string
  alert: string
}

const semanticToneConfig: Record<SemanticTone, SemanticToneConfig> = {
  neutral: {
    toneClassName: 'tone-neutral',
    alert: 'border-[var(--border-soft)] bg-[var(--bg-subtle)] text-[var(--text-strong)]',
  },
  info: {
    toneClassName: 'tone-info',
    alert: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  warning: {
    toneClassName: 'tone-warning',
    alert: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  error: {
    toneClassName: 'tone-error',
    alert: 'border-red-200 bg-red-50 text-[var(--danger-600)]',
  },
  success: {
    toneClassName: 'tone-success',
    alert: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  gain: {
    toneClassName: 'tone-gain',
    alert: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  loss: {
    toneClassName: 'tone-loss',
    alert: 'border-rose-200 bg-rose-50 text-rose-700',
  },
  open: {
    toneClassName: 'tone-open',
    alert: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  },
  closed: {
    toneClassName: 'tone-closed',
    alert: 'border-slate-200 bg-slate-50 text-slate-700',
  },
  current: {
    toneClassName: 'tone-current',
    alert: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  visible: {
    toneClassName: 'tone-visible',
    alert: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  hidden: {
    toneClassName: 'tone-hidden',
    alert: 'border-slate-200 bg-slate-50 text-slate-700',
  },
  published: {
    toneClassName: 'tone-published',
    alert: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  unpublished: {
    toneClassName: 'tone-unpublished',
    alert: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  demo: {
    toneClassName: 'tone-demo',
    alert: 'border-violet-200 bg-violet-50 text-violet-700',
  },
  readonly: {
    toneClassName: 'tone-readonly',
    alert: 'border-amber-200 bg-amber-50 text-amber-700',
  },
}

export type AlertSemanticTone = 'info' | 'warning' | 'error' | 'success'

type LogicalExerciseStatusLike = 'open' | 'closed'
type ClosingNetResultKindLike = 'gain' | 'loss' | 'neutral'
type ClosingAdjustmentStatusLike = 'not_requested' | 'balanced' | 'shortage' | 'surplus'

export function getSemanticBadgeClassName(tone: SemanticTone = 'neutral'): string {
  return ['status-badge', semanticToneConfig[tone].toneClassName].join(' ')
}

export function getSemanticChipClassName(tone: SemanticTone = 'neutral'): string {
  return ['metric-chip', semanticToneConfig[tone].toneClassName].join(' ')
}

export function getSemanticAlertClassName(tone: AlertSemanticTone): string {
  return semanticToneConfig[tone].alert
}

export function getSemanticCardClassName(tone: SemanticTone = 'neutral'): string {
  return semanticToneConfig[tone].toneClassName
}

export function getExerciseSemanticTone(
  status: LogicalExerciseStatusLike,
  isCurrent = false
): SemanticTone {
  if (isCurrent) return 'current'
  return status === 'closed' ? 'closed' : 'open'
}

export function getNetResultSemanticTone(kind: ClosingNetResultKindLike): SemanticTone {
  if (kind === 'gain') return 'gain'
  if (kind === 'loss') return 'loss'
  return 'neutral'
}

export function getAdjustmentStatusSemanticTone(status: ClosingAdjustmentStatusLike): SemanticTone {
  switch (status) {
    case 'balanced':
      return 'success'
    case 'shortage':
      return 'warning'
    case 'surplus':
      return 'info'
    default:
      return 'neutral'
  }
}
