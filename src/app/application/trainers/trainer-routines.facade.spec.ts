import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { SessionFacade } from '@app/application/auth/session.facade';
import { Exercise } from '@app/domain/routines/model/exercise.model';
import { Routine } from '@app/domain/routines/model/routine.model';
import { EXERCISE_CATALOG_PORT, ROUTINES_PORT } from '@app/domain/routines/port/routines.port';
import { domainError } from '@app/domain/shared/model/app-error';
import { Student } from '@app/domain/students/model/student.model';
import { STUDENTS_PORT } from '@app/domain/students/port/students.port';

import { TrainerRoutinesFacade } from './trainer-routines.facade';

const alumno = (id: string, firstName: string, status: Student['status'] = 'active'): Student => ({
  id,
  trainerId: 'trn-001',
  trainerName: 'Kelvin Moreno',
  firstName,
  lastName: 'Acosta',
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

describe('TrainerRoutinesFacade', () => {
  let facade: TrainerRoutinesFacade;
  let listByTrainer: jest.Mock;
  let create: jest.Mock;
  let update: jest.Mock;
  let assign: jest.Mock;
  let archive: jest.Mock;
  let createExercise: jest.Mock;

  const createFacade = (
    trainerId: string | null = 'trn-001',
    rutinas: Routine[] = [
      rutina('rtn-002', 'Zeta', 'active'),
      rutina('rtn-001', 'Alfa', 'active'),
      rutina('rtn-003', 'Vieja', 'archived'),
    ],
  ): TrainerRoutinesFacade => {
    listByTrainer = jest.fn().mockReturnValue(of(rutinas));
    create = jest.fn().mockReturnValue(of(rutina('rtn-nueva', 'Nueva', 'active')));
    update = jest.fn().mockReturnValue(of(rutina('rtn-001', 'Alfa', 'active')));
    assign = jest.fn().mockReturnValue(of(rutina('rtn-003', 'Vieja', 'active')));
    archive = jest.fn().mockReturnValue(of(rutina('rtn-001', 'Alfa', 'archived')));
    createExercise = jest.fn().mockReturnValue(of(ejercicio('ex-901', 'Zancada', 'trn-001')));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        TrainerRoutinesFacade,
        { provide: SessionFacade, useValue: { profileId: () => trainerId } },
        {
          provide: ROUTINES_PORT,
          useValue: { listByTrainer, create, update, assign, archive },
        },
        {
          provide: STUDENTS_PORT,
          useValue: {
            listByTrainer: () =>
              of([alumno('std-001', 'Alejandra'), alumno('std-002', 'Diego', 'suspended')]),
          },
        },
        {
          provide: EXERCISE_CATALOG_PORT,
          useValue: {
            listForTrainer: () =>
              of([
                ejercicio('ex-002', 'Zancada', null),
                ejercicio('ex-001', 'Sentadilla', null),
                ejercicio('ex-900', 'Búlgara', 'trn-001'),
              ]),
            create: createExercise,
          },
        },
      ],
    });
    return TestBed.inject(TrainerRoutinesFacade);
  };

  beforeEach(() => {
    facade = createFacade();
    facade.load();
  });

  describe('load()', () => {
    it('pide la biblioteca del entrenador de la sesion', () => {
      expect(listByTrainer).toHaveBeenCalledWith('trn-001');
    });

    it('no consulta sin entrenador en sesion', () => {
      const sinSesion = createFacade(null);

      sinSesion.load();

      expect(listByTrainer).not.toHaveBeenCalled();
    });

    it('resuelve el nombre del alumno de cada rutina', () => {
      expect(facade.visible()[0]?.studentName).toBe('Alejandra Acosta');
    });
  });

  describe('visible()', () => {
    it('muestra las activas ordenadas por nombre', () => {
      expect(facade.visible().map(row => row.routine.id)).toEqual(['rtn-001', 'rtn-002']);
    });

    it('cambia a las archivadas', () => {
      facade.selectFilter('archived');

      expect(facade.visible().map(row => row.routine.id)).toEqual(['rtn-003']);
    });
  });

  describe('contadores', () => {
    it('cuenta activas y archivadas por separado', () => {
      expect(facade.activeCount()).toBe(2);
      expect(facade.archivedCount()).toBe(1);
    });
  });

  describe('assignableStudents()', () => {
    // A un alumno suspendido no se le puede asignar una rutina.
    it('deja fuera a los suspendidos', () => {
      expect(facade.assignableStudents().map(item => item.id)).toEqual(['std-001']);
    });
  });

  describe('catalogo', () => {
    it('separa publicos de propios y los ordena', () => {
      expect(facade.publicExercises().map(item => item.name)).toEqual(['Sentadilla', 'Zancada']);
      expect(facade.ownExercises().map(item => item.name)).toEqual(['Búlgara']);
    });
  });

  describe('create()', () => {
    it('agrega el entrenador de la sesion', async () => {
      await facade.create(ENTRADA);

      expect(create).toHaveBeenCalledWith({ ...ENTRADA, trainerId: 'trn-001' });
    });

    it('devuelve el id de la rutina creada', async () => {
      expect(await facade.create(ENTRADA)).toBe('rtn-nueva');
    });

    it('expone el rechazo del puerto', async () => {
      create.mockReturnValue(throwError(() => domainError('conflict')));

      expect(await facade.create(ENTRADA)).toBeNull();
      expect(facade.actionError()?.code).toBe('conflict');
      expect(facade.busy()).toBe(false);
    });

    it('no crea sin entrenador en sesion', async () => {
      const sinSesion = createFacade(null);

      expect(await sinSesion.create(ENTRADA)).toBeNull();
      expect(create).not.toHaveBeenCalled();
    });
  });

  describe('update()', () => {
    it('manda la rutina completa con su entrenador', async () => {
      await facade.update('rtn-001', ENTRADA);

      expect(update).toHaveBeenCalledWith('rtn-001', { ...ENTRADA, trainerId: 'trn-001' });
    });

    it('no edita sin entrenador en sesion', async () => {
      const sinSesion = createFacade(null);

      expect(await sinSesion.update('rtn-001', ENTRADA)).toBeNull();
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('assign()', () => {
    it('llama al puerto con la rutina', async () => {
      expect(await facade.assign('rtn-003')).toBe(true);
      expect(assign).toHaveBeenCalledWith('rtn-003');
    });

    // Asignar archiva otra rutina que no vuelve en la respuesta: parchear la
    // lista en memoria la dejaria mintiendo.
    it('relee la biblioteca despues', async () => {
      await facade.assign('rtn-003');

      expect(listByTrainer).toHaveBeenCalledTimes(2);
    });

    it('devuelve false si el puerto rechaza', async () => {
      assign.mockReturnValue(throwError(() => domainError('conflict')));

      expect(await facade.assign('rtn-003')).toBe(false);
      expect(facade.actionError()?.code).toBe('conflict');
    });
  });

  describe('archive()', () => {
    it('llama al puerto con la rutina', async () => {
      expect(await facade.archive('rtn-001')).toBe(true);
      expect(archive).toHaveBeenCalledWith('rtn-001');
    });
  });

  describe('createExercise()', () => {
    const NUEVO = {
      name: 'Zancada',
      muscleGroup: 'legs' as const,
      equipment: null,
      thumbnailUrl: null,
      instructions: [],
    };

    it('lo deja a nombre del entrenador de la sesion', async () => {
      await facade.createExercise(NUEVO);

      expect(createExercise).toHaveBeenCalledWith({ ...NUEVO, ownerTrainerId: 'trn-001' });
    });

    it('lo suma al catalogo propio sin releer', async () => {
      await facade.createExercise(NUEVO);

      expect(facade.ownExercises().map(item => item.id)).toContain('ex-901');
    });

    it('expone el rechazo del puerto', async () => {
      createExercise.mockReturnValue(throwError(() => domainError('conflict')));

      expect(await facade.createExercise(NUEVO)).toBeNull();
      expect(facade.actionError()?.code).toBe('conflict');
    });

    it('no crea sin entrenador en sesion', async () => {
      const sinSesion = createFacade(null);

      expect(await sinSesion.createExercise(NUEVO)).toBeNull();
      expect(createExercise).not.toHaveBeenCalled();
    });
  });

  describe('clearActionError()', () => {
    it('limpia el error anterior', async () => {
      create.mockReturnValue(throwError(() => domainError('conflict')));
      await facade.create(ENTRADA);

      facade.clearActionError();

      expect(facade.actionError()).toBeNull();
    });
  });

  describe('reload()', () => {
    it('vuelve a consultar la biblioteca', () => {
      facade.reload();

      expect(listByTrainer).toHaveBeenCalledTimes(2);
    });
  });
});
