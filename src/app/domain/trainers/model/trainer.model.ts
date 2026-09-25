import { Id, IsoDateString } from '@app/domain/shared/model/ids';

/**
 * Entrenador.
 *
 * No existia como modelo: hasta ahora solo se le conocia por
 * `Student.trainerId` y por el nombre denormalizado que trae la ficha. La
 * Epica 9 necesita su perfil de verdad.
 */
export interface Trainer {
  readonly id: Id;
  readonly userId: Id;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string | null;
  readonly avatarUrl: string | null;
  readonly specialty: string | null;
  readonly certifications: readonly string[];
  readonly bio: string | null;
  readonly joinedAt: IsoDateString;
}

/** Nombre completo listo para mostrar. */
export function trainerFullName(trainer: Trainer): string {
  return `${trainer.firstName} ${trainer.lastName}`.trim();
}

/** Iniciales para el avatar cuando no hay foto. */
export function trainerInitials(trainer: Trainer): string {
  const first = trainer.firstName.charAt(0);
  const last = trainer.lastName.charAt(0);
  return `${first}${last}`.toUpperCase();
}
