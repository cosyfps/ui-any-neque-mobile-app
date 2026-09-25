import { firstValueFrom } from 'rxjs';

import { DomainError } from '@app/domain/shared/model/app-error';

import { MOCK_LATENCY_MS, cloneSeed, simulate, simulateError } from './mock-delay';

describe('mock-delay', () => {
  describe('cloneSeed()', () => {
    it('devuelve un valor equivalente pero no la misma referencia', () => {
      const seed = { nombre: 'Ana', etiquetas: ['a', 'b'] };
      const copy = cloneSeed(seed);

      expect(copy).toEqual(seed);
      expect(copy).not.toBe(seed);
      expect(copy.etiquetas).not.toBe(seed.etiquetas);
    });

    it.each([
      ['undefined', undefined],
      ['null', null],
      ['un numero', 42],
      ['un string', 'texto'],
      ['un booleano', true],
    ])('devuelve %s tal cual', (_label, value) => {
      expect(cloneSeed(value)).toBe(value);
    });

    it('aisla mutaciones anidadas', () => {
      const seed = { nested: { total: 1 } };
      const copy = cloneSeed(seed);
      copy.nested.total = 99;

      expect(seed.nested.total).toBe(1);
    });

    // jsdom no expone structuredClone, asi que el camino real en tests es el
    // fallback por JSON. Cubrimos ambas ramas instalandolo y quitandolo.
    it('usa structuredClone cuando el entorno lo expone', () => {
      const original = globalThis.structuredClone;
      const native = jest.fn(<T>(value: T): T => JSON.parse(JSON.stringify(value)) as T);
      globalThis.structuredClone = native as unknown as typeof structuredClone;

      try {
        expect(cloneSeed({ nested: { total: 7 } }).nested.total).toBe(7);
        expect(native).toHaveBeenCalledTimes(1);
      } finally {
        globalThis.structuredClone = original;
      }
    });

    it('cae al fallback por JSON sin structuredClone disponible', () => {
      const original = globalThis.structuredClone;
      // @ts-expect-error se elimina a proposito para ejercitar el fallback
      delete globalThis.structuredClone;

      try {
        expect(cloneSeed({ nested: { total: 7 } }).nested.total).toBe(7);
      } finally {
        globalThis.structuredClone = original;
      }
    });
  });

  describe('simulate()', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('emite el valor tras la latencia', async () => {
      const pending = firstValueFrom(simulate(['a'], 100));
      jest.advanceTimersByTime(100);
      await expect(pending).resolves.toEqual(['a']);
    });

    it('no emite antes de que corra la latencia', () => {
      const next = jest.fn();
      simulate(['a'], 100).subscribe(next);

      jest.advanceTimersByTime(99);
      expect(next).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('entrega una copia, no la semilla original', () => {
      const seed = { total: 1 };
      let received: { total: number } | null = null;
      simulate(seed, 10).subscribe(value => (received = value));
      jest.advanceTimersByTime(10);

      expect(received).not.toBeNull();
      expect(received).not.toBe(seed);
    });

    it('usa MOCK_LATENCY_MS por defecto', () => {
      const next = jest.fn();
      simulate(['a']).subscribe(next);

      jest.advanceTimersByTime(MOCK_LATENCY_MS - 1);
      expect(next).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('simulateError()', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('falla con un DomainError tras la latencia', () => {
      const onError = jest.fn();
      simulateError('not_found', 100).subscribe({ error: onError });

      jest.advanceTimersByTime(99);
      expect(onError).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(onError).toHaveBeenCalledTimes(1);
      const error = onError.mock.calls[0]?.[0] as DomainError;
      expect(error).toBeInstanceOf(DomainError);
      expect(error.code).toBe('not_found');
    });

    it('permite sobrescribir el mensaje', () => {
      const onError = jest.fn();
      simulateError('conflict', 10, 'duplicado').subscribe({ error: onError });
      jest.advanceTimersByTime(10);

      expect((onError.mock.calls[0]?.[0] as DomainError).message).toBe('duplicado');
    });

    it('usa MOCK_LATENCY_MS por defecto', () => {
      const onError = jest.fn();
      simulateError('unknown').subscribe({ error: onError });

      jest.advanceTimersByTime(MOCK_LATENCY_MS - 1);
      expect(onError).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });
});
