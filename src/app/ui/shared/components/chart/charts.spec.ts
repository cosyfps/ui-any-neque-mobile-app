import { BarChartComponent } from './bar-chart.component';
import { BarInput, SeriesPoint } from './chart-math';
import { LineChartComponent } from './line-chart.component';
import { RingProgressComponent } from './ring-progress.component';

describe('BarChartComponent', () => {
  let chart: BarChartComponent;

  beforeEach(() => {
    chart = new BarChartComponent();
  });

  it('arranca sin barras', () => {
    expect(chart.bars()).toEqual([]);
  });

  it('escala las barras recibidas', () => {
    const data: BarInput[] = [
      { label: 'L', value: 1, highlighted: false },
      { label: 'M', value: 2, highlighted: true },
    ];
    chart.data = data;

    expect(chart.bars()).toHaveLength(2);
    expect(chart.bars()[1]?.highlighted).toBe(true);
  });

  it('expone un viewBox valido', () => {
    expect(chart.viewBox).toMatch(/^0 0 \d+ \d+$/);
  });

  it('tiene una etiqueta accesible por defecto', () => {
    expect(chart.ariaLabel.length).toBeGreaterThan(0);
  });

  it('reacciona a un cambio de datos', () => {
    chart.data = [{ label: 'L', value: 1, highlighted: false }];
    expect(chart.bars()).toHaveLength(1);

    chart.data = [];
    expect(chart.bars()).toEqual([]);
  });
});

describe('LineChartComponent', () => {
  let chart: LineChartComponent;

  beforeEach(() => {
    chart = new LineChartComponent();
  });

  it('arranca sin puntos', () => {
    expect(chart.polyline().dots).toEqual([]);
    expect(chart.polyline().line).toBe('');
  });

  it('construye la linea con los puntos recibidos', () => {
    const data: SeriesPoint[] = [
      { value: 61, label: 'mar' },
      { value: 59, label: 'sep' },
    ];
    chart.data = data;

    expect(chart.polyline().dots).toHaveLength(2);
    expect(chart.polyline().line.startsWith('M')).toBe(true);
  });

  // Dos graficos con el mismo id de degradado se pisan entre si.
  it('cada instancia usa un id de degradado distinto', () => {
    const otro = new LineChartComponent();

    expect(chart.gradientId).not.toBe(otro.gradientId);
  });

  it('la referencia al degradado apunta a su propio id', () => {
    expect(chart.gradientRef).toBe(`url(#${chart.gradientId})`);
  });

  it('expone un viewBox valido', () => {
    expect(chart.viewBox).toMatch(/^0 0 \d+ \d+$/);
  });
});

describe('RingProgressComponent', () => {
  let ring: RingProgressComponent;

  beforeEach(() => {
    ring = new RingProgressComponent();
  });

  it('sin progreso el offset es la circunferencia completa', () => {
    ring.progress = 0;
    expect(ring.offset()).toBeCloseTo(ring.circumference);
  });

  it('con progreso completo el offset es cero', () => {
    ring.progress = 1;
    expect(ring.offset()).toBeCloseTo(0);
  });

  it('a la mitad el offset es la mitad', () => {
    ring.progress = 0.5;
    expect(ring.offset()).toBeCloseTo(ring.circumference / 2);
  });

  it('recorta valores fuera de rango', () => {
    ring.progress = 3;
    expect(ring.offset()).toBeCloseTo(0);
  });

  it('gira el anillo para que empiece arriba', () => {
    expect(ring.rotation).toContain('rotate(-90');
  });

  it('el centro es la mitad del viewBox', () => {
    expect(ring.viewBox).toBe(`0 0 ${ring.center * 2} ${ring.center * 2}`);
  });
});
