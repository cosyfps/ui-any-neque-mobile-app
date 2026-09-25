/** Categorias de error que el dominio expone a la capa de aplicacion. */
export type DomainErrorCode =
  | 'not_found'
  | 'unauthorized'
  | 'invalid_credentials'
  | 'invalid_invitation'
  | 'conflict'
  | 'network'
  | 'unknown';

/**
 * Error de dominio. Los adapters traducen cualquier fallo de su tecnologia
 * (HTTP, storage, mock) a esta forma, de modo que la capa de aplicacion
 * nunca dependa del transporte.
 */
export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'DomainError';
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}

/** Mensajes por defecto en espanol, listos para mostrar en la interfaz. */
const DEFAULT_MESSAGES: Record<DomainErrorCode, string> = {
  not_found: 'No encontramos lo que buscabas.',
  unauthorized: 'Tu sesión expiró. Vuelve a ingresar.',
  invalid_credentials: 'Correo o contraseña incorrectos.',
  invalid_invitation: 'Esta invitación no es válida o ya fue utilizada.',
  conflict: 'Ya existe un registro con esos datos.',
  network: 'No pudimos conectarnos. Revisa tu conexión.',
  unknown: 'Algo salió mal. Intenta de nuevo.',
};

/** Construye un DomainError con el mensaje por defecto de su codigo. */
export function domainError(code: DomainErrorCode, message?: string): DomainError {
  return new DomainError(code, message ?? DEFAULT_MESSAGES[code]);
}

/** Normaliza cualquier valor capturado en un DomainError. */
export function toDomainError(cause: unknown): DomainError {
  if (cause instanceof DomainError) {
    return cause;
  }
  return domainError('unknown');
}
