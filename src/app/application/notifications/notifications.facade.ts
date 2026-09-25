import { Injectable, Signal, computed, inject } from '@angular/core';

import { SessionFacade } from '@app/application/auth/session.facade';
import { AppNotification, isUnread } from '@app/domain/notifications/model/notification.model';
import { NOTIFICATIONS_PORT } from '@app/domain/notifications/port/notifications.port';
import { differenceInDays, parseIsoDate } from '@app/domain/shared/model/date';
import { CLOCK } from '@app/domain/shared/port/clock.port';

import { AsyncState, ViewState, asyncState } from '../shared/async-state';

/** Notificaciones agrupadas por antiguedad. */
export interface NotificationGroup {
  readonly label: string;
  readonly items: readonly AppNotification[];
}

/** Notificaciones del usuario autenticado. */
// Scoped a la ruta /student: sus puertos viven en ese injector, no en el raiz.
@Injectable()
export class NotificationsFacade {
  private readonly port = inject(NOTIFICATIONS_PORT);
  private readonly session = inject(SessionFacade);
  private readonly clock = inject(CLOCK);

  readonly items: AsyncState<AppNotification[]> = asyncState<AppNotification[]>();

  readonly all: Signal<readonly AppNotification[]> = computed(() => this.items.data() ?? []);

  readonly unreadCount: Signal<number> = computed(() => this.all().filter(isUnread).length);

  readonly hasUnread: Signal<boolean> = computed(() => this.unreadCount() > 0);

  /** Hoy, esta semana y antes. Los grupos vacios no se emiten. */
  readonly groups: Signal<readonly NotificationGroup[]> = computed(() => {
    const now = this.clock.now();
    const today: AppNotification[] = [];
    const week: AppNotification[] = [];
    const older: AppNotification[] = [];

    for (const notification of this.all()) {
      const createdAt = parseIsoDate(notification.createdAt);
      const days = createdAt === null ? Number.MAX_SAFE_INTEGER : differenceInDays(createdAt, now);

      if (days <= 0) {
        today.push(notification);
      } else if (days <= 7) {
        week.push(notification);
      } else {
        older.push(notification);
      }
    }

    const groups: NotificationGroup[] = [];
    if (today.length > 0) groups.push({ label: 'Hoy', items: today });
    if (week.length > 0) groups.push({ label: 'Esta semana', items: week });
    if (older.length > 0) groups.push({ label: 'Antes', items: older });

    return groups;
  });

  readonly viewState: Signal<ViewState> = this.items.viewState;

  load(): void {
    const userId = this.session.user()?.id ?? null;
    if (userId === null) {
      return;
    }
    this.items.load(() => this.port.listByUser(userId));
  }

  reload(): void {
    this.items.reload();
  }

  markRead(notificationId: string): Promise<boolean> {
    return new Promise(resolve => {
      this.port.markRead(notificationId).subscribe({
        next: updated => {
          this.items.set(this.all().map(item => (item.id === updated.id ? updated : item)));
          resolve(true);
        },
        error: () => resolve(false),
      });
    });
  }

  markAllRead(): Promise<boolean> {
    const userId = this.session.user()?.id ?? null;
    if (userId === null) {
      return Promise.resolve(false);
    }

    const readAt = this.clock.now().toISOString();

    return new Promise(resolve => {
      this.port.markAllRead(userId).subscribe({
        next: () => {
          this.items.set(
            this.all().map(item => (item.readAt === null ? { ...item, readAt } : item)),
          );
          resolve(true);
        },
        error: () => resolve(false),
      });
    });
  }
}
