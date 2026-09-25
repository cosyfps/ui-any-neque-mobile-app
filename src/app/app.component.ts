import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Shell de la app.
 *
 * Usa el `router-outlet` de Angular y no `ion-router-outlet` a proposito:
 * el outlet de Ionic mantiene una pila de paginas pensada para push/pop, y
 * con el tab bar propio de Ñeque termina apilando todas las pestanas
 * visitadas y mostrandolas a la vez. Las transiciones visuales las aportan
 * las animaciones `nq-ani` del design system.
 *
 * Tampoco hay `ion-app`: de Ionic solo se usaba el contenedor con scroll, y
 * cargar `@ionic/core` entero para eso costaba 158 kB del bundle inicial.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: ` <router-outlet /> `,
  styleUrl: './app.component.scss',
})
export class AppComponent {}
