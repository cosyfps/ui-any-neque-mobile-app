import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';

import { AppNotification, isUnread } from '@app/domain/notifications/model/notification.model';
import { DomainError } from '@app/domain/shared/model/app-error';
import { CLOCK } from '@app/domain/shared/port/clock.port';

import { NotificationsMockAdapter } from './notifications.mock-adapter';

const NOW = new Date('2026-09-17T10:00:00.000Z');
const USER = 'usr-student-001';

const resolve = <T>(source: Observable<T>): { value?: T; error?: DomainError } => {
  let value: T | undefined;
  let error: DomainError | undefined;
  source.subscribe({ next: v => (value = v), error: (e: DomainError) => (error = e) });
  jest.runAllTimers();
  return { value, error };
};

describe('NotificationsMockAdapter', () => {
  let adapter: NotificationsMockAdapter;

  const list = (): AppNotification[] => resolve(adapter.listByUser(USER)).value ?? [];

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
    TestBed.configureTestingModule({
      providers: [NotificationsMockAdapter, { provide: CLOCK, useValue: { now: () => NOW } }],
    });
    adapter = TestBed.inject(NotificationsMockAdapter);
  });

  afterEach(() => jest.useRealTimers());

  describe('listByUser()', () => {
    it('devuelve las notificaciones semilla', () => {
      expect(list()).toHaveLength(6);
    });

    it('las ordena de la mas reciente a la mas antigua', () => {
      const dates = list().map(item => item.createdAt);
      expect([...dates].sort((a, b) => b.localeCompare(a))).toEqual(dates);
    });

    it('devuelve vacio para otro usuario', () => {
      expect(resolve(adapter.listByUser('usr-999')).value).toEqual([]);
    });

    it('incluye leidas y no leidas', () => {
      const all = list();
      expect(all.some(isUnread)).toBe(true);
      expect(all.some(item => !isUnread(item))).toBe(true);
    });

    it('las fechas son relativas al reloj inyectado', () => {
      for (const item of list()) {
        expect(new Date(item.createdAt).getTime()).toBeLessThanOrEqual(NOW.getTime());
      }
    });
  });

  describe('markRead()', () => {
    it('marca la notificacion como leida', () => {
      const unread = list().find(isUnread) as AppNotification;

      expect(resolve(adapter.markRead(unread.id)).value?.readAt).not.toBeNull();
    });

    it('persiste el cambio', () => {
      const unread = list().find(isUnread) as AppNotification;
      resolve(adapter.markRead(unread.id));

      expect(list().find(item => item.id === unread.id)?.readAt).not.toBeNull();
    });

    it('no altera la fecha de una ya leida', () => {
      const read = list().find(item => !isUnread(item)) as AppNotification;

      expect(resolve(adapter.markRead(read.id)).value?.readAt).toBe(read.readAt);
    });

    it('falla con un id desconocido', () => {
      expect(resolve(adapter.markRead('ntf-999')).error?.code).toBe('not_found');
    });
  });

  describe('markAllRead()', () => {
    it('deja todo leido', () => {
      resolve(adapter.markAllRead(USER));

      expect(list().some(isUnread)).toBe(false);
    });

    it('no toca las notificaciones de otro usuario', () => {
      resolve(adapter.markAllRead('usr-999'));

      expect(list().some(isUnread)).toBe(true);
    });
  });

  it('dos instancias no comparten estado', () => {
    resolve(adapter.markAllRead(USER));

    const otra = TestBed.runInInjectionContext(() => new NotificationsMockAdapter());
    expect((resolve(otra.listByUser(USER)).value ?? []).some(isUnread)).toBe(true);
  });
});
