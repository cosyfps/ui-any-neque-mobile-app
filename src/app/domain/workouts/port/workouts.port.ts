import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { DateRange } from '@app/domain/shared/model/date-range';
import { Id } from '@app/domain/shared/model/ids';

import { WorkoutCompletion, WorkoutSession } from '../model/workout-session.model';

/**
 * Sesiones de entrenamiento.
 *
 * Es el puerto mas compartido: lo consumen el home, Mi rutina, el runner,
 * progreso y la agenda. Toda mutacion devuelve la sesion completa para que
 * las facades solo hagan `set()` y no repliquen logica de merge.
 */
export interface WorkoutsPort {
  listByStudent(studentId: Id, range?: DateRange): Observable<WorkoutSession[]>;
  getById(sessionId: Id): Observable<WorkoutSession>;
  start(sessionId: Id): Observable<WorkoutSession>;
  markExercise(sessionId: Id, routineExerciseId: Id, done: boolean): Observable<WorkoutSession>;
  logSet(sessionId: Id, routineExerciseId: Id, completedSets: number): Observable<WorkoutSession>;
  complete(sessionId: Id, completion: WorkoutCompletion): Observable<WorkoutSession>;
}

export const WORKOUTS_PORT = new InjectionToken<WorkoutsPort>('WorkoutsPort');
