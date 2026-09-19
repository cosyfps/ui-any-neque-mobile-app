import { Observable } from 'rxjs';

import { DomainError } from '@app/domain/shared/model/app-error';
import { Assessment } from '@app/domain/students/model/assessment.model';
import { Student } from '@app/domain/students/model/student.model';

import { AssessmentsMockAdapter } from './assessments.mock-adapter';
import { StudentsMockAdapter } from './students.mock-adapter';

/** Corre la latencia simulada y devuelve lo que emitio el observable. */
const resolve = <T>(source: Observable<T>): { value?: T; error?: DomainError } => {
  let value: T | undefined;
  let error: DomainError | undefined;
  source.subscribe({ next: v => (value = v), error: (e: DomainError) => (error = e) });
  jest.runAllTimers();
  return { value, error };
};

describe('StudentsMockAdapter', () => {
  let adapter: StudentsMockAdapter;

  beforeEach(() => {
    jest.useFakeTimers();
    adapter = new StudentsMockAdapter();
  });

  afterEach(() => jest.useRealTimers());

  describe('getById()', () => {
    it('devuelve el alumno semilla', () => {
      const { value } = resolve(adapter.getById('std-001'));
      expect(value?.firstName).toBe('Ana');
      expect(value?.trainerId).toBe('trn-001');
    });

    it('falla con un id desconocido', () => {
      expect(resolve(adapter.getById('std-999')).error?.code).toBe('not_found');
    });

    it('no entrega referencias a su estado interno', () => {
      const first = resolve(adapter.getById('std-001')).value;
      const second = resolve(adapter.getById('std-001')).value;
      expect(first).not.toBe(second);
    });
  });

  describe('listByTrainer()', () => {
    it('devuelve los alumnos del entrenador', () => {
      expect(resolve(adapter.listByTrainer('trn-001')).value).toHaveLength(3);
    });

    it('devuelve vacio para otro entrenador', () => {
      expect(resolve(adapter.listByTrainer('trn-999')).value).toEqual([]);
    });
  });

  describe('update()', () => {
    it('aplica los cambios y los persiste', () => {
      const { value } = resolve(adapter.update('std-001', { phone: '+56 9 1111 2222' }));
      expect(value?.phone).toBe('+56 9 1111 2222');

      expect(resolve(adapter.getById('std-001')).value?.phone).toBe('+56 9 1111 2222');
    });

    it('conserva los campos no enviados', () => {
      const { value } = resolve(adapter.update('std-001', { heightCm: 170 }));
      expect(value?.firstName).toBe('Ana');
      expect(value?.heightCm).toBe(170);
    });

    it('falla con un id desconocido', () => {
      expect(resolve(adapter.update('std-999', { phone: null })).error?.code).toBe('not_found');
    });
  });

  it('dos instancias no comparten estado', () => {
    resolve(adapter.update('std-001', { phone: 'mutado' }));

    const otra = new StudentsMockAdapter();
    expect(resolve(otra.getById('std-001')).value?.phone).not.toBe('mutado');
  });
});

describe('AssessmentsMockAdapter', () => {
  let adapter: AssessmentsMockAdapter;

  beforeEach(() => {
    jest.useFakeTimers();
    adapter = new AssessmentsMockAdapter();
  });

  afterEach(() => jest.useRealTimers());

  describe('listByStudent()', () => {
    it('devuelve las evaluaciones del alumno', () => {
      expect(resolve(adapter.listByStudent('std-001')).value?.length).toBeGreaterThan(1);
    });

    it('las ordena de la mas reciente a la mas antigua', () => {
      const list = resolve(adapter.listByStudent('std-001')).value ?? [];
      const dates = list.map(item => item.takenAt);
      expect([...dates].sort((a, b) => b.localeCompare(a))).toEqual(dates);
    });

    it('devuelve vacio para otro alumno', () => {
      expect(resolve(adapter.listByStudent('std-999')).value).toEqual([]);
    });
  });

  describe('latestByStudent()', () => {
    it('devuelve la evaluacion mas reciente', () => {
      const latest = resolve(adapter.latestByStudent('std-001')).value;
      const list = resolve(adapter.listByStudent('std-001')).value ?? [];
      expect(latest?.id).toBe(list[0]?.id);
    });

    it('devuelve null para un alumno sin evaluaciones', () => {
      expect(resolve(adapter.latestByStudent('std-999')).value).toBeNull();
    });
  });

  describe('create()', () => {
    it('agrega la evaluacion y le asigna id', () => {
      const input: Omit<Assessment, 'id'> = {
        studentId: 'std-001',
        takenAt: '2026-11-01T10:00:00.000Z',
        weightKg: 58,
        heightCm: 165,
        bodyFatPct: null,
        muscleMassKg: null,
        measurements: { chestCm: null, waistCm: null, hipCm: null, armCm: null, thighCm: null },
        notes: null,
      };

      const created = resolve(adapter.create(input)).value;

      expect(created?.id).toBeDefined();
      expect(resolve(adapter.latestByStudent('std-001')).value?.weightKg).toBe(58);
    });
  });
});

describe('semillas de alumnos', () => {
  it('el alumno semilla calza con la cuenta de auth', () => {
    jest.useFakeTimers();
    const student = resolve(new StudentsMockAdapter().getById('std-001')).value as Student;
    expect(student.email).toBe('ana@neque.cl');
    jest.useRealTimers();
  });
});
