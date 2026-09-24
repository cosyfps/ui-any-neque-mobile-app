import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideArrowLeft,
  LucideChevronLeft,
  LucideChevronRight,
  LucideCheck,
  LucidePlay,
  LucidePlus,
} from '@lucide/angular';

import { WorkoutRunnerFacade } from '@app/application/workouts/workout-runner.facade';

import { RingProgressComponent } from '@shared/components/chart/ring-progress.component';
import { PageStateComponent } from '@shared/components/page-state.component';
import { SheetTrapDirective } from '@shared/directives/sheet-trap.directive';

@Component({
  selector: 'app-workout-runner',
  standalone: true,
  imports: [
    PageStateComponent,
    RingProgressComponent,
    SheetTrapDirective,
    LucideArrowLeft,
    LucideChevronLeft,
    LucideChevronRight,
    LucideCheck,
    LucidePlay,
    LucidePlus,
  ],
  providers: [WorkoutRunnerFacade],
  template: `
    <div class="nq-screen">
      <div class="runner">
        <header class="head">
          <button class="nav-back" type="button" aria-label="Salir" (click)="exit()">
            <svg lucideArrowLeft [size]="22" [strokeWidth]="1.8"></svg>
          </button>
          <span class="head-title">{{ facade.session.data()?.title ?? 'Entrenamiento' }}</span>
          <span class="elapsed">{{ elapsedLabel() }}</span>
        </header>

        @switch (facade.viewState()) {
          @case ('loading') {
            <nq-page-state type="loading" />
          }
          @case ('error') {
            <nq-page-state type="error" [retry]="reload" />
          }
          @case ('empty') {
            <nq-page-state type="error" title="No encontramos la sesión" [showRetry]="false" />
          }
          @case ('success') {
            <div
              class="progress-track"
              role="progressbar"
              aria-label="Avance de la sesion"
              aria-valuemin="0"
              aria-valuemax="100"
              [attr.aria-valuenow]="totalPercent()"
              [attr.aria-valuetext]="totalPercent() + '%'"
            >
              <div class="progress-fill" [style.width.%]="totalPercent()"></div>
            </div>

            <!-- Una sola region viva para las cuatro fases: el lector anuncia
                 el paso de ejercicio a descanso y a resumen sin interrumpir. -->
            <div class="phases" role="status" aria-live="polite">
              @switch (facade.phase()) {
                @case ('idle') {
                  <div class="stage nq-ani">
                    <span class="stage-label">Listo para empezar</span>
                    <h1 class="stage-title">{{ facade.exercises().length }} ejercicios</h1>
                    <p class="stage-desc">
                      Te guiaremos serie por serie, con el descanso incluido entre cada una.
                    </p>
                    <button
                      class="nq-btn nq-btn-primary stage-cta"
                      type="button"
                      (click)="facade.start()"
                    >
                      <svg lucidePlay [size]="18" [strokeWidth]="2"></svg>
                      Comenzar
                    </button>
                  </div>
                }

                @case ('exercise') {
                  @if (facade.currentExercise(); as exercise) {
                    <div class="stage nq-ani">
                      <span class="stage-label">
                        Ejercicio {{ facade.exerciseIndex() + 1 }} de
                        {{ facade.exercises().length }}
                      </span>
                      <h1 class="stage-title">{{ exercise.name }}</h1>

                      <div class="set-badge">
                        Serie {{ facade.currentSet() }} de {{ facade.totalSets() }}
                      </div>

                      <div class="targets">
                        <label class="target">
                          <input
                            class="target-input"
                            type="number"
                            inputmode="numeric"
                            min="1"
                            max="99"
                            [value]="repsValue()"
                            (input)="setReps($event)"
                          />
                          <span class="target-label">repeticiones</span>
                        </label>
                        @if (exercise.weightKg !== null) {
                          <label class="target">
                            <input
                              class="target-input"
                              type="number"
                              inputmode="decimal"
                              min="0"
                              max="500"
                              step="0.5"
                              [value]="weightValue()"
                              (input)="setWeight($event)"
                            />
                            <span class="target-label">kg</span>
                          </label>
                        }
                        <div class="target">
                          <span class="target-value">{{ exercise.restSeconds }}</span>
                          <span class="target-label">seg descanso</span>
                        </div>
                      </div>

                      <p class="targets-hint">
                        Viene con lo que te toca. Ajústalo solo si levantaste algo distinto.
                      </p>

                      <button
                        class="nq-btn nq-btn-primary stage-cta"
                        type="button"
                        (click)="completeSet()"
                      >
                        <svg lucideCheck [size]="18" [strokeWidth]="2.5"></svg>
                        Serie completada
                      </button>

                      <div class="nav-row">
                        <button
                          class="nav-btn"
                          type="button"
                          aria-label="Ejercicio anterior"
                          [disabled]="facade.exerciseIndex() === 0"
                          (click)="facade.previous()"
                        >
                          <svg lucideChevronLeft [size]="20" [strokeWidth]="2"></svg>
                        </button>
                        <button
                          class="nav-btn"
                          type="button"
                          aria-label="Siguiente ejercicio"
                          (click)="facade.next()"
                        >
                          <svg lucideChevronRight [size]="20" [strokeWidth]="2"></svg>
                        </button>
                      </div>
                    </div>
                  }
                }

                @case ('rest') {
                  <div class="stage rest-stage nq-ani">
                    <span class="stage-label">Descanso</span>

                    <nq-ring-progress
                      class="rest-ring"
                      [progress]="restProgress()"
                      [ariaLabel]="'Quedan ' + facade.restRemaining() + ' segundos de descanso'"
                    >
                      <span class="rest-seconds">{{ facade.restRemaining() }}</span>
                      <span class="rest-unit">seg</span>
                    </nq-ring-progress>

                    <p class="stage-desc">
                      Siguiente: {{ facade.currentExercise()?.name ?? 'fin de la sesión' }}
                    </p>

                    <div class="rest-actions">
                      <button
                        class="nq-btn nq-btn-secondary"
                        type="button"
                        (click)="facade.addRest()"
                      >
                        <svg lucidePlus [size]="16" [strokeWidth]="2"></svg>
                        15 seg
                      </button>
                      <button
                        class="nq-btn nq-btn-primary"
                        type="button"
                        (click)="facade.skipRest()"
                      >
                        Saltar descanso
                      </button>
                    </div>
                  </div>
                }

                @case ('summary') {
                  <div class="stage nq-ani">
                    <div class="summary-check">
                      <svg lucideCheck [size]="30" [strokeWidth]="3"></svg>
                    </div>
                    <h1 class="stage-title">¡Sesión terminada!</h1>

                    <div class="summary-grid">
                      <div class="summary-item">
                        <span class="summary-value">{{ elapsedLabel() }}</span>
                        <span class="summary-label">duración</span>
                      </div>
                      <div class="summary-item">
                        <span class="summary-value">{{ completedExercises() }}</span>
                        <span class="summary-label">ejercicios</span>
                      </div>
                      <div class="summary-item">
                        <span class="summary-value">{{ completedSets() }}</span>
                        <span class="summary-label">series</span>
                      </div>
                    </div>

                    <button
                      class="nq-btn nq-btn-primary stage-cta"
                      type="button"
                      [disabled]="saving()"
                      (click)="finish()"
                    >
                      Guardar y volver
                    </button>
                  </div>
                }
              }
            </div>
          }
        }
      </div>
    </div>

    <!-- Salir a mitad de la sesion pierde el cronometro y la fase en curso:
         se confirma antes. -->
    <div class="nq-overlay" [class.open]="confirmingExit()" (click)="cancelExit()">
      <div
        class="nq-sheet confirm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-title"
        [nqSheetTrap]="confirmingExit()"
        (dismissed)="cancelExit()"
        (click)="$event.stopPropagation()"
      >
        <div class="nq-sheet-handle"></div>
        <h2 class="nq-sheet-title" id="exit-title">¿Salir del entrenamiento?</h2>
        <p class="confirm-desc">
          Las series que ya marcaste quedan guardadas, pero se pierde el cronómetro y tendrás que
          empezar la sesión de nuevo.
        </p>

        <div class="confirm-actions">
          <button class="nq-btn nq-btn-secondary" type="button" (click)="cancelExit()">
            Seguir entrenando
          </button>
          <button class="nq-btn nq-btn-primary" type="button" (click)="leave()">Salir</button>
        </div>
      </div>
    </div>
  `,
  // `.nq-screen` se estira contra el ancestro posicionado que aporta esta
  // clase; sin ella el contenedor no tiene contra que medir su alto.
  host: { class: 'nq-page-host' },
  styleUrl: './workout-runner.page.scss',
})
export class WorkoutRunnerPage {
  readonly facade = inject(WorkoutRunnerFacade);

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Bloquea "Guardar y volver": sin esto un doble toque guarda dos veces. */
  readonly saving = signal(false);
  readonly confirmingExit = signal(false);

  readonly totalPercent = computed(() => Math.round(this.facade.totalProgress() * 100));

  readonly restProgress = computed(() => {
    const total = this.facade.restTotal();
    return total === 0 ? 0 : this.facade.restRemaining() / total;
  });

  readonly completedExercises = computed(
    () => this.facade.exercises().filter(exercise => exercise.done).length,
  );

  readonly completedSets = computed(() =>
    this.facade.exercises().reduce((sum, exercise) => sum + exercise.completedSets, 0),
  );

  readonly elapsedLabel = computed(() => {
    const total = this.facade.elapsedSeconds();
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  });

  /**
   * Lo que el alumno corrigio de la serie en curso.
   *
   * `null` significa "igual a lo prescrito": asi confirmar sin tocar nada
   * sigue costando un toque y no hay que sincronizar los campos en cada
   * cambio de ejercicio.
   */
  readonly repsOverride = signal<number | null>(null);
  readonly weightOverride = signal<number | null>(null);

  readonly repsValue = computed(
    () => this.repsOverride() ?? this.facade.currentExercise()?.targetReps ?? 0,
  );

  readonly weightValue = computed(
    () => this.weightOverride() ?? this.facade.currentExercise()?.weightKg ?? null,
  );

  readonly reload = (): void => this.facade.reload();

  constructor() {
    this.facade.open(this.route.snapshot.paramMap.get('sessionId') ?? '');
  }

  setReps(event: Event): void {
    this.repsOverride.set(this.numero(event));
  }

  setWeight(event: Event): void {
    this.weightOverride.set(this.numero(event));
  }

  /** Cierra la serie con lo corregido y vuelve a lo prescrito para la siguiente. */
  completeSet(): void {
    this.facade.completeSet(this.repsOverride(), this.weightOverride());
    this.repsOverride.set(null);
    this.weightOverride.set(null);
  }

  /** Un campo vaciado vuelve a valer lo prescrito, no cero. */
  private numero(event: Event): number | null {
    const raw = (event.target as HTMLInputElement).value.trim();
    if (raw === '') {
      return null;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }

  async finish(): Promise<void> {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    try {
      await this.facade.finish();
      await this.router.navigate(['/student/routine']);
    } finally {
      this.saving.set(false);
    }
  }

  /** Sin sesion empezada no hay nada que perder: sale directo. */
  exit(): void {
    const phase = this.facade.phase();
    if (phase === 'idle' || phase === 'summary') {
      void this.router.navigate(['/student/routine']);
      return;
    }
    this.confirmingExit.set(true);
  }

  cancelExit(): void {
    this.confirmingExit.set(false);
  }

  leave(): void {
    this.confirmingExit.set(false);
    void this.router.navigate(['/student/routine']);
  }
}
