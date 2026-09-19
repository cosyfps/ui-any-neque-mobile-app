import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IonApp } from '@ionic/angular/standalone';

/**
 * Shell de la app.
 *
 * Usa el `router-outlet` de Angular y no `ion-router-outlet` a proposito:
 * el outlet de Ionic mantiene una pila de paginas pensada para push/pop, y
 * con el tab bar propio de Ñeque termina apilando todas las pestanas
 * visitadas y mostrandolas a la vez. Las transiciones visuales las aportan
 * las animaciones `nq-ani` del design system.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, RouterOutlet],
  template: `
    <ion-app>
      <router-outlet />
    </ion-app>
  `,
  styleUrl: './app.component.scss',
})
export class AppComponent {}
