import { addDays, isSameDay, startOfMonth, startOfWeek } from '@app/domain/shared/model/date';

/** Una celda de la grilla mensual del calendario. */
export interface MonthCell {
  readonly date: Date;
  readonly inMonth: boolean;
  readonly isToday: boolean;
}

/** Filas de la grilla: siempre 6 para que el calendario no cambie de alto. */
const WEEKS = 6;
const DAYS_PER_WEEK = 7;

/**
 * Construye la grilla 6x7 de un mes, empezando en lunes.
 *
 * Es pura y se testea sin renderizar nada; el componente solo la pinta.
 */
export function buildMonthGrid(year: number, month: number, today: Date): MonthCell[][] {
  const firstOfMonth = startOfMonth(new Date(year, month, 1));
  const gridStart = startOfWeek(firstOfMonth);

  const grid: MonthCell[][] = [];

  for (let week = 0; week < WEEKS; week++) {
    const row: MonthCell[] = [];
    for (let day = 0; day < DAYS_PER_WEEK; day++) {
      const date = addDays(gridStart, week * DAYS_PER_WEEK + day);
      row.push({
        date,
        inMonth: date.getMonth() === month && date.getFullYear() === year,
        isToday: isSameDay(date, today),
      });
    }
    grid.push(row);
  }

  return grid;
}
