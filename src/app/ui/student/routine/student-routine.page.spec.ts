import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { SessionFacade } from '@app/application/auth/session.facade';
import { StudentRoutineFacade } from '@app/application/routines/student-routine.facade';
import { Routine, RoutineExercise } from '@app/domain/routines/model/routine.model';
import { ROUTINES_PORT } from '@app/domain/routines/port/routines.port';
import { toIsoDate } from '@app/domain/shared/model/date';
import { CLOCK } from '@app/domain/shared/port/clock.port';
import { WorkoutSession } from '@app/domain/workouts/model/workout-session.model';
import { WORKOUTS_PORT } from '@app/domain/workouts/port/workouts.port';

import { StudentRoutinePage } from './student-routine.page';

// Jueves 17 de septiembre de 2026: dia 4 en convencion ISO.
const NOW = new Date(2026, 8, 17, 10, 0, 0);

const EXERCISE: RoutineExercise = {
  id: 'rex-009',
  exerciseId: 'ex-007',
  name: 'Dominadas',
  order: 1,
  sets: 4,
  reps: 8,
  restSeconds: 90,
  weightKg: null,
  notes: null,
};

const ROUTINE: Routine = {
  id: 'rtn-001',
  studentId: 'std-001',
  trainerId: 'trn-001',
  name: 'Hipertrofia',
  goal: 'Masa muscular',
  startDate: '2026-09-01T00:00:00.000Z',
  endDate: null,
  status: 'active',
  days: [
    {
      id: 'day-004',
      weekday: 4,
      title: 'Tracción',
      focus: 'back',
      estimatedMinutes: 50,
      exercises: [EXERCISE],
    },
  ],
};

const sessionWith = (
  done: boolean,
  status: WorkoutSession['status'] = 'scheduled',
): WorkoutSession => ({
  id: 'wks-today',
  studentId: 'std-001',
  routineId: 'rtn-001',
  routineDayId: 'day-004',
  title: 'Tracción',
  scheduledFor: toIsoDate(new Date(2026, 8, 17, 18)),
  startedAt: null,
  completedAt: null,
  status,
  durationMinutes: null,
  estimatedMinutes: 50,
  exercises: [
    {
      routineExerciseId: 'rex-009',
      exerciseId: 'ex-007',
      name: 'Dominadas',
      targetSets: 4,
      targetReps: 8,
      restSeconds: 90,
      weightKg: null,
      completedSets: done ? 4 : 0,
      done,
    },
  ],
});

describe('StudentRoutinePage', () => {
  let page: StudentRoutinePage;
  let router: Router;
  let markExercise: jest.Mock;
  let complete: jest.Mock;

  const createPage = (session = sessionWith(false)): StudentRoutinePage => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        StudentRoutineFacade,
        { provide: CLOCK, useValue: { now: () => NOW } },
        { provide: SessionFacade, useValue: { profileId: () => 'std-001' } },
        {
          provide: ROUTINES_PORT,
          useValue: {
            getActiveForStudent: () => of(ROUTINE),
            listByStudent: jest.fn(),
            getById: jest.fn(),
          },
        },
        {
          provide: WORKOUTS_PORT,
          useValue: {
            listByStudent: () => of([session]),
            markExercise,
            complete,
            getById: jest.fn(),
            start: jest.fn(),
            logSet: jest.fn(),
          },
        },
      ],
    });
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    return TestBed.runInInjectionContext(() => new StudentRoutinePage());
  };

  beforeEach(() => {
    markExercise = jest.fn().mockReturnValue(of(sessionWith(true)));
    complete = jest.fn().mockReturnValue(of(sessionWith(true, 'completed')));
    page = createPage();
  });

  describe('estado inicial', () => {
    it('selecciona el dia de hoy', () => {
      expect(page.facade.selectedWeekday()).toBe(4);
      expect(page.facade.selectedDay()?.title).toBe('Tracción');
    });

    it('declara los siete dias de la semana', () => {
      expect(page.weekdays).toHaveLength(7);
    });

    it('arranca sin celebracion ni operaciones en curso', () => {
      expect(page.showCelebration()).toBe(false);
      expect(page.busyId()).toBeNull();
      expect(page.completing()).toBe(false);
    });
  });

  describe('hasTraining()', () => {
    it('es verdadero en un dia con entrenamiento', () => {
      expect(page.hasTraining(4)).toBe(true);
    });

    it('es falso en un dia de descanso', () => {
      expect(page.hasTraining(3)).toBe(false);
    });
  });

  describe('isDone()', () => {
    it('es falso sin marcar', () => {
      expect(page.isDone('rex-009')).toBe(false);
    });

    it('es verdadero cuando el ejercicio esta hecho', () => {
      page = createPage(sessionWith(true));
      expect(page.isDone('rex-009')).toBe(true);
    });

    it('es falso para un ejercicio que no existe', () => {
      expect(page.isDone('rex-999')).toBe(false);
    });
  });

  describe('checkLabel()', () => {
    const exercise = { id: 'rex-009', name: 'Sentadilla' } as RoutineExercise;

    it('ofrece marcar cuando esta pendiente', () => {
      expect(page.checkLabel(exercise)).toBe('Marcar Sentadilla');
    });

    it('ofrece desmarcar cuando ya esta hecho', () => {
      page = createPage(sessionWith(true));

      expect(page.checkLabel(exercise)).toBe('Desmarcar Sentadilla');
    });
  });

  describe('progressPercent()', () => {
    it('es cero sin nada marcado', () => {
      expect(page.progressPercent()).toBe(0);
    });

    it('es cien con todo marcado', () => {
      page = createPage(sessionWith(true));
      expect(page.progressPercent()).toBe(100);
    });
  });

  describe('toggle()', () => {
    it('marca el ejercicio y libera el bloqueo', async () => {
      await page.toggle(EXERCISE);

      expect(markExercise).toHaveBeenCalledWith('wks-today', 'rex-009', true);
      expect(page.busyId()).toBeNull();
    });

    it('ignora un segundo toque mientras hay uno en curso', async () => {
      page.busyId.set('rex-009');

      await page.toggle(EXERCISE);

      expect(markExercise).not.toHaveBeenCalled();
    });
  });

  describe('completeSession()', () => {
    it('cierra la sesion y muestra la celebracion', async () => {
      await page.completeSession(50);

      expect(complete).toHaveBeenCalledWith('wks-today', { durationMinutes: 50, note: null });
      expect(page.showCelebration()).toBe(true);
      expect(page.completing()).toBe(false);
    });

    it('ignora un segundo envio mientras hay uno en curso', async () => {
      page.completing.set(true);

      await page.completeSession(50);

      expect(complete).not.toHaveBeenCalled();
    });

    it('dismissCelebration() cierra el modal', async () => {
      await page.completeSession(50);

      page.dismissCelebration();

      expect(page.showCelebration()).toBe(false);
    });
  });

  describe('startWorkout()', () => {
    it('navega al runner con el id de la sesion', () => {
      page.startWorkout();

      expect(router.navigate).toHaveBeenCalledWith(['/student/workout', 'wks-today']);
    });

    it('no navega en un dia sin sesion', () => {
      page.facade.selectDay(2);

      page.startWorkout();

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('reload', () => {
    it('es un campo arrow invocable', () => {
      expect(() => page.reload()).not.toThrow();
    });
  });
});
