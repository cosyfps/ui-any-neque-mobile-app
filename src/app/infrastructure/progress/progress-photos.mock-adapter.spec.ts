import { Observable } from 'rxjs';

import { ProgressPhoto } from '@app/domain/progress/model/progress-photo.model';
import { DomainError } from '@app/domain/shared/model/app-error';

import { ProgressPhotosMockAdapter } from './progress-photos.mock-adapter';
import { SEED_PROGRESS_PHOTOS } from './seed/photos.seed';

const resolve = <T>(source: Observable<T>): { value?: T; error?: DomainError } => {
  let value: T | undefined;
  let error: DomainError | undefined;
  source.subscribe({ next: v => (value = v), error: (e: DomainError) => (error = e) });
  jest.runAllTimers();
  return { value, error };
};

const newPhoto: Omit<ProgressPhoto, 'id'> = {
  studentId: 'std-001',
  takenAt: '2026-11-01T09:00:00.000Z',
  url: 'data:image/svg+xml;utf8,<svg/>',
  angle: 'back',
  weightKg: 58,
  note: null,
};

describe('ProgressPhotosMockAdapter', () => {
  let adapter: ProgressPhotosMockAdapter;

  beforeEach(() => {
    jest.useFakeTimers();
    adapter = new ProgressPhotosMockAdapter();
  });

  afterEach(() => jest.useRealTimers());

  describe('listByStudent()', () => {
    it('devuelve las fotos semilla del alumno', () => {
      expect(resolve(adapter.listByStudent('std-001')).value).toHaveLength(
        SEED_PROGRESS_PHOTOS.length,
      );
    });

    it('las ordena de la mas reciente a la mas antigua', () => {
      const dates = (resolve(adapter.listByStudent('std-001')).value ?? []).map(
        photo => photo.takenAt,
      );
      expect([...dates].sort((a, b) => b.localeCompare(a))).toEqual(dates);
    });

    it('devuelve vacio para otro alumno', () => {
      expect(resolve(adapter.listByStudent('std-999')).value).toEqual([]);
    });
  });

  describe('add()', () => {
    it('agrega la foto con un id nuevo', () => {
      const created = resolve(adapter.add(newPhoto)).value;

      expect(created?.id).toBeDefined();
      expect(created?.angle).toBe('back');
      expect(resolve(adapter.listByStudent('std-001')).value).toHaveLength(
        SEED_PROGRESS_PHOTOS.length + 1,
      );
    });

    it('genera ids distintos en altas sucesivas', () => {
      const first = resolve(adapter.add(newPhoto)).value;
      const second = resolve(adapter.add(newPhoto)).value;
      expect(first?.id).not.toBe(second?.id);
    });
  });

  describe('remove()', () => {
    it('elimina la foto', () => {
      resolve(adapter.remove('pht-001'));

      const ids = (resolve(adapter.listByStudent('std-001')).value ?? []).map(photo => photo.id);
      expect(ids).not.toContain('pht-001');
    });

    it('falla con un id desconocido', () => {
      expect(resolve(adapter.remove('pht-999')).error?.code).toBe('not_found');
    });
  });

  it('dos instancias no comparten estado', () => {
    resolve(adapter.remove('pht-001'));

    const otra = new ProgressPhotosMockAdapter();
    expect(resolve(otra.listByStudent('std-001')).value).toHaveLength(SEED_PROGRESS_PHOTOS.length);
  });

  describe('semillas', () => {
    it('todas usan data-URI y no archivos binarios', () => {
      for (const photo of SEED_PROGRESS_PHOTOS) {
        expect(photo.url.startsWith('data:image/svg+xml')).toBe(true);
      }
    });

    it('hay al menos dos fotos frontales para poder comparar', () => {
      expect(SEED_PROGRESS_PHOTOS.filter(photo => photo.angle === 'front').length).toBeGreaterThan(
        1,
      );
    });
  });
});
