import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { StartPage } from './start.page';

describe('StartPage', () => {
  let page: StartPage;
  let router: Router;

  const createPage = (): StartPage => TestBed.runInInjectionContext(() => new StartPage());

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    router = TestBed.inject(Router);
    page = createPage();
  });

  describe('estado inicial', () => {
    it('arranca con el panel de login cerrado y sin envio en curso', () => {
      expect(page.showLogin).toBe(false);
      expect(page.showPassword).toBe(false);
      expect(page.passwordFocused).toBe(false);
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

  describe('reglas de password', () => {
    it('marca las cuatro reglas como no cumplidas con la contrasena vacia', () => {
      expect(page.pwdRequirements().map(r => r.met)).toEqual([false, false, false, false]);
      expect(page.passwordValid()).toBe(false);
    });

    it.each([
      ['abcdefgh', [true, false, false, false]],
      ['Abcdefgh', [true, true, false, false]],
      ['Abcdefg1', [true, true, true, false]],
      ['Abcdefg1!', [true, true, true, true]],
    ])('evalua %s regla por regla', (value, expected) => {
      page.form.controls.password.setValue(value);

      expect(page.pwdRequirements().map(r => r.met)).toEqual(expected);
    });

    it('expone el valor actual de la contrasena', () => {
      page.form.controls.password.setValue('Abcdefg1!');

      expect(page.passwordValue()).toBe('Abcdefg1!');
      expect(page.passwordValid()).toBe(true);
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

    it('no hace nada si el formulario es invalido', () => {
      page.onLogin();

      expect(page.isSubmitting()).toBe(false);
      expect(page.emailTouched()).toBe(false);
    });

    it('marca ambos campos como tocados y entra en envio', () => {
      fillValidForm();

      page.onLogin();

      expect(page.emailTouched()).toBe(true);
      expect(page.passwordTouched()).toBe(true);
      expect(page.isSubmitting()).toBe(true);
    });

    it('ignora un segundo submit mientras hay uno en curso', () => {
      fillValidForm();
      page.onLogin();
      page.isSubmitting.set(true);

      page.onLogin();

      expect(page.isSubmitting()).toBe(true);
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
