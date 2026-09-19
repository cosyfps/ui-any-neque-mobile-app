import {
  Component,
  computed,
  signal,
  DestroyRef,
  inject,
  ViewChildren,
  QueryList,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import {
  LucideCircleAlert,
  LucideLoaderCircle,
  LucideArrowLeft,
  LucideCheck,
  LucideEye,
  LucideEyeOff,
} from '@lucide/angular';

import { SessionFacade } from '@app/application/auth/session.facade';
import { PasswordResetTicket } from '@app/domain/auth/model/auth-user.model';
import { AUTH_PORT } from '@app/domain/auth/port/auth.port';
import { toDomainError } from '@app/domain/shared/model/app-error';
import { isPasswordValid, passwordRules } from '@app/ui/shared/validators/password-rules';

const OTP_LENGTH = 6;

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    IonContent,
    ReactiveFormsModule,
    LucideCircleAlert,
    LucideLoaderCircle,
    LucideArrowLeft,
    LucideCheck,
    LucideEye,
    LucideEyeOff,
  ],
  template: `
    <ion-content [fullscreen]="true" [scrollY]="false">
      <div class="fp-container">
        <!-- Step 1: Email -->
        <div
          class="step"
          [class.active]="step() === 'email'"
          [class.exit-left]="step() !== 'email'"
        >
          <div class="step-inner">
            <button class="nav-back" (click)="goBack()" aria-label="Go back">
              <svg lucideArrowLeft [size]="22" [strokeWidth]="1.8"></svg>
            </button>

            <div class="illustration">
              <svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="80" r="60" fill="rgba(var(--nq-primary-rgb),0.08)" />
                <circle cx="100" cy="80" r="40" fill="rgba(var(--nq-primary-rgb),0.12)" />
                <rect
                  x="78"
                  y="62"
                  width="44"
                  height="30"
                  rx="4"
                  fill="none"
                  stroke="var(--nq-primary)"
                  stroke-width="2"
                />
                <path
                  d="M78 66l22 14 22-14"
                  fill="none"
                  stroke="var(--nq-primary)"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <circle cx="100" cy="105" r="4" fill="var(--nq-primary)" opacity="0.4" />
                <circle cx="90" cy="112" r="2.5" fill="var(--nq-primary)" opacity="0.25" />
                <circle cx="112" cy="110" r="3" fill="var(--nq-primary)" opacity="0.3" />
              </svg>
            </div>

            <h1 class="step-title">Reset Password</h1>
            <p class="step-desc">
              Enter your email address and we'll send you<br />
              a verification code to reset your password.
            </p>

            <form [formGroup]="emailForm" (ngSubmit)="onSendCode()" novalidate class="email-form">
              <div class="field" [class.has-error]="emailTouched() && emailError()">
                <label class="nq-field-label" for="fp-email">Email</label>
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
                    id="fp-email"
                    type="email"
                    formControlName="email"
                    placeholder="your.email&#64;example.com"
                    autocomplete="email"
                    inputmode="email"
                    enterkeyhint="send"
                    [attr.aria-describedby]="
                      emailTouched() && emailError() ? 'fp-email-error' : null
                    "
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
                  <span class="nq-field-error" id="fp-email-error">{{ emailError() }}</span>
                }
              </div>

              @if (requestError(); as error) {
                <p class="nq-field-error request-error" role="alert">{{ error }}</p>
              }

              <button
                class="btn-submit"
                type="submit"
                [class.disabled]="!emailValid() || isSending()"
                [disabled]="!emailValid() || isSending()"
              >
                @if (isSending()) {
                  <svg class="btn-spinner" lucideLoaderCircle [size]="20" [strokeWidth]="2"></svg>
                } @else {
                  Send Code
                }
              </button>
            </form>
          </div>
        </div>

        <!-- Step 2: OTP Verification -->
        <div
          class="step"
          [class.active]="step() === 'otp'"
          [class.exit-left]="step() === 'password'"
        >
          <div class="step-inner">
            <button class="nav-back" (click)="backToEmail()" aria-label="Go back">
              <svg lucideArrowLeft [size]="22" [strokeWidth]="1.8"></svg>
            </button>

            <div class="illustration">
              <svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="80" r="60" fill="rgba(var(--nq-primary-rgb),0.08)" />
                <circle cx="100" cy="80" r="40" fill="rgba(var(--nq-primary-rgb),0.12)" />
                <rect
                  x="75"
                  y="60"
                  width="50"
                  height="36"
                  rx="5"
                  fill="none"
                  stroke="var(--nq-primary)"
                  stroke-width="2"
                />
                <path
                  d="M85 80h6M95 80h6M105 80h6"
                  stroke="var(--nq-primary)"
                  stroke-width="3"
                  stroke-linecap="round"
                />
                <path d="M100 55l-3-6h6l-3 6z" fill="var(--nq-primary)" opacity="0.5" />
              </svg>
            </div>

            <h1 class="step-title">Verification Code</h1>
            <p class="step-desc">
              We sent a code to<br />
              <strong>{{ maskedEmail() }}</strong>
            </p>

            <div class="otp-group" [class.locked]="isVerifying()">
              @for (digit of otpDigits; track $index) {
                <input
                  #otpInput
                  class="otp-cell"
                  type="text"
                  inputmode="numeric"
                  maxlength="1"
                  [attr.aria-label]="'Digit ' + ($index + 1)"
                  [value]="otpValues()[$index]"
                  (input)="onOtpInput($index, $event)"
                  (keydown)="onOtpKeydown($index, $event)"
                  (paste)="onOtpPaste($event)"
                  (focus)="onOtpFocus($index)"
                  [class.filled]="otpValues()[$index] !== ''"
                  [disabled]="isVerifying()"
                />
              }
            </div>

            @if (requestError(); as error) {
              <p class="nq-field-error request-error" role="alert">{{ error }}</p>
            }

            <div class="resend-row">
              <span class="resend-label">Didn't get it?</span>
              @if (canResend()) {
                <button class="resend-btn" (click)="resendCode()">Resend code</button>
              } @else {
                <span class="resend-timer">{{ resendCountdown() }}s</span>
              }
            </div>

            <button class="change-email-link" (click)="backToEmail()">Change email address</button>

            <button
              class="btn-submit"
              (click)="onVerifyOtp()"
              [class.disabled]="!otpComplete() || isVerifying()"
              [disabled]="!otpComplete() || isVerifying()"
            >
              @if (isVerifying()) {
                <svg class="btn-spinner" lucideLoaderCircle [size]="20" [strokeWidth]="2"></svg>
              } @else {
                Verify Code
              }
            </button>
          </div>
        </div>

        <!-- Step 3: New password. Verificar el codigo no abre sesion: recien
             aqui, con la contrasena cambiada, el backend devuelve una. -->
        <div class="step" [class.active]="step() === 'password'">
          <div class="step-inner">
            <button class="nav-back" (click)="backToOtp()" aria-label="Go back">
              <svg lucideArrowLeft [size]="22" [strokeWidth]="1.8"></svg>
            </button>

            <div class="illustration">
              <svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="80" r="60" fill="rgba(var(--nq-primary-rgb),0.08)" />
                <circle cx="100" cy="80" r="40" fill="rgba(var(--nq-primary-rgb),0.12)" />
                <rect
                  x="80"
                  y="76"
                  width="40"
                  height="28"
                  rx="4"
                  fill="none"
                  stroke="var(--nq-primary-strong)"
                  stroke-width="2"
                />
                <path
                  d="M88 76v-8a12 12 0 0124 0v8"
                  fill="none"
                  stroke="var(--nq-primary-strong)"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <circle cx="100" cy="90" r="3.5" fill="var(--nq-primary-strong)" />
              </svg>
            </div>

            <h1 class="step-title">New Password</h1>
            <p class="step-desc">
              Choose a new password for <strong>{{ maskedEmail() }}</strong>
            </p>

            <form
              class="email-form"
              [formGroup]="passwordForm"
              (ngSubmit)="onSetPassword()"
              novalidate
            >
              <div class="field">
                <label class="nq-field-label" for="fp-password">New password</label>
                <div class="nq-field-input">
                  <input
                    id="fp-password"
                    formControlName="password"
                    [type]="showPassword() ? 'text' : 'password'"
                    autocomplete="new-password"
                    enterkeyhint="next"
                    placeholder="Your new password"
                    aria-describedby="fp-pwd-rules"
                  />
                  <button
                    class="toggle-visibility"
                    type="button"
                    [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                    (click)="togglePassword()"
                  >
                    @if (showPassword()) {
                      <svg lucideEyeOff [size]="18" [strokeWidth]="1.8"></svg>
                    } @else {
                      <svg lucideEye [size]="18" [strokeWidth]="1.8"></svg>
                    }
                  </button>
                </div>
              </div>

              <ul class="pwd-rules" id="fp-pwd-rules">
                @for (rule of rules(); track rule.label) {
                  <li class="pwd-rule" [class.met]="rule.met">
                    <span class="pwd-rule-dot">
                      @if (rule.met) {
                        <svg lucideCheck [size]="12" [strokeWidth]="3"></svg>
                      }
                    </span>
                    {{ rule.label }}
                  </li>
                }
              </ul>

              <div class="field" [class.has-error]="confirmError() !== null">
                <label class="nq-field-label" for="fp-confirm">Repeat password</label>
                <div class="nq-field-input">
                  <input
                    id="fp-confirm"
                    formControlName="confirm"
                    [type]="showPassword() ? 'text' : 'password'"
                    autocomplete="new-password"
                    enterkeyhint="done"
                    placeholder="Confirm it"
                    [attr.aria-describedby]="confirmError() ? 'fp-confirm-error' : null"
                    (blur)="markConfirmTouched()"
                  />
                </div>
                @if (confirmError(); as error) {
                  <span class="nq-field-error" id="fp-confirm-error">{{ error }}</span>
                }
              </div>

              @if (requestError(); as error) {
                <p class="nq-field-error request-error" role="alert">{{ error }}</p>
              }

              <button
                class="btn-submit"
                type="submit"
                [class.disabled]="!passwordValid() || isSaving()"
                [disabled]="!passwordValid() || isSaving()"
              >
                @if (isSaving()) {
                  <svg class="btn-spinner" lucideLoaderCircle [size]="20" [strokeWidth]="2"></svg>
                } @else {
                  Save Password
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  // `ion-content` se posiciona contra un ancestro `.ion-page`. Con el
  // router-outlet de Angular nadie la agrega, asi que la pone el host.
  host: { class: 'ion-page' },
  styleUrl: './forgot-password.page.scss',
})
export class ForgotPasswordPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = new FormBuilder();
  private readonly router = inject(Router);

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  readonly otpLength = OTP_LENGTH;
  readonly otpDigits = Array.from({ length: OTP_LENGTH });

  readonly step = signal<'email' | 'otp' | 'password'>('email');
  readonly emailTouched = signal(false);
  readonly isSending = signal(false);
  readonly isVerifying = signal(false);
  readonly canResend = signal(false);
  readonly isSaving = signal(false);
  readonly showPassword = signal(false);
  readonly confirmTouched = signal(false);
  readonly resendCountdown = signal(60);
  readonly otpValues = signal<string[]>(Array(OTP_LENGTH).fill(''));

  private resendTimer: ReturnType<typeof setInterval> | null = null;

  readonly emailForm = this.fb.nonNullable.group({
    email: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9._+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/),
      ],
    ],
  });

  readonly passwordForm = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', [Validators.required]],
  });

  private readonly _email = signal('');
  private readonly _password = signal('');
  private readonly _confirm = signal('');
  private readonly _ticket = signal<PasswordResetTicket | null>(null);
  private readonly auth = inject(AUTH_PORT);
  private readonly session = inject(SessionFacade);

  /** Error del backend en cualquiera de los dos pasos. */
  readonly requestError = signal<string | null>(null);

  readonly emailError = computed((): string | null => {
    this._email();
    if (!this.emailTouched()) return null;
    const ctrl = this.emailForm.controls.email;
    if (ctrl.hasError('required')) return 'Email is required';
    if (ctrl.hasError('pattern')) return 'Please enter a valid email address';
    return null;
  });

  readonly emailValid = computed(() => {
    this._email();
    return this.emailForm.controls.email.valid;
  });

  readonly maskedEmail = computed(() => {
    const email = this._email();
    const atIdx = email.indexOf('@');
    if (atIdx < 0) return email;
    const user = email.slice(0, atIdx);
    const domain = email.slice(atIdx + 1);
    if (user.length <= 2) return `${user}@${domain}`;
    return `${user[0]}${'*'.repeat(user.length - 2)}${user[user.length - 1]}@${domain}`;
  });

  readonly otpComplete = computed(() => this.otpValues().every(d => d !== ''));

  readonly rules = computed(() => passwordRules(this._password()));
  readonly confirmsMatch = computed(() => this._password() === this._confirm());
  readonly passwordValid = computed(
    () => isPasswordValid(this._password()) && this.confirmsMatch(),
  );

  readonly confirmError = computed((): string | null => {
    if (!this.confirmTouched() || this._confirm() === '') {
      return null;
    }
    return this.confirmsMatch() ? null : 'Passwords do not match';
  });

  constructor() {
    this.emailForm.controls.email.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this._email.set(v));

    this.passwordForm.controls.password.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => {
        this._password.set(v);
        this.requestError.set(null);
      });
    this.passwordForm.controls.confirm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => {
        this._confirm.set(v);
        this.requestError.set(null);
      });

    this.destroyRef.onDestroy(() => {
      this.clearResendTimer();
    });
  }

  ngAfterViewInit(): void {
    this.otpInputs.changes.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.step() === 'otp') {
        setTimeout(() => this.otpInputs.first?.nativeElement.focus(), 100);
      }
    });
  }

  markEmailTouched(): void {
    this.emailTouched.set(true);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  onSendCode(): void {
    this.emailTouched.set(true);
    if (!this.emailValid() || this.isSending()) return;

    this.isSending.set(true);
    this.requestError.set(null);

    this.auth
      .requestPasswordReset(this.emailForm.controls.email.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSending.set(false);
          this.step.set('otp');
          this.startResendTimer();
        },
        error: (cause: unknown) => {
          this.isSending.set(false);
          this.requestError.set(toDomainError(cause).message);
        },
      });
  }

  backToEmail(): void {
    this.step.set('email');
    this.otpValues.set(Array(this.otpLength).fill(''));
    this.isVerifying.set(false);
    this._ticket.set(null);
    this.clearResendTimer();
  }

  backToOtp(): void {
    this.step.set('otp');
    this.requestError.set(null);
  }

  togglePassword(): void {
    this.showPassword.update(value => !value);
  }

  markConfirmTouched(): void {
    this.confirmTouched.set(true);
  }

  // ── OTP input handling ──

  onOtpInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');
    const vals = [...this.otpValues()];
    vals[index] = value ? value.charAt(0) : '';
    this.otpValues.set(vals);

    if (value && index < this.otpLength - 1) {
      const inputs = this.otpInputs.toArray();
      inputs[index + 1]?.nativeElement.focus();
    }
  }

  onOtpKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.otpValues()[index] && index > 0) {
      const inputs = this.otpInputs.toArray();
      const vals = [...this.otpValues()];
      vals[index - 1] = '';
      this.otpValues.set(vals);
      inputs[index - 1]?.nativeElement.focus();
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData('text') || '').replace(/\D/g, '');
    if (!pasted) return;

    const inputs = this.otpInputs.toArray();
    const focusedIdx = inputs.findIndex(el => el.nativeElement === document.activeElement);
    const startIdx = focusedIdx >= 0 ? focusedIdx : 0;

    const vals = [...this.otpValues()];
    for (let i = 0; i < pasted.length && startIdx + i < this.otpLength; i++) {
      vals[startIdx + i] = pasted.charAt(i);
    }
    this.otpValues.set(vals);

    const focusTarget = Math.min(startIdx + pasted.length, this.otpLength - 1);
    inputs[focusTarget]?.nativeElement.focus();
  }

  onOtpFocus(index: number): void {
    const inputs = this.otpInputs.toArray();
    inputs[index]?.nativeElement.select();
  }

  onVerifyOtp(): void {
    if (!this.otpComplete() || this.isVerifying()) return;

    this.isVerifying.set(true);
    this.requestError.set(null);

    this.auth
      .verifyOtp(this.emailForm.controls.email.value, this.otpValues().join(''))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ticket => {
          this.isVerifying.set(false);
          // Verificar el codigo ya no abre sesion: habilita el paso 3.
          this._ticket.set(ticket);
          this.step.set('password');
          this.clearResendTimer();
        },
        error: (cause: unknown) => {
          this.isVerifying.set(false);
          this.requestError.set(toDomainError(cause).message);
        },
      });
  }

  onSetPassword(): void {
    const ticket = this._ticket();
    if (ticket === null || !this.passwordValid() || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.requestError.set(null);

    this.auth
      .resetPassword(ticket, this.passwordForm.controls.password.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: session => {
          this.isSaving.set(false);
          this.router.navigate([this.session.adopt(session)]);
        },
        error: (cause: unknown) => {
          this.isSaving.set(false);
          this.requestError.set(toDomainError(cause).message);
        },
      });
  }

  resendCode(): void {
    if (!this.canResend()) return;

    this.canResend.set(false);
    this.requestError.set(null);
    this.startResendTimer();

    this.auth
      .requestPasswordReset(this.emailForm.controls.email.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (cause: unknown) => this.requestError.set(toDomainError(cause).message),
      });
  }

  private startResendTimer(): void {
    this.clearResendTimer();
    this.resendCountdown.set(60);
    this.canResend.set(false);

    this.resendTimer = setInterval(() => {
      const next = this.resendCountdown() - 1;
      this.resendCountdown.set(next);
      if (next <= 0) {
        this.canResend.set(true);
        this.clearResendTimer();
      }
    }, 1000);
  }

  private clearResendTimer(): void {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
  }
}
