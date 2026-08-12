import { Component, Input } from '@angular/core';
import { LucideAlertCircle, LucideInbox, LucideWifi, LucideRefreshCw } from '@lucide/angular';

export type PageStateType = 'loading' | 'error' | 'empty' | 'offline';

@Component({
  selector: 'nq-page-state',
  standalone: true,
  imports: [LucideAlertCircle, LucideInbox, LucideWifi, LucideRefreshCw],
  template: `
    @switch (type) {
      @case ('loading') {
        <div class="state">
          <div class="skeleton-group">
            <div class="skeleton-header">
              <div class="nq-skeleton-circle" style="width:44px;height:44px"></div>
              <div style="flex:1;display:flex;flex-direction:column;gap:8px">
                <div class="nq-skeleton-text lg"></div>
                <div class="nq-skeleton-text sm"></div>
              </div>
            </div>
            <div class="nq-skeleton-card"></div>
            <div class="skeleton-row">
              <div class="nq-skeleton-card" style="height:100px"></div>
              <div class="nq-skeleton-card" style="height:100px"></div>
            </div>
            <div class="nq-skeleton-card" style="height:80px"></div>
          </div>
        </div>
      }
      @case ('error') {
        <div class="nq-state">
          <div class="nq-state-icon error">
            <svg lucideAlertCircle [size]="24" [strokeWidth]="1.5"></svg>
          </div>
          <span class="nq-state-title">{{ title || 'Algo salió mal' }}</span>
          <span class="nq-state-desc">{{
            message || 'No pudimos cargar la información. Intenta de nuevo.'
          }}</span>
          @if (showRetry) {
            <button class="retry-btn" (click)="onRetry()">
              <svg lucideRefreshCw [size]="16" [strokeWidth]="2"></svg>
              Reintentar
            </button>
          }
        </div>
      }
      @case ('empty') {
        <div class="nq-state">
          <div class="nq-state-icon">
            <svg lucideInbox [size]="24" [strokeWidth]="1.5"></svg>
          </div>
          <span class="nq-state-title">{{ title || 'Sin datos' }}</span>
          <span class="nq-state-desc">{{ message || 'Aún no hay información para mostrar.' }}</span>
        </div>
      }
      @case ('offline') {
        <div class="nq-state">
          <div class="nq-state-icon warning">
            <svg lucideWifi [size]="24" [strokeWidth]="1.5"></svg>
          </div>
          <span class="nq-state-title">Sin conexión</span>
          <span class="nq-state-desc">Revisa tu conexión a internet e intenta de nuevo.</span>
          @if (showRetry) {
            <button class="retry-btn" (click)="onRetry()">
              <svg lucideRefreshCw [size]="16" [strokeWidth]="2"></svg>
              Reintentar
            </button>
          }
        </div>
      }
    }
  `,
  styles: [
    `
      .state {
        padding: 32px 24px;
      }
      .skeleton-group {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .skeleton-header {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .skeleton-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .error {
        background: rgba(var(--nq-danger-rgb), 0.06);
        color: var(--nq-danger);
      }
      .warning {
        background: rgba(var(--nq-warning-rgb), 0.06);
        color: var(--nq-warning);
      }
      .retry-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        border-radius: var(--nq-radius-sm);
        background: var(--nq-surface);
        border: 1px solid var(--nq-border-solid);
        color: var(--nq-text);
        font-family: var(--nq-font-family);
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 8px;
        transition: background var(--nq-transition);
      }
      .retry-btn:active {
        background: var(--nq-surface-2);
      }
    `,
  ],
})
export class PageStateComponent {
  @Input() type: PageStateType = 'loading';
  @Input() title = '';
  @Input() message = '';
  @Input() showRetry = true;
  @Input() retry?: () => void;

  onRetry(): void {
    this.retry?.();
  }
}
