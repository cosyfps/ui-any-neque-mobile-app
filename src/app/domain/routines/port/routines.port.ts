import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { Id } from '@app/domain/shared/model/ids';

import { Exercise, ExerciseInput } from '../model/exercise.model';
import { Routine, RoutineInput } from '../model/routine.model';

export interface RoutinesPort {
  /** Rutina vigente del alumno. Null si todavia no tiene una asignada. */
  getActiveForStudent(studentId: Id): Observable<Routine | null>;
  listByStudent(studentId: Id): Observable<Routine[]>;
  listByTrainer(trainerId: Id): Observable<Routine[]>;
  getById(routineId: Id): Observable<Routine>;

  /** Crea la rutina en borrador, sin asignar. */
  create(input: RoutineInput): Observable<Routine>;
  update(routineId: Id, changes: RoutineInput): Observable<Routine>;
  /**
   * Activa la rutina para su alumno y archiva la anterior.
   *
   * Va en una sola operacion a proposito: solo puede haber un plan semanal
   * activo por alumno, y hacerlo en dos pasos deja un hueco donde hay dos o
   * ninguno.
   */
  assign(routineId: Id): Observable<Routine>;
  archive(routineId: Id): Observable<Routine>;
}

export const ROUTINES_PORT = new InjectionToken<RoutinesPort>('RoutinesPort');

/**
 * Catalogo de ejercicios.
 *
 * `listForTrainer` devuelve el catalogo publico mas los propios de ese
 * entrenador. Nunca los de otro: los ejercicios propios son privados.
 */
export interface ExerciseCatalogPort {
  list(): Observable<Exercise[]>;
  listForTrainer(trainerId: Id): Observable<Exercise[]>;
  getById(exerciseId: Id): Observable<Exercise>;
  create(input: ExerciseInput): Observable<Exercise>;
}

export const EXERCISE_CATALOG_PORT = new InjectionToken<ExerciseCatalogPort>('ExerciseCatalogPort');
