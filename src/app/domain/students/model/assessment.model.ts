import { Id, IsoDateString } from '@app/domain/shared/model/ids';

/**
 * Mediciones corporales de una evaluacion.
 *
 * Son propiedades explicitas y no un indice dinamico para que
 * `noPropertyAccessFromIndexSignature` no obligue a accesos por corchetes
 * en toda la UI.
 */
export interface BodyMeasurements {
  readonly chestCm: number | null;
  readonly waistCm: number | null;
  readonly hipCm: number | null;
  readonly armCm: number | null;
  readonly thighCm: number | null;
}

/** Evaluacion fisica registrada por el entrenador. */
export interface Assessment {
  readonly id: Id;
  readonly studentId: Id;
  readonly takenAt: IsoDateString;
  readonly weightKg: number;
  readonly heightCm: number;
  readonly bodyFatPct: number | null;
  readonly muscleMassKg: number | null;
  readonly measurements: BodyMeasurements;
  readonly notes: string | null;
}
