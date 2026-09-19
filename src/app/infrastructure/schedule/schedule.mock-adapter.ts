import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ScheduleStatus,
  ScheduledSession,
  SessionKind,
} from '@app/domain/schedule/model/scheduled-session.model';
import { SchedulePort } from '@app/domain/schedule/port/schedule.port';
import { addDays, isWithinRange, startOfWeek, toIsoDate } from '@app/domain/shared/model/date';
import { DateRange } from '@app/domain/shared/model/date-range';
import { Id } from '@app/domain/shared/model/ids';
import { CLOCK } from '@app/domain/shared/port/clock.port';

import { simulate, simulateError } from '../shared/mock-delay';

interface SlotSeed {
  readonly weekOffset: number;
  readonly weekday: number;
  readonly hour: number;
  readonly durationMinutes: number;
  readonly title: string;
  readonly kind: SessionKind;
  readonly status: ScheduleStatus;
  readonly location: string | null;
}

/** Agenda tipica de un mes: entrenamientos, una evaluacion y un control. */
const SLOTS: readonly SlotSeed[] = [
  {
    weekOffset: -1,
    weekday: 1,
    hour: 18,
    durationMinutes: 60,
    title: 'Tren inferior',
    kind: 'training',
    status: 'confirmed',
    location: 'Box Providencia',
  },
  {
    weekOffset: -1,
    weekday: 4,
    hour: 18,
    durationMinutes: 60,
    title: 'Tracción',
    kind: 'training',
    status: 'confirmed',
    location: 'Box Providencia',
  },
  {
    weekOffset: 0,
    weekday: 1,
    hour: 18,
    durationMinutes: 60,
    title: 'Tren inferior',
    kind: 'training',
    status: 'confirmed',
    location: 'Box Providencia',
  },
  {
    weekOffset: 0,
    weekday: 2,
    hour: 18,
    durationMinutes: 60,
    title: 'Empuje',
    kind: 'training',
    status: 'confirmed',
    location: 'Box Providencia',
  },
  {
    weekOffset: 0,
    weekday: 4,
    hour: 18,
    durationMinutes: 60,
    title: 'Tracción',
    kind: 'training',
    status: 'pending',
    location: 'Box Providencia',
  },
  {
    weekOffset: 0,
    weekday: 6,
    hour: 10,
    durationMinutes: 45,
    title: 'Evaluación física',
    kind: 'assessment',
    status: 'pending',
    location: 'Box Providencia',
  },
  {
    weekOffset: 1,
    weekday: 1,
    hour: 18,
    durationMinutes: 60,
    title: 'Tren inferior',
    kind: 'training',
    status: 'pending',
    location: 'Box Providencia',
  },
  {
    weekOffset: 1,
    weekday: 3,
    hour: 12,
    durationMinutes: 20,
    title: 'Control de avance',
    kind: 'checkin',
    status: 'pending',
    location: null,
  },
  {
    weekOffset: 2,
    weekday: 2,
    hour: 18,
    durationMinutes: 60,
    title: 'Empuje',
    kind: 'training',
    status: 'pending',
    location: 'Box Providencia',
  },
];

@Injectable()
export class ScheduleMockAdapter implements SchedulePort {
  private readonly clock = inject(CLOCK);
  private sessions: ScheduledSession[];

  constructor() {
    const weekStart = startOfWeek(this.clock.now());

    this.sessions = SLOTS.map((slot, index) => {
      const day = addDays(weekStart, slot.weekOffset * 7 + (slot.weekday - 1));
      const startsAt = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        slot.hour,
        0,
        0,
        0,
      );

      return {
        id: `sch-${String(index + 1).padStart(3, '0')}`,
        studentId: 'std-001',
        trainerId: 'trn-001',
        title: slot.title,
        startsAt: toIsoDate(startsAt),
        endsAt: toIsoDate(new Date(startsAt.getTime() + slot.durationMinutes * 60_000)),
        location: slot.location,
        kind: slot.kind,
        status: slot.status,
        workoutSessionId: null,
      };
    });
  }

  listByStudent(studentId: Id, range: DateRange): Observable<ScheduledSession[]> {
    return simulate(
      this.sessions
        .filter(session => session.studentId === studentId)
        .filter(session => isWithinRange(session.startsAt, range))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    );
  }

  confirm(sessionId: Id): Observable<ScheduledSession> {
    return this.mutate(sessionId, session => ({ ...session, status: 'confirmed' }));
  }

  /** El mock no guarda el motivo; el BFF si lo persistira. */
  cancel(sessionId: Id, _reason: string): Observable<ScheduledSession> {
    return this.mutate(sessionId, session => ({ ...session, status: 'cancelled' }));
  }

  private mutate(
    sessionId: Id,
    change: (session: ScheduledSession) => ScheduledSession,
  ): Observable<ScheduledSession> {
    const current = this.sessions.find(item => item.id === sessionId);
    if (current === undefined) {
      return simulateError<ScheduledSession>('not_found');
    }

    const updated = change(current);
    this.sessions = this.sessions.map(item => (item.id === sessionId ? updated : item));

    return simulate(updated);
  }
}
