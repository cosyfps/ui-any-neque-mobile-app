import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AuthSession } from '@app/domain/auth/model/auth-user.model';
import { InvitationDetails, InvitationPort } from '@app/domain/auth/port/invitation.port';
import { addDays, toIsoDate } from '@app/domain/shared/model/date';
import { CLOCK } from '@app/domain/shared/port/clock.port';

import { cloneSeed, simulate, simulateError } from '../shared/mock-delay';

import { SEED_INVITATIONS } from './seed/invitations.seed';

const SESSION_DAYS = 7;

/**
 * Invitaciones en memoria.
 *
 * Tres tokens semilla cubren los tres caminos de la pantalla: valido,
 * expirado y ya utilizado.
 */
@Injectable()
export class InvitationMockAdapter implements InvitationPort {
  private readonly clock = inject(CLOCK);
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
        invitation.status === 'expired'
          ? 'Esta invitación expiró. Pídele a tu entrenador que te envíe una nueva.'
          : 'Esta invitación ya fue utilizada. Ingresa con tu correo y contraseña.',
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

  private find(token: string): InvitationDetails | undefined {
    return this.invitations.find(item => item.token === token);
  }
}
