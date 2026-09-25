import { Weekday } from '@app/domain/shared/model/date';
import { Id } from '@app/domain/shared/model/ids';

/**
 * Contacto al que llamar en una urgencia durante el entrenamiento.
 *
 * Son tres columnas y no un texto libre porque el telefono tiene que poder
 * marcarse sin que nadie lo interprete.
 */
export interface EmergencyContact {
  readonly name: string;
  readonly phone: string;
  readonly relation: string;
}

/**
 * Antecedentes del alumno, registrados por su entrenador.
 *
 * Es un registro unico por alumno que se edita, no un historial de versiones.
 * Todo es opcional salvo el objetivo declarado y la disponibilidad semanal:
 * sin esos dos no se puede planificar una rutina.
 */
export interface Anamnesis {
  readonly id: Id;
  readonly studentId: Id;
  readonly medicalHistory: string | null;
  readonly previousInjuries: string | null;
  readonly surgeries: string | null;
  readonly medications: string | null;
  readonly allergies: string | null;
  readonly previousActivity: string | null;
  readonly declaredGoal: string;
  /** Dias ISO 1-7 en que el alumno puede entrenar. */
  readonly weeklyAvailability: readonly Weekday[];
  readonly emergencyContact: EmergencyContact | null;
  readonly updatedAt: string;
}

/** Campos que el formulario envia; el resto lo pone el backend. */
export type AnamnesisInput = Omit<Anamnesis, 'id' | 'updatedAt'>;

/**
 * True cuando la anamnesis tiene lo minimo para planificar.
 *
 * Existe como funcion pura para que la ficha del alumno y el constructor de
 * rutinas coincidan en que consideran "completa".
 */
export function isAnamnesisUsable(anamnesis: Anamnesis | null): boolean {
  if (anamnesis === null) {
    return false;
  }
  return anamnesis.declaredGoal.trim() !== '' && anamnesis.weeklyAvailability.length > 0;
}

/** Antecedentes clinicos que el entrenador deberia leer antes de prescribir. */
export function hasClinicalFlags(anamnesis: Anamnesis): boolean {
  return [
    anamnesis.medicalHistory,
    anamnesis.previousInjuries,
    anamnesis.surgeries,
    anamnesis.medications,
    anamnesis.allergies,
  ].some(campo => campo !== null && campo.trim() !== '');
}
