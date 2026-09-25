import { Anamnesis, hasClinicalFlags, isAnamnesisUsable } from './anamnesis.model';

const base: Anamnesis = {
  id: 'anm-001',
  studentId: 'std-001',
  medicalHistory: null,
  previousInjuries: null,
  surgeries: null,
  medications: null,
  allergies: null,
  previousActivity: null,
  declaredGoal: 'Ganar masa muscular',
  weeklyAvailability: [1, 3, 5],
  emergencyContact: null,
  updatedAt: '2026-03-05T10:00:00.000Z',
};

describe('anamnesis model', () => {
  describe('isAnamnesisUsable()', () => {
    it('es usable con objetivo y disponibilidad', () => {
      expect(isAnamnesisUsable(base)).toBe(true);
    });

    it('no es usable sin registrar', () => {
      expect(isAnamnesisUsable(null)).toBe(false);
    });

    it('no es usable sin objetivo', () => {
      expect(isAnamnesisUsable({ ...base, declaredGoal: '' })).toBe(false);
    });

    it('no acepta un objetivo de solo espacios', () => {
      expect(isAnamnesisUsable({ ...base, declaredGoal: '   ' })).toBe(false);
    });

    it('no es usable sin dias disponibles', () => {
      expect(isAnamnesisUsable({ ...base, weeklyAvailability: [] })).toBe(false);
    });
  });

  describe('hasClinicalFlags()', () => {
    it('es falso cuando no hay antecedentes', () => {
      expect(hasClinicalFlags(base)).toBe(false);
    });

    it.each([
      ['medicalHistory', 'Hipertensión'],
      ['previousInjuries', 'Esguince'],
      ['surgeries', 'Menisco'],
      ['medications', 'Ibuprofeno'],
      ['allergies', 'Polen'],
    ])('es verdadero con %s', (campo, valor) => {
      expect(hasClinicalFlags({ ...base, [campo]: valor })).toBe(true);
    });

    it('ignora los campos de solo espacios', () => {
      expect(hasClinicalFlags({ ...base, allergies: '  ' })).toBe(false);
    });
  });
});
