import { Id, IsoDateString } from '@app/domain/shared/model/ids';

export type SessionKind = 'training' | 'assessment' | 'checkin';
export type ScheduleStatus = 'confirmed' | 'pending' | 'cancelled';

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
}
