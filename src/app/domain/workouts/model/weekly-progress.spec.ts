import { toIsoDate } from '@app/domain/shared/model/date';

import { weeklyProgress } from './weekly-progress';
import { WorkoutSession, WorkoutStatus } from './workout-session.model';

// Semana del lunes 14 al domingo 20 de septiembre de 2026.
const MONDAY = new Date(2026, 8, 14);
const THURSDAY = new Date(2026, 8, 17);

const sessionOn = (
  date: Date,
  status: WorkoutStatus,
  id = `s-${date.getDate()}`,
): WorkoutSession => ({
  id,
  studentId: 'std-001',
  routineId: 'rtn-001',
  routineDayId: 'day-001',
  title: 'Sesión',
  scheduledFor: toIsoDate(date),
  startedAt: null,
  completedAt: null,
  status,
  durationMinutes: null,
  estimatedMinutes: 50,
  exercises: [],
});

describe('weeklyProgress', () => {
  it('devuelve siete dias siempre', () => {
    expect(weeklyProgress([], MONDAY, THURSDAY).byDay).toHaveLength(7);
  });

  it('numera los dias de 1 a 7 empezando en lunes', () => {
    const result = weeklyProgress([], MONDAY, THURSDAY);
    expect(result.byDay.map(day => day.weekday)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('marca solo el dia de hoy', () => {
    const result = weeklyProgress([], MONDAY, THURSDAY);
    expect(result.byDay.filter(day => day.isToday)).toHaveLength(1);
    expect(result.byDay[3]?.isToday).toBe(true);
  });

  it('sin sesiones deja todo en cero', () => {
    const result = weeklyProgress([], MONDAY, THURSDAY);
    expect(result).toMatchObject({ completed: 0, planned: 0, percent: 0 });
  });

  it('cuenta completadas y planificadas', () => {
    const sessions = [
      sessionOn(new Date(2026, 8, 14), 'completed'),
      sessionOn(new Date(2026, 8, 15), 'completed'),
      sessionOn(new Date(2026, 8, 17), 'scheduled'),
      sessionOn(new Date(2026, 8, 18), 'skipped'),
    ];

    const result = weeklyProgress(sessions, MONDAY, THURSDAY);

    expect(result.completed).toBe(2);
    expect(result.planned).toBe(4);
    expect(result.percent).toBe(50);
  });

  it('asigna cada sesion a su dia', () => {
    const sessions = [sessionOn(new Date(2026, 8, 16), 'completed')];

    const result = weeklyProgress(sessions, MONDAY, THURSDAY);

    expect(result.byDay[2]?.completed).toBe(1);
    expect(result.byDay[2]?.planned).toBe(1);
    expect(result.byDay[0]?.planned).toBe(0);
  });

  it('ignora sesiones fuera de la semana', () => {
    const sessions = [
      sessionOn(new Date(2026, 8, 7), 'completed', 'fuera-antes'),
      sessionOn(new Date(2026, 8, 21), 'completed', 'fuera-despues'),
    ];

    expect(weeklyProgress(sessions, MONDAY, THURSDAY).planned).toBe(0);
  });

  it('ignora sesiones con fecha no parseable', () => {
    const roto = { ...sessionOn(MONDAY, 'completed'), scheduledFor: 'no-es-fecha' };

    expect(weeklyProgress([roto], MONDAY, THURSDAY).planned).toBe(0);
  });

  it('redondea el porcentaje al entero mas cercano', () => {
    const sessions = [
      sessionOn(new Date(2026, 8, 14), 'completed'),
      sessionOn(new Date(2026, 8, 15), 'scheduled'),
      sessionOn(new Date(2026, 8, 16), 'scheduled'),
    ];

    expect(weeklyProgress(sessions, MONDAY, THURSDAY).percent).toBe(33);
  });

  it('llega a 100 por ciento con todo completado', () => {
    const sessions = [
      sessionOn(new Date(2026, 8, 14), 'completed'),
      sessionOn(new Date(2026, 8, 15), 'completed'),
    ];

    expect(weeklyProgress(sessions, MONDAY, THURSDAY).percent).toBe(100);
  });
});
