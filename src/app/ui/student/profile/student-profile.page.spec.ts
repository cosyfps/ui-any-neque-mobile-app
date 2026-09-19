import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { SessionFacade } from '@app/application/auth/session.facade';
import { NotificationsFacade } from '@app/application/notifications/notifications.facade';
import { StudentProfileFacade } from '@app/application/students/student-profile.facade';
import { NOTIFICATIONS_PORT } from '@app/domain/notifications/port/notifications.port';
import { CLOCK } from '@app/domain/shared/port/clock.port';
import { Assessment } from '@app/domain/students/model/assessment.model';
import { Student } from '@app/domain/students/model/student.model';
import { ASSESSMENTS_PORT } from '@app/domain/students/port/assessments.port';
import { STUDENTS_PORT } from '@app/domain/students/port/students.port';

import { StudentProfilePage } from './student-profile.page';

const NOW = new Date('2026-09-17T10:00:00.000Z');

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
  id: 'asm-001',
  studentId: 'std-001',
  takenAt: '2026-09-07T10:00:00.000Z',
  weightKg: 58.9,
  heightCm: 165,
  bodyFatPct: null,
  muscleMassKg: null,
  measurements: { chestCm: null, waistCm: null, hipCm: null, armCm: null, thighCm: null },
  notes: null,
};

describe('StudentProfilePage', () => {
  let page: StudentProfilePage;
  let router: Router;
  let signOut: jest.Mock;

  const createPage = (): StudentProfilePage => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        StudentProfileFacade,
        NotificationsFacade,
        { provide: CLOCK, useValue: { now: () => NOW } },
        {
          provide: SessionFacade,
          useValue: { profileId: () => 'std-001', user: () => ({ id: 'usr-1' }), signOut },
        },
        {
          provide: STUDENTS_PORT,
          useValue: { getById: () => of(STUDENT), listByTrainer: jest.fn(), update: jest.fn() },
        },
        {
          provide: ASSESSMENTS_PORT,
          useValue: {
            latestByStudent: () => of(ASSESSMENT),
            listByStudent: () => of([ASSESSMENT]),
            create: jest.fn(),
          },
        },
        {
          provide: NOTIFICATIONS_PORT,
          useValue: { listByUser: () => of([]), markRead: jest.fn(), markAllRead: jest.fn() },
        },
      ],
    });
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    return TestBed.runInInjectionContext(() => new StudentProfilePage());
  };

  beforeEach(() => {
    signOut = jest.fn().mockResolvedValue(undefined);
    page = createPage();
  });

  describe('estado inicial', () => {
    it('carga la ficha del alumno', () => {
      expect(page.facade.viewState()).toBe('success');
      expect(page.facade.displayName()).toBe('Ana Rojas');
    });

    it('expone el IMC', () => {
      expect(page.bmiLabel()).toBe(21.6);
    });

    it('arranca sin confirmacion de cierre', () => {
      expect(page.confirmingSignOut()).toBe(false);
      expect(page.signingOut()).toBe(false);
    });
  });

  describe('formatDate()', () => {
    it('formatea la fecha de ingreso', () => {
      expect(page.formatDate(STUDENT.joinedAt)).toContain('2026');
    });
  });

  describe('go()', () => {
    it('navega a la ruta indicada', () => {
      page.go('/student/schedule');

      expect(router.navigate).toHaveBeenCalledWith(['/student/schedule']);
    });
  });

  describe('cierre de sesion', () => {
    it('askSignOut() abre la confirmacion', () => {
      page.askSignOut();

      expect(page.confirmingSignOut()).toBe(true);
    });

    it('cancelSignOut() la cierra sin cerrar sesion', () => {
      page.askSignOut();

      page.cancelSignOut();

      expect(page.confirmingSignOut()).toBe(false);
      expect(signOut).not.toHaveBeenCalled();
    });

    it('confirmSignOut() cierra sesion y vuelve a la raiz', async () => {
      page.askSignOut();

      await page.confirmSignOut();

      expect(signOut).toHaveBeenCalledTimes(1);
      expect(page.confirmingSignOut()).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('ignora un segundo intento mientras hay uno en curso', async () => {
      page.signingOut.set(true);

      await page.confirmSignOut();

      expect(signOut).not.toHaveBeenCalled();
    });
  });

  describe('reload', () => {
    it('es un campo arrow invocable', () => {
      expect(() => page.reload()).not.toThrow();
    });
  });
});
