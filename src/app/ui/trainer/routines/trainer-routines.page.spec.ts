import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { SessionFacade } from '@app/application/auth/session.facade';
import { TrainerRoutinesFacade } from '@app/application/trainers/trainer-routines.facade';
import { Exercise } from '@app/domain/routines/model/exercise.model';
import { Routine } from '@app/domain/routines/model/routine.model';
import { EXERCISE_CATALOG_PORT, ROUTINES_PORT } from '@app/domain/routines/port/routines.port';
import { domainError } from '@app/domain/shared/model/app-error';
import { Student } from '@app/domain/students/model/student.model';
import { STUDENTS_PORT } from '@app/domain/students/port/students.port';

import { TrainerRoutinesPage } from './trainer-routines.page';

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

const rutina = (id: string, name: string, status: Routine['status'], studentId = 'std-001') =>
  ({
    id,
    studentId,
    trainerId: 'trn-001',
    name,
    goal: 'Ganar masa',
    startDate: '2026-09-01T00:00:00.000Z',
    endDate: null,
    status,
    days: [],
  }) as Routine;

const ejercicio = (id: string, name: string, owner: string | null): Exercise => ({
  id,
  name,
  muscleGroup: 'legs',
  equipment: null,
  thumbnailUrl: null,
  instructions: [],
  ownerTrainerId: owner,
});

const ENTRADA = {
  studentId: 'std-001',
  name: 'Hipertrofia',
  goal: 'Ganar masa',
  startDate: '2026-09-01T00:00:00.000Z',
  endDate: null,
  days: [],
};

describe('TrainerRoutinesPage', () => {
  let page: TrainerRoutinesPage;
  let create: jest.Mock;
  let update: jest.Mock;
  let assign: jest.Mock;
  let archive: jest.Mock;
  let createExercise: jest.Mock;

  const createPage = (
    opciones: {
      rutinas?: Routine[];
      cartera?: Student[];
      ejercicios?: Exercise[];
      falla?: boolean;
    } = {},
  ): TrainerRoutinesPage => {
    const {
      rutinas = [rutina('rtn-001', 'Hipertrofia', 'active')],
      cartera = [alumno('std-001', 'Ana'), alumno('std-002', 'Diego', 'suspended')],
      ejercicios = [
        ejercicio('ex-001', 'Sentadilla', null),
        ejercicio('ex-900', 'Búlgara', 'trn-001'),
      ],
      falla = false,
    } = opciones;

    create = jest.fn().mockReturnValue(of(rutina('rtn-nueva', 'Nueva', 'active')));
    update = jest.fn().mockReturnValue(of(rutina('rtn-001', 'Editada', 'active')));
    assign = jest.fn().mockReturnValue(of(rutina('rtn-001', 'Hipertrofia', 'active')));
    archive = jest.fn().mockReturnValue(of(rutina('rtn-001', 'Hipertrofia', 'archived')));
    createExercise = jest.fn().mockReturnValue(of(ejercicio('ex-901', 'Zancada', 'trn-001')));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        // La pagina la declara en sus `providers`; aqui hay que darla a mano.
        TrainerRoutinesFacade,
        { provide: SessionFacade, useValue: { profileId: () => 'trn-001' } },
        {
          provide: ROUTINES_PORT,
          useValue: {
            listByTrainer: () => (falla ? throwError(() => new Error('boom')) : of(rutinas)),
            create,
            update,
            assign,
            archive,
          },
        },
        { provide: STUDENTS_PORT, useValue: { listByTrainer: () => of(cartera) } },
        {
          provide: EXERCISE_CATALOG_PORT,
          useValue: { listForTrainer: () => of(ejercicios), create: createExercise },
        },
      ],
    });
    return TestBed.runInInjectionContext(() => new TrainerRoutinesPage());
  };

  beforeEach(() => {
    page = createPage();
  });

  describe('biblioteca', () => {
    it('resuelve el nombre del alumno de cada rutina', () => {
      expect(page.facade.visible()[0]).toMatchObject({ studentName: 'Ana Rojas' });
    });

    it('avisa cuando el alumno ya no esta en la cartera', () => {
      page = createPage({ rutinas: [rutina('rtn-001', 'Vieja', 'active', 'std-999')] });

      expect(page.facade.visible()[0]?.studentName).toBe('Alumno desconocido');
    });

    it('muestra las activas por defecto', () => {
      expect(page.facade.filter()).toBe('active');
      expect(page.facade.activeCount()).toBe(1);
    });

    it('cambia a las archivadas', () => {
      page = createPage({
        rutinas: [rutina('rtn-001', 'A', 'active'), rutina('rtn-002', 'B', 'archived')],
      });

      page.facade.selectFilter('archived');

      expect(page.facade.visible().map(row => row.routine.id)).toEqual(['rtn-002']);
    });

    // Una biblioteca con rutinas pero ninguna archivada muestra ese vacio.
    it('la pestana sin rutinas queda en empty', () => {
      page.facade.selectFilter('archived');

      expect(page.facade.viewState()).toBe('empty');
      expect(page.emptyTitle()).toBe('Nada sin asignar');
    });

    it('invita a crear la primera con la biblioteca vacia', () => {
      page = createPage({ rutinas: [] });

      expect(page.emptyTitle()).toBe('Ninguna rutina asignada');
      expect(page.emptyMessage()).toContain('Crea una rutina');
    });

    it('propaga el error del puerto', () => {
      page = createPage({ falla: true });

      expect(page.facade.viewState()).toBe('error');
    });
  });

  describe('selector de alumno', () => {
    // A un alumno suspendido no se le puede asignar una rutina.
    it('solo ofrece alumnos activos', () => {
      expect(page.facade.assignableStudents().map(item => item.id)).toEqual(['std-001']);
    });
  });

  describe('catalogo de ejercicios', () => {
    it('separa los publicos de los propios', () => {
      expect(page.facade.publicExercises().map(item => item.id)).toEqual(['ex-001']);
      expect(page.facade.ownExercises().map(item => item.id)).toEqual(['ex-900']);
    });
  });

  describe('secciones', () => {
    it('abre en rutinas', () => {
      expect(page.seccion()).toBe('routines');
      expect(page.addLabel()).toBe('Crear una rutina');
    });

    it('el boton de alta cambia con la seccion', () => {
      page.selectSeccion('exercises');

      expect(page.addLabel()).toBe('Crear un ejercicio');
    });
  });

  describe('constructor de rutinas', () => {
    it('el sheet nace cerrado', () => {
      expect(page.building()).toBe(false);
    });

    it('crear abre el constructor en blanco', () => {
      page.openCreate();

      expect(page.building()).toBe(true);
      expect(page.editing()).toBeNull();
      expect(page.builderTitle()).toBe('Nueva rutina');
    });

    it('editar abre el constructor con la rutina', () => {
      const actual = rutina('rtn-001', 'Hipertrofia', 'active');

      page.openEdit(actual);

      expect(page.editing()).toBe(actual);
      expect(page.builderTitle()).toBe('Editar rutina');
    });

    it('guardar una nueva agrega el entrenador de la sesion', async () => {
      page.openCreate();

      await page.saveRoutine(ENTRADA);

      expect(create).toHaveBeenCalledWith({ ...ENTRADA, trainerId: 'trn-001' });
      expect(page.building()).toBe(false);
    });

    // Una rutina nace sin asignar: sin el salto de pestana el entrenador la
    // guarda y no la ve por ninguna parte.
    it('tras crear salta a la pestana donde queda', async () => {
      page.openCreate();

      await page.saveRoutine(ENTRADA);

      expect(page.facade.filter()).toBe('archived');
    });

    it('guardar una existente la actualiza', async () => {
      page.openEdit(rutina('rtn-001', 'Hipertrofia', 'active'));

      await page.saveRoutine(ENTRADA);

      expect(update).toHaveBeenCalledWith('rtn-001', { ...ENTRADA, trainerId: 'trn-001' });
      expect(page.building()).toBe(false);
    });

    it('un rechazo deja el sheet abierto', async () => {
      page.openCreate();
      create.mockReturnValue(throwError(() => domainError('conflict')));

      await page.saveRoutine(ENTRADA);

      expect(page.building()).toBe(true);
      expect(page.facade.actionError()?.code).toBe('conflict');
    });

    it('cerrar lo oculta', () => {
      page.openCreate();

      page.closeBuilder();

      expect(page.building()).toBe(false);
    });
  });

  describe('asignar y archivar', () => {
    // Activar y archivar la anterior va en una sola operacion del puerto.
    it('asignar llama al puerto con la rutina', async () => {
      await page.assign('rtn-001');

      expect(assign).toHaveBeenCalledWith('rtn-001');
    });

    it('archivar llama al puerto con la rutina', async () => {
      await page.archive('rtn-001');

      expect(archive).toHaveBeenCalledWith('rtn-001');
    });

    it('relee la biblioteca tras asignar', async () => {
      await page.assign('rtn-001');

      expect(page.facade.rows.data()).toHaveLength(1);
    });
  });

  describe('ejercicio propio', () => {
    const NUEVO = {
      name: 'Zancada',
      muscleGroup: 'legs' as const,
      equipment: null,
      thumbnailUrl: null,
      instructions: [],
    };

    it('el sheet nace cerrado', () => {
      expect(page.creatingExercise()).toBe(false);
    });

    it('el boton de alta lo abre desde la seccion de ejercicios', () => {
      page.selectSeccion('exercises');

      page.openCreate();

      expect(page.creatingExercise()).toBe(true);
      expect(page.building()).toBe(false);
    });

    it('queda con el entrenador que lo crea', async () => {
      await page.saveExercise(NUEVO);

      expect(createExercise).toHaveBeenCalledWith({ ...NUEVO, ownerTrainerId: 'trn-001' });
    });

    it('aparece en el catalogo propio sin releer', async () => {
      await page.saveExercise(NUEVO);

      expect(page.facade.ownExercises().map(item => item.id)).toContain('ex-901');
    });

    it('un rechazo deja el sheet abierto', async () => {
      page.selectSeccion('exercises');
      page.openCreate();
      createExercise.mockReturnValue(throwError(() => domainError('conflict')));

      await page.saveExercise(NUEVO);

      expect(page.creatingExercise()).toBe(true);
    });

    it('cerrar lo oculta', () => {
      page.selectSeccion('exercises');
      page.openCreate();

      page.closeExercise();

      expect(page.creatingExercise()).toBe(false);
    });
  });

  describe('dias()', () => {
    it('usa el singular con un solo dia', () => {
      expect(page.dias(1)).toBe('1 día');
    });

    it('usa el plural con varios', () => {
      expect(page.dias(4)).toBe('4 días');
    });
  });

  describe('grupo()', () => {
    it('traduce el grupo muscular', () => {
      expect(page.grupo('legs')).toBe('Piernas');
    });
  });

  describe('reload', () => {
    it('es un campo arrow para poder pasarlo a [retry]', () => {
      expect(() => page.reload()).not.toThrow();
    });
  });
});
