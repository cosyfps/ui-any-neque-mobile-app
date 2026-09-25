import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlTree } from '@angular/router';

import { SessionFacade } from '@app/application/auth/session.facade';
import { UserRole, homeRouteForRole } from '@app/domain/auth/model/auth-user.model';

/**
 * Exige sesion activa. Se aplica con `canMatch` para que el chunk de la ruta
 * ni siquiera se descargue sin sesion.
 */
export const authGuard: CanMatchFn = (): boolean | UrlTree => {
  const session = inject(SessionFacade);
  const router = inject(Router);

  session.restore();

  return session.isAuthenticated() ? true : router.parseUrl('/');
};

/**
 * Exige sesion activa con un rol concreto. Si el rol no calza, redirige al
 * home del rol que si tiene: un alumno nunca ve el shell del entrenador.
 */
export function roleGuard(role: UserRole): CanMatchFn {
  return (): boolean | UrlTree => {
    const session = inject(SessionFacade);
    const router = inject(Router);

    session.restore();

    const current = session.role();
    if (current === null) {
      return router.parseUrl('/');
    }
    return current === role ? true : router.parseUrl(homeRouteForRole(current));
  };
}

/**
 * Para las rutas publicas de acceso: con sesion activa manda al home del rol
 * en vez de volver a mostrar el login.
 */
export const publicOnlyGuard: CanMatchFn = (): boolean | UrlTree => {
  const session = inject(SessionFacade);
  const router = inject(Router);

  session.restore();

  const current = session.role();
  return current === null ? true : router.parseUrl(homeRouteForRole(current));
};
