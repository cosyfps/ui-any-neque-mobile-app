import {
  addDays,
  addMonths,
  differenceInDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  isoWeekday,
  isSameDay,
  isWithinRange,
  monthRange,
  parseIsoDate,
  startOfDay,
  startOfMonth,
  startOfWeek,
  toIsoDate,
  weekRange,
} from './date';

// Jueves 17 de septiembre de 2026, hora local.
const THURSDAY = new Date(2026, 8, 17, 14, 30, 45, 500);

describe('date helpers', () => {
  describe('toIsoDate / parseIsoDate', () => {
    it('hace round-trip de una fecha', () => {
      const parsed = parseIsoDate(toIsoDate(THURSDAY));
      expect(parsed?.getTime()).toBe(THURSDAY.getTime());
    });

    it('devuelve null ante un valor no parseable', () => {
      expect(parseIsoDate('no-es-fecha')).toBeNull();
    });
  });

  describe('startOfDay / endOfDay', () => {
    it('startOfDay pone la hora en 00:00:00.000', () => {
      const result = startOfDay(THURSDAY);
      expect([result.getHours(), result.getMinutes(), result.getSeconds()]).toEqual([0, 0, 0]);
      expect(result.getDate()).toBe(17);
    });

    it('endOfDay pone la hora en 23:59:59.999', () => {
      const result = endOfDay(THURSDAY);
      expect([result.getHours(), result.getMinutes(), result.getSeconds()]).toEqual([23, 59, 59]);
      expect(result.getMilliseconds()).toBe(999);
    });

    it('no muta la fecha original', () => {
      const original = THURSDAY.getTime();
      startOfDay(THURSDAY);
      endOfDay(THURSDAY);
      expect(THURSDAY.getTime()).toBe(original);
    });
  });

  describe('isoWeekday', () => {
    it.each([
      [new Date(2026, 8, 14), 1],
      [new Date(2026, 8, 17), 4],
      [new Date(2026, 8, 19), 6],
      [new Date(2026, 8, 20), 7],
    ])('mapea %s a %i', (date, expected) => {
      expect(isoWeekday(date)).toBe(expected);
    });
  });

  describe('addDays / addMonths', () => {
    it('suma dias cruzando el fin de mes', () => {
      expect(addDays(new Date(2026, 8, 30), 3).getDate()).toBe(3);
    });

    it('resta dias con valores negativos', () => {
      expect(addDays(new Date(2026, 8, 2), -3).getDate()).toBe(30);
    });

    it('suma meses', () => {
      expect(addMonths(new Date(2026, 8, 17), 2).getMonth()).toBe(10);
    });
  });

  describe('startOfWeek / endOfWeek', () => {
    it('la semana del jueves empieza el lunes 14', () => {
      expect(startOfWeek(THURSDAY).getDate()).toBe(14);
    });

    it('la semana del jueves termina el domingo 20', () => {
      expect(endOfWeek(THURSDAY).getDate()).toBe(20);
    });

    it('un domingo pertenece a la semana que empieza el lunes anterior', () => {
      expect(startOfWeek(new Date(2026, 8, 20)).getDate()).toBe(14);
    });

    it('un lunes es su propio inicio de semana', () => {
      expect(startOfWeek(new Date(2026, 8, 14)).getDate()).toBe(14);
    });
  });

  describe('startOfMonth / endOfMonth', () => {
    it('devuelve el primer dia del mes', () => {
      expect(startOfMonth(THURSDAY).getDate()).toBe(1);
    });

    it('devuelve el ultimo dia del mes', () => {
      expect(endOfMonth(THURSDAY).getDate()).toBe(30);
    });

    it('resuelve febrero de un ano bisiesto', () => {
      expect(endOfMonth(new Date(2028, 1, 10)).getDate()).toBe(29);
    });
  });

  describe('isSameDay', () => {
    it('true para la misma fecha con distinta hora', () => {
      expect(isSameDay(THURSDAY, new Date(2026, 8, 17, 1, 0))).toBe(true);
    });

    it('false para dias distintos', () => {
      expect(isSameDay(THURSDAY, new Date(2026, 8, 18))).toBe(false);
    });
  });

  describe('differenceInDays', () => {
    it('cuenta dias calendario completos', () => {
      expect(differenceInDays(new Date(2026, 8, 14), new Date(2026, 8, 17))).toBe(3);
    });

    it('devuelve negativo cuando la segunda fecha es anterior', () => {
      expect(differenceInDays(new Date(2026, 8, 17), new Date(2026, 8, 14))).toBe(-3);
    });

    it('ignora la hora del dia', () => {
      expect(differenceInDays(new Date(2026, 8, 17, 23, 0), new Date(2026, 8, 18, 1, 0))).toBe(1);
    });
  });

  describe('weekRange / monthRange', () => {
    it('weekRange cubre de lunes a domingo', () => {
      const range = weekRange(THURSDAY);
      expect(parseIsoDate(range.from)?.getDate()).toBe(14);
      expect(parseIsoDate(range.to)?.getDate()).toBe(20);
    });

    it('monthRange cubre el mes completo', () => {
      const range = monthRange(THURSDAY);
      expect(parseIsoDate(range.from)?.getDate()).toBe(1);
      expect(parseIsoDate(range.to)?.getDate()).toBe(30);
    });
  });

  describe('isWithinRange', () => {
    const range = weekRange(THURSDAY);

    it('true dentro del rango', () => {
      expect(isWithinRange(toIsoDate(new Date(2026, 8, 16)), range)).toBe(true);
    });

    it('false fuera del rango', () => {
      expect(isWithinRange(toIsoDate(new Date(2026, 8, 21)), range)).toBe(false);
    });

    it('false si la fecha no es parseable', () => {
      expect(isWithinRange('no-es-fecha', range)).toBe(false);
    });

    it('false si el rango no es parseable', () => {
      expect(isWithinRange(toIsoDate(THURSDAY), { from: 'x', to: 'y' })).toBe(false);
    });
  });
});
