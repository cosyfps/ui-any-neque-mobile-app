import {
  WORKOUT_STATUS_LABEL,
  WorkoutExerciseLog,
  WorkoutSession,
  sessionProgress,
  totalCompletedSets,
  totalTargetSets,
} from './workout-session.model';

const log = (overrides: Partial<WorkoutExerciseLog> = {}): WorkoutExerciseLog => ({
  routineExerciseId: 'rex-1',
  exerciseId: 'ex-1',
  name: 'Sentadilla',
  targetSets: 4,
  targetReps: 8,
  restSeconds: 90,
  weightKg: 40,
  completedSets: 0,
  done: false,
  sets: [],
  ...overrides,
});

const session = (exercises: WorkoutExerciseLog[]): WorkoutSession => ({
  id: 'wks-001',
  studentId: 'std-001',
  routineId: 'rtn-001',
  routineDayId: 'day-001',
  title: 'Tren inferior',
  scheduledFor: '2026-09-17T18:00:00.000Z',
  startedAt: null,
  completedAt: null,
  status: 'scheduled',
  durationMinutes: null,
  estimatedMinutes: 55,
  exercises,
});

describe('workout-session model', () => {
  describe('sessionProgress()', () => {
    it('devuelve cero sin ejercicios', () => {
      expect(sessionProgress(session([]))).toBe(0);
    });

    it('devuelve cero sin nada marcado', () => {
      expect(sessionProgress(session([log(), log()]))).toBe(0);
    });

    it('devuelve la mitad con uno de dos marcados', () => {
      expect(sessionProgress(session([log({ done: true }), log()]))).toBe(0.5);
    });

    it('devuelve uno con todo marcado', () => {
      expect(sessionProgress(session([log({ done: true }), log({ done: true })]))).toBe(1);
    });
  });

  describe('totalTargetSets()', () => {
    it('suma las series prescritas', () => {
      expect(totalTargetSets(session([log({ targetSets: 4 }), log({ targetSets: 3 })]))).toBe(7);
    });

    it('devuelve cero sin ejercicios', () => {
      expect(totalTargetSets(session([]))).toBe(0);
    });
  });

  describe('totalCompletedSets()', () => {
    it('suma las series hechas', () => {
      expect(
        totalCompletedSets(session([log({ completedSets: 4 }), log({ completedSets: 1 })])),
      ).toBe(5);
    });
  });

  it('cada estado tiene etiqueta en espanol', () => {
    expect(WORKOUT_STATUS_LABEL.completed).toBe('Completado');
    expect(Object.keys(WORKOUT_STATUS_LABEL)).toHaveLength(4);
  });
});
