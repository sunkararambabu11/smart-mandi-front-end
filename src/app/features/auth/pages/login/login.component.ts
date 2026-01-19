/**
 * Login Page Component
 * ====================
 * Mobile number entry for OTP-based authentication.
 * Also supports username/password login.
 * Mobile-first design with beautiful UI.
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  DestroyRef,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '@core/services/auth.service';

type LoginMode = 'phoneNumber' | 'username';

@Component({
  selector: 'smc-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'role': 'main',
    '[attr.aria-label]': '"Login to Smart Mandi Connect"',
  },
})
export class LoginComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly authService = inject(AuthService);

  @ViewChild('phoneNumberInput') phoneNumberInput!: ElementRef<HTMLInputElement>;
  @ViewChild('usernameInput') usernameInput!: ElementRef<HTMLInputElement>;

  /** Current login mode */
  readonly loginMode = signal<LoginMode>('phoneNumber');

  /** Show password toggle */
  readonly showPassword = signal(false);

  /** phoneNumber login form */
  readonly phoneNumberForm: FormGroup = this.fb.group({
    phoneNumberNumber: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[6-9]\d{9}$/), // Indian mobile number
      ],
    ],
  });

  /** Username login form */
  readonly usernameForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  /** Form submitted state */
  readonly submitted = signal(false);

  /** Error message for screen readers */
  readonly errorAnnouncement = signal('');

  ngOnInit(): void {
    // Clear any previous OTP state
    this.authService.clearOtpState();
  }

  ngAfterViewInit(): void {
    // Focus appropriate input for immediate interaction
    setTimeout(() => {
      if (this.loginMode() === 'phoneNumber') {
        this.phoneNumberInput?.nativeElement?.focus();
      } else {
        this.usernameInput?.nativeElement?.focus();
      }
    }, 100);
  }

  /** Switch login mode */
  switchMode(mode: LoginMode): void {
    this.loginMode.set(mode);
    this.submitted.set(false);
    this.errorAnnouncement.set('');
    this.authService.clearError();
    
    // Focus the appropriate input
    setTimeout(() => {
      if (mode === 'phoneNumber') {
        this.phoneNumberInput?.nativeElement?.focus();
      } else {
        this.usernameInput?.nativeElement?.focus();
      }
    }, 100);
  }

  /** Toggle password visibility */
  togglePasswordVisibility(): void {
    this.showPassword.update((show) => !show);
  }

  /** Get phoneNumber form controls */
  get phoneNumberControls() {
    return this.phoneNumberForm.controls;
  }

  /** Get username form controls */
  get usernameControls() {
    return this.usernameForm.controls;
  }

  /** Check if phoneNumber number is valid */
  get isphoneNumberValid(): boolean {
    return this.phoneNumberControls['phoneNumberNumber'].valid;
  }

  /** Get error message for phoneNumber number */
  get phoneNumberErrorMessage(): string {
    const control = this.phoneNumberControls['phoneNumberNumber'];
    if (control.hasError('required')) {
      return 'phoneNumber number is required';
    }
    if (control.hasError('pattern')) {
      return 'Please enter a valid 10-digit Indian mobile number';
    }
    return '';
  }

  /** Submit phoneNumber login form */
  onphoneNumberSubmit(): void {
    this.submitted.set(true);

    if (this.phoneNumberForm.invalid) {
      this.errorAnnouncement.set(this.phoneNumberErrorMessage);
      this.phoneNumberInput?.nativeElement?.focus();
      return;
    }

    const phoneNumberNumber = this.phoneNumberControls['phoneNumberNumber'].value;

    this.authService
      .requestOtp(phoneNumberNumber)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.router.navigate(['/auth/otp']);
        },
        error: (err) => {
          console.error('OTP request failed:', err);
          this.errorAnnouncement.set('Failed to send OTP. Please try again.');
        },
      });
  }

  /** Submit username login form */
  onUsernameSubmit(): void {
    this.submitted.set(true);

    if (this.usernameForm.invalid) {
      this.usernameInput?.nativeElement?.focus();
      return;
    }

    const { username, password } = this.usernameForm.getRawValue();

    this.authService
      .loginWithEmail(username, password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // Navigation handled by auth service
        },
        error: (err) => {
          console.error('Login failed:', err);
          this.errorAnnouncement.set('Invalid email or password.');
        },
      });
  }

  /** Format phoneNumber number input */
  onphoneNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 10) {
      value = value.slice(0, 10);
    }
    this.phoneNumberControls['phoneNumberNumber'].setValue(value);
    this.errorAnnouncement.set('');
  }

  /** Handle keyboard navigation */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      if (this.loginMode() === 'phoneNumber' && this.isphoneNumberValid) {
        this.onphoneNumberSubmit();
      }
    }
  }
}
