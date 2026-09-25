import { Provider } from '@angular/core';

import { AUTH_PORT } from '@app/domain/auth/port/auth.port';
import { SESSION_STORAGE_PORT } from '@app/domain/auth/port/session-storage.port';

import { AuthMockAdapter } from './auth.mock-adapter';
import { LocalStorageSessionAdapter } from './local-storage-session.adapter';

/**
 * Providers de autenticacion. Van en el injector raiz porque el guard los
 * necesita antes de resolver cualquier ruta.
 *
 * La invitacion vive en `invitation-providers.ts` y no aqui: este modulo lo
 * importa el injector raiz, asi que cualquier import suyo acaba en el bundle
 * inicial aunque solo lo use una ruta lazy.
 */
export function provideAuthMockAdapters(): Provider[] {
  return [
    AuthMockAdapter,
    LocalStorageSessionAdapter,
    { provide: AUTH_PORT, useExisting: AuthMockAdapter },
    { provide: SESSION_STORAGE_PORT, useExisting: LocalStorageSessionAdapter },
  ];
}
