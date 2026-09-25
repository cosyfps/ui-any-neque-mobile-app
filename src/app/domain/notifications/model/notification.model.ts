import { Id, IsoDateString } from '@app/domain/shared/model/ids';

export type NotificationKind = 'routine' | 'session' | 'message' | 'system';

export const NOTIFICATION_KIND_LABEL: Record<NotificationKind, string> = {
  routine: 'Rutina',
  session: 'Sesión',
  message: 'Mensaje',
  system: 'Sistema',
};

export interface AppNotification {
  readonly id: Id;
  readonly userId: Id;
  readonly kind: NotificationKind;
  readonly title: string;
  readonly body: string;
  readonly createdAt: IsoDateString;
  /** Null mientras no se ha leido. */
  readonly readAt: IsoDateString | null;
  /** Ruta interna a la que lleva el toque, si corresponde. */
  readonly actionRoute: string | null;
}

/**
 * No existe un `unreadCount()` en el puerto a proposito: se deriva de la
 * lista que ya trae `listByUser`, asi que es un computed de la facade.
 */
export function isUnread(notification: AppNotification): boolean {
  return notification.readAt === null;
}
