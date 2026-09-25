import { Observable } from 'rxjs';

import { DomainError } from '@app/domain/shared/model/app-error';

import { ExerciseCatalogMockAdapter, RoutinesMockAdapter } from './routines.mock-adapter';
import { SEED_EXERCISES } from './seed/exercises.seed';
import { SEED_ROUTINES } from './seed/routines.seed';

const resolve = <T>(source: Observable<T>): { value?: T; error?: DomainError } => {
  let value: T | undefined;
  let error: DomainError | undefined;
  source.subscribe({ next: v => (value = v), error: (e: DomainError) => (error = e) });
  jest.runAllTimers();
  return { value, error };
};

describe('RoutinesMockAdapter', () => {
  let adapter: RoutinesMockAdapter;

  beforeEach(() => {
    jest.useFakeTimers();
    adapter = new RoutinesMockAdapter();
  });

  afterEach(() => jest.useRealTimers());

  describe('getActiveForStudent()', () => {
    it('devuelve la rutina vigente del alumno', () => {
      const routine = resolve(adapter.getActiveForStudent('std-001')).value;
      expect(routine?.status).toBe('active');
      expect(routine?.days.length).toBe(4);
    });

    it('devuelve null para un alumno sin rutina', () => {
      expect(resolve(adapter.getActiveForStudent('std-999')).value).toBeNull();
    });
  });

  describe('listByStudent()', () => {
    it('devuelve las rutinas del alumno', () => {
      expect(resolve(adapter.listByStudent('std-001')).value).toHaveLength(1);
    });

    it('devuelve vacio para otro alumno', () => {
      expect(resolve(adapter.listByStudent('std-999')).value).toEqual([]);
    });
  });

  describe('getById()', () => {
    it('devuelve la rutina por id', () => {
      expect(resolve(adapter.getById('rtn-001')).value?.name).toBe('Hipertrofia — Bloque 2');
    });

    it('falla con un id desconocido', () => {
      expect(resolve(adapter.getById('rtn-999')).error?.code).toBe('not_found');
    });
  });
});

describe('ExerciseCatalogMockAdapter', () => {
  let adapter: ExerciseCatalogMockAdapter;

  beforeEach(() => {
    jest.useFakeTimers();
    adapter = new ExerciseCatalogMockAdapter();
  });

  afterEach(() => jest.useRealTimers());

  it('lista el catalogo completo', () => {
    expect(resolve(adapter.list()).value).toHaveLength(SEED_EXERCISES.length);
  });

  it('devuelve un ejercicio por id', () => {
    expect(resolve(adapter.getById('ex-001')).value?.name).toBe('Sentadilla con barra');
  });

  it('falla con un id desconocido', () => {
    expect(resolve(adapter.getById('ex-999')).error?.code).toBe('not_found');
  });

  it('cada ejercicio tiene instrucciones', () => {
    for (const exercise of resolve(adapter.list()).value ?? []) {
      expect(exercise.instructions.length).toBeGreaterThan(0);
    }
  });
});

describe('integridad de las semillas', () => {
  it('cada ejercicio de la rutina existe en el catalogo', () => {
    const catalogIds = new Set(SEED_EXERCISES.map(exercise => exercise.id));

    for (const routine of SEED_ROUTINES) {
      for (const day of routine.days) {
        for (const exercise of day.exercises) {
          expect(catalogIds.has(exercise.exerciseId)).toBe(true);
        }
      }
    }
  });

  it('los ids de ejercicio de rutina no se repiten', () => {
    const ids = SEED_ROUTINES.flatMap(routine =>
      routine.days.flatMap(day => day.exercises.map(exercise => exercise.id)),
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('los dias de la rutina no repiten dia de la semana', () => {
    for (const routine of SEED_ROUTINES) {
      const weekdays = routine.days.map(day => day.weekday);
      expect(new Set(weekdays).size).toBe(weekdays.length);
    }
  });
});
