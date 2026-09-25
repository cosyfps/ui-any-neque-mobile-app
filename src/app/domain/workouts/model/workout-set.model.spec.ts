import { WorkoutSet, lastSet, setVolumeKg, totalVolumeKg } from './workout-set.model';

const serie = (setNumber: number, reps: number | null, weightKg: number | null): WorkoutSet => ({
  id: `wst-${setNumber}`,
  setNumber,
  reps,
  weightKg,
  completedAt: '2026-09-19T10:00:00.000Z',
});

describe('workout set model', () => {
  describe('setVolumeKg()', () => {
    it('multiplica repeticiones por peso', () => {
      expect(setVolumeKg(serie(1, 10, 40))).toBe(400);
    });

    it.each([
      ['sin repeticiones', serie(1, null, 40)],
      ['sin peso', serie(1, 10, null)],
    ])('devuelve null %s', (_caso, set) => {
      expect(setVolumeKg(set)).toBeNull();
    });
  });

  describe('totalVolumeKg()', () => {
    it('suma las series completas', () => {
      expect(totalVolumeKg([serie(1, 10, 40), serie(2, 8, 45)])).toBe(760);
    });

    // Una serie de peso corporal no resta ni rompe el total.
    it('ignora las series sin datos', () => {
      expect(totalVolumeKg([serie(1, 10, 40), serie(2, 12, null)])).toBe(400);
    });

    it('es cero sin series', () => {
      expect(totalVolumeKg([])).toBe(0);
    });
  });

  describe('lastSet()', () => {
    it('devuelve la de mayor numero sin importar el orden', () => {
      expect(lastSet([serie(3, 8, 45), serie(1, 10, 40)])?.setNumber).toBe(3);
    });

    it('devuelve null sin series', () => {
      expect(lastSet([])).toBeNull();
    });
  });
});
