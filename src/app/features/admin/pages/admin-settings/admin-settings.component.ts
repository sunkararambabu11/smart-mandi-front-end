/**
 * Admin Settings Page Component
 * ==============================
 * Platform configuration, system settings, and admin preferences.
 */

import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface PlatformSettings {
  siteName: string;
  siteDescription: string;
  supportEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  requirePhoneVerification: boolean;
  defaultLanguage: string;
  defaultCurrency: string;
}

interface CommissionSettings {
  farmerCommission: number;
  buyerCommission: number;
  minOrderValue: number;
  maxOrderValue: number;
  paymentMethods: string[];
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  adminAlerts: boolean;
  dailyReports: boolean;
  weeklyReports: boolean;
}

@Component({
  selector: 'smc-admin-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly selectedTab = signal(0);
  readonly isSaving = signal(false);

  readonly platformSettings = signal<PlatformSettings>({
    siteName: 'Smart Mandi Connect',
    siteDescription: 'Direct farm-to-buyer agricultural marketplace',
    supportEmail: 'support@smartmandi.com',
    supportPhone: '+91 1800 123 4567',
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
    requirePhoneVerification: false,
    defaultLanguage: 'en',
    defaultCurrency: 'INR',
  });

  readonly commissionSettings = signal<CommissionSettings>({
    farmerCommission: 2.5,
    buyerCommission: 1.5,
    minOrderValue: 100,
    maxOrderValue: 500000,
    paymentMethods: ['upi', 'netbanking', 'card', 'cod'],
  });

  readonly notificationSettings = signal<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    adminAlerts: true,
    dailyReports: false,
    weeklyReports: true,
  });

  readonly languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'mr', name: 'Marathi' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'ta', name: 'Tamil' },
  ];

  readonly currencies = [
    { code: 'INR', name: 'Indian Rupee (₹)' },
    { code: 'USD', name: 'US Dollar ($)' },
  ];

  readonly paymentOptions = [
    { value: 'upi', label: 'UPI', icon: 'account_balance' },
    { value: 'netbanking', label: 'Net Banking', icon: 'account_balance' },
    { value: 'card', label: 'Credit/Debit Card', icon: 'credit_card' },
    { value: 'cod', label: 'Cash on Delivery', icon: 'payments' },
  ];

  updatePlatformSetting<K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]): void {
    this.platformSettings.update(s => ({ ...s, [key]: value }));
  }

  updateCommissionSetting<K extends keyof CommissionSettings>(key: K, value: CommissionSettings[K]): void {
    this.commissionSettings.update(s => ({ ...s, [key]: value }));
  }

  updateNotificationSetting<K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]): void {
    this.notificationSettings.update(s => ({ ...s, [key]: value }));
  }

  togglePaymentMethod(method: string): void {
    this.commissionSettings.update(s => {
      const methods = s.paymentMethods.includes(method)
        ? s.paymentMethods.filter(m => m !== method)
        : [...s.paymentMethods, method];
      return { ...s, paymentMethods: methods };
    });
  }

  saveSettings(): void {
    this.isSaving.set(true);
    
    // Simulate API call
    setTimeout(() => {
      this.isSaving.set(false);
      this.snackBar.open('Settings saved successfully', 'Close', { duration: 3000 });
    }, 1000);
  }

  resetToDefaults(): void {
    this.platformSettings.set({
      siteName: 'Smart Mandi Connect',
      siteDescription: 'Direct farm-to-buyer agricultural marketplace',
      supportEmail: 'support@smartmandi.com',
      supportPhone: '+91 1800 123 4567',
      maintenanceMode: false,
      allowRegistration: true,
      requireEmailVerification: true,
      requirePhoneVerification: false,
      defaultLanguage: 'en',
      defaultCurrency: 'INR',
    });
    this.snackBar.open('Settings reset to defaults', 'Close', { duration: 3000 });
  }
}
