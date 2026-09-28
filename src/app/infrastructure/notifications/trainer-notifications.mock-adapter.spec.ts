import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { AppNotification } from '@app/domain/notifications/model/notification.model';
import { DomainError } from '@app/domain/shared/model/app-error';
import { toIsoDate } from '@app/domain/shared/model/date';
import { CLOCK } from '@app/domain/shared/port/clock.port';
import { Student } from '@app/domain/students/model/student.model';
import { STUDENTS_PORT } from '@app/domain/students/port/students.port';
import {
  WorkoutExerciseLog,
  WorkoutSession,
  WorkoutStatus,
} from '@app/domain/workouts/model/workout-session.model';
import { WORKOUTS_PORT } from '@app/domain/workouts/port/workouts.port';

import { TrainerNotificationsMockAdapter } from './trainer-notifications.mock-adapter';

// Domingo 27 de septiembre de 2026, mediodia.
const AHORA = new Date(2026, 8, 27, 12);
const TRAINER_USER = 'usr-trainer-001';

const hace = (dias: number): string => toIsoDate(new Date(2026, 8, 27 - dias, 18));

const alumno = (id: string, firstName: string, status: Student['status'] = 'active'): Student =>
  ({ id, firstName, status, joinedAt: hace(3) }) as Student;

const ejercicio = (skipReason: WorkoutExerciseLog['skipReason']): WorkoutExerciseLog => ({
  routineExerciseId: 'rex-1',
  exerciseId: 'ex-1',
  name: 'Sentadilla',
  targetSets: 3,
  targetReps: 10,
  restSeconds: 60,
  weightKg: null,
  completedSets: 0,
  done: false,
  sets: [],
  skipped: true,
  skipReason,
});

const sesion = (
  id: string,
  dias: number,
  status: WorkoutStatus,
  exercises: WorkoutExerciseLog[] = [],
): WorkoutSession => ({
  id,
  studentId: 'std-001',
  routineId: 'rtn-001',
  routineDayId: 'day-1',
  title: 'Pierna',
  scheduledFor: hace(dias),
  startedAt: null,
  completedAt: status === 'completed' ? hace(dias) : null,
  status,
  durationMinutes: 40,
  estimatedMinutes: 45,
  exercises,
});

const resolve = <T>(source: Observable<T>): { value?: T; error?: DomainError } => {
  let value: T | undefined;
  let error: DomainError | undefined;
  source.subscribe({ next: v => (value = v), error: (e: DomainError) => (error = e) });
  jest.runAllTimers();
  return { value, error };
};

describe('TrainerNotificationsMockAdapter', () => {
  let adapter: TrainerNotificationsMockAdapter;

  const crear = (
    cartera: Student[],
    sesiones: Record<string, WorkoutSession[]>,
  ): TrainerNotificationsMockAdapter => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        TrainerNotificationsMockAdapter,
        { provide: CLOCK, useValue: { now: () => AHORA } },
        { provide: STUDENTS_PORT, useValue: { listByTrainer: () => of(cartera) } },
        {
          provide: WORKOUTS_PORT,
          useValue: { listByStudent: (id: string) => of(sesiones[id] ?? []) },
        },
      ],
    });
    return TestBed.inject(TrainerNotificationsMockAdapter);
  };

  const list = (): AppNotification[] => resolve(adapter.listByUser(TRAINER_USER)).value ?? [];

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(AHORA);
    adapter = crear([alumno('std-002', 'Camila')], {
      'std-002': [
        sesion('wks-1', 1, 'completed'),
        sesion('wks-2', 2, 'completed', [ejercicio('pain')]),
        sesion('wks-3', 3, 'completed', [ejercicio('no_time')]),
        sesion('wks-old', 20, 'completed'),
      ],
    });
  });

  afterEach(() => jest.useRealTimers());

  it('un usuario que no es entrenador no tiene notificaciones', () => {
    expect(resolve(adapter.listByUser('usr-student-001')).value).toEqual([]);
  });

  it('avisa cada sesion completada en los ultimos 14 dias', () => {
    const hechas = list().filter(item => item.kind === 'session');

    expect(hechas.map(item => item.id)).toEqual([
      'tn-done-wks-1',
      'tn-done-wks-2',
      'tn-done-wks-3',
    ]);
    expect(hechas[0]?.title).toBe('Camila completó su sesión');
    expect(hechas[0]?.body).toBe('Pierna · 40 min');
  });

  it('solo el salto por dolor es una alerta', () => {
    const alertas = list().filter(item => item.kind === 'alert');

    expect(alertas).toHaveLength(1);
    expect(alertas[0]?.body).toBe('Sentadilla · Molestia o dolor');
  });

  it('todas llevan a la ficha del alumno y van de la mas reciente a la mas antigua', () => {
    const lista = list();

    expect(lista.every(item => item.targetType === 'student' && item.targetId === 'std-002')).toBe(
      true,
    );
    const fechas = lista.map(item => item.createdAt);
    expect([...fechas].sort((a, b) => b.localeCompare(a))).toEqual(fechas);
  });

  it('avisa a un alumno en riesgo', () => {
    adapter = crear([alumno('std-002', 'Camila')], {
      'std-002': [sesion('wks-1', 2, 'skipped'), sesion('wks-2', 12, 'completed')],
    });

    const riesgo = list().find(item => item.id.startsWith('tn-risk-std-002'));

    expect(riesgo?.title).toBe('Camila está en riesgo');
    expect(riesgo?.body).toBe('12 días sin entrenar');
  });

  it('avisa la invitacion aceptada e ignora a los alumnos no activos', () => {
    adapter = crear([alumno('std-001', 'Alejandra'), alumno('std-003', 'Diego', 'suspended')], {});

    const lista = list();

    expect(lista).toHaveLength(1);
    expect(lista[0]?.kind).toBe('invitation');
    expect(lista[0]?.title).toBe('Alejandra aceptó tu invitación');
  });

  it('una invitacion aceptada hace mas de 14 dias ya no se avisa', () => {
    adapter = crear([{ ...alumno('std-001', 'Alejandra'), joinedAt: hace(30) }], {});

    expect(list()).toEqual([]);
  });

  it('sin alumnos activos no hay nada', () => {
    adapter = crear([], {});

    expect(list()).toEqual([]);
  });

  describe('lectura', () => {
    it('marcar una la deja leida al volver a listar', () => {
      list();
      const { value } = resolve(adapter.markRead('tn-done-wks-1'));

      expect(value?.readAt).toBe(toIsoDate(AHORA));
      expect(list().find(item => item.id === 'tn-done-wks-1')?.readAt).toBe(toIsoDate(AHORA));
    });

    it('marcar una desconocida falla', () => {
      expect(resolve(adapter.markRead('tn-nada')).error).toBeDefined();
    });

    it('marcar todas deja la lista sin pendientes', () => {
      list();
      resolve(adapter.markAllRead(TRAINER_USER));

      expect(list().every(item => item.readAt !== null)).toBe(true);
    });
  });
});
