import { Id, IsoDateString } from '@app/domain/shared/model/ids';

export type SessionKind = 'training' | 'assessment' | 'checkin';
export type ScheduleStatus = 'confirmed' | 'pending' | 'cancelled';

/** Motivo por el que se cancela una cita. */
export type CancelReason = 'illness' | 'travel' | 'injury' | 'rescheduled' | 'other';

export const CANCEL_REASON_LABEL: Record<CancelReason, string> = {
  illness: 'Enfermedad',
  travel: 'Viaje',
  injury: 'Lesión',
  rescheduled: 'Reagendada',
  other: 'Otro motivo',
};

export const SESSION_KIND_LABEL: Record<SessionKind, string> = {
  training: 'Entrenamiento',
  assessment: 'Evaluación',
  checkin: 'Control',
};

export const SCHEDULE_STATUS_LABEL: Record<ScheduleStatus, string> = {
  confirmed: 'Confirmada',
  pending: 'Por confirmar',
  cancelled: 'Cancelada',
};

/** Cita agendada entre entrenador y alumno. */
export interface ScheduledSession {
  readonly id: Id;
  readonly studentId: Id;
  readonly trainerId: Id;
  readonly title: string;
  readonly startsAt: IsoDateString;
  readonly endsAt: IsoDateString;
  readonly location: string | null;
  readonly kind: SessionKind;
  readonly status: ScheduleStatus;
  /** Sesion de entrenamiento asociada, si la cita es de tipo training. */
  readonly workoutSessionId: Id | null;
  /**
   * Cancelacion. El motivo es de una lista cerrada para poder contarlo; la
   * nota libre existe porque "otro motivo" sin explicacion no le sirve a nadie.
   */
  readonly cancellationReason: CancelReason | null;
  readonly cancellationNote: string | null;
  readonly cancelledAt: IsoDateString | null;
}
