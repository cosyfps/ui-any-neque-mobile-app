import { Weekday } from '@app/domain/shared/model/date';
import { Id, IsoDateString } from '@app/domain/shared/model/ids';

import { MuscleGroup } from './exercise.model';

/** Un ejercicio dentro de un dia de rutina, con su prescripcion. */
export interface RoutineExercise {
  readonly id: Id;
  readonly exerciseId: Id;
  readonly name: string;
  readonly order: number;
  readonly sets: number;
  readonly reps: number;
  readonly restSeconds: number;
  readonly weightKg: number | null;
  readonly notes: string | null;
}

/** Un dia de entrenamiento dentro de la rutina. */
export interface RoutineDay {
  readonly id: Id;
  readonly weekday: Weekday;
  readonly title: string;
  readonly focus: MuscleGroup;
  readonly estimatedMinutes: number;
  readonly exercises: readonly RoutineExercise[];
}

export type RoutineStatus = 'active' | 'archived';

/** Rutina asignada por el entrenador a un alumno. */
export interface Routine {
  readonly id: Id;
  readonly studentId: Id;
  readonly trainerId: Id;
  readonly name: string;
  readonly goal: string;
  readonly startDate: IsoDateString;
  readonly endDate: IsoDateString | null;
  readonly status: RoutineStatus;
  readonly days: readonly RoutineDay[];
}

/** Un ejercicio tal como lo envia el constructor, sin id todavia. */
export type RoutineExerciseInput = Omit<RoutineExercise, 'id'>;

/** Un dia tal como lo envia el constructor. */
export interface RoutineDayInput extends Omit<RoutineDay, 'id' | 'exercises'> {
  readonly exercises: readonly RoutineExerciseInput[];
}

/** Rutina completa tal como la envia el constructor. */
export interface RoutineInput extends Omit<Routine, 'id' | 'status' | 'days'> {
  readonly days: readonly RoutineDayInput[];
}

/** Total de series prescritas en un dia. */
export function totalSets(day: RoutineDay): number {
  return day.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
}

/** Busca el dia de la rutina que corresponde a un dia de la semana. */
export function dayForWeekday(routine: Routine, weekday: Weekday): RoutineDay | null {
  return routine.days.find(day => day.weekday === weekday) ?? null;
}
