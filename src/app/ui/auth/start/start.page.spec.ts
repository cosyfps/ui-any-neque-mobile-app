import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthSession } from '@app/domain/auth/model/auth-user.model';
import { AUTH_PORT } from '@app/domain/auth/port/auth.port';
import { SESSION_STORAGE_PORT } from '@app/domain/auth/port/session-storage.port';
import { domainError } from '@app/domain/shared/model/app-error';
import { CLOCK } from '@app/domain/shared/port/clock.port';

import { StartPage } from './start.page';

const STUDENT_SESSION: AuthSession = {
  user: {
    id: 'usr-1',
    email: 'ana@neque.cl',
    role: 'student',
    displayName: 'Ana Rojas',
    avatarUrl: null,
    profileId: 'std-001',
  },
  token: 'token',
  expiresAt: '2026-12-31T00:00:00.000Z',
};

describe('StartPage', () => {
  let page: StartPage;
  let router: Router;
  let login: jest.Mock;

  const createPage = (): StartPage => TestBed.runInInjectionContext(() => new StartPage());

  beforeEach(() => {
    login = jest.fn().mockReturnValue(of(STUDENT_SESSION));

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: CLOCK, useValue: { now: () => new Date('2026-09-17T10:00:00.000Z') } },
        {
          provide: AUTH_PORT,
          useValue: {
            login,
            signOut: () => of(undefined),
            requestPasswordReset: () => of(undefined),
            verifyOtp: () => of(STUDENT_SESSION),
          },
        },
        {
          provide: SESSION_STORAGE_PORT,
          useValue: { read: () => null, write: jest.fn(), clear: jest.fn() },
        },
      ],
    });
    router = TestBed.inject(Router);
    // Ninguna prueba debe navegar de verdad: el router de prueba no declara rutas.
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    page = createPage();
  });

  describe('estado inicial', () => {
    it('arranca con el panel de login cerrado y sin envio en curso', () => {
      expect(page.showLogin).toBe(false);
      expect(page.showPassword).toBe(false);
      expect(page.isSubmitting()).toBe(false);
      expect(page.formValid()).toBe(false);
    });

    it('no muestra error de email antes de tocar el campo', () => {
      expect(page.emailError()).toBeNull();

      page.form.controls.email.setValue('no-es-un-email');

      expect(page.emailError()).toBeNull();
    });
  });

  describe('validacion de email', () => {
    it('exige el campo cuando esta vacio y ya fue tocado', () => {
      page.markEmailTouched();
      page.form.controls.email.setValue('');

      expect(page.emailError()).toBe('Email is required');
    });

    it('rechaza un formato invalido', () => {
      page.markEmailTouched();
      page.form.controls.email.setValue('kelvin@sin-tld');

      expect(page.emailError()).toBe('Please enter a valid email address');
    });

    it('acepta un email valido', () => {
      page.markEmailTouched();
      page.form.controls.email.setValue('kelvin.moreno@duocuc.cl');

      expect(page.emailError()).toBeNull();
    });
  });

  describe('validacion de password', () => {
    it('no muestra error antes de tocar el campo', () => {
      page.form.controls.password.setValue('');

      expect(page.passwordError()).toBeNull();
    });

    it('exige el campo cuando esta vacio y ya fue tocado', () => {
      page.markPasswordTouched();
      page.form.controls.password.setValue('');

      expect(page.passwordError()).toBe('Password is required');
    });

    it('exige un largo minimo de 8', () => {
      page.markPasswordTouched();
      page.form.controls.password.setValue('corta');

      expect(page.passwordError()).toBe('Password must be at least 8 characters');
    });

    // El login no valida composicion: una contrasena antigua que no cumple
    // las reglas vigentes debe poder usarse igual.
    it('acepta una contrasena sin mayusculas, numeros ni simbolos', () => {
      page.markPasswordTouched();
      page.form.controls.password.setValue('todominuscula');

      expect(page.passwordError()).toBeNull();
    });

    it('expone el valor actual de la contrasena', () => {
      page.form.controls.password.setValue('Abcdefg1!');

      expect(page.passwordValue()).toBe('Abcdefg1!');
      expect(page.passwordFilled()).toBe(true);
    });

    it('marca el campo como tocado', () => {
      expect(page.passwordTouched()).toBe(false);

      page.markPasswordTouched();

      expect(page.passwordTouched()).toBe(true);
    });
  });

  describe('formValid()', () => {
    it('exige email valido y password valida a la vez', () => {
      page.form.controls.email.setValue('kelvin@duocuc.cl');
      expect(page.formValid()).toBe(false);

      page.form.controls.password.setValue('Abcdefg1!');
      expect(page.formValid()).toBe(true);

      page.form.controls.email.setValue('roto@');
      expect(page.formValid()).toBe(false);
    });
  });

  describe('onLogin()', () => {
    const fillValidForm = (): void => {
      page.form.controls.email.setValue('kelvin@duocuc.cl');
      page.form.controls.password.setValue('Abcdefg1!');
    };

    it('no hace nada si el formulario es invalido', async () => {
      await page.onLogin();

      expect(page.isSubmitting()).toBe(false);
      expect(page.emailTouched()).toBe(false);
      expect(login).not.toHaveBeenCalled();
    });

    it('marca ambos campos como tocados y llama al puerto', async () => {
      fillValidForm();

      await page.onLogin();

      expect(page.emailTouched()).toBe(true);
      expect(page.passwordTouched()).toBe(true);
      expect(login).toHaveBeenCalledWith({
        email: 'kelvin@duocuc.cl',
        password: 'Abcdefg1!',
      });
    });

    it('navega al home del rol tras autenticarse', async () => {
      const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);
      fillValidForm();

      await page.onLogin();

      expect(navigate).toHaveBeenCalledWith(['/student/home']);
      expect(page.isSubmitting()).toBe(false);
    });

    it('ignora un segundo submit mientras hay uno en curso', async () => {
      fillValidForm();
      page.isSubmitting.set(true);

      await page.onLogin();

      expect(login).not.toHaveBeenCalled();
    });

    describe('credenciales invalidas', () => {
      beforeEach(() => {
        login.mockReturnValue(throwError(() => domainError('invalid_credentials')));
      });

      it('expone el mensaje de error y no navega', async () => {
        const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);
        fillValidForm();

        await page.onLogin();

        expect(page.loginError()).toBe('Correo o contraseña incorrectos.');
        expect(navigate).not.toHaveBeenCalled();
        expect(page.isSubmitting()).toBe(false);
      });

      it('limpia el error al editar el formulario', async () => {
        fillValidForm();
        await page.onLogin();
        expect(page.loginError()).not.toBeNull();

        page.form.controls.password.setValue('Otra1234!');

        expect(page.loginError()).toBeNull();
      });
    });
  });

  describe('navegacion', () => {
    it('goToForgotPassword() navega a /forgot-password', () => {
      const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);

      page.goToForgotPassword();

      expect(navigate).toHaveBeenCalledWith(['/forgot-password']);
    });
  });
});
