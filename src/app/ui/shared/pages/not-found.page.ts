import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { LucideCompass } from '@lucide/angular';

import { SessionFacade } from '@app/application/auth/session.facade';
import { homeRouteForRole } from '@app/domain/auth/model/auth-user.model';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [IonContent, LucideCompass],
  template: `
    <ion-content [fullscreen]="true" [scrollY]="false">
      <div class="wrap">
        <div class="nq-state nq-ani">
          <div class="nq-state-icon">
            <svg lucideCompass [size]="24" [strokeWidth]="1.5"></svg>
          </div>
          <span class="nq-state-title">Esta página no existe</span>
          <span class="nq-state-desc">
            El enlace que seguiste no lleva a ninguna parte dentro de Ñeque.
          </span>
          <button class="nq-btn nq-btn-primary back-btn" type="button" (click)="goHome()">
            {{ ctaLabel() }}
          </button>
        </div>
      </div>
    </ion-content>
  `,
  // `ion-content` se posiciona contra un ancestro `.ion-page`. Con el
  // router-outlet de Angular nadie la agrega, asi que la pone el host.
  host: { class: 'ion-page' },
  styleUrl: './not-found.page.scss',
})
export class NotFoundPage {
  private readonly router = inject(Router);
  private readonly session = inject(SessionFacade);

  readonly ctaLabel = computed(() =>
    this.session.isAuthenticated() ? 'Volver al inicio' : 'Ir a ingresar',
  );

  constructor() {
    // La ruta comodin no tiene guard, asi que nadie mas rehidrata la sesion.
    this.session.restore();
  }

  goHome(): void {
    const role = this.session.role();
    this.router.navigate([role === null ? '/' : homeRouteForRole(role)]);
  }
}
