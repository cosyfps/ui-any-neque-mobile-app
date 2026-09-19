import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { Id, IsoDateString } from '@app/domain/shared/model/ids';

import { AuthSession } from '../model/auth-user.model';

export type InvitationStatus = 'pending' | 'accepted' | 'expired';

/**
 * Invitacion emitida por un entrenador para que un alumno cree su acceso.
 *
 * El entrenador nunca conoce ni define la contrasena: solo comparte el enlace.
 */
export interface InvitationDetails {
  readonly token: string;
  readonly studentId: Id;
  readonly studentName: string;
  readonly email: string;
  readonly trainerName: string;
  readonly expiresAt: IsoDateString;
  readonly status: InvitationStatus;
}

export interface InvitationPort {
  /** Resuelve los datos de la invitacion. Falla si el token no sirve. */
  resolve(token: string): Observable<InvitationDetails>;
  /** Fija la contrasena del alumno y devuelve su sesion ya iniciada. */
  accept(token: string, password: string): Observable<AuthSession>;
}

export const INVITATION_PORT = new InjectionToken<InvitationPort>('InvitationPort');
