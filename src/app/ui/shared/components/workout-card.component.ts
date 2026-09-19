import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { LucideChevronRight } from '@lucide/angular';

import { clampPercent } from './chart/chart-math';

@Component({
  selector: 'nq-workout-card',
  standalone: true,
  imports: [LucideChevronRight],
  template: `
    <div class="card" [class.inactive]="!active">
      <div class="avatar" aria-hidden="true">{{ avatarInitials() }}</div>

      <div class="body">
        <span class="title">{{ title }}</span>
        <span class="metadata">{{ metadata }}</span>

        <div
          class="bar"
          role="progressbar"
          [attr.aria-label]="'Avance de ' + title"
          [attr.aria-valuenow]="percent()"
          [attr.aria-valuetext]="percent() + '%'"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div class="bar-fill" [style.width.%]="percent()"></div>
        </div>
      </div>

      <button
        class="action"
        type="button"
        [attr.aria-label]="'Ver ' + title"
        (click)="action.emit()"
      >
        <svg lucideChevronRight [size]="18" [strokeWidth]="2"></svg>
      </button>
    </div>
  `,
  styleUrl: './workout-card.component.scss',
})
export class WorkoutCardComponent {
  @Input({ required: true }) title = '';
  /** Linea secundaria: calorias, duracion, fecha. */
  @Input() metadata = '';
  /** Atenua la tarjeta cuando esta en falso, como en la referencia. */
  @Input() active = true;

  @Input() set progress(value: number) {
    this._progress.set(value);
  }

  /** Toque en el chevron de la tarjeta. */
  @Output() readonly action = new EventEmitter<void>();

  private readonly _progress = signal(0);

  /** Avance en porcentaje entero, recortado a 0-100. */
  readonly percent = computed(() => Math.round(clampPercent(this._progress() * 100)));

  /** Iniciales de las dos primeras palabras del titulo. */
  readonly avatarInitials = computed(() => {
    const words = this.title.trim().split(/\s+/).filter(Boolean);
    const first = words[0]?.charAt(0) ?? '';
    const second = words[1]?.charAt(0) ?? '';
    return `${first}${second}`.toUpperCase();
  });
}
