import { Component, computed, inject, signal } from '@angular/core';
import {
  LucideCamera,
  LucideLoaderCircle,
  LucideTrash2,
  LucideTrendingDown,
  LucideTrendingUp,
} from '@lucide/angular';

import { ProgressFacade } from '@app/application/progress/progress.facade';
import { PhotoAngle, PHOTO_ANGLE_LABEL } from '@app/domain/progress/model/progress-photo.model';
import { CLOCK } from '@app/domain/shared/port/clock.port';

import { SeriesPoint } from '@shared/components/chart/chart-math';
import { LineChartComponent } from '@shared/components/chart/line-chart.component';
import { PageStateComponent } from '@shared/components/page-state.component';
import { PullToRefreshDirective } from '@shared/directives/pull-to-refresh.directive';
import { SheetTrapDirective } from '@shared/directives/sheet-trap.directive';

type ProgressTab = 'metrics' | 'photos';
type MetricSeries = 'weight' | 'bmi';

const ANGLES: readonly PhotoAngle[] = ['front', 'side', 'back'];

@Component({
  selector: 'app-student-progress',
  standalone: true,
  imports: [
    PageStateComponent,
    PullToRefreshDirective,
    SheetTrapDirective,
    LineChartComponent,
    LucideCamera,
    LucideLoaderCircle,
    LucideTrash2,
    LucideTrendingDown,
    LucideTrendingUp,
  ],
  template: `
    <div
      class="page"
      nqPullToRefresh
      [refreshing]="facade.assessments.loading()"
      (refresh)="reload()"
    >
      <header class="head">
        <h1 class="nq-h2">Mi progreso</h1>
      </header>

      <div class="nq-tabs">
        <button
          class="nq-tab"
          type="button"
          [class.active]="tab() === 'metrics'"
          (click)="tab.set('metrics')"
        >
          Mediciones
        </button>
        <button
          class="nq-tab"
          type="button"
          [class.active]="tab() === 'photos'"
          (click)="tab.set('photos')"
        >
          Fotos
        </button>
      </div>

      <!-- Cada pestana tiene su propio estado. Con un switch unico sobre las
           evaluaciones, un alumno al que el entrenador todavia no le registra
           ninguna veia "Sin evaluaciones" tambien en Fotos y no podia subir
           la primera. -->
      @if (tab() === 'metrics') {
        @switch (facade.viewState()) {
          @case ('loading') {
            <nq-page-state type="loading" />
          }
          @case ('error') {
            <nq-page-state type="error" [retry]="reload" />
          }
          @case ('empty') {
            <nq-page-state
              type="empty"
              title="Sin evaluaciones aún"
              message="Cuando tu entrenador registre tu primera evaluación, la verás acá."
            />
          }
          @case ('success') {
            <section class="metrics nq-ani">
              <div class="metric">
                <span class="metric-value">{{ weightLabel() }}</span>
                <span class="metric-label">Peso actual</span>
              </div>
              <div class="metric">
                <span class="metric-value">{{ facade.adherence() }}%</span>
                <span class="metric-label">Adherencia</span>
              </div>
              <div class="metric">
                <span class="metric-value">{{ facade.completedCount() }}</span>
                <span class="metric-label">Sesiones</span>
              </div>
            </section>

            @if (facade.weightDelta(); as delta) {
              <p class="delta nq-ani nq-d1" [class.down]="delta < 0">
                @if (delta < 0) {
                  <svg lucideTrendingDown [size]="15" [strokeWidth]="2"></svg>
                } @else {
                  <svg lucideTrendingUp [size]="15" [strokeWidth]="2"></svg>
                }
                {{ delta > 0 ? '+' : '' }}{{ delta }} kg desde tu primera evaluación
              </p>
            }

            <section class="nq-section nq-ani nq-d2">
              <div class="nq-section-header">
                <h2 class="nq-section-title">Evolución</h2>
                <div class="series-toggle">
                  <button
                    class="series-btn"
                    type="button"
                    [class.active]="series() === 'weight'"
                    (click)="series.set('weight')"
                  >
                    Peso
                  </button>
                  <button
                    class="series-btn"
                    type="button"
                    [class.active]="series() === 'bmi'"
                    (click)="series.set('bmi')"
                  >
                    IMC
                  </button>
                </div>
              </div>

              <div class="nq-card chart-card">
                <nq-line-chart [data]="activeSeries()" [ariaLabel]="seriesAria()" />
              </div>
            </section>

            <section class="nq-section nq-ani nq-d3">
              <div class="nq-section-header">
                <h2 class="nq-section-title">Historial</h2>
              </div>

              <ul class="history">
                @for (assessment of history(); track assessment.id) {
                  <li class="history-item">
                    <span class="history-date">{{ formatDate(assessment.takenAt) }}</span>
                    <span class="history-values">
                      {{ assessment.weightKg }} kg
                      @if (assessment.bodyFatPct !== null) {
                        · {{ assessment.bodyFatPct }}% grasa
                      }
                    </span>
                    @if (assessment.notes !== null) {
                      <span class="history-note">{{ assessment.notes }}</span>
                    }
                  </li>
                }
              </ul>
            </section>
          }
        }
      } @else {
        @switch (facade.photos.viewState()) {
          @case ('loading') {
            <nq-page-state type="loading" />
          }
          @case ('error') {
            <nq-page-state type="error" [retry]="reload" />
          }
          @default {
            <!-- Comparador antes / despues -->
            @if (facade.canCompare()) {
              <section class="nq-section nq-ani">
                <div class="nq-section-header">
                  <h2 class="nq-section-title">Comparación</h2>
                </div>

                @if (facade.compareA(); as before) {
                  @if (facade.compareB(); as after) {
                    <!-- Las dos fotos se superponen y el divisor recorta la de
                         arriba. Una al lado de otra no deja ver el cambio. -->
                    <figure
                      class="compare"
                      #comparador
                      (pointerdown)="alTomarDivisor($event, comparador)"
                      (pointermove)="alArrastrarDivisor($event, comparador)"
                      (pointerup)="alSoltarDivisor()"
                      (pointercancel)="alSoltarDivisor()"
                    >
                      <img class="compare-img" [src]="before.url" alt="Foto anterior" />
                      <img
                        class="compare-img compare-after"
                        [src]="after.url"
                        alt="Foto reciente"
                        [style.clip-path]="'inset(0 0 0 ' + divisor() + '%)'"
                      />

                      <span class="compare-date izquierda">{{ formatDate(before.takenAt) }}</span>
                      <span class="compare-date derecha">{{ formatDate(after.takenAt) }}</span>

                      <button
                        class="compare-handle"
                        type="button"
                        role="slider"
                        aria-label="Comparar fotos"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        [attr.aria-valuenow]="divisor()"
                        [attr.aria-valuetext]="divisorTexto()"
                        [style.left.%]="divisor()"
                        (keydown)="alTeclearDivisor($event)"
                      ></button>
                    </figure>
                  }
                }
              </section>
            }

            <section class="nq-section nq-ani nq-d1">
              <div class="nq-section-header">
                <h2 class="nq-section-title">Agregar foto</h2>
              </div>

              <div class="angle-row">
                @for (angle of angles; track angle) {
                  <button
                    class="angle-btn"
                    type="button"
                    [class.active]="selectedAngle() === angle"
                    (click)="selectedAngle.set(angle)"
                  >
                    {{ angleLabel(angle) }}
                  </button>
                }
              </div>

              <label class="upload" [class.busy]="uploading()">
                @if (uploading()) {
                  <svg
                    class="upload-spinner"
                    lucideLoaderCircle
                    [size]="18"
                    [strokeWidth]="2"
                  ></svg>
                  Subiendo…
                } @else {
                  <svg lucideCamera [size]="18" [strokeWidth]="1.8"></svg>
                  Tomar o elegir foto
                }
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  aria-label="Tomar o elegir foto de progreso"
                  [disabled]="uploading()"
                  (change)="onFile($event)"
                />
              </label>
              @if (uploadError()) {
                <p class="nq-field-error" role="alert">{{ uploadError() }}</p>
              }
            </section>

            @if (facade.photoGroups().length > 0) {
              @for (group of facade.photoGroups(); track group.takenAt) {
                <section class="nq-section nq-ani nq-d2">
                  <div class="nq-section-header">
                    <h2 class="nq-section-title">{{ group.label }}</h2>
                  </div>

                  <div class="gallery">
                    @for (photo of group.photos; track photo.id) {
                      <figure class="photo">
                        <img [src]="photo.url" [alt]="'Foto ' + angleLabel(photo.angle)" />
                        <figcaption>{{ angleLabel(photo.angle) }}</figcaption>
                        <button
                          class="photo-remove"
                          type="button"
                          [attr.aria-label]="'Eliminar foto ' + angleLabel(photo.angle)"
                          (click)="askRemove(photo.id)"
                        >
                          <svg lucideTrash2 [size]="14" [strokeWidth]="2"></svg>
                        </button>
                      </figure>
                    }
                  </div>
                </section>
              }
            } @else {
              <p class="section-empty">Aún no subes fotos de progreso.</p>
            }
          }
        }
      }
    </div>

    <!-- Borrar una foto no tiene vuelta atras: se confirma. El overlay vive
         siempre en el DOM y solo conmuta la clase open, que es como el design
         system lo anima. -->
    <div class="nq-overlay" [class.open]="pendingRemoval() !== null" (click)="cancelRemove()">
      <div
        class="nq-sheet confirm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-photo-title"
        [nqSheetTrap]="pendingRemoval() !== null"
        (dismissed)="cancelRemove()"
        (click)="$event.stopPropagation()"
      >
        <div class="nq-sheet-handle"></div>
        <h2 class="nq-sheet-title" id="remove-photo-title">¿Eliminar esta foto?</h2>
        <p class="confirm-desc">No se puede deshacer: tendrás que volver a subirla.</p>

        <div class="confirm-actions">
          <button class="nq-btn nq-btn-secondary" type="button" (click)="cancelRemove()">
            Cancelar
          </button>
          <button
            class="nq-btn nq-btn-primary"
            type="button"
            [disabled]="removing()"
            (click)="confirmRemove()"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './student-progress.page.scss',
})
export class StudentProgressPage {
  readonly facade = inject(ProgressFacade);

  private readonly clock = inject(CLOCK);

  readonly angles = ANGLES;
  readonly tab = signal<ProgressTab>('metrics');
  readonly series = signal<MetricSeries>('weight');
  readonly selectedAngle = signal<PhotoAngle>('front');
  /** Posicion del divisor del comparador, en porcentaje. */
  readonly divisor = signal(50);
  private arrastrandoDivisor = false;

  readonly uploading = signal(false);
  readonly uploadError = signal<string | null>(null);
  readonly pendingRemoval = signal<string | null>(null);
  readonly removing = signal(false);

  /** Sin evaluacion el valor es un guion, no un " kg" con el numero en blanco. */
  readonly weightLabel = computed(() => {
    const weight = this.facade.latest()?.weightKg;
    return weight === undefined ? '—' : `${weight} kg`;
  });

  readonly history = computed(() =>
    [...(this.facade.assessments.data() ?? [])].sort((a, b) => b.takenAt.localeCompare(a.takenAt)),
  );

  readonly activeSeries = computed((): readonly SeriesPoint[] => {
    const source =
      this.series() === 'weight' ? this.facade.weightSeries() : this.facade.bmiSeries();
    return source.map(point => ({ value: point.value, label: point.label }));
  });

  readonly seriesAria = computed(() =>
    this.series() === 'weight'
      ? 'Evolución del peso en kilos'
      : 'Evolución del índice de masa corporal',
  );

  readonly reload = (): void => this.facade.reload();

  constructor() {
    this.facade.load();
  }

  /** Texto que lee el lector de pantalla en vez de un porcentaje pelado. */
  divisorTexto(): string {
    return `${this.divisor()}% de la foto reciente a la vista`;
  }

  alTomarDivisor(event: PointerEvent, contenedor: HTMLElement): void {
    this.arrastrandoDivisor = true;
    this.moverDivisor(event, contenedor);
  }

  alArrastrarDivisor(event: PointerEvent, contenedor: HTMLElement): void {
    if (this.arrastrandoDivisor) {
      this.moverDivisor(event, contenedor);
    }
  }

  alSoltarDivisor(): void {
    this.arrastrandoDivisor = false;
  }

  /** Con teclado el divisor se mueve de a 5%, y a los extremos con Inicio y Fin. */
  alTeclearDivisor(event: KeyboardEvent): void {
    const salto: Record<string, number> = { ArrowLeft: -5, ArrowRight: 5 };
    const delta = salto[event.key];

    if (delta !== undefined) {
      event.preventDefault();
      this.divisor.update(valor => Math.min(100, Math.max(0, valor + delta)));
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      this.divisor.set(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.divisor.set(100);
    }
  }

  private moverDivisor(event: PointerEvent, contenedor: HTMLElement): void {
    const caja = contenedor.getBoundingClientRect();
    if (caja.width === 0) {
      return;
    }
    const porcentaje = ((event.clientX - caja.left) / caja.width) * 100;
    this.divisor.set(Math.round(Math.min(100, Math.max(0, porcentaje))));
  }

  angleLabel(angle: PhotoAngle): string {
    return PHOTO_ANGLE_LABEL[angle];
  }

  formatDate(iso: string): string {
    if (iso === '') {
      return '';
    }
    return new Intl.DateTimeFormat('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  }

  /** Lee el archivo como data-URL: el adapter mock guarda la imagen en memoria. */
  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file === undefined || this.uploading()) {
      return;
    }

    this.uploading.set(true);
    this.uploadError.set(null);

    const reader = new FileReader();
    reader.onerror = () => {
      this.uploading.set(false);
      this.uploadError.set('No pudimos leer la imagen. Intenta con otra.');
      input.value = '';
    };
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        this.uploading.set(false);
        this.uploadError.set('No pudimos leer la imagen. Intenta con otra.');
        input.value = '';
        return;
      }
      void this.facade.addPhoto(result, this.selectedAngle(), this.clock.now()).then(ok => {
        this.uploading.set(false);
        if (!ok) {
          this.uploadError.set('No pudimos guardar la foto. Intenta de nuevo.');
        }
        input.value = '';
      });
    };
    reader.readAsDataURL(file);
  }

  askRemove(photoId: string): void {
    this.pendingRemoval.set(photoId);
  }

  cancelRemove(): void {
    this.pendingRemoval.set(null);
  }

  async confirmRemove(): Promise<void> {
    const photoId = this.pendingRemoval();
    if (photoId === null || this.removing()) {
      return;
    }
    this.removing.set(true);
    await this.facade.removePhoto(photoId);
    this.removing.set(false);
    this.pendingRemoval.set(null);
  }
}
