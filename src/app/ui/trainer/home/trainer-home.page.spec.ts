import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { SessionFacade } from '@app/application/auth/session.facade';
import { TrainerHomeFacade } from '@app/application/trainers/trainer-home.facade';
import { Routine } from '@app/domain/routines/model/routine.model';
import { ROUTINES_PORT } from '@app/domain/routines/port/routines.port';
import { CLOCK } from '@app/domain/shared/port/clock.port';
import { Assessment } from '@app/domain/students/model/assessment.model';
import { Student } from '@app/domain/students/model/student.model';
import { ASSESSMENTS_PORT } from '@app/domain/students/port/assessments.port';
import { STUDENTS_PORT } from '@app/domain/students/port/students.port';
import { WorkoutSession } from '@app/domain/workouts/model/workout-session.model';
import { WORKOUTS_PORT } from '@app/domain/workouts/port/workouts.port';

import { TrainerHomePage } from './trainer-home.page';

const AHORA = new Date(2026, 8, 20, 9, 0, 0);

const alumno = (id: string, firstName: string, status: Student['status'] = 'active'): Student => ({
  id,
  trainerId: 'trn-001',
  trainerName: 'Kelvin Moreno',
  firstName,
  lastName: 'Rojas',
  email: `${id}@neque.cl`,
  phone: null,
  avatarUrl: null,
  status,
  birthDate: null,
  heightCm: null,
  goal: null,
  joinedAt: '2026-01-10T00:00:00.000Z',
});

const sesion = (
  id: string,
  studentId: string,
  cuando: Date,
  status = 'scheduled',
): WorkoutSession =>
  ({
    id,
    studentId,
    routineId: 'rtn-001',
    routineDayId: 'day-001',
    title: 'Tren inferior',
    scheduledFor: cuando.toISOString(),
    startedAt: null,
    completedAt: null,
    status,
    durationMinutes: null,
    estimatedMinutes: 50,
    exercises: [],
  }) as WorkoutSession;

const RUTINA = { id: 'rtn-001', name: 'Hipertrofia' } as Routine;
const EVALUACION = { id: 'asm-001' } as Assessment;

describe('TrainerHomePage', () => {
  let page: TrainerHomePage;
  let router: Router;

  const createPage = (
    opciones: {
      cartera?: Student[];
      sesiones?: WorkoutSession[];
      rutina?: Routine | null;
      evaluacion?: Assessment | null;
      falla?: boolean;
      ahora?: Date;
    } = {},
  ): TrainerHomePage => {
    const {
      cartera = [alumno('std-001', 'Ana')],
      sesiones = [],
      rutina = RUTINA,
      evaluacion = EVALUACION,
      falla = false,
      ahora = AHORA,
    } = opciones;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        // La pagina la declara en sus `providers`; aqui hay que darla a mano.
        TrainerHomeFacade,
        {
          provide: SessionFacade,
          useValue: { profileId: () => 'trn-001', displayName: () => 'Kelvin Moreno' },
        },
        { provide: CLOCK, useValue: { now: () => ahora } },
        {
          provide: STUDENTS_PORT,
          useValue: {
            listByTrainer: () => (falla ? throwError(() => new Error('boom')) : of(cartera)),
          },
        },
        { provide: WORKOUTS_PORT, useValue: { listByStudent: () => of(sesiones) } },
        { provide: ROUTINES_PORT, useValue: { getActiveForStudent: () => of(rutina) } },
        { provide: ASSESSMENTS_PORT, useValue: { latestByStudent: () => of(evaluacion) } },
      ],
    });
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    return TestBed.runInInjectionContext(() => new TrainerHomePage());
  };

  beforeEach(() => {
    page = createPage();
  });

  describe('saludo', () => {
    it('usa el primer nombre del entrenador', () => {
      expect(page.facade.trainerFirstName()).toBe('Kelvin');
    });

    it.each([
      [new Date(2026, 8, 20, 9, 0), 'Buenos días'],
      [new Date(2026, 8, 20, 15, 0), 'Buenas tardes'],
      [new Date(2026, 8, 20, 21, 0), 'Buenas noches'],
    ])('saluda segun la hora del reloj inyectado', (ahora, esperado) => {
      page = createPage({ ahora });

      expect(page.facade.greeting()).toBe(esperado);
    });
  });

  describe('metricas', () => {
    it('cuenta solo los alumnos activos', () => {
      page = createPage({
        cartera: [alumno('std-001', 'Ana'), alumno('std-002', 'Diego', 'suspended')],
      });

      expect(page.facade.activeCount()).toBe(1);
    });

    it('es cero con la cartera vacia', () => {
      page = createPage({ cartera: [] });

      expect(page.facade.activeCount()).toBe(0);
      expect(page.facade.todayCount()).toBe(0);
    });
  });

  describe('sesiones de hoy', () => {
    it('resuelve el nombre del alumno de cada sesion', () => {
      page = createPage({ sesiones: [sesion('wks-001', 'std-001', AHORA)] });

      expect(page.facade.today.data()?.[0]).toMatchObject({
        studentName: 'Ana Rojas',
        title: 'Tren inferior',
      });
    });

    it('deja fuera las de otro dia', () => {
      page = createPage({ sesiones: [sesion('wks-001', 'std-001', new Date(2026, 8, 25, 18, 0))] });

      expect(page.facade.todayCount()).toBe(0);
    });

    // Lo ya entrenado no es pendiente del dia.
    it('deja fuera las ya completadas', () => {
      page = createPage({ sesiones: [sesion('wks-001', 'std-001', AHORA, 'completed')] });

      expect(page.facade.todayCount()).toBe(0);
    });

    it('no consulta sesiones sin alumnos activos', () => {
      page = createPage({ cartera: [alumno('std-001', 'Ana', 'suspended')] });

      expect(page.facade.today.data()).toEqual([]);
    });
  });

  describe('por resolver', () => {
    it('esta vacio cuando todos tienen rutina y evaluacion', () => {
      expect(page.facade.pendingCount()).toBe(0);
    });

    it('senala a quien no tiene rutina', () => {
      page = createPage({ rutina: null });

      expect(page.facade.pending.data()?.[0]).toMatchObject({
        name: 'Ana Rojas',
        reason: 'Sin rutina asignada',
      });
    });

    // Sin evaluacion su Inicio no puede mostrarle un IMC.
    it('senala a quien no tiene evaluacion', () => {
      page = createPage({ evaluacion: null });

      expect(page.facade.pending.data()?.[0]?.reason).toBe('Sin evaluación');
    });

    it('la rutina pesa mas que la evaluacion', () => {
      page = createPage({ rutina: null, evaluacion: null });

      expect(page.facade.pending.data()?.[0]?.reason).toBe('Sin rutina asignada');
    });
  });

  describe('estado de la pantalla', () => {
    it('es success con la cartera cargada', () => {
      expect(page.facade.viewState()).toBe('success');
    });

    it('una cartera vacia no es un vacio que ocultar', () => {
      page = createPage({ cartera: [] });

      expect(page.facade.viewState()).toBe('success');
    });

    it('propaga el error del puerto', () => {
      page = createPage({ falla: true });

      expect(page.facade.viewState()).toBe('error');
    });
  });

  describe('navegacion', () => {
    it('abre la ficha del alumno', () => {
      page.openStudent('std-001');

      expect(router.navigate).toHaveBeenCalledWith(['/trainer/students', 'std-001']);
    });

    it('el atajo de alta lleva a la cartera', () => {
      page.goToStudents();

      expect(router.navigate).toHaveBeenCalledWith(['/trainer/students']);
    });

    it('el atajo de rutina lleva a rutinas', () => {
      page.goToRoutines();

      expect(router.navigate).toHaveBeenCalledWith(['/trainer/routines']);
    });
  });

  describe('hora()', () => {
    it('formatea en hora local', () => {
      expect(page.hora(new Date(2026, 8, 20, 18, 30).toISOString())).toMatch(/18:30|6:30/);
    });
  });

  describe('reload', () => {
    it('es un campo arrow para poder pasarlo a [retry]', () => {
      expect(() => page.reload()).not.toThrow();
    });
  });
});
