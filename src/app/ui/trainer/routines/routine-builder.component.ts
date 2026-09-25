import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideChevronDown, LucidePlus, LucideTrash2 } from '@lucide/angular';

import {
  Exercise,
  MUSCLE_GROUP_LABEL,
  MuscleGroup,
} from '@app/domain/routines/model/exercise.model';
import {
  Routine,
  RoutineDayInput,
  RoutineExerciseInput,
  RoutineInput,
} from '@app/domain/routines/model/routine.model';
import { Weekday } from '@app/domain/shared/model/date';
import { Student, fullName } from '@app/domain/students/model/student.model';

/** Etiquetas de los dias ISO, en el orden en que se muestran. */
const DIAS: readonly { value: Weekday; label: string }[] = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

const GRUPOS = Object.entries(MUSCLE_GROUP_LABEL).map(([value, label]) => ({
  value: value as MuscleGroup,
  label,
}));

const MINUTOS_POR_DEFECTO = 50;

/**
 * Constructor de rutinas.
 *
 * Los dias se editan en acordeon y no en sheets anidados: en un telefono,
 * tres capas de sheet dejan al entrenador sin saber de donde viene.
 */
@Component({
  selector: 'nq-routine-builder',
  standalone: true,
  imports: [ReactiveFormsModule, LucidePlus, LucideTrash2, LucideChevronDown],
  template: `
    <form class="form" [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
      <div class="field">
        <label class="nq-field-label" [attr.for]="id('nombre')">Nombre *</label>
        <div class="nq-field-input">
          <input
            [attr.id]="id('nombre')"
            formControlName="name"
            enterkeyhint="next"
            placeholder="Hipertrofia — Bloque 1"
          />
        </div>
      </div>

      <div class="field">
        <label class="nq-field-label" [attr.for]="id('objetivo')">Objetivo *</label>
        <div class="nq-field-input">
          <input
            [attr.id]="id('objetivo')"
            formControlName="goal"
            enterkeyhint="next"
            placeholder="Ganar masa muscular"
          />
        </div>
      </div>

      <div class="field">
        <label class="nq-field-label" [attr.for]="id('alumno')">Alumno *</label>
        <div class="nq-field-input">
          <select [attr.id]="id('alumno')" formControlName="studentId">
            <option value="">Selecciona un alumno</option>
            @for (student of students(); track student.id) {
              <option [value]="student.id">{{ nombreDe(student) }}</option>
            }
          </select>
        </div>
      </div>

      <div class="row-2">
        <div class="field">
          <label class="nq-field-label" [attr.for]="id('inicio')">Inicio *</label>
          <div class="nq-field-input">
            <input [attr.id]="id('inicio')" formControlName="startDate" type="date" />
          </div>
        </div>

        <div class="field">
          <label class="nq-field-label" [attr.for]="id('fin')">Fin</label>
          <div class="nq-field-input">
            <input [attr.id]="id('fin')" formControlName="endDate" type="date" />
          </div>
        </div>
      </div>

      <section class="days">
        <div class="days-head">
          <h3 class="days-title">Días ({{ days().length }})</h3>
          <button class="add-day" type="button" (click)="addDay()">
            <svg lucidePlus [size]="16" [strokeWidth]="2"></svg>
            Agregar día
          </button>
        </div>

        @if (days().length === 0) {
          <p class="hint">Una rutina sin días no se puede asignar. Agrega al menos uno.</p>
        }

        @for (day of days(); track $index) {
          <div class="day">
            <button
              class="day-head"
              type="button"
              [attr.aria-expanded]="openDay() === $index"
              (click)="toggleDay($index)"
            >
              <span class="day-title">
                {{ etiquetaDia(day.weekday) }} · {{ day.title || 'Sin título' }}
              </span>
              <span class="day-meta">{{ day.exercises.length }} ej.</span>
              <svg
                class="day-chevron"
                [class.open]="openDay() === $index"
                lucideChevronDown
                [size]="18"
                [strokeWidth]="2"
              ></svg>
            </button>

            @if (openDay() === $index) {
              <div class="day-body">
                <div class="row-2">
                  <div class="field">
                    <label class="nq-field-label" [attr.for]="id('dia-' + $index)">Día</label>
                    <div class="nq-field-input">
                      <select
                        [attr.id]="id('dia-' + $index)"
                        [value]="day.weekday"
                        (change)="setWeekday($index, $event)"
                      >
                        @for (opcion of dias; track opcion.value) {
                          <option [value]="opcion.value">{{ opcion.label }}</option>
                        }
                      </select>
                    </div>
                  </div>

                  <div class="field">
                    <label class="nq-field-label" [attr.for]="id('foco-' + $index)">Foco</label>
                    <div class="nq-field-input">
                      <select
                        [attr.id]="id('foco-' + $index)"
                        [value]="day.focus"
                        (change)="setFocus($index, $event)"
                      >
                        @for (grupo of grupos; track grupo.value) {
                          <option [value]="grupo.value">{{ grupo.label }}</option>
                        }
                      </select>
                    </div>
                  </div>
                </div>

                <div class="row-2">
                  <div class="field">
                    <label class="nq-field-label" [attr.for]="id('titulo-' + $index)">Título</label>
                    <div class="nq-field-input">
                      <input
                        [attr.id]="id('titulo-' + $index)"
                        [value]="day.title"
                        placeholder="Tren inferior"
                        (input)="setTitle($index, $event)"
                      />
                    </div>
                  </div>

                  <div class="field">
                    <label class="nq-field-label" [attr.for]="id('minutos-' + $index)">
                      Minutos
                    </label>
                    <div class="nq-field-input">
                      <input
                        [attr.id]="id('minutos-' + $index)"
                        type="number"
                        inputmode="numeric"
                        min="10"
                        max="180"
                        [value]="day.estimatedMinutes"
                        (input)="setMinutes($index, $event)"
                      />
                    </div>
                  </div>
                </div>

                <div class="exercises">
                  @for (exercise of day.exercises; track $index) {
                    <div class="exercise">
                      <div class="exercise-head">
                        <span class="exercise-name">{{ exercise.name }}</span>
                        <button
                          class="remove"
                          type="button"
                          [attr.aria-label]="'Quitar ' + exercise.name"
                          (click)="removeExercise(day, $index)"
                        >
                          <svg lucideTrash2 [size]="16" [strokeWidth]="2"></svg>
                        </button>
                      </div>

                      <div class="prescription">
                        <label class="presc">
                          <input
                            type="number"
                            inputmode="numeric"
                            min="1"
                            max="20"
                            [value]="exercise.sets"
                            (input)="setPrescription(day, $index, 'sets', $event)"
                          />
                          <span>series</span>
                        </label>
                        <label class="presc">
                          <input
                            type="number"
                            inputmode="numeric"
                            min="1"
                            max="100"
                            [value]="exercise.reps"
                            (input)="setPrescription(day, $index, 'reps', $event)"
                          />
                          <span>reps</span>
                        </label>
                        <label class="presc">
                          <input
                            type="number"
                            inputmode="decimal"
                            min="0"
                            max="500"
                            step="0.5"
                            [value]="exercise.weightKg"
                            (input)="setPrescription(day, $index, 'weightKg', $event)"
                          />
                          <span>kg</span>
                        </label>
                        <label class="presc">
                          <input
                            type="number"
                            inputmode="numeric"
                            min="0"
                            max="600"
                            step="15"
                            [value]="exercise.restSeconds"
                            (input)="setPrescription(day, $index, 'restSeconds', $event)"
                          />
                          <span>seg</span>
                        </label>
                      </div>
                    </div>
                  }

                  <div class="field">
                    <label class="nq-field-label" [attr.for]="id('ejercicio-' + $index)">
                      Agregar ejercicio
                    </label>
                    <div class="nq-field-input">
                      <select
                        [attr.id]="id('ejercicio-' + $index)"
                        value=""
                        (change)="addExercise(day, $event)"
                      >
                        <option value="">Elige del catálogo</option>
                        @if (publicExercises().length > 0) {
                          <optgroup label="Catálogo">
                            @for (item of publicExercises(); track item.id) {
                              <option [value]="item.id">{{ item.name }}</option>
                            }
                          </optgroup>
                        }
                        @if (ownExercises().length > 0) {
                          <optgroup label="Mis ejercicios">
                            @for (item of ownExercises(); track item.id) {
                              <option [value]="item.id">{{ item.name }}</option>
                            }
                          </optgroup>
                        }
                      </select>
                    </div>
                  </div>
                </div>

                <button class="remove-day" type="button" (click)="removeDay($index)">
                  Quitar este día
                </button>
              </div>
            }
          </div>
        }
      </section>

      @if (validationError(); as error) {
        <p class="nq-field-error submit-error" role="alert">{{ error }}</p>
      }

      @if (errorMessage(); as error) {
        <p class="nq-field-error submit-error" role="alert">{{ error }}</p>
      }

      <div class="form-actions">
        <button class="nq-btn nq-btn-secondary" type="button" (click)="cancelled.emit()">
          Cancelar
        </button>
        <button class="nq-btn nq-btn-primary" type="submit" [disabled]="busy()">
          {{ busy() ? 'Guardando…' : submitLabel() }}
        </button>
      </div>
    </form>
  `,
  styleUrl: './routine-builder.component.scss',
})
export class RoutineBuilderComponent {
  readonly students = input<readonly Student[]>([]);
  readonly publicExercises = input<readonly Exercise[]>([]);
  readonly ownExercises = input<readonly Exercise[]>([]);
  readonly routine = input<Routine | null>(null);
  readonly busy = input(false);
  readonly errorMessage = input<string | null>(null);
  readonly submitLabel = input('Guardar');

  readonly submitted = output<Omit<RoutineInput, 'trainerId'>>();
  readonly cancelled = output<void>();

  readonly dias = DIAS;
  readonly grupos = GRUPOS;

  readonly days = signal<RoutineDayInput[]>([]);
  readonly openDay = signal<number | null>(null);

  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    goal: ['', [Validators.required, Validators.maxLength(120)]],
    studentId: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: [''],
  });

  readonly validationError = computed(() => {
    if (!this.intentado()) {
      return null;
    }
    if (this.form.invalid) {
      return 'Completa nombre, objetivo, alumno y fecha de inicio.';
    }
    if (this.days().length === 0) {
      return 'Agrega al menos un día de entrenamiento.';
    }
    // Un dia sin ejercicios no le dice nada al alumno cuando abra el runner.
    if (this.days().some(day => day.exercises.length === 0)) {
      return 'Cada día necesita al menos un ejercicio.';
    }
    if (this.hayDiasRepetidos()) {
      return 'Hay dos días de rutina en el mismo día de la semana.';
    }
    return null;
  });

  private readonly intentado = signal(false);
  private readonly uid = `rb-${Math.random().toString(36).slice(2, 8)}`;

  id(campo: string): string {
    return `${this.uid}-${campo}`;
  }

  nombreDe(student: Student): string {
    return fullName(student);
  }

  etiquetaDia(weekday: Weekday): string {
    return DIAS.find(item => item.value === weekday)?.label ?? '';
  }

  /** Carga la rutina a editar, o deja el constructor en blanco. */
  reset(): void {
    const routine = this.routine();
    this.intentado.set(false);
    this.openDay.set(null);
    this.days.set(
      (routine?.days ?? []).map(day => ({
        weekday: day.weekday,
        title: day.title,
        focus: day.focus,
        estimatedMinutes: day.estimatedMinutes,
        exercises: day.exercises.map(exercise => ({
          exerciseId: exercise.exerciseId,
          name: exercise.name,
          order: exercise.order,
          sets: exercise.sets,
          reps: exercise.reps,
          restSeconds: exercise.restSeconds,
          weightKg: exercise.weightKg,
          notes: exercise.notes,
        })),
      })),
    );
    this.form.reset({
      name: routine?.name ?? '',
      goal: routine?.goal ?? '',
      studentId: routine?.studentId ?? '',
      startDate: this.soloFecha(routine?.startDate ?? ''),
      endDate: this.soloFecha(routine?.endDate ?? ''),
    });
  }

  toggleDay(index: number): void {
    this.openDay.update(actual => (actual === index ? null : index));
  }

  addDay(): void {
    const usados = this.days().map(day => day.weekday);
    const libre = DIAS.find(item => !usados.includes(item.value))?.value ?? 1;

    this.days.update(actual => [
      ...actual,
      {
        weekday: libre,
        title: '',
        focus: 'fullbody',
        estimatedMinutes: MINUTOS_POR_DEFECTO,
        exercises: [],
      },
    ]);
    this.openDay.set(this.days().length - 1);
  }

  removeDay(index: number): void {
    this.days.update(actual => actual.filter((_dia, i) => i !== index));
    this.openDay.set(null);
  }

  setWeekday(index: number, event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value) as Weekday;
    this.patchDay(index, { weekday: value });
  }

  setFocus(index: number, event: Event): void {
    const value = (event.target as HTMLSelectElement).value as MuscleGroup;
    this.patchDay(index, { focus: value });
  }

  setTitle(index: number, event: Event): void {
    this.patchDay(index, { title: (event.target as HTMLInputElement).value });
  }

  setMinutes(index: number, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.patchDay(index, {
      estimatedMinutes: Number.isFinite(value) && value > 0 ? value : MINUTOS_POR_DEFECTO,
    });
  }

  /** Agrega el ejercicio elegido y devuelve el selector a su opcion vacia. */
  addExercise(day: RoutineDayInput, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const exerciseId = select.value;
    select.value = '';
    if (exerciseId === '') {
      return;
    }

    const exercise = [...this.publicExercises(), ...this.ownExercises()].find(
      item => item.id === exerciseId,
    );
    if (exercise === undefined) {
      return;
    }

    const index = this.days().indexOf(day);
    const nuevo: RoutineExerciseInput = {
      exerciseId: exercise.id,
      name: exercise.name,
      order: day.exercises.length + 1,
      sets: 3,
      reps: 10,
      restSeconds: 60,
      weightKg: null,
      notes: null,
    };
    this.patchDay(index, { exercises: [...day.exercises, nuevo] });
  }

  removeExercise(day: RoutineDayInput, exerciseIndex: number): void {
    const index = this.days().indexOf(day);
    this.patchDay(index, {
      exercises: day.exercises
        .filter((_item, i) => i !== exerciseIndex)
        .map((item, i) => ({ ...item, order: i + 1 })),
    });
  }

  setPrescription(
    day: RoutineDayInput,
    exerciseIndex: number,
    campo: 'sets' | 'reps' | 'weightKg' | 'restSeconds',
    event: Event,
  ): void {
    const raw = (event.target as HTMLInputElement).value.trim();
    const parsed = Number(raw);
    // Solo la carga admite "sin dato": series, reps y descanso siempre valen.
    const value = raw === '' || !Number.isFinite(parsed) ? null : parsed;

    const index = this.days().indexOf(day);
    this.patchDay(index, {
      exercises: day.exercises.map((item, i) =>
        i === exerciseIndex
          ? { ...item, [campo]: campo === 'weightKg' ? value : (value ?? item[campo]) }
          : item,
      ),
    });
  }

  onSubmit(): void {
    this.intentado.set(true);
    if (this.validationError() !== null) {
      return;
    }

    const raw = this.form.getRawValue();
    this.submitted.emit({
      studentId: raw.studentId,
      name: raw.name.trim(),
      goal: raw.goal.trim(),
      startDate: new Date(`${raw.startDate}T00:00:00`).toISOString(),
      endDate: raw.endDate === '' ? null : new Date(`${raw.endDate}T00:00:00`).toISOString(),
      days: this.days(),
    });
  }

  private hayDiasRepetidos(): boolean {
    const usados = this.days().map(day => day.weekday);
    return new Set(usados).size !== usados.length;
  }

  private patchDay(index: number, cambios: Partial<RoutineDayInput>): void {
    this.days.update(actual =>
      actual.map((day, i) => (i === index ? { ...day, ...cambios } : day)),
    );
  }

  /** `<input type="date">` solo entiende `yyyy-MM-dd`. */
  private soloFecha(iso: string): string {
    return iso === '' ? '' : (iso.split('T')[0] ?? '');
  }
}
