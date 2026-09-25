import { Component, Input, computed, signal } from '@angular/core';

import { BarInput, ChartBox, scaleBars } from './chart-math';

const BOX: ChartBox = { width: 280, height: 110, padding: 8 };

@Component({
  selector: 'nq-bar-chart',
  standalone: true,
  template: `
    <!-- Se rastrea por indice y no por etiqueta: las de la semana son
         L, M, M, J, V, S, D y martes y miercoles comparten la M. Angular
         exige claves unicas en el track. -->
    <svg
      class="chart"
      [attr.viewBox]="viewBox"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      [attr.aria-label]="ariaLabel"
    >
      @for (bar of bars(); track $index) {
        <rect
          [attr.x]="bar.x"
          [attr.y]="bar.y"
          [attr.width]="bar.width"
          [attr.height]="bar.height"
          rx="4"
          [attr.fill]="
            bar.highlighted ? 'var(--nq-primary-strong)' : 'rgba(var(--nq-primary-rgb),0.18)'
          "
        />
      }
    </svg>

    <div class="labels">
      @for (bar of bars(); track $index) {
        <span class="label" [class.highlighted]="bar.highlighted">{{ bar.label }}</span>
      }
    </div>
  `,
  styleUrl: './bar-chart.component.scss',
})
export class BarChartComponent {
  @Input({ required: true }) set data(value: readonly BarInput[]) {
    this._data.set(value);
  }

  /** Resumen en texto para lectores de pantalla. */
  @Input() ariaLabel = 'Gráfico de barras';

  readonly viewBox = `0 0 ${BOX.width} ${BOX.height}`;

  private readonly _data = signal<readonly BarInput[]>([]);

  readonly bars = computed(() => scaleBars(this._data(), BOX));
}
