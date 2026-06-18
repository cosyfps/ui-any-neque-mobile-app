import { Component, computed, signal, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import {
  LucideCircleAlert,
  LucideCheck,
  LucideEye,
  LucideEyeOff,
  LucideLoaderCircle,
} from '@lucide/angular';

@Component({
  selector: 'app-start',
  standalone: true,
  imports: [
    IonContent,
    ReactiveFormsModule,
    LucideCircleAlert,
    LucideCheck,
    LucideEye,
    LucideEyeOff,
    LucideLoaderCircle,
  ],
  template: `
    <ion-content [fullscreen]="true" [scrollY]="false">
      <div class="start-container">
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

          <form [formGroup]="form" (ngSubmit)="onLogin()" novalidate>
            <!-- Email -->
            <div class="field" [class.has-error]="emailTouched() && emailError()">
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
                  formControlName="email"
                  placeholder="your.email&#64;example.com"
                  autocomplete="email"
                  inputmode="email"
                  enterkeyhint="next"
                  [attr.aria-describedby]="emailTouched() && emailError() ? 'email-error' : null"
                  (blur)="markEmailTouched()"
                />
                @if (emailTouched() && emailError()) {
                  <svg
                    class="input-error-icon"
                    lucideCircleAlert
                    [size]="18"
                    [strokeWidth]="1.8"
                  ></svg>
                }
              </div>
              @if (emailTouched() && emailError()) {
                <span class="field-error" id="email-error">{{ emailError() }}</span>
              }
            </div>

            <!-- Password -->
            <div class="field" [class.has-error]="passwordTouched() && !passwordValid()">
              <label class="field-label" for="password">Password</label>
              <div class="input-wrapper">
                @if (passwordValid()) {
                  <svg
                    class="input-icon valid"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
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
                      d="M7 11V7a5 5 0 0110 0"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
                    <circle cx="12" cy="16.5" r="1.5" fill="currentColor" />
                  </svg>
                } @else {
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
                }
                <input
                  id="password"
                  [type]="showPassword ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="Enter your password"
                  autocomplete="current-password"
                  enterkeyhint="done"
                  [attr.aria-describedby]="
                    passwordTouched() && !passwordValid() ? 'pwd-reqs' : null
                  "
                  (focus)="passwordFocused = true"
                  (blur)="passwordFocused = false; markPasswordTouched()"
                />
                <button
                  class="toggle-password"
                  (click)="showPassword = !showPassword"
                  type="button"
                >
                  @if (showPassword) {
                    <svg lucideEye [size]="20" [strokeWidth]="1.5"></svg>
                  } @else {
                    <svg lucideEyeOff [size]="20" [strokeWidth]="1.5"></svg>
                  }
                </button>
              </div>

              @if (passwordFocused || (passwordTouched() && !passwordValid())) {
                <ul class="pwd-requirements" id="pwd-reqs">
                  @for (req of pwdRequirements(); track req.label) {
                    <li [class.met]="req.met">
                      @if (req.met) {
                        <svg lucideCheck [size]="14" [strokeWidth]="2.5"></svg>
                      } @else {
                        <svg lucideCircleAlert [size]="14" [strokeWidth]="1.8"></svg>
                      }
                      {{ req.label }}
                    </li>
                  }
                </ul>
              }
            </div>

            <div class="form-options">
              <button class="forgot-link" type="button">Forgot Password?</button>
            </div>

            <button
              class="btn-submit"
              type="submit"
              [class.disabled]="!formValid() || isSubmitting()"
              [disabled]="!formValid() || isSubmitting()"
            >
              @if (isSubmitting()) {
                <svg class="btn-spinner" lucideLoaderCircle [size]="20" [strokeWidth]="2"></svg>
              } @else {
                Log In
              }
            </button>

            <p class="form-help-text">
              Access is by invitation only.<br />
              Contact your administrator if you need help.
            </p>
          </form>
        </div>
      </div>
    </ion-content>
  `,
  styleUrl: './start.page.scss',
})
export class StartPage {
  showLogin = false;
  showPassword = false;
  passwordFocused = false;

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = new FormBuilder();

  readonly form = this.fb.nonNullable.group({
    email: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9._+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/),
      ],
    ],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly emailTouched = signal(false);
  readonly passwordTouched = signal(false);
  readonly isSubmitting = signal(false);
  private readonly _email = signal('');
  private readonly _password = signal('');
  private readonly _emailValid = signal(false);

  readonly emailError = computed((): string | null => {
    this._email();
    if (!this.emailTouched()) return null;
    const ctrl = this.form.controls.email;
    if (ctrl.hasError('required')) return 'Email is required';
    if (ctrl.hasError('pattern')) return 'Please enter a valid email address';
    return null;
  });

  readonly passwordValue = this._password.asReadonly();

  readonly pwdRequirements = computed(() => {
    const v = this._password();
    return [
      { label: '8+ characters', met: v.length >= 8 },
      { label: 'One uppercase letter', met: /[A-Z]/.test(v) },
      { label: 'One number', met: /\d/.test(v) },
      { label: 'One special character', met: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(v) },
    ];
  });

  readonly passwordValid = computed(() => this.pwdRequirements().every(r => r.met));
  readonly formValid = computed(() => this._emailValid() && this.passwordValid());

  constructor() {
    this.form.controls.email.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => {
      this._email.set(v);
      this._emailValid.set(this.form.controls.email.valid);
    });
    this.form.controls.password.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this._password.set(v));
  }

  markEmailTouched(): void {
    this.emailTouched.set(true);
  }

  markPasswordTouched(): void {
    this.passwordTouched.set(true);
  }

  onLogin(): void {
    if (!this.formValid() || this.isSubmitting()) return;

    this.emailTouched.set(true);
    this.passwordTouched.set(true);

    if (!this.formValid()) return;

    this.isSubmitting.set(true);
    // TODO: wire to auth service — call this.isSubmitting.set(false) on complete/error
  }
}
