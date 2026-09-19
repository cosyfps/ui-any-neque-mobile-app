import { InjectionToken } from '@angular/core';

import { AuthSession } from '../model/auth-user.model';

/**
 * Persistencia de la sesion entre arranques de la app.
 *
 * Es sincrono a proposito: el guard necesita decidir antes de que se resuelva
 * la ruta. El adapter nativo sobre Preferences cachea en memoria al arrancar.
 */
export interface SessionStoragePort {
  read(): AuthSession | null;
  write(session: AuthSession): void;
  clear(): void;
}

export const SESSION_STORAGE_PORT = new InjectionToken<SessionStoragePort>('SessionStoragePort');
