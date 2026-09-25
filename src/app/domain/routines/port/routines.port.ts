import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { Id } from '@app/domain/shared/model/ids';

import { Exercise } from '../model/exercise.model';
import { Routine } from '../model/routine.model';

export interface RoutinesPort {
  /** Rutina vigente del alumno. Null si todavia no tiene una asignada. */
  getActiveForStudent(studentId: Id): Observable<Routine | null>;
  listByStudent(studentId: Id): Observable<Routine[]>;
  getById(routineId: Id): Observable<Routine>;
}

export const ROUTINES_PORT = new InjectionToken<RoutinesPort>('RoutinesPort');

/** Catalogo de ejercicios, compartido por todas las rutinas. */
export interface ExerciseCatalogPort {
  list(): Observable<Exercise[]>;
  getById(exerciseId: Id): Observable<Exercise>;
}

export const EXERCISE_CATALOG_PORT = new InjectionToken<ExerciseCatalogPort>('ExerciseCatalogPort');
