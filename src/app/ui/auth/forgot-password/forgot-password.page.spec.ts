import { ElementRef, QueryList } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { ForgotPasswordPage } from './forgot-password.page';

describe('ForgotPasswordPage', () => {
  let page: ForgotPasswordPage;
  let router: Router;
  let inputs: HTMLInputElement[];

  /** Sustituye el @ViewChildren('otpInput') por inputs reales de jsdom. */
  const attachOtpInputs = (): void => {
    inputs = Array.from({ length: page.otpLength }, () => {
      const el = document.createElement('input');
      document.body.appendChild(el);
      return el;
    });
    const list = new QueryList<ElementRef<HTMLInputElement>>();
    list.reset(inputs.map(el => new ElementRef(el)));
    page.otpInputs = list;
  };

  const typeOtp = (index: number, value: string): void => {
    const input = inputs[index] as HTMLInputElement;
    input.value = value;
    page.onOtpInput(index, { target: input } as unknown as Event);
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    router = TestBed.inject(Router);
    page = TestBed.runInInjectionContext(() => new ForgotPasswordPage());
    attachOtpInputs();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.useRealTimers();
  });

  describe('estado inicial', () => {
    it('arranca en el paso de email con el OTP vacio', () => {
      expect(page.step()).toBe('email');
      expect(page.otpValues()).toEqual(['', '', '', '', '', '']);
      expect(page.otpComplete()).toBe(false);
      expect(page.emailError()).toBeNull();
      expect(page.canResend()).toBe(false);
    });
  });

  describe('validacion de email', () => {
    it('exige el campo cuando esta vacio y ya fue tocado', () => {
      page.markEmailTouched();

      expect(page.emailError()).toBe('Email is required');
      expect(page.emailValid()).toBe(false);
    });

    it('rechaza un formato invalido', () => {
      page.markEmailTouched();
      page.emailForm.controls.email.setValue('kelvin@sin-tld');

      expect(page.emailError()).toBe('Please enter a valid email address');
    });

    it('acepta un email valido', () => {
      page.markEmailTouched();
      page.emailForm.controls.email.setValue('kelvin@duocuc.cl');

      expect(page.emailError()).toBeNull();
      expect(page.emailValid()).toBe(true);
    });
  });

  describe('maskedEmail()', () => {
    it('enmascara el usuario dejando primera y ultima letra', () => {
      page.emailForm.controls.email.setValue('kelvin@duocuc.cl');

      expect(page.maskedEmail()).toBe('k****n@duocuc.cl');
    });

    it('no enmascara usuarios de dos caracteres o menos', () => {
      page.emailForm.controls.email.setValue('ab@duocuc.cl');

      expect(page.maskedEmail()).toBe('ab@duocuc.cl');
    });

    it('devuelve el texto tal cual si no hay arroba', () => {
      page.emailForm.controls.email.setValue('sin-arroba');

      expect(page.maskedEmail()).toBe('sin-arroba');
    });
  });

  describe('onSendCode()', () => {
    beforeEach(() => jest.useFakeTimers());

    it('no envia si el email es invalido', () => {
      page.onSendCode();

      expect(page.emailTouched()).toBe(true);
      expect(page.isSending()).toBe(false);
      expect(page.step()).toBe('email');
    });

    it('pasa al paso OTP y arranca el countdown tras el envio', () => {
      page.emailForm.controls.email.setValue('kelvin@duocuc.cl');

      page.onSendCode();
      expect(page.isSending()).toBe(true);

      jest.advanceTimersByTime(1200);

      expect(page.isSending()).toBe(false);
      expect(page.step()).toBe('otp');
      expect(page.resendCountdown()).toBe(60);
      expect(page.canResend()).toBe(false);
    });

    it('ignora un segundo envio mientras hay uno en curso', () => {
      page.emailForm.controls.email.setValue('kelvin@duocuc.cl');
      page.onSendCode();

      page.onSendCode();
      jest.advanceTimersByTime(1200);

      expect(page.step()).toBe('otp');
    });
  });

  describe('entrada del OTP', () => {
    it('guarda el digito y avanza al siguiente input', () => {
      const focus = jest.spyOn(inputs[1] as HTMLInputElement, 'focus');

      typeOtp(0, '4');

      expect(page.otpValues()[0]).toBe('4');
      expect(focus).toHaveBeenCalled();
    });

    it('descarta caracteres no numericos', () => {
      typeOtp(0, 'a');

      expect(page.otpValues()[0]).toBe('');
    });

    it('se queda en el ultimo input sin desbordar', () => {
      typeOtp(5, '9');

      expect(page.otpValues()[5]).toBe('9');
    });

    it('backspace en un input vacio limpia y enfoca el anterior', () => {
      typeOtp(0, '1');
      const focus = jest.spyOn(inputs[0] as HTMLInputElement, 'focus');

      page.onOtpKeydown(1, new KeyboardEvent('keydown', { key: 'Backspace' }));

      expect(page.otpValues()[0]).toBe('');
      expect(focus).toHaveBeenCalled();
    });

    it('backspace no hace nada si el input tiene contenido', () => {
      typeOtp(1, '7');

      page.onOtpKeydown(1, new KeyboardEvent('keydown', { key: 'Backspace' }));

      expect(page.otpValues()[1]).toBe('7');
    });

    it('onOtpFocus selecciona el contenido del input', () => {
      const select = jest.spyOn(inputs[2] as HTMLInputElement, 'select');

      page.onOtpFocus(2);

      expect(select).toHaveBeenCalled();
    });
  });

  describe('pegado del OTP', () => {
    const pasteEvent = (text: string): ClipboardEvent =>
      ({
        preventDefault: jest.fn(),
        clipboardData: { getData: () => text },
      }) as unknown as ClipboardEvent;

    it('reparte los 6 digitos desde el primer input', () => {
      page.onOtpPaste(pasteEvent('123456'));

      expect(page.otpValues()).toEqual(['1', '2', '3', '4', '5', '6']);
      expect(page.otpComplete()).toBe(true);
    });

    it('empieza en el input enfocado y no desborda', () => {
      (inputs[4] as HTMLInputElement).focus();

      page.onOtpPaste(pasteEvent('987654'));

      expect(page.otpValues()).toEqual(['', '', '', '', '9', '8']);
    });

    it('ignora un pegado sin digitos', () => {
      page.onOtpPaste(pasteEvent('sin-numeros'));

      expect(page.otpValues()).toEqual(['', '', '', '', '', '']);
    });

    it('descarta separadores del texto pegado', () => {
      page.onOtpPaste(pasteEvent('12-34 56'));

      expect(page.otpValues()).toEqual(['1', '2', '3', '4', '5', '6']);
    });
  });

  describe('onVerifyOtp()', () => {
    it('no verifica con el codigo incompleto', () => {
      page.onVerifyOtp();

      expect(page.isVerifying()).toBe(false);
    });

    it('entra en verificacion con el codigo completo', () => {
      page.otpValues.set(['1', '2', '3', '4', '5', '6']);

      page.onVerifyOtp();

      expect(page.isVerifying()).toBe(true);
    });
  });

  describe('reenvio de codigo', () => {
    beforeEach(() => jest.useFakeTimers());

    it('no reenvia mientras el countdown sigue corriendo', () => {
      page.resendCode();

      expect(page.resendCountdown()).toBe(60);
    });

    it('descuenta un segundo por tick y habilita el reenvio al llegar a cero', () => {
      page.emailForm.controls.email.setValue('kelvin@duocuc.cl');
      page.onSendCode();
      jest.advanceTimersByTime(1200);

      jest.advanceTimersByTime(1000);
      expect(page.resendCountdown()).toBe(59);

      jest.advanceTimersByTime(59_000);
      expect(page.resendCountdown()).toBe(0);
      expect(page.canResend()).toBe(true);
    });

    it('reinicia el countdown al reenviar', () => {
      page.canResend.set(true);

      page.resendCode();

      expect(page.canResend()).toBe(false);
      expect(page.resendCountdown()).toBe(60);
    });
  });

  describe('navegacion entre pasos', () => {
    it('backToEmail() vuelve al paso inicial y limpia el OTP', () => {
      page.step.set('otp');
      page.otpValues.set(['1', '2', '3', '4', '5', '6']);
      page.isVerifying.set(true);

      page.backToEmail();

      expect(page.step()).toBe('email');
      expect(page.otpValues()).toEqual(['', '', '', '', '', '']);
      expect(page.isVerifying()).toBe(false);
    });

    it('goBack() navega al inicio', () => {
      const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);

      page.goBack();

      expect(navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('ngAfterViewInit()', () => {
    it('enfoca el primer input al entrar al paso OTP', () => {
      jest.useFakeTimers();
      const focus = jest.spyOn(inputs[0] as HTMLInputElement, 'focus');
      TestBed.runInInjectionContext(() => page.ngAfterViewInit());
      page.step.set('otp');

      page.otpInputs.notifyOnChanges();
      jest.advanceTimersByTime(100);

      expect(focus).toHaveBeenCalled();
    });

    it('no enfoca nada si sigue en el paso de email', () => {
      jest.useFakeTimers();
      const focus = jest.spyOn(inputs[0] as HTMLInputElement, 'focus');
      TestBed.runInInjectionContext(() => page.ngAfterViewInit());

      page.otpInputs.notifyOnChanges();
      jest.advanceTimersByTime(100);

      expect(focus).not.toHaveBeenCalled();
    });
  });
});
