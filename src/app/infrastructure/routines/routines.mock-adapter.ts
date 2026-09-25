import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Exercise, ExerciseInput } from '@app/domain/routines/model/exercise.model';
import {
  Routine,
  RoutineDay,
  RoutineExercise,
  RoutineInput,
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
    const active = this.routines.find(
      routine => routine.studentId === studentId && routine.status === 'active',
    );
    return simulate(active ?? null);
  }

  listByStudent(studentId: Id): Observable<Routine[]> {
    return simulate(this.routines.filter(routine => routine.studentId === studentId));
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
    // Nace archivada: asignarla es un paso aparte, porque activar implica
    // archivar la anterior del alumno.
    const routine: Routine = { ...input, id, status: 'archived', days: this.conIds(id, input) };

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
      status: current.status,
      days: this.conIds(current.id, changes),
    };
    this.routines = this.routines.map(item => (item.id === routineId ? updated : item));

    return simulate(updated);
  }

  /**
   * Activa la rutina y archiva la anterior del mismo alumno.
   *
   * Las dos escrituras van juntas: si se hicieran por separado quedaria un
   * instante con dos rutinas activas, que es justo lo que el indice unico
   * parcial de la base va a rechazar.
   */
  assign(routineId: Id): Observable<Routine> {
    const objetivo = this.routines.find(item => item.id === routineId);
    if (objetivo === undefined) {
      return simulateError<Routine>('not_found');
    }

    const activada: Routine = { ...objetivo, status: 'active' };
    this.routines = this.routines.map(item => {
      if (item.id === routineId) {
        return activada;
      }
      const esLaAnterior = item.studentId === objetivo.studentId && item.status === 'active';
      return esLaAnterior ? { ...item, status: 'archived' } : item;
    });

    return simulate(activada);
  }

  archive(routineId: Id): Observable<Routine> {
    const current = this.routines.find(item => item.id === routineId);
    if (current === undefined) {
      return simulateError<Routine>('not_found');
    }

    const archivada: Routine = { ...current, status: 'archived' };
    this.routines = this.routines.map(item => (item.id === routineId ? archivada : item));

    return simulate(archivada);
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
