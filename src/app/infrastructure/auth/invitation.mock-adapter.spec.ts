import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';

import { AuthSession } from '@app/domain/auth/model/auth-user.model';
import { InvitationDetails } from '@app/domain/auth/port/invitation.port';
import { DomainError } from '@app/domain/shared/model/app-error';
import { CLOCK } from '@app/domain/shared/port/clock.port';

import { InvitationMockAdapter } from './invitation.mock-adapter';

const NOW = new Date('2026-09-17T10:00:00.000Z');
const VALID_PASSWORD = 'Alumno1234!';

const resolve = <T>(source: Observable<T>): { value?: T; error?: DomainError } => {
  let value: T | undefined;
  let error: DomainError | undefined;
  source.subscribe({ next: v => (value = v), error: (e: DomainError) => (error = e) });
  jest.runAllTimers();
  return { value, error };
};

describe('InvitationMockAdapter', () => {
  let adapter: InvitationMockAdapter;

  beforeEach(() => {
    jest.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [InvitationMockAdapter, { provide: CLOCK, useValue: { now: () => NOW } }],
    });
    adapter = TestBed.inject(InvitationMockAdapter);
  });

  afterEach(() => jest.useRealTimers());

  describe('resolve()', () => {
    it('devuelve los datos de una invitacion vigente', () => {
      const { value } = resolve<InvitationDetails>(adapter.resolve('inv-valida'));

      expect(value?.studentName).toBe('Camila Soto');
      expect(value?.trainerName).toBe('Kelvin Moreno');
      expect(value?.status).toBe('pending');
    });

    it('rechaza un token desconocido', () => {
      expect(resolve(adapter.resolve('inv-inexistente')).error?.code).toBe('invalid_invitation');
    });

    it('explica que la invitacion expiro', () => {
      const { error } = resolve(adapter.resolve('inv-expirada'));

      expect(error?.code).toBe('invalid_invitation');
      expect(error?.message).toContain('expiró');
    });

    it('explica que la invitacion ya se uso', () => {
      const { error } = resolve(adapter.resolve('inv-usada'));

      expect(error?.code).toBe('invalid_invitation');
      expect(error?.message).toContain('ya fue utilizada');
    });
  });

  describe('accept()', () => {
    it('devuelve una sesion de alumno', () => {
      const { value } = resolve<AuthSession>(adapter.accept('inv-valida', VALID_PASSWORD));

      expect(value?.user.role).toBe('student');
      expect(value?.user.profileId).toBe('std-002');
      expect(value?.user.email).toBe('camila@neque.cl');
    });

    it('la sesion expira una semana despues del reloj inyectado', () => {
      const { value } = resolve<AuthSession>(adapter.accept('inv-valida', VALID_PASSWORD));

      expect(value?.expiresAt).toBe('2026-09-24T10:00:00.000Z');
    });

    it('invalida la invitacion tras aceptarla', () => {
      resolve(adapter.accept('inv-valida', VALID_PASSWORD));

      expect(resolve(adapter.resolve('inv-valida')).error?.message).toContain('ya fue utilizada');
    });

    it('no permite aceptarla dos veces', () => {
      resolve(adapter.accept('inv-valida', VALID_PASSWORD));

      expect(resolve(adapter.accept('inv-valida', VALID_PASSWORD)).error?.code).toBe(
        'invalid_invitation',
      );
    });

    it('rechaza una contrasena que no cumple el minimo', () => {
      const { error } = resolve(adapter.accept('inv-valida', 'corta'));

      expect(error?.code).toBe('invalid_invitation');
      expect(error?.message).toContain('requisitos');
    });

    it('rechaza un token desconocido', () => {
      expect(resolve(adapter.accept('inv-inexistente', VALID_PASSWORD)).error?.code).toBe(
        'invalid_invitation',
      );
    });

    it('rechaza una invitacion expirada', () => {
      expect(resolve(adapter.accept('inv-expirada', VALID_PASSWORD)).error?.code).toBe(
        'invalid_invitation',
      );
    });
  });

  it('dos instancias no comparten estado', () => {
    resolve(adapter.accept('inv-valida', VALID_PASSWORD));

    const otra = TestBed.runInInjectionContext(() => new InvitationMockAdapter());
    expect(resolve(otra.resolve('inv-valida')).value?.status).toBe('pending');
  });
});
