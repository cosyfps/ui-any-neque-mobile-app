import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  LucideArrowLeft,
  LucideBell,
  LucideCalendarDays,
  LucideClipboardList,
  LucideMessageCircle,
} from '@lucide/angular';

import { NotificationsFacade } from '@app/application/notifications/notifications.facade';
import { AppNotification } from '@app/domain/notifications/model/notification.model';
import { CLOCK } from '@app/domain/shared/port/clock.port';

import { PageStateComponent } from '@shared/components/page-state.component';
import { PullToRefreshDirective } from '@shared/directives/pull-to-refresh.directive';
import { notificationRoute } from '@shared/navigation/notification-target';

const RELATIVE = new Intl.RelativeTimeFormat('es-CL', { numeric: 'auto' });

@Component({
  selector: 'app-student-notifications',
  standalone: true,
  imports: [
    PageStateComponent,
    PullToRefreshDirective,
    LucideArrowLeft,
    LucideBell,
    LucideCalendarDays,
    LucideClipboardList,
    LucideMessageCircle,
  ],
  template: `
    <div class="page" nqPullToRefresh [refreshing]="facade.items.loading()" (refresh)="reload()">
      <header class="head">
        <button class="nav-back" type="button" aria-label="Volver" (click)="goBack()">
          <svg lucideArrowLeft [size]="22" [strokeWidth]="1.8"></svg>
        </button>
        <h1 class="head-title">Notificaciones</h1>
        @if (facade.hasUnread()) {
          <button class="mark-all" type="button" (click)="markAll()">Marcar todas</button>
        }
      </header>

      @switch (facade.viewState()) {
        @case ('loading') {
          <nq-page-state type="loading" />
        }
        @case ('error') {
          <nq-page-state type="error" [retry]="reload" />
        }
        @case ('empty') {
          <nq-page-state
            type="empty"
            title="Sin notificaciones"
            message="Te avisaremos cuando tu entrenador publique algo nuevo."
          />
        }
        @case ('success') {
          @for (group of facade.groups(); track group.label) {
            <section class="group nq-ani">
              <span class="group-label">{{ group.label }}</span>

              <ul class="list">
                @for (item of group.items; track item.id) {
                  <li>
                    <button
                      class="item"
                      type="button"
                      [class.unread]="item.readAt === null"
                      (click)="open(item)"
                    >
                      <span class="icon" [attr.data-kind]="item.kind">
                        @switch (item.kind) {
                          @case ('routine') {
                            <svg lucideClipboardList [size]="17" [strokeWidth]="1.8"></svg>
                          }
                          @case ('session') {
                            <svg lucideCalendarDays [size]="17" [strokeWidth]="1.8"></svg>
                          }
                          @case ('message') {
                            <svg lucideMessageCircle [size]="17" [strokeWidth]="1.8"></svg>
                          }
                          @default {
                            <svg lucideBell [size]="17" [strokeWidth]="1.8"></svg>
                          }
                        }
                      </span>

                      <span class="body">
                        <span class="title">{{ item.title }}</span>
                        <span class="text">{{ item.body }}</span>
                        <span class="time">{{ relativeTime(item.createdAt) }}</span>
                      </span>

                      @if (item.readAt === null) {
                        <!-- Con rol: en un span generico el aria-label se ignora
                             y el estado quedaba solo en el color. -->
                        <span class="dot" role="img" aria-label="No leída"></span>
                      }
                    </button>
                  </li>
                }
              </ul>
            </section>
          }
        }
      }
    </div>
  `,
  styleUrl: './student-notifications.page.scss',
})
export class StudentNotificationsPage {
  readonly facade = inject(NotificationsFacade);

  private readonly router = inject(Router);
  private readonly clock = inject(CLOCK);
  private readonly location = inject(Location);

  readonly reload = (): void => this.facade.reload();

  constructor() {
    this.facade.load();
  }

  /** "hace 3 horas", "ayer". Cae al mayor unidad que aplique. */
  relativeTime(iso: string): string {
    const diffMs = new Date(iso).getTime() - this.clock.now().getTime();
    const minutes = Math.round(diffMs / 60_000);

    if (Math.abs(minutes) < 60) {
      return RELATIVE.format(minutes, 'minute');
    }
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) {
      return RELATIVE.format(hours, 'hour');
    }
    return RELATIVE.format(Math.round(hours / 24), 'day');
  }

  async open(notification: AppNotification): Promise<void> {
    if (notification.readAt === null) {
      await this.facade.markRead(notification.id);
    }
    const ruta = notificationRoute(notification.targetType, notification.targetId);
    if (ruta !== null) {
      await this.router.navigate(ruta);
    }
  }

  markAll(): void {
    void this.facade.markAllRead();
  }

  /**
   * Vuelve a donde estaba el alumno, no siempre a Home: esta pantalla se
   * alcanza desde la campanita del Home y desde el menu del Perfil.
   */
  goBack(): void {
    if (this.location.getState() !== null && history.length > 1) {
      this.location.back();
      return;
    }
    void this.router.navigate(['/student/home']);
  }
}
