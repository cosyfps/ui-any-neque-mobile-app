import { Provider } from '@angular/core';

import { InvitationFacade } from '@app/application/auth/invitation.facade';
import { INVITATION_PORT } from '@app/domain/auth/port/invitation.port';
import { STUDENTS_PORT } from '@app/domain/students/port/students.port';

import { StudentsMockAdapter } from '../students/students.mock-adapter';

import { InvitationMockAdapter } from './invitation.mock-adapter';

/**
 * Invitacion. Solo la necesita `/invite/:token`, asi que se registra en esa
 * ruta y viaja en su chunk lazy.
 *
 * Esta funcion existe para que la pagina no importe de `infrastructure`: con
 * el adapter declarado en sus propios `providers`, conectar el BFF obligaba a
 * editar un archivo de `ui` y rompia el criterio de la arquitectura.
 */
export function provideInvitationMockAdapters(): Provider[] {
  return [
    // `create()` resuelve al alumno por el puerto, no por la semilla: aqui
    // no se emiten invitaciones, pero sin el el injector queda incompleto.
    StudentsMockAdapter,
    { provide: STUDENTS_PORT, useExisting: StudentsMockAdapter },
    InvitationMockAdapter,
    { provide: INVITATION_PORT, useExisting: InvitationMockAdapter },
    InvitationFacade,
  ];
}
