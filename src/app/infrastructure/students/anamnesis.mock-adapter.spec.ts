import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';

import { CLOCK } from '@app/domain/shared/port/clock.port';
import { Anamnesis, AnamnesisInput } from '@app/domain/students/model/anamnesis.model';

import { AnamnesisMockAdapter } from './anamnesis.mock-adapter';

const AHORA = new Date('2026-09-19T10:00:00.000Z');

const resolve = <T>(source: Observable<T>): T | undefined => {
  let value: T | undefined;
  source.subscribe({ next: v => (value = v) });
  jest.runAllTimers();
  return value;
};

const entrada = (studentId: string): AnamnesisInput => ({
  studentId,
  medicalHistory: null,
  previousInjuries: null,
  surgeries: null,
  medications: null,
  allergies: null,
  previousActivity: null,
  declaredGoal: 'Bajar grasa',
  weeklyAvailability: [2, 4],
  emergencyContact: null,
});

describe('AnamnesisMockAdapter', () => {
  let adapter: AnamnesisMockAdapter;

  beforeEach(() => {
    jest.useFakeTimers();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [AnamnesisMockAdapter, { provide: CLOCK, useValue: { now: () => AHORA } }],
    });
    adapter = TestBed.inject(AnamnesisMockAdapter);
  });

  afterEach(() => jest.useRealTimers());

  describe('getByStudent()', () => {
    it('devuelve la anamnesis semilla', () => {
      const value = resolve<Anamnesis | null>(adapter.getByStudent('std-001'));

      expect(value?.declaredGoal).toContain('masa muscular');
      expect(value?.weeklyAvailability).toEqual([1, 2, 4, 5]);
    });

    // Un alumno sin anamnesis es el estado inicial, no un error.
    it('devuelve null cuando no hay registro', () => {
      expect(resolve<Anamnesis | null>(adapter.getByStudent('std-002'))).toBeNull();
    });
  });

  describe('save()', () => {
    it('crea la anamnesis de un alumno que no la tenia', () => {
      const creada = resolve<Anamnesis>(adapter.save(entrada('std-002')));

      expect(creada?.id).toMatch(/^anm-/);
      expect(resolve<Anamnesis | null>(adapter.getByStudent('std-002'))?.declaredGoal).toBe(
        'Bajar grasa',
      );
    });

    // Es unica por alumno: guardar de nuevo edita, no duplica.
    it('edita la existente conservando su id', () => {
      const original = resolve<Anamnesis | null>(adapter.getByStudent('std-001'));

      const editada = resolve<Anamnesis>(
        adapter.save({ ...entrada('std-001'), declaredGoal: 'Mantener' }),
      );

      expect(editada?.id).toBe(original?.id);
      expect(editada?.declaredGoal).toBe('Mantener');
    });

    it('fecha la edicion con el reloj inyectado', () => {
      const guardada = resolve<Anamnesis>(adapter.save(entrada('std-003')));

      expect(guardada?.updatedAt).toBe(AHORA.toISOString());
    });
  });
});
