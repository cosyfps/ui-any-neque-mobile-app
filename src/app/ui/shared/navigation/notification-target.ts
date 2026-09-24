import { NotificationTarget } from '@app/domain/notifications/model/notification.model';
import { Id } from '@app/domain/shared/model/ids';

/**
 * Traduce el destino de una notificacion a una ruta del alumno.
 *
 * El mapeo vive aqui y no en los datos a proposito: la base guarda
 * `targetType` + `targetId`, no conoce la navegacion del front. Si manana la
 * ruta de una entidad cambia, cambia en este archivo y en ninguno mas.
 */
const RUTAS: Record<NotificationTarget, (targetId: Id) => string[]> = {
  routine: () => ['/student/routine'],
  session: targetId => ['/student/workout', targetId],
  assessment: () => ['/student/schedule'],
  photo: () => ['/student/progress'],
};

export function notificationRoute(
  targetType: NotificationTarget | null,
  targetId: Id | null,
): string[] | null {
  if (targetType === null || targetId === null) {
    return null;
  }
  return RUTAS[targetType](targetId);
}
