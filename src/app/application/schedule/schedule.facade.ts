import { Injectable, Signal, computed, inject, signal } from '@angular/core';

import { SessionFacade } from '@app/application/auth/session.facade';
import { MonthCell, buildMonthGrid } from '@app/domain/schedule/model/month-grid';
import { ScheduledSession } from '@app/domain/schedule/model/scheduled-session.model';
import { SCHEDULE_PORT } from '@app/domain/schedule/port/schedule.port';
import {
  addMonths,
  isSameDay,
  monthRange,
  parseIsoDate,
  startOfDay,
} from '@app/domain/shared/model/date';
import { CLOCK } from '@app/domain/shared/port/clock.port';

import { AsyncState, ViewState, asyncState } from '../shared/async-state';

const MONTH_LABEL = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' });

/** Agenda mensual del alumno. */
// Scoped a la ruta /student: sus puertos viven en ese injector, no en el raiz.
@Injectable()
export class ScheduleFacade {
  private readonly port = inject(SCHEDULE_PORT);
  private readonly session = inject(SessionFacade);
  private readonly clock = inject(CLOCK);

  // Igual que el dia seleccionado: el mes inicial sale del puerto.
  private readonly _month = signal(startOfDay(this.clock.now()));
  private readonly _selectedDay = signal<Date | null>(null);

  readonly sessions: AsyncState<ScheduledSession[]> = asyncState<ScheduledSession[]>();

  readonly month: Signal<Date> = this._month.asReadonly();
  readonly selectedDay: Signal<Date | null> = this._selectedDay.asReadonly();

  readonly monthLabel: Signal<string> = computed(() => MONTH_LABEL.format(this._month()));

  readonly grid: Signal<MonthCell[][]> = computed(() => {
    const month = this._month();
    return buildMonthGrid(month.getFullYear(), month.getMonth(), this.clock.now());
  });

  readonly all: Signal<readonly ScheduledSession[]> = computed(() => this.sessions.data() ?? []);

  /** Sesiones del dia seleccionado, o del dia de hoy si no hay seleccion. */
  readonly daySessions: Signal<readonly ScheduledSession[]> = computed(() => {
    const day = this._selectedDay() ?? this.clock.now();
    return this.all().filter(item => {
      const startsAt = parseIsoDate(item.startsAt);
      return startsAt !== null && isSameDay(startsAt, day);
    });
  });

  readonly viewState: Signal<ViewState> = this.sessions.viewState;

  /** True si ese dia tiene al menos una sesion no cancelada. */
  hasSessions(date: Date): boolean {
    return this.all().some(item => {
      if (item.status === 'cancelled') {
        return false;
      }
      const startsAt = parseIsoDate(item.startsAt);
      return startsAt !== null && isSameDay(startsAt, date);
    });
  }

  load(): void {
    const studentId = this.session.profileId();
    if (studentId === null) {
      return;
    }
    this._month.set(startOfDay(this.clock.now()));
    this._selectedDay.set(startOfDay(this.clock.now()));
    this.fetch();
  }

  reload(): void {
    this.sessions.reload();
  }

  nextMonth(): void {
    this._month.update(value => addMonths(value, 1));
    this._selectedDay.set(null);
    this.fetch();
  }

  prevMonth(): void {
    this._month.update(value => addMonths(value, -1));
    this._selectedDay.set(null);
    this.fetch();
  }

  selectDay(date: Date): void {
    this._selectedDay.set(startOfDay(date));
  }

  confirm(sessionId: string): Promise<boolean> {
    return this.mutate(() => this.port.confirm(sessionId));
  }

  cancel(sessionId: string, reason: string): Promise<boolean> {
    return this.mutate(() => this.port.cancel(sessionId, reason));
  }

  private fetch(): void {
    const studentId = this.session.profileId();
    if (studentId === null) {
      return;
    }
    const range = monthRange(this._month());
    this.sessions.load(() => this.port.listByStudent(studentId, range));
  }

  private mutate(run: () => ReturnType<typeof this.port.confirm>): Promise<boolean> {
    return new Promise(resolve => {
      run().subscribe({
        next: updated => {
          this.sessions.set(this.all().map(item => (item.id === updated.id ? updated : item)));
          resolve(true);
        },
        error: () => resolve(false),
      });
    });
  }
}
