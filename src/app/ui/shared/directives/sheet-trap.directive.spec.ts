import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SheetTrapDirective } from './sheet-trap.directive';

/** Sheet minimo con tres botones, como el de cerrar sesion. */
function createSheet(): HTMLElement {
  const sheet = document.createElement('div');
  sheet.innerHTML = `
    <button id="uno" type="button">Uno</button>
    <button id="dos" type="button">Dos</button>
    <button id="tres" type="button">Tres</button>
  `;
  document.body.appendChild(sheet);
  return sheet;
}

function createDirective(host: HTMLElement): SheetTrapDirective {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: ElementRef, useValue: new ElementRef(host) }],
  });
  return TestBed.runInInjectionContext(() => new SheetTrapDirective());
}

function keydown(key: string, shiftKey = false): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, shiftKey, cancelable: true });
}

describe('SheetTrapDirective', () => {
  let sheet: HTMLElement;
  let directive: SheetTrapDirective;

  beforeEach(() => {
    jest.useFakeTimers();
    sheet = createSheet();
    directive = createDirective(sheet);
  });

  afterEach(() => {
    jest.useRealTimers();
    sheet.remove();
  });

  describe('foco al abrir', () => {
    it('lleva el foco al primer control cuando se abre', () => {
      directive.nqSheetTrap = true;
      jest.runAllTimers();

      expect(document.activeElement?.id).toBe('uno');
    });

    it('no mueve el foco si sigue cerrado', () => {
      directive.nqSheetTrap = false;
      jest.runAllTimers();

      expect(document.activeElement?.id).not.toBe('uno');
    });

    it('cancela el foco pendiente si se cierra antes de aplicarse', () => {
      directive.nqSheetTrap = true;
      directive.nqSheetTrap = false;
      jest.runAllTimers();

      expect(document.activeElement?.id).not.toBe('uno');
    });
  });

  describe('Escape', () => {
    it('avisa que el usuario pidio cerrar', () => {
      const dismissed = jest.fn();
      directive.dismissed.subscribe(dismissed);

      const event = keydown('Escape');
      directive.onKeydown(event);

      expect(dismissed).toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe('trampa de Tab', () => {
    it('del ultimo control vuelve al primero', () => {
      sheet.querySelector<HTMLElement>('#tres')?.focus();

      const event = keydown('Tab');
      directive.onKeydown(event);

      expect(document.activeElement?.id).toBe('uno');
      expect(event.defaultPrevented).toBe(true);
    });

    it('del primero con Shift salta al ultimo', () => {
      sheet.querySelector<HTMLElement>('#uno')?.focus();

      const event = keydown('Tab', true);
      directive.onKeydown(event);

      expect(document.activeElement?.id).toBe('tres');
      expect(event.defaultPrevented).toBe(true);
    });

    it('deja pasar el Tab en los controles intermedios', () => {
      sheet.querySelector<HTMLElement>('#dos')?.focus();

      const event = keydown('Tab');
      directive.onKeydown(event);

      expect(document.activeElement?.id).toBe('dos');
      expect(event.defaultPrevented).toBe(false);
    });

    it('ignora cualquier otra tecla', () => {
      const dismissed = jest.fn();
      directive.dismissed.subscribe(dismissed);

      const event = keydown('a');
      directive.onKeydown(event);

      expect(dismissed).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    });

    it('no falla en un sheet sin controles enfocables', () => {
      const vacio = document.createElement('div');
      document.body.appendChild(vacio);
      const sinFoco = createDirective(vacio);

      expect(() => sinFoco.onKeydown(keydown('Tab'))).not.toThrow();

      vacio.remove();
    });
  });
});
