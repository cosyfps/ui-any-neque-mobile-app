import { Id } from '@app/domain/shared/model/ids';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'cardio'
  | 'fullbody';

/** Etiquetas en espanol de cada grupo muscular. */
export const MUSCLE_GROUP_LABEL: Record<MuscleGroup, string> = {
  chest: 'Pecho',
  back: 'Espalda',
  legs: 'Piernas',
  shoulders: 'Hombros',
  arms: 'Brazos',
  core: 'Core',
  cardio: 'Cardio',
  fullbody: 'Cuerpo completo',
};

/** Ejercicio del catalogo, independiente de cualquier rutina. */
export interface Exercise {
  readonly id: Id;
  readonly name: string;
  readonly muscleGroup: MuscleGroup;
  readonly equipment: string | null;
  readonly thumbnailUrl: string | null;
  /** Pasos de ejecucion, en orden. */
  readonly instructions: readonly string[];
}
