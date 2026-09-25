import { Id, IsoDateString } from '@app/domain/shared/model/ids';

/**
 * Una serie tal como el alumno la ejecuto.
 *
 * Lo prescrito vive en la rutina; esto es lo que de verdad levanto. Sin este
 * registro la progresion de carga se pierde y el entrenador no puede ajustar.
 */
export interface WorkoutSet {
  readonly id: Id;
  readonly setNumber: number;
  /** Null cuando el alumno cerro la serie sin corregir lo prescrito. */
  readonly reps: number | null;
  readonly weightKg: number | null;
  readonly completedAt: IsoDateString;
}

/** Lo que el runner envia al cerrar una serie. */
export interface WorkoutSetInput {
  readonly setNumber: number;
  readonly reps: number | null;
  readonly weightKg: number | null;
}

/** Volumen de una serie, en kg levantados. Null si falta un dato. */
export function setVolumeKg(set: WorkoutSet): number | null {
  if (set.reps === null || set.weightKg === null) {
    return null;
  }
  return set.reps * set.weightKg;
}

/** Suma del volumen de las series que tienen ambos datos. */
export function totalVolumeKg(sets: readonly WorkoutSet[]): number {
  return sets.reduce((sum, set) => sum + (setVolumeKg(set) ?? 0), 0);
}

/** La ultima serie registrada, para precargar la siguiente. */
export function lastSet(sets: readonly WorkoutSet[]): WorkoutSet | null {
  return sets.reduce<WorkoutSet | null>(
    (mayor, set) => (mayor === null || set.setNumber > mayor.setNumber ? set : mayor),
    null,
  );
}
