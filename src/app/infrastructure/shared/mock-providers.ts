import { Provider } from '@angular/core';

import { CLOCK } from '@app/domain/shared/port/clock.port';

import { provideAuthMockAdapters } from '../auth/auth-providers';

import { SystemClock } from './system-clock';

/**
 * Providers de infraestructura del injector raiz: reloj y autenticacion.
 * Los puertos que solo usa el alumno se registran en `student.routes.ts`
 * para que viajen en su chunk lazy.
 *
 * Al conectar el BFF, `provideMockData()` se reemplaza por
 * `provideHttpAdapters()` y ningun archivo de domain, application o ui cambia.
 */
export function provideMockData(): Provider[] {
  return [{ provide: CLOCK, useClass: SystemClock }, ...provideAuthMockAdapters()];
}
