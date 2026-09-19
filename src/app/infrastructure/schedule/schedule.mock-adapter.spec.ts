import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';

import { ScheduledSession } from '@app/domain/schedule/model/scheduled-session.model';
import { DomainError } from '@app/domain/shared/model/app-error';
import { monthRange, weekRange } from '@app/domain/shared/model/date';
import { CLOCK } from '@app/domain/shared/port/clock.port';

import { ScheduleMockAdapter } from './schedule.mock-adapter';

const NOW = new Date(2026, 8, 17, 10, 0, 0);

const resolve = <T>(source: Observable<T>): { value?: T; error?: DomainError } => {
  let value: T | undefined;
  let error: DomainError | undefined;
  source.subscribe({ next: v => (value = v), error: (e: DomainError) => (error = e) });
  jest.runAllTimers();
  return { value, error };
};

describe('ScheduleMockAdapter', () => {
  let adapter: ScheduleMockAdapter;

  const ofMonth = (): ScheduledSession[] =>
    resolve(adapter.listByStudent('std-001', monthRange(NOW))).value ?? [];

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
    TestBed.configureTestingModule({
      providers: [ScheduleMockAdapter, { provide: CLOCK, useValue: { now: () => NOW } }],
    });
    adapter = TestBed.inject(ScheduleMockAdapter);
  });

  afterEach(() => jest.useRealTimers());

  describe('listByStudent()', () => {
    it('devuelve sesiones del mes', () => {
      expect(ofMonth().length).toBeGreaterThan(0);
    });

    it('las ordena por hora de inicio', () => {
      const dates = ofMonth().map(session => session.startsAt);
      expect([...dates].sort()).toEqual(dates);
    });

    it('respeta el rango entregado', () => {
      const week = resolve(adapter.listByStudent('std-001', weekRange(NOW))).value ?? [];
      expect(week.length).toBeLessThanOrEqual(ofMonth().length);
    });

    it('devuelve vacio para otro alumno', () => {
      expect(resolve(adapter.listByStudent('std-999', monthRange(NOW))).value).toEqual([]);
    });

    it('cada sesion termina despues de empezar', () => {
      for (const session of ofMonth()) {
        expect(new Date(session.endsAt).getTime()).toBeGreaterThan(
          new Date(session.startsAt).getTime(),
        );
      }
    });

    it('incluye los tres tipos de cita', () => {
      const all =
        resolve(adapter.listByStudent('std-001', monthRange(new Date(2026, 9, 1)))).value ?? [];
      const kinds = new Set([...ofMonth(), ...all].map(session => session.kind));
      expect(kinds.size).toBeGreaterThan(1);
    });
  });

  describe('confirm()', () => {
    it('deja la sesion confirmada', () => {
      const pending = ofMonth().find(session => session.status === 'pending') as ScheduledSession;

      expect(resolve(adapter.confirm(pending.id)).value?.status).toBe('confirmed');
    });

    it('persiste el cambio', () => {
      const pending = ofMonth().find(session => session.status === 'pending') as ScheduledSession;
      resolve(adapter.confirm(pending.id));

      expect(ofMonth().find(session => session.id === pending.id)?.status).toBe('confirmed');
    });

    it('falla con un id desconocido', () => {
      expect(resolve(adapter.confirm('sch-999')).error?.code).toBe('not_found');
    });
  });

  describe('cancel()', () => {
    it('deja la sesion cancelada', () => {
      const first = ofMonth()[0] as ScheduledSession;

      expect(resolve(adapter.cancel(first.id, 'no puedo')).value?.status).toBe('cancelled');
    });

    it('falla con un id desconocido', () => {
      expect(resolve(adapter.cancel('sch-999', 'motivo')).error?.code).toBe('not_found');
    });
  });

  it('dos instancias no comparten estado', () => {
    const first = ofMonth()[0] as ScheduledSession;
    resolve(adapter.cancel(first.id, 'motivo'));

    const otra = TestBed.runInInjectionContext(() => new ScheduleMockAdapter());
    const misma = (resolve(otra.listByStudent('std-001', monthRange(NOW))).value ?? []).find(
      session => session.id === first.id,
    );

    expect(misma?.status).not.toBe('cancelled');
  });
});
