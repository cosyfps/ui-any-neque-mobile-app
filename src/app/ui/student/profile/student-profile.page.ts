import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  LucideBell,
  LucideCalendarDays,
  LucideChevronRight,
  LucideImage,
  LucideLogOut,
} from '@lucide/angular';

import { SessionFacade } from '@app/application/auth/session.facade';
import { NotificationsFacade } from '@app/application/notifications/notifications.facade';
import { StudentProfileFacade } from '@app/application/students/student-profile.facade';

import { PageStateComponent } from '@shared/components/page-state.component';
import { SheetTrapDirective } from '@shared/directives/sheet-trap.directive';

const DATE_FORMAT = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [
    PageStateComponent,
    SheetTrapDirective,
    LucideBell,
    LucideCalendarDays,
    LucideChevronRight,
    LucideImage,
    LucideLogOut,
  ],
  template: `
    <div class="page">
      <header class="head">
        <h1 class="nq-h2">Mi perfil</h1>
      </header>

      @switch (facade.viewState()) {
        @case ('loading') {
          <nq-page-state type="loading" />
        }
        @case ('error') {
          <nq-page-state type="error" [retry]="reload" />
        }
        @case ('empty') {
          <nq-page-state type="empty" title="Sin datos de perfil" />
        }
        @case ('success') {
          @if (facade.student.data(); as student) {
            <section class="identity nq-ani">
              <div class="nq-avatar lg">{{ facade.avatarInitials() }}</div>
              <div class="identity-text">
                <span class="identity-name">{{ facade.displayName() }}</span>
                <span class="identity-email">{{ student.email }}</span>
                @if (student.goal !== null) {
                  <span class="identity-goal">{{ student.goal }}</span>
                }
              </div>
            </section>

            <section class="stats nq-ani nq-d1">
              <div class="stat">
                <span class="stat-value">{{ facade.heightCm() ?? '—' }}</span>
                <span class="stat-label">cm</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ facade.weightKg() ?? '—' }}</span>
                <span class="stat-label">kg</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ facade.bmi()?.value ?? '—' }}</span>
                <span class="stat-label">IMC</span>
              </div>
            </section>

            <section class="nq-section nq-ani nq-d2">
              <div class="nq-section-header">
                <h2 class="nq-section-title">Cuenta</h2>
              </div>

              <div class="menu">
                <button class="nq-list-item" type="button" (click)="go('/student/schedule')">
                  <svg lucideCalendarDays [size]="19" [strokeWidth]="1.8"></svg>
                  <span class="menu-label">Mi agenda</span>
                  <svg lucideChevronRight [size]="18" [strokeWidth]="2"></svg>
                </button>

                <button class="nq-list-item" type="button" (click)="go('/student/notifications')">
                  <svg lucideBell [size]="19" [strokeWidth]="1.8"></svg>
                  <span class="menu-label">Notificaciones</span>
                  @if (notifications.hasUnread()) {
                    <span class="nq-badge nq-badge-primary">{{ notifications.unreadCount() }}</span>
                  }
                  <svg lucideChevronRight [size]="18" [strokeWidth]="2"></svg>
                </button>

                <button class="nq-list-item" type="button" (click)="go('/student/progress')">
                  <svg lucideImage [size]="19" [strokeWidth]="1.8"></svg>
                  <span class="menu-label">Fotos de progreso</span>
                  <svg lucideChevronRight [size]="18" [strokeWidth]="2"></svg>
                </button>
              </div>
            </section>

            <section class="nq-section nq-ani nq-d3">
              <div class="nq-section-header">
                <h2 class="nq-section-title">Mi entrenador</h2>
              </div>
              <div class="nq-card trainer-card">
                <span class="trainer-name">
                  {{ student.trainerName || 'Sin entrenador asignado' }}
                </span>
                <span class="trainer-since">
                  Entrenando contigo desde {{ formatDate(student.joinedAt) }}
                </span>
              </div>
            </section>

            <button class="nq-btn nq-btn-ghost logout" type="button" (click)="askSignOut()">
              <svg lucideLogOut [size]="18" [strokeWidth]="1.8"></svg>
              Cerrar sesión
            </button>
          }
        }
      }
    </div>

    <!-- El overlay vive siempre en el DOM y solo conmuta la clase open, que
         es como el design system lo anima: sin ella queda invisible. -->
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
        <p class="confirm-desc">Tendrás que ingresar de nuevo con tu correo y contraseña.</p>

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
  styleUrl: './student-profile.page.scss',
})
export class StudentProfilePage {
  readonly facade = inject(StudentProfileFacade);
  readonly notifications = inject(NotificationsFacade);

  private readonly session = inject(SessionFacade);
  private readonly router = inject(Router);

  readonly confirmingSignOut = signal(false);
  readonly signingOut = signal(false);

  readonly bmiLabel = computed(() => this.facade.bmi()?.value ?? null);

  readonly reload = (): void => this.facade.reload();

  constructor() {
    this.facade.load();
    this.notifications.load();
  }

  formatDate(iso: string): string {
    return DATE_FORMAT.format(new Date(iso));
  }

  go(path: string): void {
    this.router.navigate([path]);
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
    await this.session.signOut();
    this.signingOut.set(false);
    this.confirmingSignOut.set(false);
    await this.router.navigate(['/']);
  }
}
