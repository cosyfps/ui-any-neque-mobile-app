import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-start',
  standalone: true,
  imports: [IonContent, FormsModule],
  template: `
    <ion-content [fullscreen]="true" [scrollY]="false">
      <div class="start-container">
        <!-- Gradient hero with lotus -->
        <div class="hero">
          <svg class="lotus" viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="120" cy="60" rx="18" ry="55" fill="rgba(255,255,255,0.30)" />
            <ellipse
              cx="120"
              cy="60"
              rx="18"
              ry="55"
              fill="rgba(255,255,255,0.25)"
              transform="rotate(-25 120 110)"
            />
            <ellipse
              cx="120"
              cy="60"
              rx="18"
              ry="55"
              fill="rgba(255,255,255,0.25)"
              transform="rotate(25 120 110)"
            />
            <ellipse
              cx="120"
              cy="60"
              rx="16"
              ry="50"
              fill="rgba(255,255,255,0.18)"
              transform="rotate(-50 120 110)"
            />
            <ellipse
              cx="120"
              cy="60"
              rx="16"
              ry="50"
              fill="rgba(255,255,255,0.18)"
              transform="rotate(50 120 110)"
            />
            <ellipse
              cx="120"
              cy="65"
              rx="14"
              ry="44"
              fill="rgba(255,255,255,0.12)"
              transform="rotate(-72 120 110)"
            />
            <ellipse
              cx="120"
              cy="65"
              rx="14"
              ry="44"
              fill="rgba(255,255,255,0.12)"
              transform="rotate(72 120 110)"
            />
          </svg>
        </div>

        <!-- Welcome content -->
        <div class="content">
          <div class="welcome-group">
            <h1 class="title">Welcome Back!</h1>
            <p class="subtitle">
              Hi there!<br />
              This is an invitation-only app.<br />
              Log in with your assigned credentials.
            </p>
          </div>

          <div class="action-group">
            <button class="btn-login" (click)="showLogin = true">Log In</button>
            <p class="help-text">Don't have access? Contact your administrator.</p>
          </div>
        </div>
      </div>

      <!-- Login form panel (slides up from bottom) -->
      <div class="login-panel" [class.open]="showLogin">
        <div class="form-section">
          <div class="form-header">
            <h1 class="form-title">Log In</h1>
            <button class="back-btn" (click)="showLogin = false" aria-label="Go back">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>

          <div class="field">
            <label class="field-label" for="email">Email</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect
                  x="2"
                  y="4"
                  width="20"
                  height="16"
                  rx="3"
                  stroke="currentColor"
                  stroke-width="1.5"
                />
                <path
                  d="M2 7l10 6 10-6"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <input
                id="email"
                type="email"
                [(ngModel)]="email"
                placeholder="your.email@example.com"
                autocomplete="email"
                inputmode="email"
              />
            </div>
          </div>

          <div class="field">
            <label class="field-label" for="password">Password</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect
                  x="3"
                  y="11"
                  width="18"
                  height="11"
                  rx="3"
                  stroke="currentColor"
                  stroke-width="1.5"
                />
                <path
                  d="M7 11V7a5 5 0 0110 0v4"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
                <circle cx="12" cy="16.5" r="1.5" fill="currentColor" />
              </svg>
              <input
                id="password"
                [type]="showPassword ? 'text' : 'password'"
                [(ngModel)]="password"
                placeholder="Enter your password"
                autocomplete="current-password"
              />
              <button
                class="toggle-password"
                (click)="showPassword = !showPassword"
                type="button"
                [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
              >
                @if (showPassword) {
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"
                      stroke="currentColor"
                      stroke-width="1.5"
                    />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5" />
                  </svg>
                } @else {
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
                    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="1.5" />
                  </svg>
                }
              </button>
            </div>
          </div>

          <div class="form-options">
            <button class="forgot-link" type="button">Forgot Password?</button>
          </div>

          <button class="btn-submit" (click)="onLogin()">Log In</button>

          <p class="form-help-text">
            Access is by invitation only.<br />
            Contact your administrator if you need help.
          </p>
        </div>
      </div>
    </ion-content>
  `,
  styleUrl: './start.page.scss',
})
export class StartPage {
  showLogin = false;
  showPassword = false;
  email = '';
  password = '';

  onLogin(): void {
    // TODO: wire to auth service
  }
}
