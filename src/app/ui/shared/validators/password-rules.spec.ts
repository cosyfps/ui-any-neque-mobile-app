import { isPasswordValid, passwordRules } from './password-rules';

describe('password-rules', () => {
  describe('passwordRules()', () => {
    it('devuelve las cuatro reglas', () => {
      expect(passwordRules('')).toHaveLength(4);
    });

    it('con la contrasena vacia ninguna se cumple', () => {
      expect(passwordRules('').every(rule => !rule.met)).toBe(true);
    });

    it.each([
      ['abcdefgh', [true, false, false, false]],
      ['Abcdefgh', [true, true, false, false]],
      ['Abcdefg1', [true, true, true, false]],
      ['Abcdefg1!', [true, true, true, true]],
      ['Ab1!', [false, true, true, true]],
    ])('evalua %s regla por regla', (value, expected) => {
      expect(passwordRules(value).map(rule => rule.met)).toEqual(expected);
    });

    it('acepta cualquier caracter especial del set', () => {
      for (const char of ['!', '@', '#', '$', '%', '^', '&', '*', '-', '_', '+', '=', '?']) {
        expect(passwordRules(`Abcdefg1${char}`)[3]?.met).toBe(true);
      }
    });
  });

  describe('isPasswordValid()', () => {
    it('exige las cuatro reglas', () => {
      expect(isPasswordValid('Abcdefg1!')).toBe(true);
    });

    it('rechaza si falta una regla', () => {
      expect(isPasswordValid('Abcdefg1')).toBe(false);
    });

    it('rechaza la contrasena vacia', () => {
      expect(isPasswordValid('')).toBe(false);
    });
  });
});
