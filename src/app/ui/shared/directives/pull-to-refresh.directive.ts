import { Directive, ElementRef, computed, inject, input, output, signal } from '@angular/core';

/** Arrastre necesario para que el gesto cuente como recarga. */
const UMBRAL_PX = 64;
/** Tope del arrastre: mas alla el dedo sigue bajando y el indicador no. */
const MAXIMO_PX = 96;
/** El gesto solo cuenta si el dedo baja mucho mas de lo que se desvia. */
const PROPORCION_VERTICAL = 1.5;

/**
 * Pull-to-refresh para las paginas del alumno.
 *
 * Existe porque esas paginas no tienen
 * `ion-refresher`. El scroll real lo hace `.layout-content` del shell, asi que
 * la directiva busca el ancestro que desplaza y solo arranca cuando ya esta
 * arriba del todo.
 *
 * No pinta nada por su cuenta: expone `--nq-pull` en el host y conmuta las
 * clases `nq-pulling` y `nq-refreshing`. El indicador lo dibuja
 * `_components.scss`, para que el CSS viva con el resto del design system.
 */
@Directive({
  selector: '[nqPullToRefresh]',
  standalone: true,
  host: {
    '[class.nq-pulling]': 'arrastre() > 0',
    '[class.nq-refreshing]': 'refreshing()',
    '[style.--nq-pull]': 'arrastre() + "px"',
    '(touchstart)': 'alEmpezar($event)',
    '(touchmove)': 'alMover($event)',
    '(touchend)': 'alSoltar()',
    '(touchcancel)': 'cancelar()',
  },
})
export class PullToRefreshDirective {
  /** Mientras sea verdadero el indicador sigue girando. */
  readonly refreshing = input(false);

  /** Se emite una vez cuando el arrastre supera el umbral. */
  readonly refresh = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly _arrastre = signal(0);
  private inicio: { x: number; y: number } | null = null;

  /** Desplazamiento actual del indicador, ya recortado. */
  readonly arrastre = computed(() => this._arrastre());

  alEmpezar(event: TouchEvent): void {
    const toque = event.touches[0];
    // Solo si el contenido ya esta arriba: si no, el dedo esta desplazando.
    if (toque === undefined || this.refreshing() || this.desplazamiento() > 0) {
      this.inicio = null;
      return;
    }
    this.inicio = { x: toque.clientX, y: toque.clientY };
  }

  alMover(event: TouchEvent): void {
    const inicio = this.inicio;
    const toque = event.touches[0];
    if (inicio === null || toque === undefined) {
      return;
    }

    const deltaY = toque.clientY - inicio.y;
    const deltaX = Math.abs(toque.clientX - inicio.x);

    // Un gesto diagonal o hacia arriba no es una recarga.
    if (deltaY <= 0 || deltaY < deltaX * PROPORCION_VERTICAL) {
      this._arrastre.set(0);
      return;
    }

    // Resistencia: el indicador avanza la mitad que el dedo.
    this._arrastre.set(Math.min(deltaY / 2, MAXIMO_PX));
  }

  alSoltar(): void {
    const supero = this._arrastre() >= UMBRAL_PX;
    this.inicio = null;
    this._arrastre.set(0);
    if (supero) {
      this.refresh.emit();
    }
  }

  cancelar(): void {
    this.inicio = null;
    this._arrastre.set(0);
  }

  /** `scrollTop` del ancestro que realmente desplaza. */
  private desplazamiento(): number {
    let elemento: HTMLElement | null = this.host.nativeElement;
    while (elemento !== null) {
      if (elemento.scrollHeight > elemento.clientHeight) {
        return elemento.scrollTop;
      }
      elemento = elemento.parentElement;
    }
    return 0;
  }
}
