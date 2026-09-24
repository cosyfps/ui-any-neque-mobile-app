import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PullToRefreshDirective } from './pull-to-refresh.directive';

/** Anfitrion minimo: la directiva necesita un ElementRef con ancestros. */
@Component({
  standalone: true,
  imports: [PullToRefreshDirective],
  template: `
    <div class="scroller">
      <div nqPullToRefresh [refreshing]="cargando" (refresh)="recargas = recargas + 1"></div>
    </div>
  `,
})
class AnfitrionComponent {
  cargando = false;
  recargas = 0;
}

/** `TouchEvent` no existe en jsdom: basta con lo que la directiva lee. */
function toque(x: number, y: number): TouchEvent {
  return { touches: [{ clientX: x, clientY: y }] } as unknown as TouchEvent;
}

describe('PullToRefreshDirective', () => {
  let fixture: ComponentFixture<AnfitrionComponent>;
  let anfitrion: AnfitrionComponent;
  let directiva: PullToRefreshDirective;
  let scroller: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    fixture = TestBed.createComponent(AnfitrionComponent);
    fixture.detectChanges();
    anfitrion = fixture.componentInstance;
    scroller = (fixture.nativeElement as HTMLElement).querySelector('.scroller') as HTMLElement;
    const anfitrionDirectiva = fixture.debugElement.query(
      elemento => elemento.injector.get(PullToRefreshDirective, null) !== null,
    );
    directiva = anfitrionDirectiva.injector.get(PullToRefreshDirective);
  });

  /** El ancestro desplaza y esta a `scrollTop`. */
  const conScroll = (alto: number, scrollTop: number): void => {
    Object.defineProperty(scroller, 'scrollHeight', { value: alto, configurable: true });
    Object.defineProperty(scroller, 'clientHeight', { value: 100, configurable: true });
    scroller.scrollTop = scrollTop;
  };

  describe('arrastre', () => {
    it('avanza la mitad de lo que baja el dedo', () => {
      directiva.alEmpezar(toque(0, 0));
      directiva.alMover(toque(0, 80));

      expect(directiva.arrastre()).toBe(40);
    });

    it('se detiene en el maximo', () => {
      directiva.alEmpezar(toque(0, 0));
      directiva.alMover(toque(0, 400));

      expect(directiva.arrastre()).toBe(96);
    });

    it('ignora el gesto hacia arriba', () => {
      directiva.alEmpezar(toque(0, 100));
      directiva.alMover(toque(0, 40));

      expect(directiva.arrastre()).toBe(0);
    });

    it('ignora el gesto diagonal', () => {
      directiva.alEmpezar(toque(0, 0));
      directiva.alMover(toque(90, 60));

      expect(directiva.arrastre()).toBe(0);
    });
  });

  describe('inicio del gesto', () => {
    it('no arranca si el contenido no esta arriba del todo', () => {
      conScroll(500, 120);

      directiva.alEmpezar(toque(0, 0));
      directiva.alMover(toque(0, 200));

      expect(directiva.arrastre()).toBe(0);
    });

    it('arranca cuando el contenido ya esta arriba', () => {
      conScroll(500, 0);

      directiva.alEmpezar(toque(0, 0));
      directiva.alMover(toque(0, 200));

      expect(directiva.arrastre()).toBeGreaterThan(0);
    });

    it('no arranca mientras ya esta recargando', () => {
      anfitrion.cargando = true;
      fixture.detectChanges();

      directiva.alEmpezar(toque(0, 0));
      directiva.alMover(toque(0, 200));

      expect(directiva.arrastre()).toBe(0);
    });
  });

  describe('al soltar', () => {
    it('recarga si supero el umbral', () => {
      directiva.alEmpezar(toque(0, 0));
      directiva.alMover(toque(0, 160));

      directiva.alSoltar();

      expect(anfitrion.recargas).toBe(1);
      expect(directiva.arrastre()).toBe(0);
    });

    it('no recarga si se quedo corto', () => {
      directiva.alEmpezar(toque(0, 0));
      directiva.alMover(toque(0, 40));

      directiva.alSoltar();

      expect(anfitrion.recargas).toBe(0);
    });

    it('cancelar descarta el gesto sin recargar', () => {
      directiva.alEmpezar(toque(0, 0));
      directiva.alMover(toque(0, 200));

      directiva.cancelar();

      expect(anfitrion.recargas).toBe(0);
      expect(directiva.arrastre()).toBe(0);
    });

    it('sin gesto previo no hace nada', () => {
      directiva.alMover(toque(0, 200));

      expect(directiva.arrastre()).toBe(0);
    });
  });
});
