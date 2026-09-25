import { Injectable, inject } from '@angular/core';
import { Observable, catchError, switchMap } from 'rxjs';

import { AuthSession } from '@app/domain/auth/model/auth-user.model';
import {
  INVITATION_TTL_HOURS,
  InvitationDetails,
  InvitationPort,
} from '@app/domain/auth/port/invitation.port';
import { addDays, toIsoDate } from '@app/domain/shared/model/date';
import { Id } from '@app/domain/shared/model/ids';
import { CLOCK } from '@app/domain/shared/port/clock.port';
import { STUDENTS_PORT } from '@app/domain/students/port/students.port';

import { cloneSeed, simulate, simulateError } from '../shared/mock-delay';

import { SEED_INVITATIONS } from './seed/invitations.seed';

const SESSION_DAYS = 7;
const MS_POR_HORA = 60 * 60 * 1000;

/** Por que la invitacion ya no sirve, en palabras del alumno. */
const MENSAJES: Record<Exclude<InvitationDetails['status'], 'pending'>, string> = {
  expired: 'Esta invitación expiró. Pídele a tu entrenador que te envíe una nueva.',
  accepted: 'Esta invitación ya fue utilizada. Ingresa con tu correo y contraseña.',
  revoked: 'Esta invitación ya no es válida. Pídele a tu entrenador que te envíe otra.',
};

/**
 * Invitaciones en memoria.
 *
 * Tres tokens semilla cubren los tres caminos de la pantalla: valido,
 * expirado y ya utilizado.
 */
@Injectable()
export class InvitationMockAdapter implements InvitationPort {
  private readonly clock = inject(CLOCK);
  /**
   * El alta y la invitacion tienen que ver el mismo alumno.
   *
   * Leer la semilla directo dejaba fuera a los alumnos creados en la sesion:
   * el BFF consulta una sola base, y aqui el estado vivo lo tiene el puerto.
   */
  private readonly students = inject(STUDENTS_PORT);
  private invitations: InvitationDetails[] = cloneSeed(SEED_INVITATIONS) as InvitationDetails[];

  resolve(token: string): Observable<InvitationDetails> {
    const invitation = this.find(token);

    if (invitation === undefined) {
      return simulateError<InvitationDetails>('invalid_invitation');
    }
    if (invitation.status !== 'pending') {
      return simulateError<InvitationDetails>(
        'invalid_invitation',
        undefined,
        MENSAJES[invitation.status],
      );
    }

    return simulate(invitation);
  }

  accept(token: string, password: string): Observable<AuthSession> {
    const invitation = this.find(token);

    if (invitation === undefined || invitation.status !== 'pending') {
      return simulateError<AuthSession>('invalid_invitation');
    }
    if (password.length < 8) {
      return simulateError<AuthSession>(
        'invalid_invitation',
        undefined,
        'La contraseña no cumple los requisitos.',
      );
    }

    this.invitations = this.invitations.map(item =>
      item.token === token ? { ...item, status: 'accepted' } : item,
    );

    return simulate<AuthSession>({
      user: {
        id: `usr-${invitation.studentId}`,
        email: invitation.email,
        role: 'student',
        displayName: invitation.studentName,
        avatarUrl: null,
        profileId: invitation.studentId,
      },
      token: `mock-token-${invitation.studentId}`,
      expiresAt: toIsoDate(addDays(this.clock.now(), SESSION_DAYS)),
    });
  }

  getForStudent(studentId: Id): Observable<InvitationDetails | null> {
    const vigente = this.invitations.find(
      item => item.studentId === studentId && item.status === 'pending',
    );
    return simulate(vigente ?? null);
  }

  /**
   * Emite una invitacion e invalida la anterior del mismo alumno.
   *
   * Reemitir sin revocar dejaria dos enlaces validos a la vez, y el primero
   * es justamente el que el alumno ya no tiene.
   */
  create(studentId: Id): Observable<InvitationDetails> {
    return this.students.getById(studentId).pipe(
      switchMap(alumno => {
        const emitida: InvitationDetails = {
          token: `inv-${studentId}-${this.clock.now().getTime()}`,
          studentId,
          studentName: `${alumno.firstName} ${alumno.lastName}`.trim(),
          email: alumno.email,
          trainerName: alumno.trainerName,
          expiresAt: toIsoDate(
            new Date(this.clock.now().getTime() + INVITATION_TTL_HOURS * MS_POR_HORA),
          ),
          status: 'pending',
        };

        this.invitations = [
          ...this.invitations.map(item =>
            item.studentId === studentId && item.status === 'pending'
              ? { ...item, status: 'revoked' as const }
              : item,
          ),
          emitida,
        ];

        return simulate(emitida);
      }),
      catchError(() => simulateError<InvitationDetails>('not_found')),
    );
  }

  revoke(token: string): Observable<void> {
    if (this.find(token) === undefined) {
      return simulateError<void>('not_found');
    }

    this.invitations = this.invitations.map(item =>
      item.token === token ? { ...item, status: 'revoked' } : item,
    );

    return simulate<void>(undefined);
  }

  private find(token: string): InvitationDetails | undefined {
    return this.invitations.find(item => item.token === token);
  }
}
