import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { LucidePlus } from '@lucide/angular';

import {
  RoutinesFilter,
  TrainerRoutinesFacade,
} from '@app/application/trainers/trainer-routines.facade';
import { ExerciseInput, MUSCLE_GROUP_LABEL } from '@app/domain/routines/model/exercise.model';
import {
  Routine,
  RoutineAssignment,
  RoutineInput,
  isAssigned,
} from '@app/domain/routines/model/routine.model';
import { CLOCK } from '@app/domain/shared/port/clock.port';

import { PageStateComponent } from '@shared/components/page-state.component';
import { PullToRefreshDirective } from '@shared/directives/pull-to-refresh.directive';
import { SheetTrapDirective } from '@shared/directives/sheet-trap.directive';

import { ExerciseFormComponent } from './exercise-form.component';
import { RoutineAssignComponent } from './routine-assign.component';
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
    RoutineAssignComponent,
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
                tab.value === 'assigned' ? facade.assignedCount() : facade.unassignedCount()
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
                    <span class="nq-badge alumnos-badge" [class.vacia]="!asignada(row.routine)">
                      {{ alumnos(row.studentNames.length) }}
                    </span>
                  </div>
                  <p class="card-sub">
                    {{ row.routine.goal }} · {{ dias(row.routine.days.length) }}
                  </p>
                  @if (row.studentNames.length > 0) {
                    <p class="card-students">{{ row.studentNames.join(', ') }}</p>
                  }

                  <div class="card-actions">
                    <button class="text-btn" type="button" (click)="openEdit(row.routine)">
                      Editar
                    </button>
                    <button
                      class="text-btn"
                      type="button"
                      [disabled]="facade.busy()"
                      (click)="openAssign(row.routine)"
                    >
                      Asignar alumnos
                    </button>
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

    <div class="nq-overlay" [class.open]="assigning() !== null" (click)="closeAssign()">
      <div
        class="nq-sheet form-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="asignar-title"
        [nqSheetTrap]="assigning() !== null"
        (dismissed)="closeAssign()"
        (click)="$event.stopPropagation()"
      >
        <div class="nq-sheet-handle"></div>
        <h2 class="nq-sheet-title" id="asignar-title">Asignar «{{ assigning()?.name }}»</h2>

        <nq-routine-assign
          #assignForm
          [options]="assignOptions()"
          [today]="today"
          [busy]="facade.busy()"
          [errorMessage]="facade.actionError()?.message ?? null"
          (submitted)="saveAssignments($event)"
          (cancelled)="closeAssign()"
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
   * "Sin asignar" junta las plantillas recien creadas y las que se quedaron
   * sin alumnos: las dos estan listas para repartirse.
   */
  readonly estados: readonly { value: RoutinesFilter; label: string }[] = [
    { value: 'assigned', label: 'Asignadas' },
    { value: 'unassigned', label: 'Sin asignar' },
  ];

  readonly seccion = signal<Seccion>('routines');
  readonly building = signal(false);
  readonly creatingExercise = signal(false);
  readonly editing = signal<Routine | null>(null);
  readonly assigning = signal<Routine | null>(null);

  /** Inicio que se propone al marcar un alumno, en `yyyy-MM-dd` local. */
  readonly today = this.fechaLocal(inject(CLOCK).now());

  readonly assignOptions = computed(() => {
    const routine = this.assigning();
    return routine === null ? [] : this.facade.assignmentOptions(routine);
  });

  readonly addLabel = computed(() =>
    this.seccion() === 'routines' ? 'Crear una rutina' : 'Crear un ejercicio',
  );

  readonly builderTitle = computed(() =>
    this.editing() === null ? 'Nueva rutina' : 'Editar rutina',
  );

  readonly emptyTitle = computed(() =>
    this.facade.filter() === 'unassigned' ? 'Nada sin asignar' : 'Ninguna rutina asignada',
  );

  readonly emptyMessage = computed(() =>
    this.facade.filter() === 'unassigned'
      ? 'Aquí aparecen las rutinas nuevas y las que se quedan sin alumnos.'
      : 'Crea una rutina y asígnasela a los alumnos con ese objetivo.',
  );

  readonly reload = (): void => this.facade.reload();

  private readonly builder = viewChild<RoutineBuilderComponent>('builder');
  private readonly exerciseForm = viewChild<ExerciseFormComponent>('exerciseForm');
  private readonly assignForm = viewChild<RoutineAssignComponent>('assignForm');

  constructor() {
    this.facade.load();
  }

  alumnos(total: number): string {
    if (total === 0) {
      return 'Sin alumnos';
    }
    return total === 1 ? '1 alumno' : `${total} alumnos`;
  }

  asignada(routine: Routine): boolean {
    return isAssigned(routine);
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
    if (actual !== null) {
      return;
    }
    // Una rutina nace sin alumnos: sin este salto el entrenador la guarda y
    // no la ve por ninguna parte. Y lo siguiente que hara es repartirla.
    this.facade.selectFilter('unassigned');
    const creada = this.facade.rows.data()?.find(row => row.routine.id === id)?.routine;
    if (creada !== undefined) {
      this.openAssign(creada);
    }
  }

  openAssign(routine: Routine): void {
    this.facade.clearActionError();
    this.assigning.set(routine);
    // Se le pasan las opciones: el input todavia no recibe las de esta rutina.
    this.assignForm()?.reset(this.facade.assignmentOptions(routine));
  }

  closeAssign(): void {
    this.assigning.set(null);
  }

  async saveAssignments(assignments: RoutineAssignment[]): Promise<void> {
    const routine = this.assigning();
    if (routine === null) {
      return;
    }
    if (await this.facade.saveAssignments(routine.id, assignments)) {
      this.assigning.set(null);
      this.facade.selectFilter(assignments.length > 0 ? 'assigned' : 'unassigned');
    }
  }

  closeExercise(): void {
    this.creatingExercise.set(false);
  }

  async saveExercise(value: Omit<ExerciseInput, 'ownerTrainerId'>): Promise<void> {
    if ((await this.facade.createExercise(value)) !== null) {
      this.creatingExercise.set(false);
    }
  }

  private fechaLocal(date: Date): string {
    const dos = (n: number): string => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${dos(date.getMonth() + 1)}-${dos(date.getDate())}`;
  }
}
