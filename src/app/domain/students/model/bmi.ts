/** Categoria de IMC segun los cortes de la OMS. */
export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export interface BmiResult {
  /** Valor con un decimal. */
  readonly value: number;
  readonly category: BmiCategory;
}

/** Etiquetas en espanol para mostrar junto al valor. */
export const BMI_CATEGORY_LABEL: Record<BmiCategory, string> = {
  underweight: 'Bajo peso',
  normal: 'Peso normal',
  overweight: 'Sobrepeso',
  obese: 'Obesidad',
};

/** Cortes de la OMS. */
function categorize(value: number): BmiCategory {
  if (value < 18.5) return 'underweight';
  if (value < 25) return 'normal';
  if (value < 30) return 'overweight';
  return 'obese';
}

/**
 * Indice de masa corporal: peso en kilos dividido por la altura en metros
 * al cuadrado. Devuelve null si los datos no permiten calcularlo.
 */
export function calculateBmi(weightKg: number, heightCm: number): BmiResult | null {
  if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm)) {
    return null;
  }
  if (weightKg <= 0 || heightCm <= 0) {
    return null;
  }

  const heightM = heightCm / 100;
  const value = Math.round((weightKg / (heightM * heightM)) * 10) / 10;

  return { value, category: categorize(value) };
}
