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
  isResolved,
  withDerivedStatus,
} from '@app/domain/workouts/model/workout-session.model';
import {
  SkipReason,
  WorkoutSet,
  WorkoutSetInput,
} from '@app/domain/workouts/model/workout-set.model';
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
    const alumno = routine?.assignments[0]?.studentId;
    this.sessions =
      routine === undefined || alumno === undefined
        ? []
        : buildWorkoutSeed(routine, alumno, this.clock.now());
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
      exercises: session.exercises.map(exercise =>
        exercise.routineExerciseId === routineExerciseId
          ? {
              ...exercise,
              done,
              // Marcar a mano un ejercicio saltado lo da por hecho.
              skipped: false,
              skipReason: null,
              completedSets: done ? exercise.targetSets : 0,
              // Desmarcar borra lo registrado: no queda serie huerfana.
              sets: done ? exercise.sets.filter(item => item.skipped !== true) : [],
            }
          : exercise,
      ),
    }));
  }

  logSet(sessionId: Id, routineExerciseId: Id, set: WorkoutSetInput): Observable<WorkoutSession> {
    return this.mutate(sessionId, session => ({
      ...session,
      exercises: session.exercises.map(exercise =>
        exercise.routineExerciseId === routineExerciseId ? this.withSet(exercise, set) : exercise,
      ),
    }));
  }

  /** Registra como saltadas las series que faltan, sin tocar las ya hechas. */
  skipExercise(
    sessionId: Id,
    routineExerciseId: Id,
    reason: SkipReason | null,
  ): Observable<WorkoutSession> {
    return this.mutate(sessionId, session => ({
      ...session,
      exercises: session.exercises.map(exercise => {
        if (exercise.routineExerciseId !== routineExerciseId) {
          return exercise;
        }
        const registradas = new Set(exercise.sets.map(item => item.setNumber));
        let actualizado = exercise;
        for (let numero = 1; numero <= exercise.targetSets; numero++) {
          if (!registradas.has(numero)) {
            actualizado = this.withSet(actualizado, {
              setNumber: numero,
              reps: null,
              weightKg: null,
              skipped: true,
              skipReason: reason,
            });
          }
        }
        return actualizado;
      }),
    }));
  }

  /**
   * Cierra la sesion: lo que quedaba pendiente se da por hecho y lo saltado
   * sigue saltado, asi el entrenador ve que se omitio.
   */
  complete(sessionId: Id, completion: WorkoutCompletion): Observable<WorkoutSession> {
    return this.mutate(sessionId, session => ({
      ...session,
      status: 'completed',
      completedAt: toIsoDate(this.clock.now()),
      durationMinutes: completion.durationMinutes,
      exercises: session.exercises.map(exercise =>
        isResolved(exercise)
          ? exercise
          : { ...exercise, done: true, completedSets: exercise.targetSets },
      ),
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
    const saltada = input.skipped === true;
    const registrada: WorkoutSet = {
      id: `wst-${exercise.routineExerciseId}-${setNumber}`,
      setNumber,
      reps: saltada ? null : input.reps,
      weightKg: saltada ? null : input.weightKg,
      durationSeconds: saltada ? null : (input.durationSeconds ?? null),
      skipped: saltada,
      skipReason: saltada ? (input.skipReason ?? null) : null,
      completedAt: toIsoDate(this.clock.now()),
    };

    const sets = [...exercise.sets.filter(item => item.setNumber !== setNumber), registrada].sort(
      (a, b) => a.setNumber - b.setNumber,
    );
    const hechas = sets.filter(item => item.skipped !== true).length;
    const completas = sets.length >= exercise.targetSets;
    const ultimoSalto = [...sets].reverse().find(item => item.skipped === true);

    return {
      ...exercise,
      sets,
      completedSets: hechas,
      // Con todas registradas: hecho si se hizo al menos una, saltado si ninguna.
      done: completas && hechas > 0,
      skipped: completas && hechas === 0,
      skipReason: completas && hechas === 0 ? (ultimoSalto?.skipReason ?? null) : null,
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

    // Toda mutacion recalcula el estado: desmarcar reabre una sesion cerrada.
    const updated = withDerivedStatus(change(current), toIsoDate(this.clock.now()));
    this.sessions = this.sessions.map(item => (item.id === sessionId ? updated : item));

    return simulate(updated);
  }

  private find(sessionId: Id): WorkoutSession | undefined {
    return this.sessions.find(item => item.id === sessionId);
  }
}
