import { Routine, RoutineDay } from '@app/domain/routines/model/routine.model';
import { addDays, startOfWeek, toIsoDate } from '@app/domain/shared/model/date';
import {
  WorkoutExerciseLog,
  WorkoutSession,
  WorkoutStatus,
} from '@app/domain/workouts/model/workout-session.model';
import { WorkoutSet } from '@app/domain/workouts/model/workout-set.model';

/** Semanas hacia atras que se generan para tener historial. */
const PAST_WEEKS = 3;

/** Hora del dia a la que queda agendada cada sesion. */
const SESSION_HOUR = 18;

function logsFor(
  day: RoutineDay,
  status: WorkoutStatus,
  completedAt: string | null,
): WorkoutExerciseLog[] {
  const done = status === 'completed';
  return day.exercises.map(exercise => ({
    routineExerciseId: exercise.id,
    exerciseId: exercise.exerciseId,
    name: exercise.name,
    targetSets: exercise.sets,
    targetReps: exercise.reps,
    restSeconds: exercise.restSeconds,
    weightKg: exercise.weightKg,
    completedSets: done ? exercise.sets : 0,
    done,
    sets: done && completedAt !== null ? seriesDe(exercise.id, exercise, completedAt) : [],
  }));
}

/**
 * Series de una sesion ya cerrada.
 *
 * El historial se da por ejecutado tal como se prescribio: no hay de donde
 * sacar desviaciones reales, y inventar ruido haria que los graficos del
 * entrenador mostraran una progresion que nadie registro.
 */
function seriesDe(
  routineExerciseId: string,
  exercise: RoutineDay['exercises'][number],
  completedAt: string,
): WorkoutSet[] {
  return Array.from({ length: exercise.sets }, (_unused, index) => ({
    id: `wst-${routineExerciseId}-${index + 1}`,
    setNumber: index + 1,
    reps: exercise.reps,
    weightKg: exercise.weightKg,
    completedAt,
  }));
}

/**
 * Genera el historial de sesiones a partir de la rutina y del reloj.
 *
 * Se construye en tiempo de ejecucion y no como fechas fijas para que el
 * home siempre muestre "hoy" y "proximo" con sentido. Los tests inyectan un
 * reloj fijo, asi que el resultado sigue siendo determinista.
 */
export function buildWorkoutSeed(routine: Routine, now: Date): WorkoutSession[] {
  const sessions: WorkoutSession[] = [];
  const currentWeekStart = startOfWeek(now);
  const todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  for (let week = -PAST_WEEKS; week <= 0; week++) {
    const weekStart = addDays(currentWeekStart, week * 7);

    for (const day of routine.days) {
      const date = addDays(weekStart, day.weekday - 1);
      const scheduled = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        SESSION_HOUR,
        0,
        0,
        0,
      );
      const dayTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

      // Las semanas pasadas quedan cerradas; el dia de hoy y lo que viene, abierto.
      // Una sesion del historial queda como omitida para que el grafico no sea perfecto.
      let status: WorkoutStatus = 'scheduled';
      if (dayTime < todayTime) {
        status = week === -1 && day.weekday === 5 ? 'skipped' : 'completed';
      }

      const index = sessions.length + 1;
      const completedAt =
        status === 'completed'
          ? toIsoDate(new Date(scheduled.getTime() + day.estimatedMinutes * 60_000))
          : null;

      sessions.push({
        id: `wks-${String(index).padStart(3, '0')}`,
        studentId: routine.studentId,
        routineId: routine.id,
        routineDayId: day.id,
        title: day.title,
        scheduledFor: toIsoDate(scheduled),
        startedAt: status === 'completed' ? toIsoDate(scheduled) : null,
        completedAt,
        status,
        durationMinutes: status === 'completed' ? day.estimatedMinutes : null,
        estimatedMinutes: day.estimatedMinutes,
        exercises: logsFor(day, status, completedAt),
      });
    }
  }

  return sessions;
}
