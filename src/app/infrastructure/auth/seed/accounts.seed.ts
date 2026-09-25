import { AuthUser } from '@app/domain/auth/model/auth-user.model';

/**
 * Cuenta semilla mas su contrasena, solo para el adapter mock.
 *
 * `password` es mutable porque el adapter la reemplaza al completar una
 * recuperacion. Es estado por instancia: cada adapter clona la semilla.
 */
export interface SeedAccount {
  password: string;
  readonly user: AuthUser;
}

/**
 * Cuentas de prueba mientras no existe el BFF.
 *
 * Ñeque es invitation-only: en produccion estas cuentas las crea el BFF o la
 * consola de administracion, nunca la app.
 */
export const SEED_ACCOUNTS: readonly SeedAccount[] = [
  {
    password: 'Entrenador1!',
    user: {
      id: 'usr-trainer-001',
      email: 'kelvin@neque.cl',
      role: 'trainer',
      displayName: 'Kelvin Moreno',
      avatarUrl: null,
      profileId: 'trn-001',
    },
  },
  {
    password: 'Alumno1234!',
    user: {
      id: 'usr-student-001',
      email: 'ana@neque.cl',
      role: 'student',
      displayName: 'Ana Rojas',
      avatarUrl: null,
      profileId: 'std-001',
    },
  },
];

/** Codigo OTP aceptado por el flujo simulado de recuperacion. */
export const SEED_OTP_CODE = '123456';
