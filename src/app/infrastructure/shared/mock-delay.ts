import { Observable, defer, delay, of, switchMap, throwError, timer } from 'rxjs';

import { DomainErrorCode, domainError } from '@app/domain/shared/model/app-error';

/** Latencia por defecto de los adapters mock, en milisegundos. */
export const MOCK_LATENCY_MS = 420;

/**
 * Clona en profundidad una semilla para que los adapters nunca entreguen
 * referencias a su estado interno ni compartan objetos entre tests.
 *
 * Los modelos de dominio solo contienen primitivos, arreglos y objetos planos
 * (las fechas viajan como string ISO), asi que el fallback por JSON es fiel.
 * Hace falta porque jsdom no siempre expone `structuredClone`.
 */
export function cloneSeed<T>(value: T): T {
  // Los primitivos ya son inmutables y el fallback por JSON no sabe
  // representarlos: `JSON.stringify(undefined)` devuelve undefined.
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Emite un valor clonado tras una latencia simulada. */
export function simulate<T>(value: T, ms: number = MOCK_LATENCY_MS): Observable<T> {
  return defer(() => of(cloneSeed(value))).pipe(delay(ms));
}

/**
 * Falla con un DomainError tras una latencia simulada.
 *
 * Usa `timer` + `switchMap` en vez de `delay` porque el operador `delay`
 * reenvia las notificaciones de error de inmediato, sin esperar.
 */
export function simulateError<T>(
  code: DomainErrorCode,
  ms: number = MOCK_LATENCY_MS,
  message?: string,
): Observable<T> {
  return timer(ms).pipe(switchMap(() => throwError(() => domainError(code, message))));
}
