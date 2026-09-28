import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Exercise, ExerciseInput } from '@app/domain/routines/model/exercise.model';
import {
  Routine,
  RoutineAssignment,
  RoutineDay,
  RoutineExercise,
  RoutineInput,
  assignmentFor,
} from '@app/domain/routines/model/routine.model';
import { ExerciseCatalogPort, RoutinesPort } from '@app/domain/routines/port/routines.port';
import { Id } from '@app/domain/shared/model/ids';

import { cloneSeed, simulate, simulateError } from '../shared/mock-delay';

import { SEED_EXERCISES } from './seed/exercises.seed';
import { SEED_ROUTINES } from './seed/routines.seed';

@Injectable()
export class RoutinesMockAdapter implements RoutinesPort {
  private routines: Routine[] = cloneSeed(SEED_ROUTINES) as Routine[];
  private nextId = SEED_ROUTINES.length + 1;

  getActiveForStudent(studentId: Id): Observable<Routine | null> {
    const active = this.routines.find(routine => assignmentFor(routine, studentId) !== null);
    return simulate(active ?? null);
  }

  listByTrainer(trainerId: Id): Observable<Routine[]> {
    return simulate(this.routines.filter(routine => routine.trainerId === trainerId));
  }

  getById(routineId: Id): Observable<Routine> {
    const routine = this.routines.find(item => item.id === routineId);
    return routine === undefined ? simulateError<Routine>('not_found') : simulate(routine);
  }

  create(input: RoutineInput): Observable<Routine> {
    const id = `rtn-${String(this.nextId++).padStart(3, '0')}`;
    // Nace sin alumnos: repartirla es un paso aparte.
    const routine: Routine = { ...input, id, days: this.conIds(id, input), assignments: [] };

    this.routines = [...this.routines, routine];

    return simulate(routine);
  }

  update(routineId: Id, changes: RoutineInput): Observable<Routine> {
    const current = this.routines.find(item => item.id === routineId);
    if (current === undefined) {
      return simulateError<Routine>('not_found');
    }

    const updated: Routine = {
      ...current,
      ...changes,
      id: current.id,
      assignments: current.assignments,
      days: this.conIds(current.id, changes),
    };
    this.routines = this.routines.map(item => (item.id === routineId ? updated : item));

    return simulate(updated);
  }

  /**
   * Deja la rutina con esos alumnos y los saca de la que hacian antes.
   *
   * Todo en una escritura: por separado quedaria un instante con el alumno en
   * dos rutinas, que es lo que la restriccion unica de la base va a rechazar.
   */
  setAssignments(routineId: Id, assignments: readonly RoutineAssignment[]): Observable<Routine> {
    const objetivo = this.routines.find(item => item.id === routineId);
    if (objetivo === undefined) {
      return simulateError<Routine>('not_found');
    }

    const actualizada: Routine = { ...objetivo, assignments: [...assignments] };
    const llegan = new Set(assignments.map(item => item.studentId));
    this.routines = this.routines.map(item =>
      item.id === routineId
        ? actualizada
        : {
            ...item,
            assignments: item.assignments.filter(asignacion => !llegan.has(asignacion.studentId)),
          },
    );

    return simulate(actualizada);
  }

  /** Sale de la biblioteca y con ella sus asignaciones: sus alumnos quedan libres. */
  remove(routineId: Id): Observable<void> {
    if (!this.routines.some(item => item.id === routineId)) {
      return simulateError<void>('not_found');
    }
    this.routines = this.routines.filter(item => item.id !== routineId);
    return simulate<void>(undefined);
  }

  /** El constructor manda dias y ejercicios sin id: aqui se les asigna uno. */
  private conIds(routineId: Id, input: RoutineInput): RoutineDay[] {
    return input.days.map((day, indiceDia) => ({
      ...day,
      id: `${routineId}-d${indiceDia + 1}`,
      exercises: day.exercises.map(
        (exercise, indice): RoutineExercise => ({
          ...exercise,
          id: `${routineId}-d${indiceDia + 1}-e${indice + 1}`,
        }),
      ),
    }));
  }
}

@Injectable()
export class ExerciseCatalogMockAdapter implements ExerciseCatalogPort {
  private exercises: Exercise[] = cloneSeed(SEED_EXERCISES) as Exercise[];
  private nextId = SEED_EXERCISES.length + 1;

  list(): Observable<Exercise[]> {
    return simulate(this.exercises.filter(item => item.ownerTrainerId === null));
  }

  /** Catalogo publico mas los propios de ese entrenador, nunca los de otro. */
  listForTrainer(trainerId: Id): Observable<Exercise[]> {
    return simulate(
      this.exercises.filter(
        item => item.ownerTrainerId === null || item.ownerTrainerId === trainerId,
      ),
    );
  }

  getById(exerciseId: Id): Observable<Exercise> {
    const exercise = this.exercises.find(item => item.id === exerciseId);
    return exercise === undefined ? simulateError<Exercise>('not_found') : simulate(exercise);
  }

  create(input: ExerciseInput): Observable<Exercise> {
    const exercise: Exercise = {
      ...input,
      id: `exr-${String(this.nextId++).padStart(3, '0')}`,
    };

    this.exercises = [...this.exercises, exercise];

    return simulate(exercise);
  }
}
