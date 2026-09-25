import { Routine, RoutineDay, dayForWeekday, totalSets } from './routine.model';

const day = (weekday: 1 | 2 | 4, sets: number[]): RoutineDay => ({
  id: `day-${weekday}`,
  weekday,
  title: 'Sesión',
  focus: 'legs',
  estimatedMinutes: 50,
  exercises: sets.map((count, index) => ({
    id: `rex-${weekday}-${index}`,
    exerciseId: 'ex-1',
    name: 'Ejercicio',
    order: index + 1,
    sets: count,
    reps: 10,
    restSeconds: 60,
    weightKg: null,
    notes: null,
  })),
});

const routine: Routine = {
  id: 'rtn-001',
  studentId: 'std-001',
  trainerId: 'trn-001',
  name: 'Hipertrofia',
  goal: 'Masa muscular',
  startDate: '2026-09-01T00:00:00.000Z',
  endDate: null,
  status: 'active',
  days: [day(1, [4, 3, 3]), day(2, [4, 4]), day(4, [3])],
};

describe('routine model', () => {
  describe('totalSets()', () => {
    it('suma las series del dia', () => {
      expect(totalSets(day(1, [4, 3, 3]))).toBe(10);
    });

    it('devuelve cero sin ejercicios', () => {
      expect(totalSets(day(1, []))).toBe(0);
    });
  });

  describe('dayForWeekday()', () => {
    it('encuentra el dia programado', () => {
      expect(dayForWeekday(routine, 2)?.id).toBe('day-2');
    });

    it('devuelve null en un dia sin entrenamiento', () => {
      expect(dayForWeekday(routine, 3)).toBeNull();
    });

    it('devuelve null en una rutina sin dias', () => {
      expect(dayForWeekday({ ...routine, days: [] }, 1)).toBeNull();
    });
  });
});
