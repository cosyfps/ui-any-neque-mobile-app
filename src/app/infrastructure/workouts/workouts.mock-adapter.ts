import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { isWithinRange, toIsoDate } from '@app/domain/shared/model/date';
import { DateRange } from '@app/domain/shared/model/date-range';
import { Id } from '@app/domain/shared/model/ids';
import { CLOCK } from '@app/domain/shared/port/clock.port';
import {
  WorkoutCompletion,
  WorkoutExerciseLog,
  WorkoutSession,
} from '@app/domain/workouts/model/workout-session.model';
import { WorkoutSet, WorkoutSetInput } from '@app/domain/workouts/model/workout-set.model';
import { WorkoutsPort } from '@app/domain/workouts/port/workouts.port';

import { SEED_ROUTINES } from '../routines/seed/routines.seed';
import { cloneSeed, simulate, simulateError } from '../shared/mock-delay';

import { buildWorkoutSeed } from './seed/workouts.seed';

/**
 * Sesiones de entrenamiento mutables en memoria.
 *
 * El estado vive en campos de instancia: si fuera global, un test filtraria
 * sesiones al siguiente y aparecerian fallos intermitentes.
 */
@Injectable()
export class WorkoutsMockAdapter implements WorkoutsPort {
  private readonly clock = inject(CLOCK);
  private sessions: WorkoutSession[];

  constructor() {
    const routine = cloneSeed(SEED_ROUTINES)[0];
    this.sessions = routine === undefined ? [] : buildWorkoutSeed(routine, this.clock.now());
  }

  listByStudent(studentId: Id, range?: DateRange): Observable<WorkoutSession[]> {
    const ofStudent = this.sessions
      .filter(session => session.studentId === studentId)
      .filter(session => range === undefined || isWithinRange(session.scheduledFor, range))
      .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));

    return simulate(ofStudent);
  }

  getById(sessionId: Id): Observable<WorkoutSession> {
    const session = this.find(sessionId);
    return session === undefined ? simulateError<WorkoutSession>('not_found') : simulate(session);
  }

  start(sessionId: Id): Observable<WorkoutSession> {
    return this.mutate(sessionId, session => ({
      ...session,
      status: 'in_progress',
      startedAt: session.startedAt ?? toIsoDate(this.clock.now()),
    }));
  }

  markExercise(sessionId: Id, routineExerciseId: Id, done: boolean): Observable<WorkoutSession> {
    return this.mutate(sessionId, session => ({
      ...session,
      status: session.status === 'scheduled' ? 'in_progress' : session.status,
      exercises: session.exercises.map(exercise =>
        exercise.routineExerciseId === routineExerciseId
          ? {
              ...exercise,
              done,
              completedSets: done ? exercise.targetSets : 0,
              // Desmarcar borra lo registrado: no queda serie huerfana.
              sets: done ? exercise.sets : [],
            }
          : exercise,
      ),
    }));
  }

  logSet(sessionId: Id, routineExerciseId: Id, set: WorkoutSetInput): Observable<WorkoutSession> {
    return this.mutate(sessionId, session => ({
      ...session,
      status: session.status === 'scheduled' ? 'in_progress' : session.status,
      exercises: session.exercises.map(exercise =>
        exercise.routineExerciseId === routineExerciseId ? this.withSet(exercise, set) : exercise,
      ),
    }));
  }

  complete(sessionId: Id, completion: WorkoutCompletion): Observable<WorkoutSession> {
    return this.mutate(sessionId, session => ({
      ...session,
      status: 'completed',
      completedAt: toIsoDate(this.clock.now()),
      durationMinutes: completion.durationMinutes,
      exercises: session.exercises.map(exercise => ({
        ...exercise,
        done: true,
        completedSets: exercise.targetSets,
      })),
    }));
  }

  /**
   * Agrega o reemplaza una serie.
   *
   * Reemplaza por `setNumber` en vez de acumular: reintentar el registro de
   * la misma serie no puede inflar el conteo ni el volumen.
   */
  private withSet(exercise: WorkoutExerciseLog, input: WorkoutSetInput): WorkoutExerciseLog {
    const setNumber = Math.max(1, Math.min(input.setNumber, exercise.targetSets));
    const registrada: WorkoutSet = {
      id: `wst-${exercise.routineExerciseId}-${setNumber}`,
      setNumber,
      reps: input.reps,
      weightKg: input.weightKg,
      completedAt: toIsoDate(this.clock.now()),
    };

    const sets = [...exercise.sets.filter(item => item.setNumber !== setNumber), registrada].sort(
      (a, b) => a.setNumber - b.setNumber,
    );

    return {
      ...exercise,
      sets,
      completedSets: sets.length,
      done: sets.length >= exercise.targetSets,
    };
  }

  private mutate(
    sessionId: Id,
    change: (session: WorkoutSession) => WorkoutSession,
  ): Observable<WorkoutSession> {
    const current = this.find(sessionId);
    if (current === undefined) {
      return simulateError<WorkoutSession>('not_found');
    }

    const updated = change(current);
    this.sessions = this.sessions.map(item => (item.id === sessionId ? updated : item));

    return simulate(updated);
  }

  private find(sessionId: Id): WorkoutSession | undefined {
    return this.sessions.find(item => item.id === sessionId);
  }
}
