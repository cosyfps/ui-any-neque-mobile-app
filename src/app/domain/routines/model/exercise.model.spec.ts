import { Exercise, isPublicExercise, isVisibleToTrainer } from './exercise.model';

const base: Exercise = {
  id: 'exr-001',
  name: 'Sentadilla con barra',
  muscleGroup: 'legs',
  equipment: 'Barra',
  thumbnailUrl: null,
  instructions: ['Apoya la barra', 'Baja controlado'],
  ownerTrainerId: null,
};

describe('exercise model', () => {
  describe('isPublicExercise()', () => {
    it('sin dueno es del catalogo publico', () => {
      expect(isPublicExercise(base)).toBe(true);
    });

    it('con dueno es privado', () => {
      expect(isPublicExercise({ ...base, ownerTrainerId: 'trn-001' })).toBe(false);
    });
  });

  describe('isVisibleToTrainer()', () => {
    it('el catalogo publico lo ve cualquiera', () => {
      expect(isVisibleToTrainer(base, 'trn-009')).toBe(true);
    });

    it('el entrenador ve los suyos', () => {
      expect(isVisibleToTrainer({ ...base, ownerTrainerId: 'trn-001' }, 'trn-001')).toBe(true);
    });

    // Los ejercicios propios son privados: nadie mas los ve.
    it('no ve los de otro entrenador', () => {
      expect(isVisibleToTrainer({ ...base, ownerTrainerId: 'trn-002' }, 'trn-001')).toBe(false);
    });
  });
});
