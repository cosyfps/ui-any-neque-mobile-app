import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';

import { AuthSession } from '@app/domain/auth/model/auth-user.model';
import { INVITATION_TTL_HOURS, InvitationDetails } from '@app/domain/auth/port/invitation.port';
import { DomainError } from '@app/domain/shared/model/app-error';
import { CLOCK } from '@app/domain/shared/port/clock.port';
import { STUDENTS_PORT } from '@app/domain/students/port/students.port';

import { StudentsMockAdapter } from '../students/students.mock-adapter';

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
      providers: [
        InvitationMockAdapter,
        // `create()` resuelve al alumno por el puerto, para ver tambien a los
        // que se dieron de alta en la sesion y no solo a los de la semilla.
        StudentsMockAdapter,
        { provide: STUDENTS_PORT, useExisting: StudentsMockAdapter },
        { provide: CLOCK, useValue: { now: () => NOW } },
      ],
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

  describe('getForStudent()', () => {
    it('devuelve la invitacion pendiente del alumno', () => {
      const { value } = resolve<InvitationDetails | null>(adapter.getForStudent('std-002'));

      expect(value?.token).toBe('inv-valida');
    });

    // Una invitacion ya aceptada no es una invitacion vigente.
    it('devuelve null cuando la unica invitacion esta aceptada', () => {
      const { value } = resolve<InvitationDetails | null>(adapter.getForStudent('std-001'));

      expect(value).toBeNull();
    });
  });

  describe('create()', () => {
    it('emite una invitacion vigente por las horas del TTL', () => {
      const { value } = resolve<InvitationDetails>(adapter.create('std-001'));

      expect(value?.status).toBe('pending');
      expect(value?.email).toBe('ana@neque.cl');
      expect(value?.expiresAt).toBe(
        new Date(NOW.getTime() + INVITATION_TTL_HOURS * 60 * 60 * 1000).toISOString(),
      );
    });

    // Reemitir sin revocar dejaria dos enlaces validos a la vez.
    it('revoca la invitacion pendiente anterior del alumno', () => {
      resolve<InvitationDetails>(adapter.create('std-002'));

      expect(resolve<InvitationDetails>(adapter.resolve('inv-valida')).error?.code).toBe(
        'invalid_invitation',
      );
    });

    it('deja una sola invitacion vigente tras reemitir', () => {
      const { value: emitida } = resolve<InvitationDetails>(adapter.create('std-002'));

      const { value } = resolve<InvitationDetails | null>(adapter.getForStudent('std-002'));
      expect(value?.token).toBe(emitida?.token);
    });

    // El alta y la invitacion son un solo gesto: leer la semilla en vez del
    // puerto dejaba sin invitacion a todo alumno creado en la sesion.
    it('invita a un alumno dado de alta en esta sesion', () => {
      const students = TestBed.inject(StudentsMockAdapter);
      let creado = '';
      students
        .create({
          trainerId: 'trn-001',
          firstName: 'Valentina',
          lastName: 'Núñez',
          email: 'vale@neque.cl',
          phone: null,
          birthDate: null,
          heightCm: null,
          goal: null,
        })
        .subscribe(student => (creado = student.id));
      jest.runAllTimers();

      const { value } = resolve<InvitationDetails>(adapter.create(creado));

      expect(value?.studentName).toBe('Valentina Núñez');
      expect(value?.email).toBe('vale@neque.cl');
    });

    it('falla con un alumno desconocido', () => {
      const { error } = resolve<InvitationDetails>(adapter.create('std-999'));

      expect(error?.code).toBe('not_found');
    });
  });

  describe('revoke()', () => {
    it('inutiliza el token revocado', () => {
      resolve<void>(adapter.revoke('inv-valida'));

      const { error } = resolve<InvitationDetails>(adapter.resolve('inv-valida'));
      expect(error?.message).toContain('ya no es válida');
    });

    it('falla con un token desconocido', () => {
      const { error } = resolve<void>(adapter.revoke('inv-inexistente'));

      expect(error?.code).toBe('not_found');
    });
  });

  it('dos instancias no comparten estado', () => {
    resolve(adapter.accept('inv-valida', VALID_PASSWORD));

    const otra = TestBed.runInInjectionContext(() => new InvitationMockAdapter());
    expect(resolve(otra.resolve('inv-valida')).value?.status).toBe('pending');
  });
});
