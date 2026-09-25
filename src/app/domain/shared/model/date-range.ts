import { IsoDateString } from './ids';

/** Rango cerrado de fechas usado para filtrar consultas de los puertos. */
export interface DateRange {
  readonly from: IsoDateString;
  readonly to: IsoDateString;
}
