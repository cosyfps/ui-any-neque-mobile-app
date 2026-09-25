import { Component, computed, input } from '@angular/core';

import { ChartBox, SeriesPoint, buildPolyline } from './chart-math';

const BOX: ChartBox = { width: 300, height: 140, padding: 14 };

/** Contador de instancias: dos degradados con el mismo id se pisan entre si. */
let instanceCount = 0;

@Component({
  selector: 'nq-line-chart',
  standalone: true,
  template: `
    <svg
      class="chart"
      [attr.viewBox]="viewBox"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      [attr.aria-label]="ariaLabel()"
    >
      <defs>
        <linearGradient [attr.id]="gradientId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--nq-primary)" stop-opacity="0.26" />
          <stop offset="100%" stop-color="var(--nq-primary)" stop-opacity="0" />
        </linearGradient>
      </defs>

      @if (polyline().area) {
        <path [attr.d]="polyline().area" [attr.fill]="gradientRef" />
      }
      @if (polyline().line) {
        <path
          [attr.d]="polyline().line"
          fill="none"
          stroke="var(--nq-primary-strong)"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      }

      @for (dot of polyline().dots; track dot.label + dot.x) {
        <circle
          [attr.cx]="dot.x"
          [attr.cy]="dot.y"
          r="3.5"
          fill="var(--nq-bg)"
          stroke="var(--nq-primary-strong)"
          stroke-width="2"
        />
      }
    </svg>

    <div class="labels">
      @for (dot of polyline().dots; track dot.label + dot.x) {
        <span class="label">{{ dot.label }}</span>
      }
    </div>
  `,
  styleUrl: './line-chart.component.scss',
})
export class LineChartComponent {
  readonly data = input.required<readonly SeriesPoint[]>();

  readonly ariaLabel = input('Gráfico de evolución');

  readonly viewBox = `0 0 ${BOX.width} ${BOX.height}`;
  readonly gradientId = `nq-line-gradient-${++instanceCount}`;
  readonly gradientRef = `url(#${this.gradientId})`;

  readonly polyline = computed(() => buildPolyline(this.data(), BOX));
}
