import { Component, Input, computed, signal } from '@angular/core';

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
      [attr.aria-label]="ariaLabel"
    >
      <circle
        [attr.cx]="center"
        [attr.cy]="center"
        [attr.r]="radius"
        fill="none"
        stroke="var(--nq-surface-2)"
        [attr.stroke-width]="strokeWidth"
      />
      <circle
        [attr.cx]="center"
        [attr.cy]="center"
        [attr.r]="radius"
        fill="none"
        stroke="var(--nq-primary-strong)"
        [attr.stroke-width]="strokeWidth"
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
  @Input({ required: true }) set progress(value: number) {
    this._progress.set(value);
  }

  @Input() strokeWidth = 8;
  @Input() ariaLabel = 'Progreso';

  readonly viewBox = `0 0 ${SIZE} ${SIZE}`;
  readonly center = SIZE / 2;
  readonly radius = RADIUS;
  readonly circumference = ringCircumference(RADIUS);
  readonly rotation = `rotate(-90 ${SIZE / 2} ${SIZE / 2})`;

  private readonly _progress = signal(0);

  readonly offset = computed(() => ringOffset(RADIUS, this._progress()));
}
