import { DomainError, domainError, toDomainError } from './app-error';

describe('DomainError', () => {
  it('conserva codigo y mensaje', () => {
    const error = new DomainError('not_found', 'no existe');
    expect(error.code).toBe('not_found');
    expect(error.message).toBe('no existe');
    expect(error.name).toBe('DomainError');
  });

  it('sigue siendo instanceof tras extender Error', () => {
    const error = new DomainError('network', 'sin red');
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
  });

  describe('domainError()', () => {
    it('usa el mensaje por defecto del codigo', () => {
      expect(domainError('invalid_credentials').message).toBe('Correo o contraseña incorrectos.');
    });

    it('permite sobrescribir el mensaje', () => {
      expect(domainError('unknown', 'detalle propio').message).toBe('detalle propio');
    });
  });

  describe('toDomainError()', () => {
    it('devuelve el mismo error si ya es de dominio', () => {
      const original = domainError('conflict');
      expect(toDomainError(original)).toBe(original);
    });

    it('envuelve cualquier otro valor como unknown', () => {
      const wrapped = toDomainError(new Error('fallo de red'));
      expect(wrapped.code).toBe('unknown');
    });

    it('envuelve valores que no son Error', () => {
      expect(toDomainError('texto suelto').code).toBe('unknown');
    });
  });
});
