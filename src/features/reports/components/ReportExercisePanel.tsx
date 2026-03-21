import { useEffect, useState } from 'react'
import type { LogicalExercise } from '@/features/companies/types/logicalExercises.types'
import type {
  ExerciseReportRange,
  RequestedReportRange,
  VisibleReportRange,
} from '@/features/reports/types/reports.types'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { getExerciseSemanticTone, getSemanticBadgeClassName } from '@/shared/ui/semanticTones'

function formatResolvedExerciseLine(
  activeExercise: LogicalExercise | null,
  exerciseRange: ExerciseReportRange | null
): string | null {
  if (!activeExercise && !exerciseRange) return null

  const exerciseLabel = activeExercise
    ? `Ejercicio ${activeExercise.exercise_index}`
    : 'Ejercicio resuelto'
  const dateFrom = exerciseRange?.date_from ?? activeExercise?.start_date ?? '—'
  const dateTo =
    exerciseRange?.date_to ??
    activeExercise?.closing_date ??
    (exerciseRange?.status ? 'abierto' : '—')
  const status =
    exerciseRange?.status === 'closed'
      ? 'Cerrado'
      : exerciseRange?.status === 'open'
        ? 'Abierto'
        : activeExercise?.status === 'closed'
          ? 'Cerrado'
          : 'Actual'

  return `${exerciseLabel} · ${dateFrom} a ${dateTo} · ${status}`
}

function formatExercisePreview(exercises: LogicalExercise[]): string {
  if (exercises.length === 0) return ''

  return `${exercises.length} ejercicios · ${exercises.map((exercise) => exercise.start_date).join(' · ')}`
}

interface ReportExercisePanelProps {
  companyId?: number | null
  activeExercise: LogicalExercise | null
  previousExercises: LogicalExercise[]
  onSelectExercise?: (exercise: LogicalExercise) => void
  onSelectSnapshot?: (exercise: LogicalExercise) => void
}

interface ReportExerciseInfoProps {
  requestedRange: RequestedReportRange | null
  exerciseRange: ExerciseReportRange | null
  visibleRange: VisibleReportRange | null
  activeExercise: LogicalExercise | null
}

export function ReportExercisePanel({
  companyId,
  activeExercise,
  previousExercises,
  onSelectExercise,
  onSelectSnapshot,
}: ReportExercisePanelProps) {
  const [showExercises, setShowExercises] = useState(false)
  const [knownExercises, setKnownExercises] = useState<LogicalExercise[]>([])

  useEffect(() => {
    setKnownExercises([])
    setShowExercises(false)
  }, [companyId])

  useEffect(() => {
    const incomingExercises = [activeExercise, ...previousExercises].filter(
      (exercise): exercise is LogicalExercise => exercise !== null
    )

    if (incomingExercises.length === 0) return

    setKnownExercises((current) => {
      const byId = new Map<string, LogicalExercise>()

      current.forEach((exercise) => {
        byId.set(String(exercise.exercise_id), exercise)
      })

      incomingExercises.forEach((exercise) => {
        byId.set(String(exercise.exercise_id), exercise)
      })

      return Array.from(byId.values()).sort(
        (left, right) => right.exercise_index - left.exercise_index
      )
    })
  }, [activeExercise, previousExercises])

  const availableExercises = knownExercises.length > 0 ? knownExercises : previousExercises
  const selectableExercises = availableExercises.filter(
    (exercise) => exercise.exercise_id !== activeExercise?.exercise_id
  )

  if (selectableExercises.length === 0) return null

  return (
    <section className="rounded-xl border border-dashed border-[var(--border-soft)] bg-transparent px-3 py-2 sm:px-4">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 text-left"
        onClick={() => setShowExercises((current) => !current)}
        aria-expanded={showExercises}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 overflow-hidden">
            <p className="shrink-0 text-xs font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase">
              Ejercicios
            </p>
            <span className="shrink-0 rounded-full border border-[var(--border-soft)] bg-white px-2 py-0.5 text-[0.7rem] font-medium text-[var(--text-muted)]">
              {selectableExercises.length}
            </span>
            <span className="truncate text-sm text-[var(--text-muted)]">
              {formatExercisePreview(selectableExercises)}
            </span>
          </div>
        </div>
        <span
          className={[
            'inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white text-[var(--text-muted)] transition-transform',
            showExercises ? 'rotate-180' : '',
          ].join(' ')}
          aria-hidden="true"
        >
          <svg className="size-4" viewBox="0 0 20 20" fill="none">
            <path
              d="m5 8 5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {showExercises && (
        <div className="mt-2 divide-y divide-[var(--border-soft)] border-t border-[var(--border-soft)] pt-1">
          {selectableExercises.map((exercise) => {
            return (
              <div
                key={exercise.exercise_id}
                className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--text-strong)]">
                      Ejercicio {exercise.exercise_index}
                    </p>
                    <span
                      className={getSemanticBadgeClassName(
                        getExerciseSemanticTone(exercise.status, exercise.status === 'open')
                      )}
                    >
                      {exercise.status === 'open' ? 'Actual' : 'Cerrado'}
                    </span>
                  </div>
                  <p className="muted-text mt-1 text-sm">
                    {exercise.start_date} a {exercise.closing_date ?? 'abierto'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowExercises(false)
                      onSelectExercise?.(exercise)
                    }}
                  >
                    Ver ejercicio
                  </Button>
                  {exercise.snapshot_id !== null && onSelectSnapshot && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onSelectSnapshot(exercise)}
                    >
                      Ver cierre confirmado
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export function ReportExerciseInfo({
  requestedRange,
  exerciseRange,
  visibleRange,
  activeExercise,
}: ReportExerciseInfoProps) {
  const resolvedExerciseLine = formatResolvedExerciseLine(activeExercise, exerciseRange)
  const requestedDateFrom = requestedRange?.date_from ?? null
  const requestedDateTo = requestedRange?.date_to ?? null
  const visibleDateFrom = visibleRange?.date_from ?? null
  const visibleDateTo = visibleRange?.date_to ?? null
  const rangeWasAdjusted =
    requestedDateFrom !== null &&
    requestedDateTo !== null &&
    (requestedDateFrom !== visibleDateFrom || requestedDateTo !== visibleDateTo)

  if (!activeExercise && !rangeWasAdjusted) return null

  return (
    <Alert tone="info">
      <div className="space-y-1 text-sm">
        {resolvedExerciseLine && (
          <p>
            El reporte corresponde a <strong>{resolvedExerciseLine}</strong>.
          </p>
        )}
        {rangeWasAdjusted && (
          <p>
            Rango solicitado: <strong>{requestedDateFrom ?? '—'}</strong> a{' '}
            <strong>{requestedDateTo ?? '—'}</strong>. Rango visible:{' '}
            <strong>{visibleDateFrom ?? '—'}</strong> a <strong>{visibleDateTo ?? '—'}</strong>.
          </p>
        )}
      </div>
    </Alert>
  )
}
