import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideLogOut } from '@lucide/angular';

import { TrainerProfileFacade } from '@app/application/trainers/trainer-profile.facade';

import { PageStateComponent } from '@shared/components/page-state.component';
import { SheetTrapDirective } from '@shared/directives/sheet-trap.directive';

@Component({
  selector: 'app-trainer-profile',
  standalone: true,
  imports: [PageStateComponent, SheetTrapDirective, LucideLogOut],
  providers: [TrainerProfileFacade],
  template: `
    <div class="page">
      <header class="head">
        <h1 class="nq-h2">Perfil</h1>
      </header>

      @switch (facade.viewState()) {
        @case ('loading') {
          <nq-page-state type="loading" loadingLabel="Cargando tu perfil" />
        }
        @case ('error') {
          <nq-page-state type="error" message="No pudimos cargar tu perfil." [retry]="reload" />
        }
        @default {
          @if (facade.trainer.data(); as trainer) {
            <section class="identity">
              <span class="nq-avatar lg" aria-hidden="true">{{ facade.avatarInitials() }}</span>
              <div class="identity-body">
                <p class="name">{{ facade.displayName() }}</p>
                <p class="email">{{ trainer.email }}</p>
              </div>
            </section>

            <section class="nq-section">
              <div class="nq-section-header">
                <h2 class="nq-section-title">Cuenta</h2>
              </div>
              <dl class="data">
                <div class="data-row">
                  <dt>Alumnos activos</dt>
                  <dd>{{ facade.activeCount() }}</dd>
                </div>
                <div class="data-row">
                  <dt>Teléfono</dt>
                  <dd>{{ trainer.phone ?? 'Sin registrar' }}</dd>
                </div>
                <div class="data-row">
                  <dt>Desde</dt>
                  <dd>{{ desde(trainer.joinedAt) }}</dd>
                </div>
              </dl>
            </section>

            <section class="nq-section">
              <div class="nq-section-header">
                <h2 class="nq-section-title">Profesional</h2>
              </div>
              <dl class="data">
                <div class="data-row">
                  <dt>Especialidad</dt>
                  <dd>{{ trainer.specialty ?? 'Sin registrar' }}</dd>
                </div>
              </dl>

              @if (trainer.certifications.length > 0) {
                <ul class="certs" role="list">
                  @for (cert of trainer.certifications; track cert) {
                    <li class="cert">{{ cert }}</li>
                  }
                </ul>
              } @else {
                <p class="empty-text">Sin certificaciones registradas.</p>
              }

              @if (trainer.bio !== null) {
                <p class="bio">{{ trainer.bio }}</p>
              }
            </section>

            <section class="nq-section">
              <button class="nq-btn nq-btn-secondary signout" type="button" (click)="askSignOut()">
                <svg lucideLogOut [size]="18" [strokeWidth]="2"></svg>
                Cerrar sesión
              </button>
            </section>
          }
        }
      }
    </div>

    <!-- El overlay vive siempre en el DOM y solo conmuta la clase open: es
         como el design system lo anima, y cerrado no deja nada tabulable. -->
    <div class="nq-overlay" [class.open]="confirmingSignOut()" (click)="cancelSignOut()">
      <div
        class="nq-sheet confirm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signout-title"
        [nqSheetTrap]="confirmingSignOut()"
        (dismissed)="cancelSignOut()"
        (click)="$event.stopPropagation()"
      >
        <div class="nq-sheet-handle"></div>
        <h2 class="nq-sheet-title" id="signout-title">¿Cerrar sesión?</h2>
        <p class="empty-text">Tendrás que ingresar de nuevo con tu correo y contraseña.</p>

        <div class="confirm-actions">
          <button class="nq-btn nq-btn-secondary" type="button" (click)="cancelSignOut()">
            Cancelar
          </button>
          <button
            class="nq-btn nq-btn-primary"
            type="button"
            [disabled]="signingOut()"
            (click)="confirmSignOut()"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './trainer-profile.page.scss',
})
export class TrainerProfilePage {
  readonly facade = inject(TrainerProfileFacade);

  readonly confirmingSignOut = signal(false);
  /** Bloquea el doble toque: sin esto se dispara dos veces el cierre. */
  readonly signingOut = signal(false);

  readonly reload = (): void => this.facade.reload();

  private readonly router = inject(Router);

  constructor() {
    this.facade.load();
  }

  desde(iso: string): string {
    return new Date(iso).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  }

  askSignOut(): void {
    this.confirmingSignOut.set(true);
  }

  cancelSignOut(): void {
    this.confirmingSignOut.set(false);
  }

  async confirmSignOut(): Promise<void> {
    if (this.signingOut()) {
      return;
    }
    this.signingOut.set(true);
    try {
      await this.facade.signOut();
      await this.router.navigate(['/']);
    } finally {
      this.signingOut.set(false);
      this.confirmingSignOut.set(false);
    }
  }
}
