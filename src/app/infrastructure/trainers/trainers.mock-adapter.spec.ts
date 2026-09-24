import { Observable } from 'rxjs';

import { DomainError } from '@app/domain/shared/model/app-error';
import { Trainer } from '@app/domain/trainers/model/trainer.model';

import { TrainersMockAdapter } from './trainers.mock-adapter';

/** Corre la latencia simulada y devuelve lo que emitio el observable. */
const resolve = <T>(source: Observable<T>): { value?: T; error?: DomainError } => {
  let value: T | undefined;
  let error: DomainError | undefined;
  source.subscribe({ next: v => (value = v), error: (e: DomainError) => (error = e) });
  jest.runAllTimers();
  return { value, error };
};

describe('TrainersMockAdapter', () => {
  let adapter: TrainersMockAdapter;

  beforeEach(() => {
    jest.useFakeTimers();
    adapter = new TrainersMockAdapter();
  });

  afterEach(() => jest.useRealTimers());

  describe('getById()', () => {
    it('devuelve el entrenador semilla', () => {
      const { value } = resolve<Trainer>(adapter.getById('trn-001'));

      expect(value?.email).toBe('kelvin@neque.cl');
      expect(value?.certifications).toHaveLength(2);
    });

    it('falla con un id desconocido', () => {
      const { error } = resolve<Trainer>(adapter.getById('trn-999'));

      expect(error?.code).toBe('not_found');
    });
  });

  describe('update()', () => {
    it('aplica los cambios y los persiste', () => {
      resolve<Trainer>(adapter.update('trn-001', { specialty: 'Fuerza' }));

      const { value } = resolve<Trainer>(adapter.getById('trn-001'));
      expect(value?.specialty).toBe('Fuerza');
    });

    it('falla con un id desconocido', () => {
      const { error } = resolve<Trainer>(adapter.update('trn-999', { bio: 'x' }));

      expect(error?.code).toBe('not_found');
    });
  });

  it('no entrega referencias a su estado interno', () => {
    const primera = resolve<Trainer>(adapter.getById('trn-001')).value as Trainer;
    const segunda = resolve<Trainer>(adapter.getById('trn-001')).value as Trainer;

    expect(primera).not.toBe(segunda);
  });
});
