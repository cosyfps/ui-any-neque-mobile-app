import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Exercise } from '@app/domain/routines/model/exercise.model';
import { Routine } from '@app/domain/routines/model/routine.model';
import { ExerciseCatalogPort, RoutinesPort } from '@app/domain/routines/port/routines.port';
import { Id } from '@app/domain/shared/model/ids';

import { cloneSeed, simulate, simulateError } from '../shared/mock-delay';

import { SEED_EXERCISES } from './seed/exercises.seed';
import { SEED_ROUTINES } from './seed/routines.seed';

@Injectable()
export class RoutinesMockAdapter implements RoutinesPort {
  private readonly routines: Routine[] = cloneSeed(SEED_ROUTINES) as Routine[];

  getActiveForStudent(studentId: Id): Observable<Routine | null> {
    const active = this.routines.find(
      routine => routine.studentId === studentId && routine.status === 'active',
    );
    return simulate(active ?? null);
  }

  listByStudent(studentId: Id): Observable<Routine[]> {
    return simulate(this.routines.filter(routine => routine.studentId === studentId));
  }

  getById(routineId: Id): Observable<Routine> {
    const routine = this.routines.find(item => item.id === routineId);
    return routine === undefined ? simulateError<Routine>('not_found') : simulate(routine);
  }
}

@Injectable()
export class ExerciseCatalogMockAdapter implements ExerciseCatalogPort {
  private readonly exercises: Exercise[] = cloneSeed(SEED_EXERCISES) as Exercise[];

  list(): Observable<Exercise[]> {
    return simulate(this.exercises);
  }

  getById(exerciseId: Id): Observable<Exercise> {
    const exercise = this.exercises.find(item => item.id === exerciseId);
    return exercise === undefined ? simulateError<Exercise>('not_found') : simulate(exercise);
  }
}
