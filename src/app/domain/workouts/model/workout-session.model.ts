import { Id, IsoDateString } from '@app/domain/shared/model/ids';

import { WorkoutSet } from './workout-set.model';

export type WorkoutStatus = 'scheduled' | 'in_progress' | 'completed' | 'skipped';

/** Etiquetas en espanol de cada estado. */
export const WORKOUT_STATUS_LABEL: Record<WorkoutStatus, string> = {
  scheduled: 'Programado',
  in_progress: 'En curso',
  completed: 'Completado',
  skipped: 'Omitido',
};

/** Avance del alumno en un ejercicio dentro de una sesion. */
export interface WorkoutExerciseLog {
  readonly routineExerciseId: Id;
  readonly exerciseId: Id;
  readonly name: string;
  readonly targetSets: number;
  readonly targetReps: number;
  readonly restSeconds: number;
  /** Carga prescrita. Lo que el alumno levanto va en `sets`. */
  readonly weightKg: number | null;
  readonly completedSets: number;
  readonly done: boolean;
  /** Series ejecutadas, en orden de registro. */
  readonly sets: readonly WorkoutSet[];
}

/** Una sesion de entrenamiento agendada o ya realizada. */
export interface WorkoutSession {
  readonly id: Id;
  readonly studentId: Id;
  readonly routineId: Id;
  readonly routineDayId: Id;
  readonly title: string;
  readonly scheduledFor: IsoDateString;
  readonly startedAt: IsoDateString | null;
  readonly completedAt: IsoDateString | null;
  readonly status: WorkoutStatus;
  readonly durationMinutes: number | null;
  readonly estimatedMinutes: number;
  readonly exercises: readonly WorkoutExerciseLog[];
}

/** Datos con los que se cierra una sesion. */
export interface WorkoutCompletion {
  readonly durationMinutes: number;
  readonly note: string | null;
}

/** Fraccion completada de la sesion, entre 0 y 1. */
export function sessionProgress(session: WorkoutSession): number {
  if (session.exercises.length === 0) {
    return 0;
  }
  const done = session.exercises.filter(exercise => exercise.done).length;
  return done / session.exercises.length;
}

/** Total de series prescritas en la sesion. */
export function totalTargetSets(session: WorkoutSession): number {
  return session.exercises.reduce((sum, exercise) => sum + exercise.targetSets, 0);
}

/** Total de series que el alumno marco como hechas. */
export function totalCompletedSets(session: WorkoutSession): number {
  return session.exercises.reduce((sum, exercise) => sum + exercise.completedSets, 0);
}
