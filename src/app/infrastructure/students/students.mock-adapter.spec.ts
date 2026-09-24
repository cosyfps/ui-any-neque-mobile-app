import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';

import { DomainError } from '@app/domain/shared/model/app-error';
import { CLOCK } from '@app/domain/shared/port/clock.port';
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

/** El adapter inyecta `CLOCK` para fechar el alta, asi que necesita injector. */
const crearAdapter = (): StudentsMockAdapter => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      StudentsMockAdapter,
      { provide: CLOCK, useValue: { now: () => new Date('2026-09-19T10:00:00.000Z') } },
    ],
  });
  return TestBed.inject(StudentsMockAdapter);
};

describe('StudentsMockAdapter', () => {
  let adapter: StudentsMockAdapter;

  beforeEach(() => {
    jest.useFakeTimers();
    adapter = crearAdapter();
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

    const otra = crearAdapter();
    expect(resolve(otra.getById('std-001')).value?.phone).not.toBe('mutado');
  });
});

describe('StudentsMockAdapter — escritura del entrenador', () => {
  let adapter: StudentsMockAdapter;

  const alta = {
    trainerId: 'trn-001',
    firstName: 'Nuevo',
    lastName: 'Alumno',
    email: 'Nuevo@Neque.CL',
    phone: null,
    birthDate: null,
    heightCm: null,
    goal: null,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    adapter = crearAdapter();
  });

  afterEach(() => jest.useRealTimers());

  describe('create()', () => {
    it('da de alta y normaliza el correo', () => {
      const { value } = resolve<Student>(adapter.create(alta));

      expect(value?.id).toMatch(/^std-/);
      expect(value?.email).toBe('nuevo@neque.cl');
      expect(value?.status).toBe('active');
    });

    it('resuelve el nombre del entrenador de su cartera', () => {
      const { value } = resolve<Student>(adapter.create(alta));

      expect(value?.trainerName).toBe('Kelvin Moreno');
    });

    it('lo deja en la cartera del entrenador', () => {
      resolve<Student>(adapter.create(alta));

      const { value } = resolve<Student[]>(adapter.listByTrainer('trn-001'));
      expect(value?.some(item => item.email === 'nuevo@neque.cl')).toBe(true);
    });

    it('rechaza un correo repetido', () => {
      const { error } = resolve<Student>(adapter.create({ ...alta, email: 'ana@neque.cl' }));

      expect(error?.code).toBe('conflict');
    });
  });

  describe('setStatus()', () => {
    // El entrenador nunca elimina: suspende y reactiva.
    it('suspende conservando la ficha', () => {
      const { value } = resolve<Student>(adapter.setStatus('std-001', 'suspended'));

      expect(value?.status).toBe('suspended');
      expect(value?.goal).toBe('Ganar masa muscular y mejorar postura');
    });

    it('reactiva', () => {
      resolve<Student>(adapter.setStatus('std-001', 'suspended'));
      const { value } = resolve<Student>(adapter.setStatus('std-001', 'active'));

      expect(value?.status).toBe('active');
    });

    it('falla con un id desconocido', () => {
      const { error } = resolve<Student>(adapter.setStatus('std-999', 'suspended'));

      expect(error?.code).toBe('not_found');
    });
  });

  describe('edit()', () => {
    it('corrige los datos de la ficha', () => {
      const { value } = resolve<Student>(adapter.edit('std-001', { goal: 'Otro objetivo' }));

      expect(value?.goal).toBe('Otro objetivo');
    });

    it('falla con un id desconocido', () => {
      const { error } = resolve<Student>(adapter.edit('std-999', { goal: 'x' }));

      expect(error?.code).toBe('not_found');
    });
  });
});

describe('AssessmentsMockAdapter', () => {
  const AHORA = new Date('2026-11-01T10:00:00.000Z');
  let adapter: AssessmentsMockAdapter;

  beforeEach(() => {
    jest.useFakeTimers();
    // Fecha la evaluacion con el reloj inyectado, asi que necesita injector.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [AssessmentsMockAdapter, { provide: CLOCK, useValue: { now: () => AHORA } }],
    });
    adapter = TestBed.inject(AssessmentsMockAdapter);
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
    const entrada: Omit<Assessment, 'id' | 'takenAt'> = {
      studentId: 'std-001',
      weightKg: 58,
      heightCm: 165,
      bodyFatPct: null,
      muscleMassKg: null,
      measurements: { chestCm: null, waistCm: null, hipCm: null, armCm: null, thighCm: null },
      notes: null,
    };

    it('agrega la evaluacion y le asigna id', () => {
      const input: Omit<Assessment, 'id' | 'takenAt'> = {
        studentId: 'std-001',
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

    // La fecha no la manda el cliente: llega del reloj del backend.
    it('fecha la evaluacion con el reloj inyectado', () => {
      const created = resolve(adapter.create(entrada)).value;

      expect(created?.takenAt).toBe(AHORA.toISOString());
    });
  });
});

describe('semillas de alumnos', () => {
  it('el alumno semilla calza con la cuenta de auth', () => {
    jest.useFakeTimers();
    const student = resolve(crearAdapter().getById('std-001')).value as Student;
    expect(student.email).toBe('ana@neque.cl');
    jest.useRealTimers();
  });
});
