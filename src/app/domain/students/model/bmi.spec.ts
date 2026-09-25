import { BMI_CATEGORY_LABEL, calculateBmi } from './bmi';

describe('calculateBmi', () => {
  it('calcula el IMC con un decimal', () => {
    // 58.9 kg y 165 cm dan 21.6
    expect(calculateBmi(58.9, 165)?.value).toBe(21.6);
  });

  it.each([
    [45, 175, 'underweight'],
    [60, 165, 'normal'],
    [78, 165, 'overweight'],
    [95, 165, 'obese'],
  ])('clasifica %i kg y %i cm como %s', (weight, height, expected) => {
    expect(calculateBmi(weight, height)?.category).toBe(expected);
  });

  describe('cortes exactos de la OMS', () => {
    it('18.5 ya es peso normal', () => {
      expect(calculateBmi(18.5, 100)?.category).toBe('normal');
    });

    it('justo bajo 18.5 es bajo peso', () => {
      expect(calculateBmi(18.4, 100)?.category).toBe('underweight');
    });

    it('25 ya es sobrepeso', () => {
      expect(calculateBmi(25, 100)?.category).toBe('overweight');
    });

    it('30 ya es obesidad', () => {
      expect(calculateBmi(30, 100)?.category).toBe('obese');
    });
  });

  describe('datos invalidos', () => {
    it.each([
      ['peso cero', 0, 165],
      ['altura cero', 60, 0],
      ['peso negativo', -60, 165],
      ['altura negativa', 60, -165],
      ['peso no finito', Number.NaN, 165],
      ['altura no finita', 60, Number.POSITIVE_INFINITY],
    ])('devuelve null con %s', (_label, weight, height) => {
      expect(calculateBmi(weight, height)).toBeNull();
    });
  });

  it('cada categoria tiene etiqueta en espanol', () => {
    expect(Object.keys(BMI_CATEGORY_LABEL)).toEqual([
      'underweight',
      'normal',
      'overweight',
      'obese',
    ]);
    expect(BMI_CATEGORY_LABEL.normal).toBe('Peso normal');
  });
});
