import { Signal, computed, signal } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

import { DomainError, toDomainError } from '@app/domain/shared/model/app-error';

/** Los cuatro estados que `<nq-page-state>` sabe renderizar. */
export type ViewState = 'loading' | 'error' | 'empty' | 'success';

export interface AsyncStateOptions<T> {
  /** Decide si un valor cargado debe tratarse como vacio. */
  isEmpty?: (value: T) => boolean;
}

/** Heuristica por defecto: null, arreglo vacio o cualquier cosa con length 0. */
function defaultIsEmpty(value: unknown): boolean {
  if (value === undefined) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === 'object' && value !== null && 'length' in value) {
    return (value as { length: number }).length === 0;
  }
  return false;
}

/**
 * Estado de una lectura asincrona, expuesto como signals.
 *
 * Es el unico lugar del proyecto donde vive la logica de loading/error/empty:
 * las facades componen instancias de esta clase y las paginas solo leen
 * `viewState()` para elegir que renderizar.
 */
export class AsyncState<T> {
  private readonly _data = signal<T | null>(null);
  private readonly _error = signal<DomainError | null>(null);
  private readonly _loading = signal(false);
  /** True en cuanto llega el primer valor, aunque sea null. */
  private readonly _settled = signal(false);
  private readonly isEmpty: (value: T) => boolean;

  private source: (() => Observable<T>) | null = null;
  private subscription: Subscription | null = null;

  readonly data: Signal<T | null> = this._data.asReadonly();
  readonly error: Signal<DomainError | null> = this._error.asReadonly();
  readonly loading: Signal<boolean> = this._loading.asReadonly();

  readonly viewState: Signal<ViewState> = computed(() => {
    if (this._error() !== null) {
      return 'error';
    }
    // `_settled` distingue "todavia no llega nada" de "llego un valor nulo":
    // un alumno sin rutina asignada es un `empty` legitimo, no un `loading`
    // eterno. Sin esta marca, `T | null` nunca podria salir de loading.
    if (!this._settled()) {
      return 'loading';
    }
    const value = this._data();
    return value === null || this.isEmpty(value) ? 'empty' : 'success';
  });

  constructor(options: AsyncStateOptions<T> = {}) {
    this.isEmpty = options.isEmpty ?? ((value: T) => defaultIsEmpty(value));
  }

  /** Registra la fuente y la ejecuta. Cancela cualquier lectura en curso. */
  load(source: () => Observable<T>): void {
    this.source = source;
    this.run(source);
  }

  /** Repite la ultima fuente registrada. Es lo que la pagina pasa a `[retry]`. */
  reload(): void {
    const source = this.source;
    if (source !== null) {
      this.run(source);
    }
  }

  /** Publica un valor ya resuelto, por ejemplo la respuesta de una mutacion. */
  set(value: T): void {
    this.cancel();
    this._loading.set(false);
    this._error.set(null);
    this._settled.set(true);
    this._data.set(value);
  }

  /** Publica un error sin pasar por la fuente. */
  fail(cause: unknown): void {
    this.cancel();
    this._loading.set(false);
    this._error.set(toDomainError(cause));
  }

  /** Vuelve al estado inicial y corta cualquier suscripcion viva. */
  reset(): void {
    this.cancel();
    this._loading.set(false);
    this._error.set(null);
    this._settled.set(false);
    this._data.set(null);
  }

  /** Corta la suscripcion. Las facades de ruta la llaman en `DestroyRef.onDestroy`. */
  destroy(): void {
    this.cancel();
  }

  private run(source: () => Observable<T>): void {
    this.cancel();
    this._loading.set(true);
    this._error.set(null);

    this.subscription = source().subscribe({
      next: value => {
        this._data.set(value);
        this._settled.set(true);
        this._loading.set(false);
      },
      error: (cause: unknown) => {
        this._error.set(toDomainError(cause));
        this._loading.set(false);
      },
    });
  }

  private cancel(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }
}

/** Azucar para construir un AsyncState sin repetir el generico. */
export function asyncState<T>(options: AsyncStateOptions<T> = {}): AsyncState<T> {
  return new AsyncState<T>(options);
}
