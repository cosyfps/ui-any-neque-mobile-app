import { Provider } from '@angular/core';

import { InvitationFacade } from '@app/application/auth/invitation.facade';
import { AUTH_PORT } from '@app/domain/auth/port/auth.port';
import { INVITATION_PORT } from '@app/domain/auth/port/invitation.port';
import { SESSION_STORAGE_PORT } from '@app/domain/auth/port/session-storage.port';

import { AuthMockAdapter } from './auth.mock-adapter';
import { InvitationMockAdapter } from './invitation.mock-adapter';
import { LocalStorageSessionAdapter } from './local-storage-session.adapter';

/**
 * Providers de autenticacion. Van en el injector raiz porque el guard los
 * necesita antes de resolver cualquier ruta.
 */
export function provideAuthMockAdapters(): Provider[] {
  return [
    AuthMockAdapter,
    LocalStorageSessionAdapter,
    { provide: AUTH_PORT, useExisting: AuthMockAdapter },
    { provide: SESSION_STORAGE_PORT, useExisting: LocalStorageSessionAdapter },
  ];
}

/**
 * Invitacion. Vive en la ruta `/invite/:token` y no en el raiz: solo la
 * necesita esa pantalla y asi viaja en su chunk lazy.
 *
 * Esta funcion existe para que la pagina no importe de `infrastructure`.
 * Con el adapter declarado en sus propios `providers`, conectar el BFF
 * obligaba a editar un archivo de `ui` y rompia el criterio de la arquitectura.
 */
export function provideInvitationMockAdapters(): Provider[] {
  return [
    InvitationMockAdapter,
    { provide: INVITATION_PORT, useExisting: InvitationMockAdapter },
    InvitationFacade,
  ];
}
