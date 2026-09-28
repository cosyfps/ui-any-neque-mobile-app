import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';

import { DomainError } from '@app/domain/shared/model/app-error';
import { weekRange } from '@app/domain/shared/model/date';
import { CLOCK } from '@app/domain/shared/port/clock.port';
import { WorkoutSession } from '@app/domain/workouts/model/workout-session.model';

import { WorkoutsMockAdapter } from './workouts.mock-adapter';

// Jueves 17 de septiembre de 2026.
const NOW = new Date(2026, 8, 17, 10, 0, 0);

const resolve = <T>(source: Observable<T>): { value?: T; error?: DomainError } => {
  let value: T | undefined;
  let error: DomainError | undefined;
  source.subscribe({ next: v => (value = v), error: (e: DomainError) => (error = e) });
  jest.runAllTimers();
  return { value, error };
};

describe('WorkoutsMockAdapter', () => {
  let adapter: WorkoutsMockAdapter;

  const allSessions = (): WorkoutSession[] => resolve(adapter.listByStudent('std-001')).value ?? [];

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
    TestBed.configureTestingModule({
      providers: [WorkoutsMockAdapter, { provide: CLOCK, useValue: { now: () => NOW } }],
    });
    adapter = TestBed.inject(WorkoutsMockAdapter);
  });

  afterEach(() => jest.useRealTimers());

  describe('listByStudent()', () => {
    it('genera historial de cuatro semanas', () => {
      // 4 dias por semana durante 4 semanas.
      expect(allSessions()).toHaveLength(16);
    });

    it('las ordena por fecha ascendente', () => {
      const dates = allSessions().map(session => session.scheduledFor);
      expect([...dates].sort()).toEqual(dates);
    });

    it('devuelve vacio para otro alumno', () => {
      expect(resolve(adapter.listByStudent('std-999')).value).toEqual([]);
    });

    it('filtra por rango cuando se entrega', () => {
      const week = resolve(adapter.listByStudent('std-001', weekRange(NOW))).value ?? [];
      expect(week.length).toBeGreaterThan(0);
      expect(week.length).toBeLessThan(16);
    });

    it('cierra las sesiones pasadas y deja abiertas las futuras', () => {
      const sessions = allSessions();
      const past = sessions.filter(item => new Date(item.scheduledFor) < NOW);
      const future = sessions.filter(item => new Date(item.scheduledFor) > NOW);

      expect(past.every(item => item.status === 'completed' || item.status === 'skipped')).toBe(
        true,
      );
      expect(future.every(item => item.status === 'scheduled')).toBe(true);
    });

    it('incluye una sesion omitida para que el historial no sea perfecto', () => {
      expect(allSessions().some(item => item.status === 'skipped')).toBe(true);
    });

    it('las completadas tienen todos sus ejercicios marcados', () => {
      for (const session of allSessions().filter(item => item.status === 'completed')) {
        expect(session.exercises.every(exercise => exercise.done)).toBe(true);
      }
    });
  });

  describe('getById()', () => {
    it('devuelve la sesion', () => {
      const first = allSessions()[0] as WorkoutSession;
      expect(resolve(adapter.getById(first.id)).value?.id).toBe(first.id);
    });

    it('falla con un id desconocido', () => {
      expect(resolve(adapter.getById('wks-999')).error?.code).toBe('not_found');
    });
  });

  describe('start()', () => {
    it('pasa la sesion a en curso y fija startedAt', () => {
      const pending = allSessions().find(item => item.status === 'scheduled') as WorkoutSession;

      const started = resolve(adapter.start(pending.id)).value;

      expect(started?.status).toBe('in_progress');
      expect(started?.startedAt).not.toBeNull();
    });

    it('falla con un id desconocido', () => {
      expect(resolve(adapter.start('wks-999')).error?.code).toBe('not_found');
    });
  });

  describe('markExercise()', () => {
    it('marca el ejercicio y completa sus series', () => {
      const session = allSessions().find(item => item.status === 'scheduled') as WorkoutSession;
      const exercise = session.exercises[0];
      if (exercise === undefined) {
        throw new Error('la sesion semilla no tiene ejercicios');
      }

      const updated = resolve(
        adapter.markExercise(session.id, exercise.routineExerciseId, true),
      ).value;
      const target = updated?.exercises.find(
        item => item.routineExerciseId === exercise.routineExerciseId,
      );

      expect(target?.done).toBe(true);
      expect(target?.completedSets).toBe(exercise.targetSets);
    });

    it('desmarcar deja las series en cero', () => {
      const session = allSessions().find(item => item.status === 'scheduled') as WorkoutSession;
      const exercise = session.exercises[0];
      if (exercise === undefined) {
        throw new Error('la sesion semilla no tiene ejercicios');
      }

      resolve(adapter.markExercise(session.id, exercise.routineExerciseId, true));
      const updated = resolve(
        adapter.markExercise(session.id, exercise.routineExerciseId, false),
      ).value;

      expect(
        updated?.exercises.find(item => item.routineExerciseId === exercise.routineExerciseId)
          ?.completedSets,
      ).toBe(0);
    });

    it('mueve la sesion de programada a en curso', () => {
      const session = allSessions().find(item => item.status === 'scheduled') as WorkoutSession;
      const exercise = session.exercises[0];
      if (exercise === undefined) {
        throw new Error('la sesion semilla no tiene ejercicios');
      }

      const updated = resolve(
        adapter.markExercise(session.id, exercise.routineExerciseId, true),
      ).value;

      expect(updated?.status).toBe('in_progress');
    });

    it('persiste el cambio entre llamadas', () => {
      const session = allSessions().find(item => item.status === 'scheduled') as WorkoutSession;
      const exercise = session.exercises[0];
      if (exercise === undefined) {
        throw new Error('la sesion semilla no tiene ejercicios');
      }

      resolve(adapter.markExercise(session.id, exercise.routineExerciseId, true));
      const reloaded = resolve(adapter.getById(session.id)).value;

      expect(
        reloaded?.exercises.find(item => item.routineExerciseId === exercise.routineExerciseId)
          ?.done,
      ).toBe(true);
    });
  });

  describe('logSet()', () => {
    const scheduledExercise = (): { sessionId: string; exerciseId: string; targetSets: number } => {
      const session = allSessions().find(item => item.status === 'scheduled') as WorkoutSession;
      const exercise = session.exercises[0];
      if (exercise === undefined) {
        throw new Error('la sesion semilla no tiene ejercicios');
      }
      return {
        sessionId: session.id,
        exerciseId: exercise.routineExerciseId,
        targetSets: exercise.targetSets,
      };
    };

    /** Serie tal como la manda el runner: lo prescrito, salvo correccion. */
    const serie = (setNumber: number, reps = 10, weightKg: number | null = 40) => ({
      setNumber,
      reps,
      weightKg,
    });

    it('registra la serie sin marcar el ejercicio', () => {
      const { sessionId, exerciseId } = scheduledExercise();

      const updated = resolve(adapter.logSet(sessionId, exerciseId, serie(1))).value;
      const target = updated?.exercises.find(item => item.routineExerciseId === exerciseId);

      expect(target?.completedSets).toBe(1);
      expect(target?.done).toBe(false);
    });

    it('guarda el peso y las repeticiones reales', () => {
      const { sessionId, exerciseId } = scheduledExercise();

      const updated = resolve(adapter.logSet(sessionId, exerciseId, serie(1, 8, 45))).value;
      const target = updated?.exercises.find(item => item.routineExerciseId === exerciseId);

      expect(target?.sets[0]).toMatchObject({ setNumber: 1, reps: 8, weightKg: 45 });
      expect(target?.sets[0]?.completedAt).toBe(NOW.toISOString());
    });

    it('marca el ejercicio al llegar al objetivo', () => {
      const { sessionId, exerciseId, targetSets } = scheduledExercise();

      let updated;
      for (let n = 1; n <= targetSets; n++) {
        updated = resolve(adapter.logSet(sessionId, exerciseId, serie(n))).value;
      }

      expect(updated?.exercises.find(item => item.routineExerciseId === exerciseId)?.done).toBe(
        true,
      );
    });

    // Reintentar la misma serie no puede inflar el conteo ni el volumen.
    it('reemplaza la serie del mismo numero en vez de acumular', () => {
      const { sessionId, exerciseId } = scheduledExercise();

      resolve(adapter.logSet(sessionId, exerciseId, serie(1, 10, 40)));
      const updated = resolve(adapter.logSet(sessionId, exerciseId, serie(1, 6, 50))).value;
      const target = updated?.exercises.find(item => item.routineExerciseId === exerciseId);

      expect(target?.sets).toHaveLength(1);
      expect(target?.sets[0]?.weightKg).toBe(50);
    });

    it('recorta un numero de serie sobre el objetivo', () => {
      const { sessionId, exerciseId, targetSets } = scheduledExercise();

      const updated = resolve(adapter.logSet(sessionId, exerciseId, serie(targetSets + 10))).value;
      const target = updated?.exercises.find(item => item.routineExerciseId === exerciseId);

      expect(target?.sets[0]?.setNumber).toBe(targetSets);
    });

    it('recorta un numero de serie bajo uno', () => {
      const { sessionId, exerciseId } = scheduledExercise();

      const updated = resolve(adapter.logSet(sessionId, exerciseId, serie(0))).value;
      const target = updated?.exercises.find(item => item.routineExerciseId === exerciseId);

      expect(target?.sets[0]?.setNumber).toBe(1);
    });

    it('acepta una serie sin peso', () => {
      const { sessionId, exerciseId } = scheduledExercise();

      const updated = resolve(adapter.logSet(sessionId, exerciseId, serie(1, 12, null))).value;
      const target = updated?.exercises.find(item => item.routineExerciseId === exerciseId);

      expect(target?.sets[0]?.weightKg).toBeNull();
    });
  });

  describe('estado derivado', () => {
    const abierta = (): WorkoutSession =>
      allSessions().find(item => item.status === 'scheduled') as WorkoutSession;

    const marcarTodo = (session: WorkoutSession, done: boolean): WorkoutSession | undefined => {
      let ultima: WorkoutSession | undefined;
      for (const exercise of session.exercises) {
        ultima = resolve(adapter.markExercise(session.id, exercise.routineExerciseId, done)).value;
      }
      return ultima;
    };

    it('marcar todos los ejercicios completa la sesion', () => {
      expect(marcarTodo(abierta(), true)?.status).toBe('completed');
    });

    // El bug reportado: seguia "completada" con 0%.
    it('desmarcar uno reabre la sesion', () => {
      const session = abierta();
      marcarTodo(session, true);
      const primero = session.exercises[0]?.routineExerciseId ?? '';

      const reabierta = resolve(adapter.markExercise(session.id, primero, false)).value;

      expect(reabierta?.status).toBe('in_progress');
      expect(reabierta?.completedAt).toBeNull();
    });
  });

  describe('saltar', () => {
    const abierta = (): WorkoutSession =>
      allSessions().find(item => item.status === 'scheduled') as WorkoutSession;

    it('logSet() registra una serie saltada con su motivo y sin datos', () => {
      const session = abierta();
      const exerciseId = session.exercises[0]?.routineExerciseId ?? '';

      const updated = resolve(
        adapter.logSet(session.id, exerciseId, {
          setNumber: 1,
          reps: 8,
          weightKg: 40,
          skipped: true,
          skipReason: 'equipment_busy',
        }),
      ).value;
      const serie = updated?.exercises[0]?.sets[0];

      expect(serie).toMatchObject({ skipped: true, skipReason: 'equipment_busy', reps: null });
      expect(updated?.exercises[0]?.completedSets).toBe(0);
    });

    it('skipExercise() salta lo que falta y conserva lo ya hecho', () => {
      const session = abierta();
      const exercise = session.exercises[0];
      if (exercise === undefined) {
        throw new Error('sin ejercicios');
      }
      resolve(
        adapter.logSet(session.id, exercise.routineExerciseId, {
          setNumber: 1,
          reps: 8,
          weightKg: 40,
        }),
      );

      const updated = resolve(
        adapter.skipExercise(session.id, exercise.routineExerciseId, 'pain'),
      ).value;
      const target = updated?.exercises[0];

      expect(target?.sets).toHaveLength(exercise.targetSets);
      expect(target?.completedSets).toBe(1);
      // Se hizo una serie: cuenta como hecho, no como saltado.
      expect(target?.done).toBe(true);
      expect(target?.skipped).toBe(false);
    });

    it('skipExercise() sin series hechas deja el ejercicio saltado con motivo', () => {
      const session = abierta();
      const exerciseId = session.exercises[0]?.routineExerciseId ?? '';

      const target = resolve(adapter.skipExercise(session.id, exerciseId, 'no_time')).value
        ?.exercises[0];

      expect(target?.skipped).toBe(true);
      expect(target?.done).toBe(false);
      expect(target?.skipReason).toBe('no_time');
    });

    it('marcar a mano un ejercicio saltado lo da por hecho', () => {
      const session = abierta();
      const exerciseId = session.exercises[0]?.routineExerciseId ?? '';
      resolve(adapter.skipExercise(session.id, exerciseId, null));

      const target = resolve(adapter.markExercise(session.id, exerciseId, true)).value
        ?.exercises[0];

      expect(target?.done).toBe(true);
      expect(target?.skipped).toBe(false);
    });

    it('complete() deja lo saltado como saltado', () => {
      const session = abierta();
      const exerciseId = session.exercises[0]?.routineExerciseId ?? '';
      resolve(adapter.skipExercise(session.id, exerciseId, null));

      const cerrada = resolve(
        adapter.complete(session.id, { durationMinutes: 30, note: null }),
      ).value;

      expect(cerrada?.status).toBe('completed');
      expect(cerrada?.exercises[0]?.skipped).toBe(true);
      expect(cerrada?.exercises.slice(1).every(item => item.done)).toBe(true);
    });

    it('skipExercise() falla con un id desconocido', () => {
      expect(resolve(adapter.skipExercise('wks-999', 'x', null)).error?.code).toBe('not_found');
    });
  });

  describe('complete()', () => {
    it('cierra la sesion y marca todo como hecho', () => {
      const session = allSessions().find(item => item.status === 'scheduled') as WorkoutSession;

      const completed = resolve(
        adapter.complete(session.id, { durationMinutes: 48, note: null }),
      ).value;

      expect(completed?.status).toBe('completed');
      expect(completed?.durationMinutes).toBe(48);
      expect(completed?.completedAt).not.toBeNull();
      expect(completed?.exercises.every(exercise => exercise.done)).toBe(true);
    });

    it('falla con un id desconocido', () => {
      expect(
        resolve(adapter.complete('wks-999', { durationMinutes: 10, note: null })).error?.code,
      ).toBe('not_found');
    });
  });

  it('dos instancias no comparten estado', () => {
    const session = allSessions().find(item => item.status === 'scheduled') as WorkoutSession;
    resolve(adapter.complete(session.id, { durationMinutes: 30, note: null }));

    const otra = TestBed.runInInjectionContext(() => new WorkoutsMockAdapter());
    const misma = resolve(otra.getById(session.id)).value;

    expect(misma?.status).toBe('scheduled');
  });
});
