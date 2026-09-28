import { Observable } from 'rxjs';

import { Exercise } from '@app/domain/routines/model/exercise.model';
import { Routine, RoutineAssignment, RoutineInput } from '@app/domain/routines/model/routine.model';
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
      expect(routine?.id).toBe('rtn-001');
      expect(routine?.days.length).toBe(4);
    });

    it('devuelve null para un alumno sin rutina', () => {
      expect(resolve(adapter.getActiveForStudent('std-999')).value).toBeNull();
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

describe('RoutinesMockAdapter — escritura del entrenador', () => {
  let adapter: RoutinesMockAdapter;

  const borrador: RoutineInput = {
    trainerId: 'trn-001',
    name: 'Full body inicial',
    goal: 'Adaptacion',
    days: [
      {
        weekday: 1,
        title: 'Cuerpo completo',
        focus: 'fullbody',
        estimatedMinutes: 45,
        exercises: [
          {
            exerciseId: 'exr-001',
            name: 'Sentadilla con barra',
            order: 1,
            sets: 3,
            reps: 12,
            restSeconds: 60,
            weightKg: 20,
            notes: null,
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    jest.useFakeTimers();
    adapter = new RoutinesMockAdapter();
  });

  afterEach(() => jest.useRealTimers());

  const asignacion = (studentId: string): RoutineAssignment => ({
    studentId,
    startDate: '2026-10-01T00:00:00.000Z',
    endDate: null,
  });

  describe('create()', () => {
    it('crea la rutina como plantilla, sin alumnos', () => {
      const { value } = resolve<Routine>(adapter.create(borrador));

      expect(value?.id).toMatch(/^rtn-/);
      expect(value?.assignments).toEqual([]);
    });

    it('asigna id a cada dia y a cada ejercicio', () => {
      const { value } = resolve<Routine>(adapter.create(borrador));

      expect(value?.days[0]?.id).toBeTruthy();
      expect(value?.days[0]?.exercises[0]?.id).toBeTruthy();
    });
  });

  describe('setAssignments()', () => {
    it('la misma rutina la hacen varios alumnos', () => {
      const creada = resolve<Routine>(adapter.create(borrador)).value as Routine;

      resolve<Routine>(
        adapter.setAssignments(creada.id, [asignacion('std-002'), asignacion('std-003')]),
      );

      expect(resolve(adapter.getActiveForStudent('std-002')).value?.id).toBe(creada.id);
      expect(resolve(adapter.getActiveForStudent('std-003')).value?.id).toBe(creada.id);
    });

    // Un alumno hace una sola rutina: la restriccion unica de la base.
    it('saca al alumno de la rutina que hacia antes', () => {
      const creada = resolve<Routine>(adapter.create(borrador)).value as Routine;

      resolve<Routine>(adapter.setAssignments(creada.id, [asignacion('std-001')]));

      const anterior = resolve<Routine>(adapter.getById('rtn-001')).value;
      expect(anterior?.assignments.some(item => item.studentId === 'std-001')).toBe(false);
      expect(resolve(adapter.getActiveForStudent('std-001')).value?.id).toBe(creada.id);
    });

    it('no toca a los alumnos de otras rutinas', () => {
      const creada = resolve<Routine>(adapter.create(borrador)).value as Routine;

      resolve<Routine>(adapter.setAssignments(creada.id, [asignacion('std-002')]));

      expect(resolve(adapter.getActiveForStudent('std-001')).value?.id).toBe('rtn-001');
    });

    it('con la lista vacia deja la rutina sin alumnos', () => {
      const { value } = resolve<Routine>(adapter.setAssignments('rtn-001', []));

      expect(value?.assignments).toEqual([]);
      expect(resolve(adapter.getActiveForStudent('std-001')).value).toBeNull();
    });

    it('falla con un id desconocido', () => {
      const { error } = resolve<Routine>(adapter.setAssignments('rtn-999', []));

      expect(error?.code).toBe('not_found');
    });
  });

  describe('update()', () => {
    // Editar la plantilla no la quita a quienes ya la hacen.
    it('actualiza conservando id y alumnos', () => {
      const { value } = resolve<Routine>(
        adapter.update('rtn-001', { ...borrador, name: 'Renombrada' }),
      );

      expect(value?.id).toBe('rtn-001');
      expect(value?.name).toBe('Renombrada');
      expect(value?.assignments.map(item => item.studentId)).toEqual(['std-001']);
    });

    it('falla con un id desconocido', () => {
      expect(resolve<Routine>(adapter.update('rtn-999', borrador)).error?.code).toBe('not_found');
    });
  });

  describe('remove()', () => {
    it('saca la rutina de la biblioteca', () => {
      expect(resolve<void>(adapter.remove('rtn-001')).error).toBeUndefined();

      const { error } = resolve<Routine>(adapter.getById('rtn-001'));
      expect(error?.code).toBe('not_found');
    });

    // Eliminar una rutina con alumnos los deja sin rutina, no en una fantasma.
    it('deja a sus alumnos sin rutina', () => {
      resolve<void>(adapter.remove('rtn-001'));

      expect(resolve<Routine | null>(adapter.getActiveForStudent('std-001')).value).toBeNull();
    });

    it('falla con un id desconocido', () => {
      expect(resolve<void>(adapter.remove('rtn-999')).error?.code).toBe('not_found');
    });
  });

  describe('listByTrainer()', () => {
    it('devuelve las rutinas del entrenador', () => {
      const { value } = resolve<Routine[]>(adapter.listByTrainer('trn-001'));

      expect(value?.length).toBeGreaterThan(0);
    });

    it('devuelve vacio para otro entrenador', () => {
      const { value } = resolve<Routine[]>(adapter.listByTrainer('trn-999'));

      expect(value).toEqual([]);
    });
  });
});

describe('ExerciseCatalogMockAdapter — ejercicios propios', () => {
  let adapter: ExerciseCatalogMockAdapter;

  const propio = {
    name: 'Remo con banda',
    muscleGroup: 'back' as const,
    equipment: 'Banda elástica',
    thumbnailUrl: null,
    instructions: ['Pisa la banda', 'Tira hacia el abdomen'],
    ownerTrainerId: 'trn-001',
  };

  beforeEach(() => {
    jest.useFakeTimers();
    adapter = new ExerciseCatalogMockAdapter();
  });

  afterEach(() => jest.useRealTimers());

  it('crea el ejercicio con dueno', () => {
    const { value } = resolve<Exercise>(adapter.create(propio));

    expect(value?.id).toMatch(/^exr-/);
    expect(value?.ownerTrainerId).toBe('trn-001');
  });

  it('el dueno lo ve junto al catalogo publico', () => {
    resolve<Exercise>(adapter.create(propio));

    const { value } = resolve<Exercise[]>(adapter.listForTrainer('trn-001'));
    expect(value?.some(item => item.name === 'Remo con banda')).toBe(true);
  });

  // Los ejercicios propios son privados: nadie mas los ve.
  it('otro entrenador no lo ve', () => {
    resolve<Exercise>(adapter.create(propio));

    const { value } = resolve<Exercise[]>(adapter.listForTrainer('trn-002'));
    expect(value?.some(item => item.name === 'Remo con banda')).toBe(false);
  });

  it('list() solo devuelve el catalogo publico', () => {
    resolve<Exercise>(adapter.create(propio));

    const { value } = resolve<Exercise[]>(adapter.list());
    expect(value?.every(item => item.ownerTrainerId === null)).toBe(true);
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
