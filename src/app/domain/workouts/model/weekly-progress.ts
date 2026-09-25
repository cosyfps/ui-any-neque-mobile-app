import { Weekday, addDays, isSameDay, parseIsoDate } from '@app/domain/shared/model/date';

import { WorkoutSession } from './workout-session.model';

/** Resumen de un dia dentro de la semana. */
export interface DayProgress {
  readonly weekday: Weekday;
  readonly date: Date;
  readonly planned: number;
  readonly completed: number;
  readonly isToday: boolean;
}

/** Resumen semanal que alimenta el grafico de barras del home. */
export interface WeeklyProgress {
  readonly completed: number;
  readonly planned: number;
  /** Porcentaje entero de adherencia, 0 cuando no hay nada planificado. */
  readonly percent: number;
  readonly byDay: readonly DayProgress[];
}

/**
 * Agrega las sesiones de una semana empezando en `weekStart` (lunes).
 *
 * Es una funcion pura de dominio: la usan tanto el home como la pantalla de
 * progreso, sin duplicar el calculo en dos facades.
 */
export function weeklyProgress(
  sessions: readonly WorkoutSession[],
  weekStart: Date,
  today: Date,
): WeeklyProgress {
  const byDay: DayProgress[] = [];
  let completed = 0;
  let planned = 0;

  for (let offset = 0; offset < 7; offset++) {
    const date = addDays(weekStart, offset);
    const ofDay = sessions.filter(session => {
      const scheduled = parseIsoDate(session.scheduledFor);
      return scheduled !== null && isSameDay(scheduled, date);
    });
    const doneCount = ofDay.filter(session => session.status === 'completed').length;

    completed += doneCount;
    planned += ofDay.length;

    byDay.push({
      weekday: (offset + 1) as Weekday,
      date,
      planned: ofDay.length,
      completed: doneCount,
      isToday: isSameDay(date, today),
    });
  }

  return {
    completed,
    planned,
    percent: planned === 0 ? 0 : Math.round((completed / planned) * 100),
    byDay,
  };
}
