import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { SessionFacade } from '@app/application/auth/session.facade';
import { NotificationsFacade } from '@app/application/notifications/notifications.facade';
import { AppNotification } from '@app/domain/notifications/model/notification.model';
import { NOTIFICATIONS_PORT } from '@app/domain/notifications/port/notifications.port';
import { addDays, toIsoDate } from '@app/domain/shared/model/date';
import { CLOCK } from '@app/domain/shared/port/clock.port';

import { StudentNotificationsPage } from './student-notifications.page';

const NOW = new Date(2026, 8, 17, 12, 0, 0);

const notification = (
  id: string,
  minutesAgo: number,
  read: boolean,
  actionRoute: string | null = null,
): AppNotification => ({
  id,
  userId: 'usr-1',
  kind: 'routine',
  title: `Título ${id}`,
  body: 'Cuerpo',
  createdAt: toIsoDate(new Date(NOW.getTime() - minutesAgo * 60_000)),
  readAt: read ? toIsoDate(NOW) : null,
  actionRoute,
});

const ITEMS = [notification('n1', 25, false, '/student/routine'), notification('n2', 180, true)];

describe('StudentNotificationsPage', () => {
  let page: StudentNotificationsPage;
  let router: Router;
  let markRead: jest.Mock;
  let markAllRead: jest.Mock;

  const createPage = (items = ITEMS): StudentNotificationsPage => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        NotificationsFacade,
        { provide: CLOCK, useValue: { now: () => NOW } },
        { provide: SessionFacade, useValue: { user: () => ({ id: 'usr-1' }) } },
        {
          provide: NOTIFICATIONS_PORT,
          useValue: { listByUser: () => of(items), markRead, markAllRead },
        },
      ],
    });
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    return TestBed.runInInjectionContext(() => new StudentNotificationsPage());
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
    markRead = jest
      .fn()
      .mockImplementation((id: string) =>
        of({ ...(ITEMS.find(item => item.id === id) as AppNotification), readAt: toIsoDate(NOW) }),
      );
    markAllRead = jest.fn().mockReturnValue(of(undefined));
    page = createPage();
  });

  afterEach(() => jest.useRealTimers());

  describe('estado inicial', () => {
    it('carga las notificaciones', () => {
      expect(page.facade.viewState()).toBe('success');
      expect(page.facade.unreadCount()).toBe(1);
    });

    it('queda en empty sin notificaciones', () => {
      expect(createPage([]).facade.viewState()).toBe('empty');
    });
  });

  describe('relativeTime()', () => {
    it('usa minutos para lo reciente', () => {
      expect(page.relativeTime(toIsoDate(new Date(NOW.getTime() - 25 * 60_000)))).toContain('min');
    });

    it('usa horas a partir de una hora', () => {
      expect(page.relativeTime(toIsoDate(new Date(NOW.getTime() - 3 * 3_600_000)))).toContain(
        'hora',
      );
    });

    it('usa dias a partir de un dia', () => {
      expect(page.relativeTime(toIsoDate(addDays(NOW, -3)))).toContain('día');
    });
  });

  describe('open()', () => {
    it('marca como leida y navega a la accion', async () => {
      await page.open(ITEMS[0] as AppNotification);

      expect(markRead).toHaveBeenCalledWith('n1');
      expect(router.navigate).toHaveBeenCalledWith(['/student/routine']);
    });

    it('no vuelve a marcar una ya leida', async () => {
      await page.open(ITEMS[1] as AppNotification);

      expect(markRead).not.toHaveBeenCalled();
    });

    it('no navega si no hay accion', async () => {
      await page.open(ITEMS[1] as AppNotification);

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('markAll()', () => {
    it('marca todas como leidas', () => {
      page.markAll();

      expect(markAllRead).toHaveBeenCalledWith('usr-1');
    });
  });

  describe('goBack()', () => {
    it('vuelve al home del alumno', () => {
      page.goBack();

      expect(router.navigate).toHaveBeenCalledWith(['/student/home']);
    });
  });

  describe('reload', () => {
    it('es un campo arrow invocable', () => {
      expect(() => page.reload()).not.toThrow();
    });
  });
});
