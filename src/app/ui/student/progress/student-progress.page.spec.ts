import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { SessionFacade } from '@app/application/auth/session.facade';
import { ProgressFacade } from '@app/application/progress/progress.facade';
import { ProgressPhoto } from '@app/domain/progress/model/progress-photo.model';
import { PROGRESS_PHOTOS_PORT } from '@app/domain/progress/port/progress-photos.port';
import { domainError } from '@app/domain/shared/model/app-error';
import { CLOCK } from '@app/domain/shared/port/clock.port';
import { Assessment } from '@app/domain/students/model/assessment.model';
import { ASSESSMENTS_PORT } from '@app/domain/students/port/assessments.port';
import { WORKOUTS_PORT } from '@app/domain/workouts/port/workouts.port';

import { StudentProgressPage } from './student-progress.page';

const assessment = (id: string, takenAt: string, weightKg: number): Assessment => ({
  id,
  studentId: 'std-001',
  takenAt,
  weightKg,
  heightCm: 165,
  bodyFatPct: 24,
  muscleMassKg: null,
  measurements: { chestCm: null, waistCm: null, hipCm: null, armCm: null, thighCm: null },
  notes: 'Nota',
});

const ASSESSMENTS = [
  assessment('a1', '2026-03-05T10:00:00.000Z', 61.4),
  assessment('a2', '2026-09-07T10:00:00.000Z', 58.9),
];

const photo = (id: string, angle: ProgressPhoto['angle'], takenAt: string): ProgressPhoto => ({
  id,
  studentId: 'std-001',
  takenAt,
  url: 'data:image/svg+xml;utf8,<svg/>',
  angle,
  weightKg: null,
  note: null,
});

const PHOTOS = [
  photo('p1', 'front', '2026-03-05T09:00:00.000Z'),
  photo('p2', 'front', '2026-09-07T09:00:00.000Z'),
];

describe('StudentProgressPage', () => {
  let page: StudentProgressPage;
  let addPhoto: jest.Mock;
  let removePhoto: jest.Mock;

  const createPage = (): StudentProgressPage => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ProgressFacade,
        { provide: CLOCK, useValue: { now: () => new Date('2026-09-18T10:00:00.000Z') } },
        { provide: SessionFacade, useValue: { profileId: () => 'std-001' } },
        {
          provide: ASSESSMENTS_PORT,
          useValue: {
            listByStudent: () => of(ASSESSMENTS),
            latestByStudent: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: PROGRESS_PHOTOS_PORT,
          useValue: { listByStudent: () => of(PHOTOS), add: addPhoto, remove: removePhoto },
        },
        {
          provide: WORKOUTS_PORT,
          useValue: {
            listByStudent: () => of([]),
            getById: jest.fn(),
            start: jest.fn(),
            markExercise: jest.fn(),
            logSet: jest.fn(),
            complete: jest.fn(),
          },
        },
      ],
    });
    return TestBed.runInInjectionContext(() => new StudentProgressPage());
  };

  beforeEach(() => {
    addPhoto = jest.fn().mockReturnValue(of(photo('p3', 'back', '2026-11-01T09:00:00.000Z')));
    removePhoto = jest.fn().mockReturnValue(of(undefined));
    page = createPage();
  });

  describe('estado inicial', () => {
    it('arranca en la pestana de mediciones', () => {
      expect(page.tab()).toBe('metrics');
      expect(page.series()).toBe('weight');
      expect(page.selectedAngle()).toBe('front');
    });

    it('carga las evaluaciones', () => {
      expect(page.facade.viewState()).toBe('success');
    });
  });

  describe('history()', () => {
    it('ordena de la mas reciente a la mas antigua', () => {
      expect(page.history().map(item => item.id)).toEqual(['a2', 'a1']);
    });
  });

  describe('activeSeries()', () => {
    it('devuelve la serie de peso por defecto', () => {
      expect(page.activeSeries().map(point => point.value)).toEqual([61.4, 58.9]);
    });

    it('cambia a la serie de IMC', () => {
      page.series.set('bmi');

      expect(page.activeSeries()[1]?.value).toBe(21.6);
    });

    it('describe la serie activa para lectores de pantalla', () => {
      expect(page.seriesAria()).toContain('peso');

      page.series.set('bmi');
      expect(page.seriesAria()).toContain('masa corporal');
    });
  });

  describe('formatDate()', () => {
    it('formatea una fecha ISO', () => {
      expect(page.formatDate('2026-09-07T10:00:00.000Z')).toContain('2026');
    });

    it('devuelve vacio con una cadena vacia', () => {
      expect(page.formatDate('')).toBe('');
    });
  });

  describe('angleLabel()', () => {
    it.each([
      ['front', 'Frente'],
      ['side', 'Perfil'],
      ['back', 'Espalda'],
    ] as const)('traduce %s a %s', (angle, expected) => {
      expect(page.angleLabel(angle)).toBe(expected);
    });
  });

  describe('weightLabel()', () => {
    it('muestra el peso de la ultima evaluacion', () => {
      expect(page.weightLabel()).toMatch(/kg$/);
    });
  });

  describe('onFile()', () => {
    /** Input con un archivo de verdad: jsdom implementa FileReader. */
    const inputConArchivo = (contenido = 'foto'): HTMLInputElement => {
      const input = document.createElement('input');
      input.type = 'file';
      const file = new File([contenido], 'foto.png', { type: 'image/png' });
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      return input;
    };

    /** FileReader resuelve en macrotask; se espera a que el control se libere. */
    const esperarLectura = async (): Promise<void> => {
      for (let i = 0; i < 50 && page.uploading(); i++) {
        await new Promise(resolve => setTimeout(resolve, 5));
      }
    };

    it('no hace nada sin archivo', () => {
      const input = document.createElement('input');
      page.onFile({ target: input } as unknown as Event);

      expect(addPhoto).not.toHaveBeenCalled();
      expect(page.uploading()).toBe(false);
    });

    it('marca que esta subiendo mientras lee el archivo', () => {
      page.onFile({ target: inputConArchivo() } as unknown as Event);

      expect(page.uploading()).toBe(true);
    });

    it('guarda la foto y libera el control al terminar', async () => {
      page.onFile({ target: inputConArchivo() } as unknown as Event);
      await esperarLectura();

      expect(addPhoto).toHaveBeenCalled();
      expect(page.uploading()).toBe(false);
      expect(page.uploadError()).toBeNull();
    });

    it('avisa cuando el guardado falla', async () => {
      addPhoto.mockReturnValue(throwError(() => domainError('network')));

      page.onFile({ target: inputConArchivo() } as unknown as Event);
      await esperarLectura();

      expect(page.uploading()).toBe(false);
      expect(page.uploadError()).not.toBeNull();
    });

    it('ignora un segundo archivo mientras sube el primero', () => {
      page.onFile({ target: inputConArchivo() } as unknown as Event);
      page.onFile({ target: inputConArchivo('otra') } as unknown as Event);

      expect(page.uploading()).toBe(true);
    });
  });

  describe('borrado con confirmacion', () => {
    it('askRemove solo marca la foto pendiente, sin borrar', () => {
      page.askRemove('p1');

      expect(page.pendingRemoval()).toBe('p1');
      expect(removePhoto).not.toHaveBeenCalled();
    });

    it('cancelRemove descarta la pendiente sin borrar', () => {
      page.askRemove('p1');
      page.cancelRemove();

      expect(page.pendingRemoval()).toBeNull();
      expect(removePhoto).not.toHaveBeenCalled();
    });

    it('confirmRemove borra y limpia la pendiente', async () => {
      page.askRemove('p1');
      await page.confirmRemove();

      expect(removePhoto).toHaveBeenCalledWith('p1');
      expect(page.pendingRemoval()).toBeNull();
      expect(page.removing()).toBe(false);
    });

    it('confirmRemove no hace nada sin foto pendiente', async () => {
      await page.confirmRemove();

      expect(removePhoto).not.toHaveBeenCalled();
    });

    it('confirmRemove ignora el segundo toque mientras borra', async () => {
      page.askRemove('p1');
      const first = page.confirmRemove();
      const second = page.confirmRemove();
      await Promise.all([first, second]);

      expect(removePhoto).toHaveBeenCalledTimes(1);
    });
  });

  describe('reload', () => {
    it('es un campo arrow invocable', () => {
      expect(() => page.reload()).not.toThrow();
    });
  });
});
