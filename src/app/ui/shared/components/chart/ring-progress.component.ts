import { Component, computed, input } from '@angular/core';

import { ringCircumference, ringOffset } from './chart-math';

const SIZE = 120;
const RADIUS = 52;

@Component({
  selector: 'nq-ring-progress',
  standalone: true,
  template: `
    <svg
      class="ring"
      [attr.viewBox]="viewBox"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      [attr.aria-label]="ariaLabel()"
    >
      <circle
        [attr.cx]="center"
        [attr.cy]="center"
        [attr.r]="radius"
        fill="none"
        stroke="var(--nq-surface-2)"
        [attr.stroke-width]="strokeWidth()"
      />
      <circle
        [attr.cx]="center"
        [attr.cy]="center"
        [attr.r]="radius"
        fill="none"
        stroke="var(--nq-primary-strong)"
        [attr.stroke-width]="strokeWidth()"
        stroke-linecap="round"
        [attr.stroke-dasharray]="circumference"
        [attr.stroke-dashoffset]="offset()"
        [attr.transform]="rotation"
      />
    </svg>

    <div class="ring-center">
      <ng-content />
    </div>
  `,
  styleUrl: './ring-progress.component.scss',
})
export class RingProgressComponent {
  /** Avance entre 0 y 1. */
  readonly progress = input.required<number>();

  readonly strokeWidth = input(8);
  readonly ariaLabel = input('Progreso');

  readonly viewBox = `0 0 ${SIZE} ${SIZE}`;
  readonly center = SIZE / 2;
  readonly radius = RADIUS;
  readonly circumference = ringCircumference(RADIUS);
  readonly rotation = `rotate(-90 ${SIZE / 2} ${SIZE / 2})`;

  readonly offset = computed(() => ringOffset(RADIUS, this.progress()));
}
