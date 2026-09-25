import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { LucidePlus } from '@lucide/angular';

import {
  RoutinesFilter,
  TrainerRoutinesFacade,
} from '@app/application/trainers/trainer-routines.facade';
import { ExerciseInput, MUSCLE_GROUP_LABEL } from '@app/domain/routines/model/exercise.model';
import { Routine, RoutineInput } from '@app/domain/routines/model/routine.model';

import { PageStateComponent } from '@shared/components/page-state.component';
import { PullToRefreshDirective } from '@shared/directives/pull-to-refresh.directive';
import { SheetTrapDirective } from '@shared/directives/sheet-trap.directive';

import { ExerciseFormComponent } from './exercise-form.component';
import { RoutineBuilderComponent } from './routine-builder.component';

/** Las dos vistas de la pantalla. Cada una tiene su propio boton de alta. */
type Seccion = 'routines' | 'exercises';

@Component({
  selector: 'app-trainer-routines',
  standalone: true,
  imports: [
    PageStateComponent,
    PullToRefreshDirective,
    SheetTrapDirective,
    RoutineBuilderComponent,
    ExerciseFormComponent,
    LucidePlus,
  ],
  providers: [TrainerRoutinesFacade],
  template: `
    <div class="page" nqPullToRefresh [refreshing]="facade.rows.loading()" (refresh)="reload()">
      <header class="head">
        <div class="head-row">
          <h1 class="nq-h2">Rutinas</h1>
          <button class="add" type="button" [attr.aria-label]="addLabel()" (click)="openCreate()">
            <svg lucidePlus [size]="20" [strokeWidth]="2"></svg>
          </button>
        </div>
      </header>

      <div class="nq-tabs" role="tablist" aria-label="Secciones">
        @for (tab of secciones; track tab.value) {
          <button
            class="nq-tab"
            type="button"
            role="tab"
            [class.active]="seccion() === tab.value"
            [attr.aria-selected]="seccion() === tab.value"
            (click)="selectSeccion(tab.value)"
          >
            {{ tab.label }}
          </button>
        }
      </div>

      @if (seccion() === 'routines') {
        <div class="nq-tabs" role="tablist" aria-label="Estado de las rutinas">
          @for (tab of estados; track tab.value) {
            <button
              class="nq-tab"
              type="button"
              role="tab"
              [class.active]="facade.filter() === tab.value"
              [attr.aria-selected]="facade.filter() === tab.value"
              (click)="facade.selectFilter(tab.value)"
            >
              {{ tab.label }} ({{
                tab.value === 'active' ? facade.activeCount() : facade.archivedCount()
              }})
            </button>
          }
        </div>

        @switch (facade.viewState()) {
          @case ('loading') {
            <nq-page-state type="loading" loadingLabel="Cargando tus rutinas" />
          }
          @case ('error') {
            <nq-page-state type="error" message="No pudimos cargar tus rutinas." [retry]="reload" />
          }
          @case ('empty') {
            <nq-page-state
              type="empty"
              [title]="emptyTitle()"
              [message]="emptyMessage()"
              [showRetry]="false"
            />
          }
          @default {
            <ul class="list" role="list">
              @for (row of facade.visible(); track row.routine.id) {
                <li class="card">
                  <div class="card-head">
                    <span class="card-name">{{ row.routine.name }}</span>
                    @if (row.routine.status === 'archived') {
                      <span class="nq-badge nq-badge-warning">Sin asignar</span>
                    } @else {
                      <span class="nq-badge nq-badge-success">Asignada</span>
                    }
                  </div>
                  <p class="card-sub">
                    {{ row.studentName }} · {{ dias(row.routine.days.length) }} ·
                    {{ row.routine.goal }}
                  </p>

                  <div class="card-actions">
                    <button class="text-btn" type="button" (click)="openEdit(row.routine)">
                      Editar
                    </button>
                    @if (row.routine.status === 'active') {
                      <button
                        class="text-btn danger"
                        type="button"
                        [disabled]="facade.busy()"
                        (click)="archive(row.routine.id)"
                      >
                        Archivar
                      </button>
                    } @else {
                      <button
                        class="text-btn"
                        type="button"
                        [disabled]="facade.busy()"
                        (click)="assign(row.routine.id)"
                      >
                        Asignar
                      </button>
                    }
                  </div>
                </li>
              }
            </ul>
          }
        }
      } @else {
        <section class="nq-section">
          <div class="nq-section-header">
            <h2 class="nq-section-title">Mis ejercicios</h2>
          </div>
          @if (facade.ownExercises().length > 0) {
            <ul class="list" role="list">
              @for (item of facade.ownExercises(); track item.id) {
                <li class="exercise-row">
                  <span class="exercise-name">{{ item.name }}</span>
                  <span class="exercise-group">{{ grupo(item.muscleGroup) }}</span>
                </li>
              }
            </ul>
          } @else {
            <p class="empty-text">
              Todavía no tienes ejercicios propios. Los que crees solo los verás tú.
            </p>
          }
        </section>

        <section class="nq-section">
          <div class="nq-section-header">
            <h2 class="nq-section-title">Catálogo</h2>
          </div>
          <ul class="list" role="list">
            @for (item of facade.publicExercises(); track item.id) {
              <li class="exercise-row">
                <span class="exercise-name">{{ item.name }}</span>
                <span class="exercise-group">{{ grupo(item.muscleGroup) }}</span>
              </li>
            }
          </ul>
        </section>
      }
    </div>

    <!-- Los overlays viven siempre en el DOM y solo conmutan la clase open:
         es como el design system los anima, y cerrados no dejan nada
         tabulable. -->
    <div class="nq-overlay" [class.open]="building()" (click)="closeBuilder()">
      <div
        class="nq-sheet form-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rutina-title"
        [nqSheetTrap]="building()"
        (dismissed)="closeBuilder()"
        (click)="$event.stopPropagation()"
      >
        <div class="nq-sheet-handle"></div>
        <h2 class="nq-sheet-title" id="rutina-title">{{ builderTitle() }}</h2>

        <nq-routine-builder
          #builder
          [routine]="editing()"
          [students]="facade.assignableStudents()"
          [publicExercises]="facade.publicExercises()"
          [ownExercises]="facade.ownExercises()"
          [busy]="facade.busy()"
          [errorMessage]="facade.actionError()?.message ?? null"
          [submitLabel]="editing() === null ? 'Crear rutina' : 'Guardar cambios'"
          (submitted)="saveRoutine($event)"
          (cancelled)="closeBuilder()"
        />
      </div>
    </div>

    <div class="nq-overlay" [class.open]="creatingExercise()" (click)="closeExercise()">
      <div
        class="nq-sheet form-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ejercicio-title"
        [nqSheetTrap]="creatingExercise()"
        (dismissed)="closeExercise()"
        (click)="$event.stopPropagation()"
      >
        <div class="nq-sheet-handle"></div>
        <h2 class="nq-sheet-title" id="ejercicio-title">Nuevo ejercicio</h2>

        <nq-exercise-form
          #exerciseForm
          [busy]="facade.busy()"
          [errorMessage]="facade.actionError()?.message ?? null"
          (submitted)="saveExercise($event)"
          (cancelled)="closeExercise()"
        />
      </div>
    </div>
  `,
  styleUrl: './trainer-routines.page.scss',
})
export class TrainerRoutinesPage {
  readonly facade = inject(TrainerRoutinesFacade);

  readonly secciones: readonly { value: Seccion; label: string }[] = [
    { value: 'routines', label: 'Rutinas' },
    { value: 'exercises', label: 'Ejercicios' },
  ];

  /**
   * "Sin asignar" y no "Archivadas": ahi caen tanto los borradores recien
   * creados como las rutinas que fueron reemplazadas, y para el entrenador
   * las dos cosas significan lo mismo, que el alumno no las esta haciendo.
   */
  readonly estados: readonly { value: RoutinesFilter; label: string }[] = [
    { value: 'active', label: 'Asignadas' },
    { value: 'archived', label: 'Sin asignar' },
  ];

  readonly seccion = signal<Seccion>('routines');
  readonly building = signal(false);
  readonly creatingExercise = signal(false);
  readonly editing = signal<Routine | null>(null);

  readonly addLabel = computed(() =>
    this.seccion() === 'routines' ? 'Crear una rutina' : 'Crear un ejercicio',
  );

  readonly builderTitle = computed(() =>
    this.editing() === null ? 'Nueva rutina' : 'Editar rutina',
  );

  readonly emptyTitle = computed(() =>
    this.facade.filter() === 'archived' ? 'Nada sin asignar' : 'Ninguna rutina asignada',
  );

  readonly emptyMessage = computed(() =>
    this.facade.filter() === 'archived'
      ? 'Aquí aparecen las rutinas nuevas y las que reemplaces.'
      : 'Crea una rutina y asígnasela a un alumno para que empiece.',
  );

  readonly reload = (): void => this.facade.reload();

  private readonly builder = viewChild<RoutineBuilderComponent>('builder');
  private readonly exerciseForm = viewChild<ExerciseFormComponent>('exerciseForm');

  constructor() {
    this.facade.load();
  }

  dias(total: number): string {
    return total === 1 ? '1 día' : `${total} días`;
  }

  grupo(value: keyof typeof MUSCLE_GROUP_LABEL): string {
    return MUSCLE_GROUP_LABEL[value];
  }

  selectSeccion(seccion: Seccion): void {
    this.seccion.set(seccion);
  }

  /** El boton de alta crea lo que corresponde a la seccion abierta. */
  openCreate(): void {
    this.facade.clearActionError();
    if (this.seccion() === 'routines') {
      this.editing.set(null);
      this.building.set(true);
      this.builder()?.reset();
      return;
    }
    this.creatingExercise.set(true);
    this.exerciseForm()?.reset();
  }

  openEdit(routine: Routine): void {
    this.facade.clearActionError();
    this.editing.set(routine);
    this.building.set(true);
    this.builder()?.reset();
  }

  closeBuilder(): void {
    this.building.set(false);
  }

  async saveRoutine(value: Omit<RoutineInput, 'trainerId'>): Promise<void> {
    const actual = this.editing();
    const id =
      actual === null
        ? await this.facade.create(value)
        : await this.facade.update(actual.id, value);

    if (id === null) {
      return;
    }

    this.building.set(false);
    // Una rutina nace sin asignar: sin este salto el entrenador la guarda y
    // no la ve por ninguna parte.
    this.facade.selectFilter('archived');
  }

  closeExercise(): void {
    this.creatingExercise.set(false);
  }

  async saveExercise(value: Omit<ExerciseInput, 'ownerTrainerId'>): Promise<void> {
    if ((await this.facade.createExercise(value)) !== null) {
      this.creatingExercise.set(false);
    }
  }

  /** Activa la rutina y archiva la anterior del alumno, en una operación. */
  async assign(routineId: string): Promise<void> {
    await this.facade.assign(routineId);
  }

  async archive(routineId: string): Promise<void> {
    await this.facade.archive(routineId);
  }
}
