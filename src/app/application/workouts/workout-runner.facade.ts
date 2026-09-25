import { DestroyRef, Injectable, Signal, computed, inject, signal } from '@angular/core';

import { CLOCK } from '@app/domain/shared/port/clock.port';
import {
  WorkoutExerciseLog,
  WorkoutSession,
} from '@app/domain/workouts/model/workout-session.model';
import { WorkoutSetInput } from '@app/domain/workouts/model/workout-set.model';
import { WORKOUTS_PORT } from '@app/domain/workouts/port/workouts.port';

import { AsyncState, ViewState, asyncState } from '../shared/async-state';

/** Fases de la ejecucion guiada de una sesion. */
export type RunnerPhase = 'idle' | 'exercise' | 'rest' | 'summary';

const TICK_MS = 1000;
const EXTRA_REST_SECONDS = 15;

/**
 * Maquina de estados de "Start Workout".
 *
 * El temporizador se limpia en `DestroyRef.onDestroy`, el mismo patron que
 * ya usa `forgot-password.page.ts` para su countdown.
 */
@Injectable()
export class WorkoutRunnerFacade {
  private readonly port = inject(WORKOUTS_PORT);
  private readonly clock = inject(CLOCK);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _phase = signal<RunnerPhase>('idle');
  private readonly _exerciseIndex = signal(0);
  private readonly _setIndex = signal(0);
  private readonly _restRemaining = signal(0);
  private readonly _startedAt = signal<number | null>(null);
  private readonly _elapsedSeconds = signal(0);

  private restTimer: ReturnType<typeof setInterval> | null = null;
  private elapsedTimer: ReturnType<typeof setInterval> | null = null;

  readonly session: AsyncState<WorkoutSession> = asyncState<WorkoutSession>();

  readonly phase: Signal<RunnerPhase> = this._phase.asReadonly();
  readonly exerciseIndex: Signal<number> = this._exerciseIndex.asReadonly();
  readonly restRemaining: Signal<number> = this._restRemaining.asReadonly();
  readonly elapsedSeconds: Signal<number> = this._elapsedSeconds.asReadonly();

  readonly exercises: Signal<readonly WorkoutExerciseLog[]> = computed(
    () => this.session.data()?.exercises ?? [],
  );

  readonly currentExercise: Signal<WorkoutExerciseLog | null> = computed(
    () => this.exercises()[this._exerciseIndex()] ?? null,
  );

  /** Numero de serie en curso, empezando en 1. */
  readonly currentSet: Signal<number> = computed(() => this._setIndex() + 1);

  readonly totalSets: Signal<number> = computed(() => this.currentExercise()?.targetSets ?? 0);

  readonly isLastExercise: Signal<boolean> = computed(
    () => this._exerciseIndex() >= this.exercises().length - 1,
  );

  /** Avance global de la sesion, entre 0 y 1. */
  readonly totalProgress: Signal<number> = computed(() => {
    const all = this.exercises();
    if (all.length === 0) {
      return 0;
    }
    const done = all.filter(exercise => exercise.done).length;
    return done / all.length;
  });

  readonly restTotal: Signal<number> = computed(() => this.currentExercise()?.restSeconds ?? 0);

  readonly viewState: Signal<ViewState> = this.session.viewState;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.clearRestTimer();
      this.clearElapsedTimer();
      this.session.destroy();
    });
  }

  /** Carga la sesion a ejecutar. */
  open(sessionId: string): void {
    this.session.load(() => this.port.getById(sessionId));
  }

  reload(): void {
    this.session.reload();
  }

  /** Arranca la ejecucion desde el primer ejercicio no completado. */
  start(): void {
    const current = this.session.data();
    if (current === null) {
      return;
    }

    const firstPending = current.exercises.findIndex(exercise => !exercise.done);
    this._exerciseIndex.set(firstPending === -1 ? 0 : firstPending);
    this._setIndex.set(0);
    this._phase.set('exercise');
    this._startedAt.set(this.clock.now().getTime());
    this.startElapsedTimer();

    this.port.start(current.id).subscribe({
      next: updated => this.session.set(updated),
      error: () => undefined,
    });
  }

  /**
   * Cierra la serie en curso. Si quedan series, entra en descanso;
   * si era la ultima, marca el ejercicio y avanza.
   *
   * `reps` y `weightKg` en `null` significan "tal como se prescribio": es el
   * caso normal, y evita que confirmar sin tocar nada cueste mas de un toque.
   */
  completeSet(reps: number | null = null, weightKg: number | null = null): void {
    const exercise = this.currentExercise();
    const current = this.session.data();
    if (exercise === null || current === null) {
      return;
    }

    const nextSetIndex = this._setIndex() + 1;
    // La decision se toma ANTES de persistir: la respuesta del puerto
    // reemplaza la sesion y moveria `isLastExercise()` bajo nuestros pies.
    const wasLastExercise = this.isLastExercise();

    const serie: WorkoutSetInput = {
      setNumber: this._setIndex() + 1,
      reps: reps ?? exercise.targetReps,
      weightKg: weightKg ?? exercise.weightKg,
    };

    if (nextSetIndex < exercise.targetSets) {
      this._setIndex.set(nextSetIndex);
      this.persistSet(current.id, exercise.routineExerciseId, serie);
      this.beginRest(exercise.restSeconds);
      return;
    }

    this.persistSet(current.id, exercise.routineExerciseId, serie);

    if (wasLastExercise) {
      this.finishToSummary();
      return;
    }

    this._exerciseIndex.update(index => index + 1);
    this._setIndex.set(0);
    this.beginRest(exercise.restSeconds);
  }

  /** Suma 15 segundos al descanso en curso. */
  addRest(): void {
    if (this._phase() !== 'rest') {
      return;
    }
    this._restRemaining.update(value => value + EXTRA_REST_SECONDS);
  }

  /** Termina el descanso de inmediato. */
  skipRest(): void {
    if (this._phase() !== 'rest') {
      return;
    }
    this.clearRestTimer();
    this._restRemaining.set(0);
    this._phase.set('exercise');
  }

  /** Vuelve al ejercicio anterior. */
  previous(): void {
    if (this._exerciseIndex() === 0) {
      return;
    }
    this.clearRestTimer();
    this._exerciseIndex.update(index => index - 1);
    this._setIndex.set(0);
    this._phase.set('exercise');
  }

  /** Salta al siguiente ejercicio sin completar el actual. */
  next(): void {
    if (this.isLastExercise()) {
      this.finishToSummary();
      return;
    }
    this.clearRestTimer();
    this._exerciseIndex.update(index => index + 1);
    this._setIndex.set(0);
    this._phase.set('exercise');
  }

  /** Cierra la sesion contra el puerto. Devuelve true si quedo completada. */
  finish(): Promise<boolean> {
    const current = this.session.data();
    if (current === null) {
      return Promise.resolve(false);
    }

    this.clearRestTimer();
    this.clearElapsedTimer();

    return new Promise(resolve => {
      this.port
        .complete(current.id, {
          durationMinutes: Math.max(1, Math.round(this._elapsedSeconds() / 60)),
          note: null,
        })
        .subscribe({
          next: updated => {
            this.session.set(updated);
            this._phase.set('summary');
            resolve(true);
          },
          error: () => resolve(false),
        });
    });
  }

  private finishToSummary(): void {
    this.clearRestTimer();
    this.clearElapsedTimer();
    this._phase.set('summary');
  }

  private persistSet(sessionId: string, routineExerciseId: string, set: WorkoutSetInput): void {
    this.port.logSet(sessionId, routineExerciseId, set).subscribe({
      next: updated => this.session.set(updated),
      error: () => undefined,
    });
  }

  private beginRest(seconds: number): void {
    if (seconds <= 0) {
      this._phase.set('exercise');
      return;
    }

    this.clearRestTimer();
    this._restRemaining.set(seconds);
    this._phase.set('rest');

    this.restTimer = setInterval(() => {
      const next = this._restRemaining() - 1;
      this._restRemaining.set(Math.max(0, next));
      if (next <= 0) {
        this.clearRestTimer();
        this._phase.set('exercise');
      }
    }, TICK_MS);
  }

  private startElapsedTimer(): void {
    this.clearElapsedTimer();
    this._elapsedSeconds.set(0);

    this.elapsedTimer = setInterval(() => {
      this._elapsedSeconds.update(value => value + 1);
    }, TICK_MS);
  }

  private clearRestTimer(): void {
    if (this.restTimer !== null) {
      clearInterval(this.restTimer);
      this.restTimer = null;
    }
  }

  private clearElapsedTimer(): void {
    if (this.elapsedTimer !== null) {
      clearInterval(this.elapsedTimer);
      this.elapsedTimer = null;
    }
  }
}
