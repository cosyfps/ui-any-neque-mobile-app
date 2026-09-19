import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { WorkoutRunnerFacade } from '@app/application/workouts/workout-runner.facade';
import { CLOCK } from '@app/domain/shared/port/clock.port';
import { WorkoutSession } from '@app/domain/workouts/model/workout-session.model';
import { WORKOUTS_PORT } from '@app/domain/workouts/port/workouts.port';

import { WorkoutRunnerPage } from './workout-runner.page';

const NOW = new Date('2026-09-17T18:00:00.000Z');

const SESSION: WorkoutSession = {
  id: 'wks-001',
  studentId: 'std-001',
  routineId: 'rtn-001',
  routineDayId: 'day-001',
  title: 'Tracción',
  scheduledFor: NOW.toISOString(),
  startedAt: null,
  completedAt: null,
  status: 'scheduled',
  durationMinutes: null,
  estimatedMinutes: 50,
  exercises: [
    {
      routineExerciseId: 'a',
      exerciseId: 'ex-a',
      name: 'Dominadas',
      targetSets: 2,
      targetReps: 8,
      restSeconds: 60,
      weightKg: null,
      completedSets: 0,
      done: false,
    },
    {
      routineExerciseId: 'b',
      exerciseId: 'ex-b',
      name: 'Remo',
      targetSets: 1,
      targetReps: 10,
      restSeconds: 45,
      weightKg: 25,
      completedSets: 0,
      done: false,
    },
  ],
};

describe('WorkoutRunnerPage', () => {
  let page: WorkoutRunnerPage;
  let router: Router;
  let complete: jest.Mock;

  const createPage = (session: WorkoutSession = SESSION): WorkoutRunnerPage => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        // La pagina la declara en sus `providers`; aqui hay que darla a mano.
        WorkoutRunnerFacade,
        { provide: CLOCK, useValue: { now: () => NOW } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'wks-001' } } },
        },
        {
          provide: WORKOUTS_PORT,
          useValue: {
            getById: () => of(session),
            start: () => of({ ...session, status: 'in_progress' as const }),
            logSet: () => of(session),
            complete,
            listByStudent: jest.fn(),
            markExercise: jest.fn(),
          },
        },
      ],
    });
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    return TestBed.runInInjectionContext(() => new WorkoutRunnerPage());
  };

  beforeEach(() => {
    jest.useFakeTimers();
    complete = jest.fn().mockReturnValue(of({ ...SESSION, status: 'completed' as const }));
    page = createPage();
  });

  afterEach(() => jest.useRealTimers());

  describe('carga inicial', () => {
    it('abre la sesion del parametro de ruta', () => {
      expect(page.facade.viewState()).toBe('success');
      expect(page.facade.exercises()).toHaveLength(2);
    });

    it('arranca en idle', () => {
      expect(page.facade.phase()).toBe('idle');
    });
  });

  describe('elapsedLabel()', () => {
    it('arranca en cero', () => {
      expect(page.elapsedLabel()).toBe('00:00');
    });

    it('formatea minutos y segundos con dos digitos', () => {
      page.facade.start();
      jest.advanceTimersByTime(65_000);

      expect(page.elapsedLabel()).toBe('01:05');
    });
  });

  describe('totalPercent()', () => {
    it('es cero sin ejercicios completados', () => {
      expect(page.totalPercent()).toBe(0);
    });

    it('refleja el avance', () => {
      page = createPage({
        ...SESSION,
        exercises: [
          { ...(SESSION.exercises[0] as (typeof SESSION.exercises)[0]), done: true },
          SESSION.exercises[1] as (typeof SESSION.exercises)[1],
        ],
      });

      expect(page.totalPercent()).toBe(50);
    });
  });

  describe('restProgress()', () => {
    it('es cero fuera del descanso', () => {
      expect(page.restProgress()).toBe(0);
    });

    it('arranca en uno al entrar en descanso', () => {
      page.facade.start();
      page.facade.completeSet();

      expect(page.restProgress()).toBe(1);
    });

    it('baja con el paso del tiempo', () => {
      page.facade.start();
      page.facade.completeSet();

      jest.advanceTimersByTime(30_000);

      expect(page.restProgress()).toBeCloseTo(0.5);
    });
  });

  describe('resumen', () => {
    it('cuenta los ejercicios completados', () => {
      expect(page.completedExercises()).toBe(0);
    });

    it('suma las series hechas', () => {
      expect(page.completedSets()).toBe(0);
    });
  });

  describe('finish()', () => {
    it('cierra la sesion y vuelve a la rutina', async () => {
      page.facade.start();

      await page.finish();

      expect(complete).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/student/routine']);
    });

    it('libera el boton al terminar', async () => {
      page.facade.start();

      await page.finish();

      expect(page.saving()).toBe(false);
    });

    // El doble toque llegaba a guardar dos veces: `saving` era un computed
    // que siempre devolvia false y el boton nunca se deshabilitaba.
    it('ignora el segundo toque mientras guarda', async () => {
      page.facade.start();

      await Promise.all([page.finish(), page.finish()]);

      expect(complete).toHaveBeenCalledTimes(1);
    });
  });

  describe('salida con confirmacion', () => {
    it('sale directo si la sesion no ha empezado', () => {
      page.exit();

      expect(page.confirmingExit()).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/student/routine']);
    });

    it('pide confirmacion con la sesion en curso', () => {
      page.facade.start();

      page.exit();

      expect(page.confirmingExit()).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('cancelar deja al alumno donde estaba', () => {
      page.facade.start();
      page.exit();

      page.cancelExit();

      expect(page.confirmingExit()).toBe(false);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('confirmar sale a la rutina', () => {
      page.facade.start();
      page.exit();

      page.leave();

      expect(page.confirmingExit()).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/student/routine']);
    });
  });

  describe('exit()', () => {
    it('vuelve a la rutina sin cerrar la sesion', () => {
      page.exit();

      expect(complete).not.toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/student/routine']);
    });
  });

  describe('reload', () => {
    it('es un campo arrow invocable', () => {
      expect(() => page.reload()).not.toThrow();
    });
  });
});
