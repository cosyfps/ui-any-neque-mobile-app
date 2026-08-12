import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  LucideUsers,
  LucideClipboardList,
  LucideChevronRight,
  LucideTrendingUp,
} from '@lucide/angular';

import { PageStateComponent } from '../../../shared/components/page-state.component';

type ViewState = 'loading' | 'error' | 'empty' | 'success';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    LucideUsers,
    LucideClipboardList,
    LucideChevronRight,
    LucideTrendingUp,
    PageStateComponent,
  ],
  template: `
    @switch (state()) {
      @case ('loading') {
        <nq-page-state type="loading" />
      }
      @case ('error') {
        <nq-page-state type="error" [showRetry]="true" [retry]="loadData" />
      }
      @case ('empty') {
        <nq-page-state
          type="empty"
          title="Bienvenido a Ñeque"
          message="Agrega tu primer cliente para comenzar a crear rutinas."
        />
      }
      @case ('success') {
        <div class="page nq-scroll-pad">
          <!-- Greeting -->
          <header class="greeting nq-ani">
            <div>
              <p class="greeting-label">{{ greetingLabel }}</p>
              <h1 class="greeting-name">Kelvin</h1>
            </div>
            <div class="greeting-date">{{ today }}</div>
          </header>

          <!-- Metrics -->
          <div class="metrics nq-ani nq-d1">
            <div class="metric">
              <div class="metric-top">
                <div class="metric-icon">
                  <svg lucideUsers [size]="18" [strokeWidth]="1.6"></svg>
                </div>
                <svg class="metric-trend" lucideTrendingUp [size]="14" [strokeWidth]="2"></svg>
              </div>
              <span class="metric-value">&mdash;</span>
              <span class="metric-label">Clientes</span>
            </div>
            <div class="metric">
              <div class="metric-top">
                <div class="metric-icon">
                  <svg lucideClipboardList [size]="18" [strokeWidth]="1.6"></svg>
                </div>
              </div>
              <span class="metric-value">&mdash;</span>
              <span class="metric-label">Rutinas activas</span>
            </div>
          </div>

          <!-- Quick actions -->
          <section class="section nq-ani nq-d2">
            <div class="section-header">
              <h2 class="section-title">Acciones</h2>
            </div>
            <div class="actions">
              <button class="action-card" (click)="go('/trainer/clients')">
                <div class="action-icon">
                  <svg lucideUsers [size]="20" [strokeWidth]="1.6"></svg>
                </div>
                <div class="action-content">
                  <span class="action-title">Clientes</span>
                  <span class="action-desc">Gestionar clientes</span>
                </div>
                <svg
                  lucideChevronRight
                  [size]="18"
                  [strokeWidth]="1.5"
                  class="action-chevron"
                ></svg>
              </button>
              <button class="action-card" (click)="go('/trainer/routines')">
                <div class="action-icon">
                  <svg lucideClipboardList [size]="20" [strokeWidth]="1.6"></svg>
                </div>
                <div class="action-content">
                  <span class="action-title">Rutinas</span>
                  <span class="action-desc">Crear y asignar</span>
                </div>
                <svg
                  lucideChevronRight
                  [size]="18"
                  [strokeWidth]="1.5"
                  class="action-chevron"
                ></svg>
              </button>
            </div>
          </section>
        </div>
      }
    }
  `,
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage {
  readonly state = signal<ViewState>('success');

  readonly greetingLabel = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  readonly today = new Date().toLocaleDateString('es-CL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  constructor(private router: Router) {}

  go(path: string): void {
    this.router.navigate([path]);
  }

  loadData = (): void => {
    this.state.set('loading');
    // TODO: wire to service
  };
}
