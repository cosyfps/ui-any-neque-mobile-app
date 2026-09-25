import { Routes } from '@angular/router';

import { provideInvitationMockAdapters } from '@app/infrastructure/auth/invitation-providers';

/**
 * Ruta de la invitacion.
 *
 * Existe como archivo aparte y no como `providers` dentro de `app.routes.ts`
 * a proposito: ahi la llamada a `provideInvitationMockAdapters()` se evalua al
 * arrancar la app, y arrastraba el adapter y la semilla de alumnos al bundle
 * inicial. Con `loadChildren` viajan en su propio chunk.
 */
export const INVITE_ROUTES: Routes = [
  {
    path: '',
    providers: [provideInvitationMockAdapters()],
    loadComponent: () => import('./invite.page').then(m => m.InvitePage),
  },
];
