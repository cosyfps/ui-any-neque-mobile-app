import {
  DestroyRef,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';

/** Lo que el navegador considera enfocable dentro del sheet. */
const FOCUSABLE = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Convierte un `.nq-sheet` en un dialogo modal usable con teclado.
 *
 * Hace tres cosas que el CSS solo no puede: lleva el foco dentro al abrir,
 * lo mantiene dentro mientras esta abierto y cierra con `Escape`. Sin lo
 * primero, `Escape` nunca llega porque el foco sigue en la pagina de atras.
 *
 * El sheet cerrado ya queda fuera del orden de tabulacion por el
 * `visibility: hidden` de `.nq-overlay`, asi que aqui no hace falta `inert`.
 */
@Directive({
  selector: '[nqSheetTrap]',
  standalone: true,
  host: {
    '(keydown)': 'onKeydown($event)',
  },
})
export class SheetTrapDirective {
  /** Avisa que el usuario pidio cerrar con `Escape`. */
  @Output() readonly dismissed = new EventEmitter<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private focusTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearFocusTimer());
  }

  @Input({ required: true })
  set nqSheetTrap(open: boolean) {
    this.clearFocusTimer();
    if (!open) {
      return;
    }
    // `setTimeout` y no un microtask: el foco no entra en un elemento que
    // todavia esta en `visibility: hidden`, y la clase `.open` se aplica al
    // pintar, despues de este setter.
    this.focusTimer = setTimeout(() => this.focusables()[0]?.focus(), 0);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.dismissed.emit();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const items = this.focusables();
    const first = items[0];
    const last = items[items.length - 1];
    if (first === undefined || last === undefined) {
      return;
    }

    const active = document.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusables(): HTMLElement[] {
    return Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE));
  }

  private clearFocusTimer(): void {
    if (this.focusTimer !== null) {
      clearTimeout(this.focusTimer);
      this.focusTimer = null;
    }
  }
}
