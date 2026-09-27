import {
  Component,
  computed,
  signal,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideCheck,
  LucideCircleAlert,
  LucideEye,
  LucideEyeOff,
  LucideLoaderCircle,
} from '@lucide/angular';

import { SessionFacade } from '@app/application/auth/session.facade';
import { isPasswordValid, passwordRules } from '@app/ui/shared/validators/password-rules';

@Component({
  selector: 'app-start',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideCheck,
    LucideCircleAlert,
    LucideEye,
    LucideEyeOff,
    LucideLoaderCircle,
  ],
  template: `
    <div class="nq-screen">
      <div class="start-container" [attr.inert]="showLogin ? '' : null">
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
            <h1 class="title">¡Hola de nuevo!</h1>
            <p class="subtitle">
              Ñeque es una app por invitación.<br />
              Ingresa con las credenciales que te asignaron.
            </p>
          </div>
          <div class="action-group">
            <button class="btn-login" (click)="showLogin = true">Ingresar</button>
            <p class="help-text">¿No tienes acceso? Habla con tu entrenador.</p>
          </div>
        </div>
      </div>

      <!-- Cerrado sigue en el DOM, trasladado fuera de pantalla: sin inert el
           foco de teclado y VoiceOver llegaban a sus campos invisibles. -->
      <div class="login-panel" [class.open]="showLogin" [attr.inert]="showLogin ? null : ''">
        <div class="form-section">
          <div class="form-header">
            <h1 class="form-title">Ingresar</h1>
            <button class="back-btn" (click)="showLogin = false" aria-label="Cerrar">
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
              <label class="nq-field-label" for="email">Correo</label>
              <div class="nq-field-input">
                <svg class="nq-field-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
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
                  placeholder="tu.correo&#64;ejemplo.com"
                  autocomplete="username"
                  autocapitalize="none"
                  spellcheck="false"
                  inputmode="email"
                  enterkeyhint="next"
                  maxlength="254"
                  (keydown.enter)="focusPassword($event)"
                  [attr.aria-describedby]="emailTouched() && emailError() ? 'email-error' : null"
                  (blur)="markEmailTouched()"
                />
                @if (emailTouched() && emailError()) {
                  <svg
                    class="nq-field-error-icon"
                    lucideCircleAlert
                    [size]="18"
                    [strokeWidth]="1.8"
                  ></svg>
                }
              </div>
              @if (emailTouched() && emailError()) {
                <span class="nq-field-error" id="email-error">{{ emailError() }}</span>
              }
            </div>

            <!-- Password -->
            <div class="field" [class.has-error]="passwordTouched() && !passwordValid()">
              <label class="nq-field-label" for="password">Contraseña</label>
              <div class="nq-field-input">
                @if (passwordValid()) {
                  <svg
                    class="nq-field-icon valid"
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
                  <svg class="nq-field-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
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
                  #passwordInput
                  id="password"
                  [type]="showPassword ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="Tu contraseña"
                  autocomplete="current-password"
                  autocapitalize="none"
                  autocorrect="off"
                  spellcheck="false"
                  enterkeyhint="go"
                  maxlength="128"
                  aria-describedby="pwd-reqs"
                  (focus)="passwordFocused.set(true)"
                  (blur)="passwordFocused.set(false); markPasswordTouched()"
                />
                <button
                  class="toggle-password"
                  type="button"
                  [attr.aria-label]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  (click)="showPassword = !showPassword"
                >
                  @if (showPassword) {
                    <svg lucideEye [size]="20" [strokeWidth]="1.5"></svg>
                  } @else {
                    <svg lucideEyeOff [size]="20" [strokeWidth]="1.5"></svg>
                  }
                </button>
              </div>

              @if (showRequirements()) {
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

            @if (loginError(); as error) {
              <p class="nq-field-error login-error" role="alert">
                <svg
                  class="nq-field-error-icon"
                  lucideCircleAlert
                  [size]="14"
                  [strokeWidth]="2"
                ></svg>
                {{ error }}
              </p>
            }

            <div class="form-options">
              <button class="forgot-link" type="button" (click)="goToForgotPassword()">
                ¿Olvidaste tu contraseña?
              </button>
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
                Ingresar
              }
            </button>

            <p class="form-help-text">
              El acceso es solo por invitación.<br />
              Si necesitas ayuda, habla con tu entrenador.
            </p>
          </form>
        </div>
      </div>
    </div>
  `,
  // `.nq-screen` se estira contra el ancestro posicionado que aporta esta
  // clase; sin ella el contenedor no tiene contra que medir su alto.
  host: { class: 'nq-page-host' },
  styleUrl: './start.page.scss',
})
export class StartPage {
  showLogin = false;
  showPassword = false;

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly session = inject(SessionFacade);
  private readonly fb = new FormBuilder();
  private readonly passwordInput = viewChild<ElementRef<HTMLInputElement>>('passwordInput');

  /** Error de credenciales devuelto por el backend, para `.nq-field-error`. */
  readonly loginError = computed(() => this.session.loginError()?.message ?? null);

  readonly form = this.fb.nonNullable.group({
    email: [
      '',
      [
        Validators.required,
        // Tolera espacios en los bordes: la sugerencia del teclado de iOS agrega
        // uno al final y el correo se envia recortado de todas formas.
        Validators.pattern(/^\s*[a-zA-Z0-9._+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\s*$/),
      ],
    ],
    password: ['', Validators.required],
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
    if (ctrl.hasError('required')) return 'El correo es obligatorio';
    if (ctrl.hasError('pattern')) return 'Ingresa un correo válido';
    return null;
  });

  readonly passwordValue = this._password.asReadonly();
  readonly passwordFocused = signal(false);

  /** Las cuatro reglas de contrasena, las mismas de /invite y recuperacion. */
  readonly pwdRequirements = computed(() => passwordRules(this._password()));
  readonly passwordValid = computed(() => isPasswordValid(this._password()));

  /** La lista se ve mientras se escribe, o despues si quedo incompleta. */
  readonly showRequirements = computed(
    () => this.passwordFocused() || (this.passwordTouched() && !this.passwordValid()),
  );

  readonly formValid = computed(() => this._emailValid() && this.passwordValid());

  constructor() {
    this.form.controls.email.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => {
      this._email.set(v);
      this._emailValid.set(this.form.controls.email.valid);
      this.session.clearError();
    });
    this.form.controls.password.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => {
        this._password.set(v);
        this.session.clearError();
      });
  }

  markEmailTouched(): void {
    this.emailTouched.set(true);
    const ctrl = this.form.controls.email;
    const trimmed = ctrl.value.trim();
    if (trimmed !== ctrl.value) ctrl.setValue(trimmed);
  }

  /**
   * "Siguiente" del teclado en el correo. Sin esto el Enter dispara el envio
   * implicito del formulario y el foco nunca pasa a la contrasena.
   */
  focusPassword(event: Event): void {
    event.preventDefault();
    this.passwordInput()?.nativeElement.focus();
  }

  markPasswordTouched(): void {
    this.passwordTouched.set(true);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  async onLogin(): Promise<void> {
    if (!this.formValid() || this.isSubmitting()) return;

    this.emailTouched.set(true);
    this.passwordTouched.set(true);

    this.isSubmitting.set(true);

    const route = await this.session.login({
      email: this.form.controls.email.value.trim(),
      password: this.form.controls.password.value,
    });

    this.isSubmitting.set(false);

    if (route !== null) {
      await this.router.navigate([route]);
    }
  }
}
