import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AuthSession,
  Credentials,
  PasswordResetTicket,
} from '@app/domain/auth/model/auth-user.model';
import { AuthPort } from '@app/domain/auth/port/auth.port';
import { addDays, toIsoDate } from '@app/domain/shared/model/date';
import { CLOCK } from '@app/domain/shared/port/clock.port';

import { MOCK_LATENCY_MS, cloneSeed, simulate, simulateError } from '../shared/mock-delay';

import { SEED_ACCOUNTS, SEED_OTP_CODE, SeedAccount } from './seed/accounts.seed';

/** Duracion de la sesion simulada, en dias. */
const SESSION_DAYS = 7;

/** Intentos fallidos seguidos que bloquean el correo. */
export const MAX_LOGIN_ATTEMPTS = 5;

/** Minutos que dura el bloqueo por intentos fallidos. */
export const LOGIN_LOCK_MINUTES = 5;

interface FailedLogins {
  count: number;
  lockedUntil: number | null;
}

/**
 * Adapter de autenticacion contra cuentas en memoria.
 *
 * Reemplazable por un HttpAuthAdapter contra el BFF sin tocar dominio,
 * aplicacion ni UI.
 */
@Injectable()
export class AuthMockAdapter implements AuthPort {
  private readonly clock = inject(CLOCK);
  private readonly accounts: SeedAccount[] = cloneSeed(SEED_ACCOUNTS) as SeedAccount[];
  /** Tickets de recuperacion vivos. Estado por instancia, nunca modulo-global. */
  private readonly resetTickets = new Set<string>();
  /** Intentos fallidos seguidos por correo normalizado. */
  private readonly failedLogins = new Map<string, FailedLogins>();

  login(credentials: Credentials): Observable<AuthSession> {
    const key = credentials.email.trim().toLowerCase();
    const now = this.clock.now().getTime();
    const lockedUntil = this.failedLogins.get(key)?.lockedUntil ?? null;

    if (lockedUntil !== null) {
      if (lockedUntil > now) {
        return simulateError<AuthSession>('too_many_attempts');
      }
      this.failedLogins.delete(key);
    }

    const account = this.findByEmail(credentials.email);

    if (account === undefined || account.password !== credentials.password) {
      return simulateError<AuthSession>(this.registerFailure(key, now));
    }

    this.failedLogins.delete(key);
    return simulate(this.buildSession(account));
  }

  signOut(): Observable<void> {
    return simulate<void>(undefined, MOCK_LATENCY_MS / 2);
  }

  requestPasswordReset(email: string): Observable<void> {
    if (this.findByEmail(email) === undefined) {
      return simulateError<void>('not_found', MOCK_LATENCY_MS, 'No hay una cuenta con ese correo.');
    }
    return simulate<void>(undefined);
  }

  verifyOtp(email: string, code: string): Observable<PasswordResetTicket> {
    const account = this.findByEmail(email);

    if (account === undefined) {
      return simulateError<PasswordResetTicket>(
        'not_found',
        MOCK_LATENCY_MS,
        'No hay una cuenta con ese correo.',
      );
    }
    if (code !== SEED_OTP_CODE) {
      return simulateError<PasswordResetTicket>(
        'invalid_credentials',
        MOCK_LATENCY_MS,
        'El código no es válido.',
      );
    }

    const token = `reset-${account.user.id}-${this.clock.now().getTime()}`;
    this.resetTickets.add(token);

    return simulate({ email: account.user.email, token });
  }

  resetPassword(ticket: PasswordResetTicket, newPassword: string): Observable<AuthSession> {
    const account = this.findByEmail(ticket.email);

    // El ticket es de un solo uso: sin esto, quien capture el token podria
    // cambiar la contrasena tantas veces como quiera.
    if (account === undefined || !this.resetTickets.has(ticket.token)) {
      return simulateError<AuthSession>(
        'unauthorized',
        MOCK_LATENCY_MS,
        'El enlace de recuperación ya no es válido. Pide uno nuevo.',
      );
    }

    this.resetTickets.delete(ticket.token);
    account.password = newPassword;

    return simulate(this.buildSession(account));
  }

  /** Suma un intento fallido y bloquea el correo al llegar al tope. */
  private registerFailure(key: string, now: number): 'invalid_credentials' | 'too_many_attempts' {
    const count = (this.failedLogins.get(key)?.count ?? 0) + 1;
    if (count >= MAX_LOGIN_ATTEMPTS) {
      this.failedLogins.set(key, { count, lockedUntil: now + LOGIN_LOCK_MINUTES * 60_000 });
      return 'too_many_attempts';
    }
    this.failedLogins.set(key, { count, lockedUntil: null });
    return 'invalid_credentials';
  }

  private findByEmail(email: string): SeedAccount | undefined {
    const normalized = email.trim().toLowerCase();
    return this.accounts.find(account => account.user.email === normalized);
  }

  private buildSession(account: SeedAccount): AuthSession {
    return {
      user: account.user,
      token: `mock-token-${account.user.id}`,
      expiresAt: toIsoDate(addDays(this.clock.now(), SESSION_DAYS)),
    };
  }
}
