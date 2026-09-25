import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { Id } from '@app/domain/shared/model/ids';

import { AppNotification } from '../model/notification.model';

export interface NotificationsPort {
  listByUser(userId: Id): Observable<AppNotification[]>;
  markRead(notificationId: Id): Observable<AppNotification>;
  markAllRead(userId: Id): Observable<void>;
}

export const NOTIFICATIONS_PORT = new InjectionToken<NotificationsPort>('NotificationsPort');
