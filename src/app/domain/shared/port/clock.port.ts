import { InjectionToken } from '@angular/core';

/**
 * Fuente de tiempo del dominio. Existe para que nada dependa de `new Date()`
 * directamente: los tests inyectan un reloj fijo y no necesitan fake timers.
 */
export interface Clock {
  now(): Date;
}

export const CLOCK = new InjectionToken<Clock>('Clock');
