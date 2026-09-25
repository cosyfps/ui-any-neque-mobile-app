import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AppNotification,
  NotificationKind,
} from '@app/domain/notifications/model/notification.model';
import { NotificationsPort } from '@app/domain/notifications/port/notifications.port';
import { toIsoDate } from '@app/domain/shared/model/date';
import { Id } from '@app/domain/shared/model/ids';
import { CLOCK } from '@app/domain/shared/port/clock.port';

import { simulate, simulateError } from '../shared/mock-delay';

interface NotificationSeed {
  readonly minutesAgo: number;
  readonly kind: NotificationKind;
  readonly title: string;
  readonly body: string;
  readonly read: boolean;
  readonly actionRoute: string | null;
}

const SEEDS: readonly NotificationSeed[] = [
  {
    minutesAgo: 25,
    kind: 'session',
    title: 'Tu sesión de hoy te espera',
    body: 'Tren inferior a las 18:00. Recuerda llegar 10 minutos antes.',
    read: false,
    actionRoute: '/student/routine',
  },
  {
    minutesAgo: 180,
    kind: 'routine',
    title: 'Kelvin ajustó tu rutina',
    body: 'Subió la carga de sentadilla a 40 kg para este bloque.',
    read: false,
    actionRoute: '/student/routine',
  },
  {
    minutesAgo: 1_200,
    kind: 'message',
    title: 'Mensaje de tu entrenador',
    body: 'Buen trabajo esta semana. Sigamos con ese ritmo.',
    read: false,
    actionRoute: null,
  },
  {
    minutesAgo: 2_880,
    kind: 'session',
    title: 'Evaluación física agendada',
    body: 'Quedó para el sábado a las 10:00.',
    read: true,
    actionRoute: '/student/schedule',
  },
  {
    minutesAgo: 4_320,
    kind: 'routine',
    title: 'Completaste tu semana',
    body: 'Cerraste 4 de 4 sesiones. Excelente adherencia.',
    read: true,
    actionRoute: '/student/progress',
  },
  {
    minutesAgo: 10_080,
    kind: 'system',
    title: 'Bienvenida a Ñeque',
    body: 'Tu cuenta quedó activa. Revisa tu rutina para comenzar.',
    read: true,
    actionRoute: null,
  },
];

@Injectable()
export class NotificationsMockAdapter implements NotificationsPort {
  private readonly clock = inject(CLOCK);
  private notifications: AppNotification[];

  constructor() {
    const now = this.clock.now().getTime();

    this.notifications = SEEDS.map((seed, index) => ({
      id: `ntf-${String(index + 1).padStart(3, '0')}`,
      userId: 'usr-student-001',
      kind: seed.kind,
      title: seed.title,
      body: seed.body,
      createdAt: toIsoDate(new Date(now - seed.minutesAgo * 60_000)),
      readAt: seed.read ? toIsoDate(new Date(now - seed.minutesAgo * 60_000 + 60_000)) : null,
      actionRoute: seed.actionRoute,
    }));
  }

  listByUser(userId: Id): Observable<AppNotification[]> {
    return simulate(
      this.notifications
        .filter(item => item.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  }

  markRead(notificationId: Id): Observable<AppNotification> {
    const current = this.notifications.find(item => item.id === notificationId);
    if (current === undefined) {
      return simulateError<AppNotification>('not_found');
    }

    const updated: AppNotification = {
      ...current,
      readAt: current.readAt ?? toIsoDate(this.clock.now()),
    };
    this.notifications = this.notifications.map(item =>
      item.id === notificationId ? updated : item,
    );

    return simulate(updated);
  }

  markAllRead(userId: Id): Observable<void> {
    const readAt = toIsoDate(this.clock.now());
    this.notifications = this.notifications.map(item =>
      item.userId === userId && item.readAt === null ? { ...item, readAt } : item,
    );
    return simulate<void>(undefined);
  }
}
