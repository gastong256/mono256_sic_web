import type { JournalSourceType } from '@/features/journal/types/journal.types'

export type LogicalExerciseStatus = 'open' | 'closed'

export interface LogicalExercise {
  exercise_id: string
  exercise_index: number
  opening_entry_id: number
  opening_source_type: JournalSourceType
  start_date: string
  closing_entry_id: number | null
  closing_date: string | null
  snapshot_id: number | null
  status: LogicalExerciseStatus
}

export interface LogicalExerciseListResponse {
  company_id: number
  company: string
  current_exercise_id: string | null
  exercises: LogicalExercise[]
}
