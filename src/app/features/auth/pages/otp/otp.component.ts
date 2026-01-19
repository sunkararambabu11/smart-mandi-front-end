/**
 * OTP Verification Component
 * ==========================
 * 6-digit OTP input with auto-focus and countdown timer.
 * Mobile-first design with beautiful animations.
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  ViewChildren,
  QueryList,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'smc-otp',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './otp.component.html',
  styleUrl: './otp.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OtpComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  /** OTP input references */
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  /** Number of OTP digits */
  readonly OTP_LENGTH = 6;

  /** OTP Form with individual digit controls */
  readonly otpForm: FormGroup = this.fb.group({
    digits: this.fb.array(
      Array(this.OTP_LENGTH)
        .fill('')
        .map(() =>
          this.fb.control('', [
            Validators.required,
            Validators.pattern(/^\d$/),
          ])
        )
    ),
  });

  /** Countdown timer in seconds */
  readonly countdown = signal(0);

  /** Track if OTP is complete - updated manually when digits change */
  readonly otpComplete = signal(false);

  /** Timer interval reference */
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  /** Formatted phone number for display */
  readonly formattedPhone = computed(() => {
    const phone = this.authService.pendingPhone();
    if (!phone) return '';
    return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
  });

  /** Can resend OTP */
  readonly canResend = computed(() => this.countdown() === 0);

  /** Formatted countdown */
  readonly formattedCountdown = computed(() => {
    const seconds = this.countdown();
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  });

  /** Get digits form array */
  get digitsArray(): FormArray {
    return this.otpForm.get('digits') as FormArray;
  }

  /** Get full OTP string */
  get otpValue(): string {
    return this.digitsArray.controls.map((c) => c.value).join('');
  }

  ngOnInit(): void {
    this.startCountdown();
  }

  ngAfterViewInit(): void {
    // Focus first input
    setTimeout(() => {
      this.focusInput(0);
    }, 100);
  }

  ngOnDestroy(): void {
    this.stopCountdown();
  }

  /** Handle digit input */
  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Only allow single digit
    if (value.length > 1) {
      input.value = value.slice(-1);
      this.digitsArray.at(index).setValue(value.slice(-1));
    }

    // Move to next input if digit entered
    if (value && index < this.OTP_LENGTH - 1) {
      this.focusInput(index + 1);
    }

    // Update the otpComplete signal
    this.updateOtpComplete();

    // Auto-submit when complete
    if (this.otpComplete()) {
      this.onSubmit();
    }
  }

  /** Update the OTP complete signal */
  private updateOtpComplete(): void {
    const digits = this.digitsArray.controls;
    const complete = digits.every((control) => control.valid && control.value);
    this.otpComplete.set(complete);
  }

  /** Handle keydown for backspace navigation */
  onKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace') {
      if (!input.value && index > 0) {
        // Move to previous input on backspace if current is empty
        event.preventDefault();
        this.focusInput(index - 1);
        this.digitsArray.at(index - 1).setValue('');
      }
      // Update OTP complete state after backspace
      setTimeout(() => this.updateOtpComplete(), 0);
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusInput(index - 1);
    } else if (event.key === 'ArrowRight' && index < this.OTP_LENGTH - 1) {
      event.preventDefault();
      this.focusInput(index + 1);
    }
  }

  /** Handle paste event */
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, this.OTP_LENGTH);

    if (digits) {
      digits.split('').forEach((digit, i) => {
        if (i < this.OTP_LENGTH) {
          this.digitsArray.at(i).setValue(digit);
        }
      });

      // Focus last filled or next empty
      const focusIndex = Math.min(digits.length, this.OTP_LENGTH - 1);
      this.focusInput(focusIndex);

      // Update OTP complete state
      this.updateOtpComplete();

      // Auto-submit if complete
      if (this.otpComplete()) {
        setTimeout(() => this.onSubmit(), 100);
      }
    }
  }

  /** Focus specific input */
  private focusInput(index: number): void {
    const inputs = this.otpInputs?.toArray();
    if (inputs && inputs[index]) {
      inputs[index].nativeElement.focus();
      inputs[index].nativeElement.select();
    }
  }

  /** Submit OTP */
  onSubmit(): void {
    if (!this.otpComplete()) {
      return;
    }

    this.authService.verifyOtp(this.otpValue).subscribe({
      next: () => {
        // Navigation handled by AuthService
      },
      error: (err) => {
        console.error('OTP verification failed:', err);
        // Clear OTP inputs on error
        this.clearOtp();
      },
    });
  }

  /** Resend OTP */
  onResend(): void {
    if (!this.canResend()) {
      return;
    }

    this.authService.resendOtp().subscribe({
      next: () => {
        this.startCountdown();
        this.clearOtp();
        this.focusInput(0);
      },
      error: (err) => {
        console.error('Resend OTP failed:', err);
      },
    });
  }

  /** Clear all OTP inputs */
  private clearOtp(): void {
    this.digitsArray.controls.forEach((control) => control.setValue(''));
    this.otpComplete.set(false);
    setTimeout(() => this.focusInput(0), 100);
  }

  /** Go back to login */
  goBack(): void {
    this.authService.clearOtpState();
    this.router.navigate(['/auth/login']);
  }

  /** Start countdown timer */
  private startCountdown(): void {
    this.stopCountdown();

    const expiresAt = this.authService.otpExpiresAt();
    if (!expiresAt) {
      this.countdown.set(300); // Default 5 minutes
    } else {
      const remaining = Math.max(
        0,
        Math.floor((expiresAt.getTime() - Date.now()) / 1000)
      );
      this.countdown.set(remaining);
    }

    this.timerInterval = setInterval(() => {
      const current = this.countdown();
      if (current > 0) {
        this.countdown.set(current - 1);
      } else {
        this.stopCountdown();
      }
    }, 1000);
  }

  /** Stop countdown timer */
  private stopCountdown(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}


