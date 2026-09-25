import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

import { SessionFacade } from '@app/application/auth/session.facade';
import { domainError } from '@app/domain/shared/model/app-error';
import { Assessment } from '@app/domain/students/model/assessment.model';
import { Student } from '@app/domain/students/model/student.model';
import { ASSESSMENTS_PORT } from '@app/domain/students/port/assessments.port';
import { STUDENTS_PORT } from '@app/domain/students/port/students.port';

import { StudentProfileFacade } from './student-profile.facade';

const STUDENT: Student = {
  id: 'std-001',
  trainerId: 'trn-001',
  trainerName: 'Kelvin Moreno',
  firstName: 'Ana',
  lastName: 'Rojas',
  email: 'ana@neque.cl',
  phone: null,
  avatarUrl: null,
  status: 'active',
  birthDate: null,
  heightCm: 165,
  goal: 'Ganar masa muscular',
  joinedAt: '2026-03-02T00:00:00.000Z',
};

const ASSESSMENT: Assessment = {
  id: 'asm-004',
  studentId: 'std-001',
  takenAt: '2026-09-07T10:00:00.000Z',
  weightKg: 58.9,
  heightCm: 165,
  bodyFatPct: 23.1,
  muscleMassKg: 43,
  measurements: { chestCm: 86, waistCm: 68, hipCm: 93, armCm: 28.5, thighCm: 55.5 },
  notes: null,
};

describe('StudentProfileFacade', () => {
  let getById: jest.Mock;
  let latestByStudent: jest.Mock;
  let profileId: string | null;

  const build = (): StudentProfileFacade => {
    TestBed.configureTestingModule({
      providers: [
        StudentProfileFacade,
        {
          provide: STUDENTS_PORT,
          useValue: { getById, listByTrainer: jest.fn(), update: jest.fn() },
        },
        {
          provide: ASSESSMENTS_PORT,
          useValue: { latestByStudent, listByStudent: jest.fn(), create: jest.fn() },
        },
        { provide: SessionFacade, useValue: { profileId: () => profileId } },
      ],
    });
    return TestBed.inject(StudentProfileFacade);
  };

  beforeEach(() => {
    getById = jest.fn().mockReturnValue(of(STUDENT));
    latestByStudent = jest.fn().mockReturnValue(of(ASSESSMENT));
    profileId = 'std-001';
  });

  describe('load()', () => {
    it('consulta ambos puertos con el id de la sesion', () => {
      build().load();

      expect(getById).toHaveBeenCalledWith('std-001');
      expect(latestByStudent).toHaveBeenCalledWith('std-001');
    });

    it('no consulta nada sin sesion', () => {
      profileId = null;
      build().load();

      expect(getById).not.toHaveBeenCalled();
    });

    it('queda en success con datos', () => {
      const facade = build();
      facade.load();

      expect(facade.viewState()).toBe('success');
      expect(facade.displayName()).toBe('Ana Rojas');
      expect(facade.firstName()).toBe('Ana');
      expect(facade.avatarInitials()).toBe('AR');
    });

    it('queda en loading mientras el puerto no responde', () => {
      getById.mockReturnValue(new Subject<Student>());
      const facade = build();
      facade.load();

      expect(facade.viewState()).toBe('loading');
    });

    it('queda en error si falla la ficha', () => {
      getById.mockReturnValue(throwError(() => domainError('not_found')));
      const facade = build();
      facade.load();

      expect(facade.viewState()).toBe('error');
    });
  });

  describe('bmi()', () => {
    it('lo calcula desde la ultima evaluacion', () => {
      const facade = build();
      facade.load();

      expect(facade.bmi()?.value).toBe(21.6);
      expect(facade.bmi()?.category).toBe('normal');
    });

    it('es null sin evaluaciones', () => {
      latestByStudent.mockReturnValue(of(null));
      const facade = build();
      facade.load();

      expect(facade.bmi()).toBeNull();
      // Un alumno sin evaluaciones no rompe la pantalla.
      expect(facade.viewState()).toBe('success');
    });

    it('es null si la evaluacion trae datos invalidos', () => {
      latestByStudent.mockReturnValue(of({ ...ASSESSMENT, heightCm: 0 }));
      const facade = build();
      facade.load();

      expect(facade.bmi()).toBeNull();
    });
  });

  describe('peso y altura', () => {
    it('salen de la ultima evaluacion', () => {
      const facade = build();
      facade.load();

      expect(facade.weightKg()).toBe(58.9);
      expect(facade.heightCm()).toBe(165);
    });

    it('la altura cae a la ficha si no hay evaluacion', () => {
      latestByStudent.mockReturnValue(of(null));
      const facade = build();
      facade.load();

      expect(facade.weightKg()).toBeNull();
      expect(facade.heightCm()).toBe(165);
    });
  });

  describe('reload()', () => {
    it('vuelve a consultar ambos puertos', () => {
      const facade = build();
      facade.load();
      facade.reload();

      expect(getById).toHaveBeenCalledTimes(2);
      expect(latestByStudent).toHaveBeenCalledTimes(2);
    });
  });

  describe('estado inicial', () => {
    it('arranca vacio', () => {
      const facade = build();

      expect(facade.displayName()).toBe('');
      expect(facade.avatarInitials()).toBe('');
      expect(facade.bmi()).toBeNull();
      expect(facade.viewState()).toBe('loading');
    });
  });
});
