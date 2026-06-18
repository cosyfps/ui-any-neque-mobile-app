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
import { LucideCircleAlert, LucideLoaderCircle, LucideArrowLeft } from '@lucide/angular';

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
  ],
  template: `
    <ion-content [fullscreen]="true" [scrollY]="false">
      <div class="fp-container">
        <!-- Step 1: Email -->
        <div class="step" [class.active]="step() === 'email'" [class.exit-left]="step() === 'otp'">
          <div class="step-inner">
            <button class="nav-back" (click)="goBack()" aria-label="Go back">
              <svg lucideArrowLeft [size]="22" [strokeWidth]="1.8"></svg>
            </button>

            <div class="illustration">
              <svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="80" r="60" fill="rgba(44,181,160,0.08)" />
                <circle cx="100" cy="80" r="40" fill="rgba(44,181,160,0.12)" />
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
                <label class="field-label" for="fp-email">Email</label>
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
                      class="input-error-icon"
                      lucideCircleAlert
                      [size]="18"
                      [strokeWidth]="1.8"
                    ></svg>
                  }
                </div>
                @if (emailTouched() && emailError()) {
                  <span class="field-error" id="fp-email-error">{{ emailError() }}</span>
                }
              </div>

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
          [class.enter-right]="step() === 'email'"
        >
          <div class="step-inner">
            <button class="nav-back" (click)="backToEmail()" aria-label="Go back">
              <svg lucideArrowLeft [size]="22" [strokeWidth]="1.8"></svg>
            </button>

            <div class="illustration">
              <svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="80" r="60" fill="rgba(44,181,160,0.08)" />
                <circle cx="100" cy="80" r="40" fill="rgba(44,181,160,0.12)" />
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

            <div class="otp-group">
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
                />
              }
            </div>

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
      </div>
    </ion-content>
  `,
  styleUrl: './forgot-password.page.scss',
})
export class ForgotPasswordPage implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = new FormBuilder();
  private readonly router = inject(Router);

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  readonly otpLength = OTP_LENGTH;
  readonly otpDigits = Array.from({ length: OTP_LENGTH });

  readonly step = signal<'email' | 'otp'>('email');
  readonly emailTouched = signal(false);
  readonly isSending = signal(false);
  readonly isVerifying = signal(false);
  readonly canResend = signal(false);
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

  private readonly _email = signal('');

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

  constructor() {
    this.emailForm.controls.email.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this._email.set(v));
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
    // TODO: wire to auth service
    setTimeout(() => {
      this.isSending.set(false);
      this.step.set('otp');
      this.startResendTimer();
    }, 1200);
  }

  backToEmail(): void {
    this.step.set('email');
    this.otpValues.set(Array(this.otpLength).fill(''));
    this.clearResendTimer();
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

    const vals = [...this.otpValues()];
    for (let i = 0; i < this.otpLength; i++) {
      vals[i] = pasted[i] || '';
    }
    this.otpValues.set(vals);

    const inputs = this.otpInputs.toArray();
    const focusIdx = Math.min(pasted.length, this.otpLength - 1);
    inputs[focusIdx]?.nativeElement.focus();
  }

  onOtpFocus(index: number): void {
    const inputs = this.otpInputs.toArray();
    inputs[index]?.nativeElement.select();
  }

  onVerifyOtp(): void {
    if (!this.otpComplete() || this.isVerifying()) return;
    this.isVerifying.set(true);
    // TODO: wire to auth service — verify OTP code
  }

  resendCode(): void {
    if (!this.canResend()) return;
    this.canResend.set(false);
    this.startResendTimer();
    // TODO: wire to auth service — resend code
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
