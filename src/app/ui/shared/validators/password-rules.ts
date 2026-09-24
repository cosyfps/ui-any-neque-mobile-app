/** Una regla de contrasena con su etiqueta visible y si se cumple. */
export interface PasswordRule {
  readonly label: string;
  readonly met: boolean;
}

const SPECIAL_CHARS = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/~`]/;

/**
 * Las cuatro reglas de contrasena de Ñeque.
 *
 * Vive aqui y no dentro de una pagina porque la usan tanto el login como
 * la pantalla de invitacion donde el alumno define su contrasena.
 */
export function passwordRules(value: string): PasswordRule[] {
  return [
    { label: '8+ caracteres', met: value.length >= 8 },
    { label: 'Una mayúscula', met: /[A-Z]/.test(value) },
    { label: 'Un número', met: /\d/.test(value) },
    { label: 'Un símbolo', met: SPECIAL_CHARS.test(value) },
  ];
}

/** True cuando la contrasena cumple las cuatro reglas. */
export function isPasswordValid(value: string): boolean {
  return passwordRules(value).every(rule => rule.met);
}
