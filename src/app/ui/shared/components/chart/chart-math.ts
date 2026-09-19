/** Una barra ya posicionada dentro del viewBox. */
export interface ScaledBar {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly label: string;
  readonly value: number;
  readonly highlighted: boolean;
}

export interface BarInput {
  readonly label: string;
  readonly value: number;
  readonly highlighted: boolean;
}

export interface ChartBox {
  readonly width: number;
  readonly height: number;
  readonly padding: number;
}

/**
 * Reparte las barras a lo ancho del viewBox y las escala contra el maximo.
 *
 * Toda la matematica de los graficos vive aqui, no en los componentes: asi se
 * prueba sin renderizar SVG en jsdom.
 */
export function scaleBars(inputs: readonly BarInput[], box: ChartBox): ScaledBar[] {
  if (inputs.length === 0) {
    return [];
  }

  const usableWidth = box.width - box.padding * 2;
  const usableHeight = box.height - box.padding * 2;
  const slot = usableWidth / inputs.length;
  const barWidth = Math.max(4, slot * 0.52);
  const max = Math.max(...inputs.map(input => input.value), 1);

  const bars: ScaledBar[] = [];

  for (let index = 0; index < inputs.length; index++) {
    const input = inputs[index];
    if (input === undefined) {
      continue;
    }
    const ratio = Math.max(0, input.value) / max;
    const height = Math.max(ratio === 0 ? 2 : 4, usableHeight * ratio);

    bars.push({
      x: box.padding + slot * index + (slot - barWidth) / 2,
      y: box.padding + usableHeight - height,
      width: barWidth,
      height,
      label: input.label,
      value: input.value,
      highlighted: input.highlighted,
    });
  }

  return bars;
}

export interface SeriesPoint {
  readonly value: number;
  readonly label: string;
}

export interface Polyline {
  /** Atributo `d` de la linea. */
  readonly line: string;
  /** Atributo `d` del area bajo la linea. */
  readonly area: string;
  readonly dots: readonly { x: number; y: number; value: number; label: string }[];
  readonly min: number;
  readonly max: number;
}

/**
 * Convierte una serie en los paths de la linea y del area.
 *
 * Con un solo punto dibuja una linea horizontal para que el grafico no
 * quede vacio.
 */
export function buildPolyline(points: readonly SeriesPoint[], box: ChartBox): Polyline {
  if (points.length === 0) {
    return { line: '', area: '', dots: [], min: 0, max: 0 };
  }

  const values = points.map(point => point.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  // Un margen del 10% evita que la linea toque los bordes del viewBox.
  const span = rawMax - rawMin || Math.abs(rawMax) || 1;
  const min = rawMin - span * 0.1;
  const max = rawMax + span * 0.1;

  const usableWidth = box.width - box.padding * 2;
  const usableHeight = box.height - box.padding * 2;
  const step = points.length === 1 ? 0 : usableWidth / (points.length - 1);

  const dots: { x: number; y: number; value: number; label: string }[] = [];

  for (let index = 0; index < points.length; index++) {
    const point = points[index];
    if (point === undefined) {
      continue;
    }
    const ratio = (point.value - min) / (max - min);
    dots.push({
      x: points.length === 1 ? box.width / 2 : box.padding + step * index,
      y: box.padding + usableHeight - usableHeight * ratio,
      value: point.value,
      label: point.label,
    });
  }

  const line = dots
    .map((dot, index) => `${index === 0 ? 'M' : 'L'}${round(dot.x)},${round(dot.y)}`)
    .join(' ');

  const first = dots[0];
  const last = dots[dots.length - 1];
  const baseline = box.height - box.padding;
  const area =
    first === undefined || last === undefined
      ? ''
      : `${line} L${round(last.x)},${round(baseline)} L${round(first.x)},${round(baseline)} Z`;

  return { line, area, dots, min: rawMin, max: rawMax };
}

/** Recorta un porcentaje al rango 0-100. */
export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, value));
}

/** Longitud de la circunferencia de un anillo de radio dado. */
export function ringCircumference(radius: number): number {
  return 2 * Math.PI * radius;
}

/**
 * Offset del trazo para que el anillo muestre `progress` (entre 0 y 1).
 */
export function ringOffset(radius: number, progress: number): number {
  const circumference = ringCircumference(radius);
  const clamped = Math.min(1, Math.max(0, progress));
  return circumference * (1 - clamped);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
