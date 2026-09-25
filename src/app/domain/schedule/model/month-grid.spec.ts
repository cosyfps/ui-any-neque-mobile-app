import { buildMonthGrid } from './month-grid';

const TODAY = new Date(2026, 8, 17);

describe('buildMonthGrid', () => {
  // Septiembre de 2026: el 1 cae martes y el mes tiene 30 dias.
  const grid = buildMonthGrid(2026, 8, TODAY);

  it('devuelve seis semanas', () => {
    expect(grid).toHaveLength(6);
  });

  it('cada semana tiene siete dias', () => {
    for (const week of grid) {
      expect(week).toHaveLength(7);
    }
  });

  it('empieza en lunes', () => {
    expect(grid[0]?.[0]?.date.getDay()).toBe(1);
  });

  it('la primera celda es del mes anterior cuando el 1 no cae lunes', () => {
    expect(grid[0]?.[0]?.inMonth).toBe(false);
    expect(grid[0]?.[0]?.date.getDate()).toBe(31);
  });

  it('marca como del mes los dias que corresponden', () => {
    const inMonth = grid.flat().filter(cell => cell.inMonth);
    expect(inMonth).toHaveLength(30);
  });

  it('marca exactamente un dia como hoy', () => {
    expect(grid.flat().filter(cell => cell.isToday)).toHaveLength(1);
  });

  it('el dia marcado como hoy es el correcto', () => {
    expect(
      grid
        .flat()
        .find(cell => cell.isToday)
        ?.date.getDate(),
    ).toBe(17);
  });

  it('no marca ningun dia como hoy en otro mes', () => {
    const other = buildMonthGrid(2026, 0, TODAY);
    expect(other.flat().filter(cell => cell.isToday)).toHaveLength(0);
  });

  it('las celdas son consecutivas', () => {
    const flat = grid.flat();
    for (let index = 1; index < flat.length; index++) {
      const previous = flat[index - 1];
      const current = flat[index];
      if (previous === undefined || current === undefined) {
        continue;
      }
      const diffDays = Math.round((current.date.getTime() - previous.date.getTime()) / 86_400_000);
      expect(diffDays).toBe(1);
    }
  });

  it('resuelve febrero de un ano bisiesto', () => {
    const february = buildMonthGrid(2028, 1, TODAY);
    expect(february.flat().filter(cell => cell.inMonth)).toHaveLength(29);
  });
});
