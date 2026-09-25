import { DateRange } from './date-range';
import { IsoDateString } from './ids';

/** Dia de la semana en convencion ISO-8601: 1 = lunes, 7 = domingo. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const MS_PER_DAY = 86_400_000;

/** Serializa una fecha al formato ISO que usan los modelos de dominio. */
export function toIsoDate(date: Date): IsoDateString {
  return date.toISOString();
}

/** Parsea una fecha ISO. Devuelve null si el valor no es una fecha valida. */
export function parseIsoDate(value: IsoDateString): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Copia la fecha con la hora puesta en 00:00:00.000 local. */
export function startOfDay(date: Date): Date {
  const copy = new Date(date.getTime());
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Copia la fecha con la hora puesta en 23:59:59.999 local. */
export function endOfDay(date: Date): Date {
  const copy = new Date(date.getTime());
  copy.setHours(23, 59, 59, 999);
  return copy;
}

/** Devuelve el dia de la semana en convencion ISO (lunes = 1). */
export function isoWeekday(date: Date): Weekday {
  const day = date.getDay();
  return (day === 0 ? 7 : day) as Weekday;
}

/** Suma dias (acepta negativos) y devuelve una fecha nueva. */
export function addDays(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Suma meses (acepta negativos) y devuelve una fecha nueva. */
export function addMonths(date: Date, months: number): Date {
  const copy = new Date(date.getTime());
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

/** Lunes de la semana a la que pertenece la fecha, a las 00:00. */
export function startOfWeek(date: Date): Date {
  return startOfDay(addDays(date, -(isoWeekday(date) - 1)));
}

/** Domingo de la semana a la que pertenece la fecha, a las 23:59. */
export function endOfWeek(date: Date): Date {
  return endOfDay(addDays(startOfWeek(date), 6));
}

/** Primer dia del mes a las 00:00. */
export function startOfMonth(date: Date): Date {
  return startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
}

/** Ultimo dia del mes a las 23:59. */
export function endOfMonth(date: Date): Date {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

/** True si ambas fechas caen en el mismo dia calendario local. */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Dias calendario completos entre dos fechas (b - a). */
export function differenceInDays(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / MS_PER_DAY);
}

/** Rango que cubre la semana completa de la fecha dada. */
export function weekRange(date: Date): DateRange {
  return { from: toIsoDate(startOfWeek(date)), to: toIsoDate(endOfWeek(date)) };
}

/** Rango que cubre el mes completo de la fecha dada. */
export function monthRange(date: Date): DateRange {
  return { from: toIsoDate(startOfMonth(date)), to: toIsoDate(endOfMonth(date)) };
}

/** True si la fecha ISO cae dentro del rango (limites incluidos). */
export function isWithinRange(value: IsoDateString, range: DateRange): boolean {
  const date = parseIsoDate(value);
  const from = parseIsoDate(range.from);
  const to = parseIsoDate(range.to);
  if (date === null || from === null || to === null) {
    return false;
  }
  return date.getTime() >= from.getTime() && date.getTime() <= to.getTime();
}
