import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { SessionFacade } from '@app/application/auth/session.facade';
import { TrainerProfileFacade } from '@app/application/trainers/trainer-profile.facade';
import { Student } from '@app/domain/students/model/student.model';
import { STUDENTS_PORT } from '@app/domain/students/port/students.port';
import { Trainer } from '@app/domain/trainers/model/trainer.model';
import { TRAINERS_PORT } from '@app/domain/trainers/port/trainers.port';

import { TrainerProfilePage } from './trainer-profile.page';

const ENTRENADOR: Trainer = {
  id: 'trn-001',
  userId: 'usr-001',
  firstName: 'Kelvin',
  lastName: 'Moreno',
  email: 'kelvin@neque.cl',
  phone: null,
  avatarUrl: null,
  specialty: 'Fuerza',
  certifications: ['NSCA-CPT'],
  bio: 'Diez años entrenando.',
  joinedAt: '2025-11-02T00:00:00.000Z',
};

const alumno = (id: string, status: Student['status']): Student => ({
  id,
  trainerId: 'trn-001',
  trainerName: 'Kelvin Moreno',
  firstName: 'Ana',
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

describe('TrainerProfilePage', () => {
  let page: TrainerProfilePage;
  let router: Router;
  let signOut: jest.Mock;

  const createPage = (
    trainer: Trainer | null = ENTRENADOR,
    cartera: Student[] = [alumno('std-001', 'active'), alumno('std-002', 'suspended')],
  ): TrainerProfilePage => {
    signOut = jest.fn().mockResolvedValue(undefined);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        // La pagina la declara en sus `providers`; aqui hay que darla a mano.
        TrainerProfileFacade,
        { provide: SessionFacade, useValue: { profileId: () => 'trn-001', signOut } },
        {
          provide: TRAINERS_PORT,
          useValue: {
            getById: () => (trainer === null ? throwError(() => new Error('boom')) : of(trainer)),
          },
        },
        { provide: STUDENTS_PORT, useValue: { listByTrainer: () => of(cartera) } },
      ],
    });
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    return TestBed.runInInjectionContext(() => new TrainerProfilePage());
  };

  beforeEach(() => {
    page = createPage();
  });

  describe('carga inicial', () => {
    it('trae el perfil del entrenador de la sesion', () => {
      expect(page.facade.viewState()).toBe('success');
      expect(page.facade.displayName()).toBe('Kelvin Moreno');
      expect(page.facade.avatarInitials()).toBe('KM');
    });

    // El conteo se deriva de la cartera: guardarlo aparte lo condena a
    // quedar desactualizado.
    it('cuenta solo los alumnos activos', () => {
      expect(page.facade.activeCount()).toBe(1);
    });

    it('un error del puerto deja la pantalla en error', () => {
      page = createPage(null);

      expect(page.facade.viewState()).toBe('error');
    });
  });

  describe('desde()', () => {
    it('formatea mes y ano en espanol', () => {
      expect(page.desde('2025-11-02T00:00:00.000Z')).toContain('noviembre');
    });
  });

  describe('cerrar sesion', () => {
    it('el sheet nace cerrado', () => {
      expect(page.confirmingSignOut()).toBe(false);
    });

    it('pide confirmacion', () => {
      page.askSignOut();

      expect(page.confirmingSignOut()).toBe(true);
      expect(signOut).not.toHaveBeenCalled();
    });

    it('cancelar no cierra la sesion', () => {
      page.askSignOut();

      page.cancelSignOut();

      expect(page.confirmingSignOut()).toBe(false);
      expect(signOut).not.toHaveBeenCalled();
    });

    it('confirmar cierra la sesion y vuelve al inicio', async () => {
      page.askSignOut();

      await page.confirmSignOut();

      expect(signOut).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
      expect(page.confirmingSignOut()).toBe(false);
    });

    // Sin el guard, un doble toque dispara dos cierres.
    it('un doble toque cierra una sola vez', async () => {
      page.askSignOut();

      await Promise.all([page.confirmSignOut(), page.confirmSignOut()]);

      expect(signOut).toHaveBeenCalledTimes(1);
    });
  });

  describe('reload', () => {
    it('es un campo arrow para poder pasarlo a [retry]', () => {
      expect(() => page.reload()).not.toThrow();
    });
  });
});
