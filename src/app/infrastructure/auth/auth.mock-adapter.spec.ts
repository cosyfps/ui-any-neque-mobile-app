import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';

import { AuthSession, PasswordResetTicket } from '@app/domain/auth/model/auth-user.model';
import { DomainError } from '@app/domain/shared/model/app-error';
import { CLOCK } from '@app/domain/shared/port/clock.port';

import { AuthMockAdapter } from './auth.mock-adapter';
import { SEED_OTP_CODE } from './seed/accounts.seed';

const NOW = new Date('2026-09-17T10:00:00.000Z');

describe('AuthMockAdapter', () => {
  let adapter: AuthMockAdapter;

  beforeEach(() => {
    jest.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [AuthMockAdapter, { provide: CLOCK, useValue: { now: () => NOW } }],
    });
    adapter = TestBed.inject(AuthMockAdapter);
  });

  afterEach(() => jest.useRealTimers());

  /** Corre la latencia simulada y devuelve lo que emitio el observable. */
  const resolve = <T>(
    source: Observable<T>,
  ): { value: T | undefined; error: DomainError | undefined } => {
    let value: T | undefined;
    let error: DomainError | undefined;
    source.subscribe({
      next: v => (value = v),
      error: (e: DomainError) => (error = e),
    });
    jest.runAllTimers();
    return { value, error };
  };

  describe('login()', () => {
    it('autentica al entrenador semilla', () => {
      const { value } = resolve<AuthSession>(
        adapter.login({ email: 'kelvin@neque.cl', password: 'Entrenador1!' }),
      );

      expect(value?.user.role).toBe('trainer');
      expect(value?.user.profileId).toBe('trn-001');
      expect(value?.token).toBe('mock-token-usr-trainer-001');
    });

    it('autentica al alumno semilla', () => {
      const { value } = resolve<AuthSession>(
        adapter.login({ email: 'alejandra@neque.cl', password: 'Alumno1234!' }),
      );

      expect(value?.user.role).toBe('student');
      expect(value?.user.profileId).toBe('std-001');
    });

    it('normaliza mayusculas y espacios del correo', () => {
      const { value } = resolve<AuthSession>(
        adapter.login({ email: '  ALEJANDRA@NEQUE.CL ', password: 'Alumno1234!' }),
      );

      expect(value?.user.role).toBe('student');
    });

    it('la sesion expira una semana despues del reloj inyectado', () => {
      const { value } = resolve<AuthSession>(
        adapter.login({ email: 'alejandra@neque.cl', password: 'Alumno1234!' }),
      );

      expect(value?.expiresAt).toBe('2026-09-24T10:00:00.000Z');
    });

    it('rechaza una contrasena incorrecta', () => {
      const { error } = resolve<AuthSession>(
        adapter.login({ email: 'alejandra@neque.cl', password: 'incorrecta' }),
      );

      expect(error?.code).toBe('invalid_credentials');
    });

    it('rechaza un correo desconocido', () => {
      const { error } = resolve<AuthSession>(
        adapter.login({ email: 'nadie@neque.cl', password: 'Alumno1234!' }),
      );

      expect(error?.code).toBe('invalid_credentials');
    });
  });

  describe('signOut()', () => {
    it('resuelve sin error', () => {
      const { error } = resolve<void>(adapter.signOut());
      expect(error).toBeUndefined();
    });
  });

  describe('requestPasswordReset()', () => {
    it('acepta un correo existente', () => {
      const { error } = resolve<void>(adapter.requestPasswordReset('alejandra@neque.cl'));
      expect(error).toBeUndefined();
    });

    it('rechaza un correo desconocido', () => {
      const { error } = resolve<void>(adapter.requestPasswordReset('nadie@neque.cl'));
      expect(error?.code).toBe('not_found');
    });
  });

  describe('verifyOtp()', () => {
    it('entrega un ticket de recuperacion, no una sesion', () => {
      const { value } = resolve<PasswordResetTicket>(
        adapter.verifyOtp('alejandra@neque.cl', SEED_OTP_CODE),
      );
      expect(value?.email).toBe('alejandra@neque.cl');
      expect(value?.token).toEqual(expect.any(String));
    });

    it('rechaza un codigo incorrecto', () => {
      const { error } = resolve<PasswordResetTicket>(
        adapter.verifyOtp('alejandra@neque.cl', '000000'),
      );
      expect(error?.code).toBe('invalid_credentials');
    });

    it('rechaza un correo desconocido', () => {
      const { error } = resolve<PasswordResetTicket>(
        adapter.verifyOtp('nadie@neque.cl', SEED_OTP_CODE),
      );
      expect(error?.code).toBe('not_found');
    });
  });

  describe('resetPassword()', () => {
    const ticketFor = (email: string): PasswordResetTicket => {
      const { value } = resolve<PasswordResetTicket>(adapter.verifyOtp(email, SEED_OTP_CODE));
      return value as PasswordResetTicket;
    };

    it('abre sesion con la contrasena nueva', () => {
      const { value } = resolve<AuthSession>(
        adapter.resetPassword(ticketFor('alejandra@neque.cl'), 'Nueva1234!'),
      );
      expect(value?.user.role).toBe('student');
    });

    it('deja de aceptar la contrasena anterior', () => {
      resolve<AuthSession>(adapter.resetPassword(ticketFor('alejandra@neque.cl'), 'Nueva1234!'));

      const { error } = resolve<AuthSession>(
        adapter.login({ email: 'alejandra@neque.cl', password: 'Alumno1234!' }),
      );
      expect(error?.code).toBe('invalid_credentials');
    });

    it('acepta la contrasena nueva en el login', () => {
      resolve<AuthSession>(adapter.resetPassword(ticketFor('alejandra@neque.cl'), 'Nueva1234!'));

      const { value } = resolve<AuthSession>(
        adapter.login({ email: 'alejandra@neque.cl', password: 'Nueva1234!' }),
      );
      expect(value?.user.email).toBe('alejandra@neque.cl');
    });

    it('invalida el ticket despues de usarlo', () => {
      const ticket = ticketFor('alejandra@neque.cl');
      resolve<AuthSession>(adapter.resetPassword(ticket, 'Nueva1234!'));

      const { error } = resolve<AuthSession>(adapter.resetPassword(ticket, 'Otra1234!'));
      expect(error?.code).toBe('unauthorized');
    });

    it('rechaza un ticket que nunca emitio', () => {
      const { error } = resolve<AuthSession>(
        adapter.resetPassword({ email: 'alejandra@neque.cl', token: 'inventado' }, 'Nueva1234!'),
      );
      expect(error?.code).toBe('unauthorized');
    });

    it('rechaza un correo desconocido', () => {
      const { error } = resolve<AuthSession>(
        adapter.resetPassword({ email: 'nadie@neque.cl', token: 'x' }, 'Nueva1234!'),
      );
      expect(error?.code).toBe('unauthorized');
    });
  });

  it('no entrega referencias a su estado interno', () => {
    const first = resolve<AuthSession>(
      adapter.login({ email: 'alejandra@neque.cl', password: 'Alumno1234!' }),
    ).value;
    const second = resolve<AuthSession>(
      adapter.login({ email: 'alejandra@neque.cl', password: 'Alumno1234!' }),
    ).value;

    expect(first).not.toBe(second);
    expect(first?.user).not.toBe(second?.user);
  });
});
