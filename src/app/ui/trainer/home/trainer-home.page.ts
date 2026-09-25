import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LucideChevronRight, LucideDumbbell, LucideUserPlus } from '@lucide/angular';

import { TrainerHomeFacade } from '@app/application/trainers/trainer-home.facade';

import { PageStateComponent } from '@shared/components/page-state.component';
import { PullToRefreshDirective } from '@shared/directives/pull-to-refresh.directive';

@Component({
  selector: 'app-trainer-home',
  standalone: true,
  imports: [
    PageStateComponent,
    PullToRefreshDirective,
    LucideUserPlus,
    LucideDumbbell,
    LucideChevronRight,
  ],
  providers: [TrainerHomeFacade],
  template: `
    <div class="page" nqPullToRefresh [refreshing]="facade.cartera.loading()" (refresh)="reload()">
      <header class="head">
        <h1 class="nq-h2">Inicio</h1>
        <p class="greeting">{{ facade.greeting() }}, {{ facade.trainerFirstName() }}</p>
      </header>

      @switch (facade.viewState()) {
        @case ('loading') {
          <nq-page-state type="loading" loadingLabel="Cargando tu día" />
        }
        @case ('error') {
          <nq-page-state type="error" message="No pudimos cargar tu día." [retry]="reload" />
        }
        @default {
          <div class="metrics">
            <div class="metric">
              <span class="metric-value">{{ facade.activeCount() }}</span>
              <span class="metric-label">Alumnos activos</span>
            </div>
            <div class="metric">
              <span class="metric-value">{{ facade.todayCount() }}</span>
              <span class="metric-label">Sesiones hoy</span>
            </div>
          </div>

          <section class="nq-section">
            <div class="nq-section-header">
              <h2 class="nq-section-title">Hoy</h2>
            </div>
            @if (facade.today.data(); as sesiones) {
              @if (sesiones.length > 0) {
                <ul class="list" role="list">
                  @for (sesion of sesiones; track sesion.id) {
                    <li>
                      <button
                        class="nq-list-item item"
                        type="button"
                        (click)="openStudent(sesion.studentId)"
                      >
                        <span class="item-body">
                          <span class="item-name">{{ sesion.studentName }}</span>
                          <span class="item-sub"
                            >{{ sesion.title }} · {{ hora(sesion.scheduledFor) }}</span
                          >
                        </span>
                        <svg lucideChevronRight [size]="18" [strokeWidth]="2"></svg>
                      </button>
                    </li>
                  }
                </ul>
              } @else {
                <p class="empty-text">Nadie entrena hoy. Buen momento para planificar.</p>
              }
            }
          </section>

          <section class="nq-section">
            <div class="nq-section-header">
              <h2 class="nq-section-title">Por resolver</h2>
            </div>
            @if (facade.pending.data(); as pendientes) {
              @if (pendientes.length > 0) {
                <ul class="list" role="list">
                  @for (alumno of pendientes; track alumno.id) {
                    <li>
                      <button
                        class="nq-list-item item"
                        type="button"
                        (click)="openStudent(alumno.id)"
                      >
                        <span class="item-body">
                          <span class="item-name">{{ alumno.name }}</span>
                          <span class="item-sub">{{ alumno.reason }}</span>
                        </span>
                        <svg lucideChevronRight [size]="18" [strokeWidth]="2"></svg>
                      </button>
                    </li>
                  }
                </ul>
              } @else {
                <p class="empty-text">Todos tus alumnos están al día.</p>
              }
            }
          </section>

          <section class="nq-section">
            <div class="nq-section-header">
              <h2 class="nq-section-title">Atajos</h2>
            </div>
            <div class="shortcuts">
              <button class="shortcut" type="button" (click)="goToStudents()">
                <svg lucideUserPlus [size]="20" [strokeWidth]="1.8"></svg>
                Registrar alumno
              </button>
              <button class="shortcut" type="button" (click)="goToRoutines()">
                <svg lucideDumbbell [size]="20" [strokeWidth]="1.8"></svg>
                Crear rutina
              </button>
            </div>
          </section>
        }
      }
    </div>
  `,
  styleUrl: './trainer-home.page.scss',
})
export class TrainerHomePage {
  readonly facade = inject(TrainerHomeFacade);

  readonly reload = (): void => this.facade.reload();

  private readonly router = inject(Router);

  constructor() {
    this.facade.load();
  }

  hora(iso: string): string {
    return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  }

  openStudent(studentId: string): void {
    void this.router.navigate(['/trainer/students', studentId]);
  }

  goToStudents(): void {
    void this.router.navigate(['/trainer/students']);
  }

  goToRoutines(): void {
    void this.router.navigate(['/trainer/routines']);
  }
}
