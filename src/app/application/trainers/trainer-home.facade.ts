import { Injectable, Signal, computed, inject } from '@angular/core';
import { forkJoin, map, of, switchMap } from 'rxjs';

import { SessionFacade } from '@app/application/auth/session.facade';
import { ROUTINES_PORT } from '@app/domain/routines/port/routines.port';
import { isSameDay, parseIsoDate } from '@app/domain/shared/model/date';
import { CLOCK } from '@app/domain/shared/port/clock.port';
import { Student, fullName } from '@app/domain/students/model/student.model';
import { ASSESSMENTS_PORT } from '@app/domain/students/port/assessments.port';
import { STUDENTS_PORT } from '@app/domain/students/port/students.port';
import { WorkoutSession } from '@app/domain/workouts/model/workout-session.model';
import { WORKOUTS_PORT } from '@app/domain/workouts/port/workouts.port';

import { AsyncState, ViewState, asyncState } from '../shared/async-state';

/** Una sesion de hoy, ya resuelta con el nombre de su alumno. */
export interface TodaySession {
  readonly id: string;
  readonly studentId: string;
  readonly studentName: string;
  readonly title: string;
  readonly scheduledFor: string;
}

/** Alumno al que le falta la primera evaluacion o la anamnesis. */
export interface PendingStudent {
  readonly id: string;
  readonly name: string;
  readonly reason: string;
}

/**
 * Inicio del entrenador.
 *
 * Compone tres puertos en una sola lectura: la pantalla no puede mostrar
 * conteos que se contradigan entre si porque cada bloque llego en su propio
 * momento.
 */
// Scoped a la ruta /trainer: sus puertos viven en ese injector, no en el raiz.
@Injectable()
export class TrainerHomeFacade {
  private readonly students = inject(STUDENTS_PORT);
  private readonly workouts = inject(WORKOUTS_PORT);
  private readonly routines = inject(ROUTINES_PORT);
  private readonly assessments = inject(ASSESSMENTS_PORT);
  private readonly session = inject(SessionFacade);
  private readonly clock = inject(CLOCK);

  readonly cartera: AsyncState<Student[]> = asyncState<Student[]>({
    // Un entrenador sin alumnos todavia es un estado valido de la pantalla.
    isEmpty: () => false,
  });

  readonly today: AsyncState<TodaySession[]> = asyncState<TodaySession[]>({
    isEmpty: () => false,
  });

  readonly pending: AsyncState<PendingStudent[]> = asyncState<PendingStudent[]>({
    isEmpty: () => false,
  });

  readonly viewState: Signal<ViewState> = this.cartera.viewState;

  readonly trainerFirstName: Signal<string> = computed(
    () => this.session.displayName().split(' ')[0] ?? '',
  );

  readonly activeCount: Signal<number> = computed(
    () => (this.cartera.data() ?? []).filter(student => student.status === 'active').length,
  );

  readonly todayCount: Signal<number> = computed(() => (this.today.data() ?? []).length);

  readonly pendingCount: Signal<number> = computed(() => (this.pending.data() ?? []).length);

  /** Saludo segun la hora del reloj inyectado. */
  readonly greeting: Signal<string> = computed(() => {
    const hora = this.clock.now().getHours();
    if (hora < 12) {
      return 'Buenos días';
    }
    return hora < 20 ? 'Buenas tardes' : 'Buenas noches';
  });

  load(): void {
    const trainerId = this.session.profileId();
    if (trainerId === null) {
      return;
    }

    this.cartera.load(() => this.students.listByTrainer(trainerId));
    this.today.load(() => this.cargarHoy(trainerId));
    this.pending.load(() => this.cargarPendientes(trainerId));
  }

  reload(): void {
    this.cartera.reload();
    this.today.reload();
    this.pending.reload();
  }

  /** Sesiones agendadas hoy para cualquier alumno de la cartera. */
  private cargarHoy(trainerId: string) {
    const hoy = this.clock.now();

    return this.students.listByTrainer(trainerId).pipe(
      switchMap(cartera => {
        const activos = cartera.filter(student => student.status === 'active');
        if (activos.length === 0) {
          return of<TodaySession[]>([]);
        }

        return forkJoin(
          activos.map(student =>
            this.workouts
              .listByStudent(student.id)
              .pipe(map(sesiones => this.deHoy(sesiones, student, hoy))),
          ),
        ).pipe(
          map(grupos => grupos.flat().sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))),
        );
      }),
    );
  }

  private esHoy(iso: string, hoy: Date): boolean {
    const fecha = parseIsoDate(iso);
    return fecha !== null && isSameDay(fecha, hoy);
  }

  private deHoy(sesiones: WorkoutSession[], student: Student, hoy: Date): TodaySession[] {
    return sesiones
      .filter(sesion => sesion.status !== 'completed' && this.esHoy(sesion.scheduledFor, hoy))
      .map(sesion => ({
        id: sesion.id,
        studentId: student.id,
        studentName: fullName(student),
        title: sesion.title,
        scheduledFor: sesion.scheduledFor,
      }));
  }

  /**
   * Alumnos a los que les falta algo para poder entrenar.
   *
   * Sin rutina no tienen que hacer; sin evaluacion su Inicio no puede
   * mostrarles un IMC. Son las dos cosas que solo el entrenador resuelve.
   */
  private cargarPendientes(trainerId: string) {
    return this.students.listByTrainer(trainerId).pipe(
      switchMap(cartera => {
        const activos = cartera.filter(student => student.status === 'active');
        if (activos.length === 0) {
          return of<PendingStudent[]>([]);
        }

        return forkJoin(
          activos.map(student =>
            forkJoin({
              rutina: this.routines.getActiveForStudent(student.id),
              evaluacion: this.assessments.latestByStudent(student.id),
            }).pipe(
              map(({ rutina, evaluacion }) => {
                if (rutina === null) {
                  return { id: student.id, name: fullName(student), reason: 'Sin rutina asignada' };
                }
                if (evaluacion === null) {
                  return { id: student.id, name: fullName(student), reason: 'Sin evaluación' };
                }
                return null;
              }),
            ),
          ),
        ).pipe(map(lista => lista.filter((item): item is PendingStudent => item !== null)));
      }),
    );
  }
}
