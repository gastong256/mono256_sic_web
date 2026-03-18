import type { LogicalExercise } from '@/features/companies/types/logicalExercises.types'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'

function formatExerciseLabel(exercise: LogicalExercise): string {
  const status = exercise.status === 'closed' ? 'Cerrado' : 'Actual'
  return `Ejercicio ${exercise.exercise_index} · ${exercise.start_date}${
    exercise.closing_date ? ` a ${exercise.closing_date}` : ''
  } · ${status}`
}

interface ReportExercisePanelProps {
  requestedDateFrom: string | null
  requestedDateTo: string | null
  visibleDateFrom: string | null
  visibleDateTo: string | null
  activeExercise: LogicalExercise | null
  previousExercises: LogicalExercise[]
  onSelectExercise?: (exercise: LogicalExercise) => void
}

export function ReportExercisePanel({
  requestedDateFrom,
  requestedDateTo,
  visibleDateFrom,
  visibleDateTo,
  activeExercise,
  previousExercises,
  onSelectExercise,
}: ReportExercisePanelProps) {
  const rangeWasAdjusted =
    requestedDateFrom !== null &&
    requestedDateTo !== null &&
    (requestedDateFrom !== visibleDateFrom || requestedDateTo !== visibleDateTo)

  if (!activeExercise && previousExercises.length === 0 && !rangeWasAdjusted) return null

  return (
    <div className="space-y-3">
      {(rangeWasAdjusted || activeExercise) && (
        <Alert tone="info">
          <div className="space-y-1 text-sm">
            {activeExercise && (
              <p>
                El reporte corresponde a <strong>{formatExerciseLabel(activeExercise)}</strong>.
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
      )}

      {previousExercises.length > 0 && (
        <div className="surface-card p-4">
          <p className="text-sm font-semibold text-[var(--text-strong)]">Ejercicios anteriores</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {previousExercises.map((exercise) => (
              <Button
                key={exercise.exercise_id}
                type="button"
                variant="secondary"
                onClick={() => onSelectExercise?.(exercise)}
              >
                {formatExerciseLabel(exercise)}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
