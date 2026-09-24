import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideCheck, LucidePlay, LucideTimer } from '@lucide/angular';

import { StudentRoutineFacade } from '@app/application/routines/student-routine.facade';
import { RoutineExercise } from '@app/domain/routines/model/routine.model';
import { Weekday } from '@app/domain/shared/model/date';

import { PageStateComponent } from '@shared/components/page-state.component';
import { PullToRefreshDirective } from '@shared/directives/pull-to-refresh.directive';
import { SheetTrapDirective } from '@shared/directives/sheet-trap.directive';

const WEEKDAYS: readonly { value: Weekday; label: string }[] = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 7, label: 'Dom' },
];

@Component({
  selector: 'app-student-routine',
  standalone: true,
  imports: [
    PageStateComponent,
    PullToRefreshDirective,
    SheetTrapDirective,
    LucideCheck,
    LucidePlay,
    LucideTimer,
  ],
  template: `
    <div class="page" nqPullToRefresh [refreshing]="facade.routine.loading()" (refresh)="reload()">
      <header class="head">
        <h1 class="nq-h2">Mi rutina</h1>
        @if (facade.routine.data(); as routine) {
          <span class="routine-goal">{{ routine.name }}</span>
        }
      </header>

      <!-- Selector de dia: siempre visible para poder cambiar de dia -->
      <div class="nq-tabs day-tabs">
        @for (day of weekdays; track day.value) {
          <button
            class="nq-tab"
            type="button"
            [class.active]="facade.selectedWeekday() === day.value"
            [class.has-training]="hasTraining(day.value)"
            (click)="facade.selectDay(day.value)"
          >
            {{ day.label }}
          </button>
        }
      </div>

      @switch (facade.viewState()) {
        @case ('loading') {
          <nq-page-state type="loading" />
        }
        @case ('error') {
          <nq-page-state type="error" [retry]="reload" />
        }
        @case ('empty') {
          <nq-page-state
            type="empty"
            title="Aún no tienes rutina"
            message="Tu entrenador te asignará una muy pronto."
          />
        }
        @case ('success') {
          @if (facade.selectedDay(); as day) {
            <section class="day-head nq-ani">
              <div>
                <h2 class="day-title">{{ day.title }}</h2>
                <span class="day-meta">
                  {{ day.exercises.length }} ejercicios · {{ day.estimatedMinutes }} min
                </span>
              </div>

              <div class="day-progress" aria-hidden="true">
                <span class="day-percent">{{ progressPercent() }}%</span>
              </div>
            </section>

            <div
              class="bar"
              role="progressbar"
              aria-label="Avance del dia"
              aria-valuemin="0"
              aria-valuemax="100"
              [attr.aria-valuenow]="progressPercent()"
              [attr.aria-valuetext]="progressPercent() + '%'"
            >
              <div class="bar-fill" [style.width.%]="progressPercent()"></div>
            </div>

            @if (!facade.isDayCompleted()) {
              <button
                class="nq-btn nq-btn-primary start-btn nq-ani"
                type="button"
                (click)="startWorkout()"
              >
                <svg lucidePlay [size]="18" [strokeWidth]="2"></svg>
                Comenzar entrenamiento
              </button>
            } @else {
              <p class="day-done nq-ani">
                <svg lucideCheck [size]="16" [strokeWidth]="2.5"></svg>
                Sesión completada
              </p>
            }

            <ul class="exercise-list">
              @for (exercise of day.exercises; track exercise.id) {
                <li class="exercise nq-ani">
                  <button
                    class="check"
                    type="button"
                    role="checkbox"
                    [attr.aria-checked]="isDone(exercise.id)"
                    [attr.aria-label]="checkLabel(exercise)"
                    [disabled]="busyId() === exercise.id"
                    (click)="toggle(exercise)"
                  >
                    @if (isDone(exercise.id)) {
                      <svg lucideCheck [size]="14" [strokeWidth]="3"></svg>
                    }
                  </button>

                  <div class="exercise-body" [class.done]="isDone(exercise.id)">
                    <span class="exercise-name">{{ exercise.name }}</span>
                    <span class="exercise-meta">
                      {{ exercise.sets }} × {{ exercise.reps }}
                      @if (exercise.weightKg !== null) {
                        · {{ exercise.weightKg }} kg
                      }
                    </span>
                    @if (exercise.notes !== null) {
                      <span class="exercise-note">{{ exercise.notes }}</span>
                    }
                  </div>

                  <span class="rest">
                    <svg lucideTimer [size]="13" [strokeWidth]="1.8"></svg>
                    {{ exercise.restSeconds }}s
                  </span>
                </li>
              }
            </ul>

            @if (!facade.isDayCompleted() && facade.selectedSession() !== null) {
              <button
                class="nq-btn nq-btn-secondary complete-btn"
                type="button"
                [disabled]="completing()"
                (click)="completeSession(day.estimatedMinutes)"
              >
                Marcar como completada
              </button>
            }
          } @else {
            <div class="rest-day nq-ani">
              <span class="rest-day-title">Día de descanso</span>
              <span class="rest-day-desc">
                No hay entrenamiento programado para este día. Aprovecha de recuperarte.
              </span>
            </div>
          }
        }
      }
    </div>

    <!-- Celebracion discreta: check y texto, sin confeti. El overlay vive
         siempre en el DOM y solo conmuta la clase open, que es como el
         design system lo anima: sin ella queda invisible y sin eventos. -->
    <div class="nq-overlay" [class.open]="showCelebration()" (click)="dismissCelebration()">
      <div
        class="nq-sheet celebration"
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-title"
        [nqSheetTrap]="showCelebration()"
        (dismissed)="dismissCelebration()"
        (click)="$event.stopPropagation()"
      >
        <div class="celebration-check">
          <svg lucideCheck [size]="30" [strokeWidth]="3"></svg>
        </div>
        <h2 class="nq-sheet-title" id="celebration-title">¡Sesión completada!</h2>
        <p class="celebration-desc">Sumaste una sesión a tu semana. Así se construye el hábito.</p>
        <button class="nq-btn nq-btn-primary" type="button" (click)="dismissCelebration()">
          Listo
        </button>
      </div>
    </div>
  `,
  styleUrl: './student-routine.page.scss',
})
export class StudentRoutinePage {
  readonly facade = inject(StudentRoutineFacade);

  private readonly router = inject(Router);

  readonly weekdays = WEEKDAYS;
  readonly busyId = signal<string | null>(null);
  readonly completing = signal(false);
  readonly showCelebration = signal(false);

  readonly progressPercent = computed(() => Math.round(this.facade.dayProgress() * 100));

  readonly reload = (): void => this.facade.reload();

  constructor() {
    this.facade.load();
  }

  /** El nombre del control cambia con el estado: marcar o desmarcar. */
  checkLabel(exercise: RoutineExercise): string {
    return `${this.isDone(exercise.id) ? 'Desmarcar' : 'Marcar'} ${exercise.name}`;
  }

  hasTraining(weekday: Weekday): boolean {
    return this.facade.days().some(day => day.weekday === weekday);
  }

  isDone(routineExerciseId: string): boolean {
    const session = this.facade.selectedSession();
    return (
      session?.exercises.find(item => item.routineExerciseId === routineExerciseId)?.done ?? false
    );
  }

  async toggle(exercise: RoutineExercise): Promise<void> {
    if (this.busyId() !== null) {
      return;
    }
    this.busyId.set(exercise.id);
    await this.facade.toggleExercise(exercise.id, !this.isDone(exercise.id));
    this.busyId.set(null);
  }

  async completeSession(durationMinutes: number): Promise<void> {
    if (this.completing()) {
      return;
    }
    this.completing.set(true);
    const ok = await this.facade.completeSelectedSession(durationMinutes);
    this.completing.set(false);

    if (ok) {
      this.showCelebration.set(true);
    }
  }

  dismissCelebration(): void {
    this.showCelebration.set(false);
  }

  startWorkout(): void {
    const session = this.facade.selectedSession();
    if (session === null) {
      return;
    }
    this.router.navigate(['/student/workout', session.id]);
  }
}
