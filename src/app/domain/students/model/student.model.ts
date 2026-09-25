import { Id, IsoDateString } from '@app/domain/shared/model/ids';

/**
 * Estado de la cuenta del alumno.
 *
 * El entrenador nunca elimina un alumno: lo suspende y lo reactiva,
 * conservando su ficha y todo su historial.
 */
export type StudentStatus = 'active' | 'suspended';

/**
 * Alumno. En la interfaz se dice "alumno"; el nombre tecnico historico del
 * repo es Client y se mantiene solo en `/trainer/clients`.
 */
export interface Student {
  readonly id: Id;
  readonly trainerId: Id;
  /**
   * Nombre del entrenador asignado, denormalizado.
   *
   * Es la forma que devuelve el BFF: la ficha del alumno viene con el nombre
   * resuelto para no obligar a la app a una segunda llamada solo para pintar
   * una linea. La feature completa de entrenadores llega en la Epica 9.
   */
  readonly trainerName: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string | null;
  readonly avatarUrl: string | null;
  readonly status: StudentStatus;
  readonly birthDate: IsoDateString | null;
  readonly heightCm: number | null;
  readonly goal: string | null;
  readonly joinedAt: IsoDateString;
}

/** Nombre completo listo para mostrar. */
export function fullName(student: Student): string {
  return `${student.firstName} ${student.lastName}`.trim();
}

/** Iniciales para el avatar cuando no hay foto. */
export function initials(student: Student): string {
  const first = student.firstName.charAt(0);
  const last = student.lastName.charAt(0);
  return `${first}${last}`.toUpperCase();
}
