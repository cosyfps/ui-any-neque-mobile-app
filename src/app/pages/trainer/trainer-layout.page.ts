import { Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { LucideHouse, LucideUsers, LucideClipboardList } from '@lucide/angular';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-trainer-layout',
  standalone: true,
  imports: [RouterOutlet, LucideHouse, LucideUsers, LucideClipboardList],
  template: `
    <div class="layout">
      <div class="layout-content">
        <router-outlet />
      </div>

      <nav class="tab-bar">
        <button
          class="tab"
          [class.active]="isActive('/trainer/dashboard')"
          (click)="navigate('/trainer/dashboard')"
        >
          <svg lucideHouse [size]="22" [strokeWidth]="1.8"></svg>
          <span class="tab-dot"></span>
        </button>

        <button
          class="tab"
          [class.active]="isActive('/trainer/clients')"
          (click)="navigate('/trainer/clients')"
        >
          <svg lucideUsers [size]="22" [strokeWidth]="1.8"></svg>
          <span class="tab-dot"></span>
        </button>

        <button
          class="tab"
          [class.active]="isActive('/trainer/routines')"
          (click)="navigate('/trainer/routines')"
        >
          <svg lucideClipboardList [size]="22" [strokeWidth]="1.8"></svg>
          <span class="tab-dot"></span>
        </button>

        <button
          class="tab tab-profile"
          [class.active]="isActive('/trainer/profile')"
          (click)="navigate('/trainer/profile')"
        >
          <div class="profile-avatar">
            @if (profileImage) {
              <img [src]="profileImage" alt="Perfil" />
            } @else {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" />
              </svg>
            }
          </div>
          <span class="tab-dot"></span>
        </button>
      </nav>
    </div>
  `,
  styleUrl: './trainer-layout.page.scss',
})
export class TrainerLayoutPage {
  private readonly router: Router;
  private readonly activeTab;

  constructor(router: Router) {
    this.router = router;
    this.activeTab = toSignal(
      this.router.events.pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(e => e.urlAfterRedirects.split('?')[0]),
      ),
      { initialValue: this.router.url.split('?')[0] },
    );
  }

  profileImage: string | null = null;

  isActive(path: string): boolean {
    return this.activeTab()?.startsWith(path) ?? false;
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }
}
