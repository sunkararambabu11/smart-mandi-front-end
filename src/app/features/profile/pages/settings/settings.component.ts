/**
 * Settings Page Component
 * =======================
 * User app settings, preferences, and notifications configuration.
 */

import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface NotificationSettings {
  orderUpdates: boolean;
  bidAlerts: boolean;
  priceAlerts: boolean;
  promotions: boolean;
  newsletter: boolean;
  smsNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

interface AppPreferences {
  language: string;
  currency: string;
  theme: 'light' | 'dark' | 'system';
  compactView: boolean;
}

@Component({
  selector: 'smc-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private readonly snackBar = inject(MatSnackBar);

  readonly isSaving = signal(false);

  readonly notifications = signal<NotificationSettings>({
    orderUpdates: true,
    bidAlerts: true,
    priceAlerts: false,
    promotions: true,
    newsletter: false,
    smsNotifications: true,
    emailNotifications: true,
    pushNotifications: true,
  });

  readonly preferences = signal<AppPreferences>({
    language: 'en',
    currency: 'INR',
    theme: 'light',
    compactView: false,
  });

  readonly languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिंदी' },
    { code: 'mr', name: 'Marathi', native: 'मराठी' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  ];

  readonly themes: { value: 'light' | 'dark' | 'system'; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: 'light_mode' },
    { value: 'dark', label: 'Dark', icon: 'dark_mode' },
    { value: 'system', label: 'System', icon: 'settings_brightness' },
  ];

  updateNotification(key: keyof NotificationSettings, value: boolean): void {
    this.notifications.update(n => ({ ...n, [key]: value }));
    this.autoSave();
  }

  updatePreference<K extends keyof AppPreferences>(key: K, value: AppPreferences[K]): void {
    this.preferences.update(p => ({ ...p, [key]: value }));
    this.autoSave();
  }

  private autoSave(): void {
    // Simulate auto-save
    this.isSaving.set(true);
    setTimeout(() => {
      this.isSaving.set(false);
    }, 500);
  }

  saveSettings(): void {
    this.isSaving.set(true);
    setTimeout(() => {
      this.isSaving.set(false);
      this.snackBar.open('Settings saved successfully', 'Close', { duration: 3000 });
    }, 1000);
  }

  resetToDefaults(): void {
    this.notifications.set({
      orderUpdates: true,
      bidAlerts: true,
      priceAlerts: false,
      promotions: true,
      newsletter: false,
      smsNotifications: true,
      emailNotifications: true,
      pushNotifications: true,
    });
    this.preferences.set({
      language: 'en',
      currency: 'INR',
      theme: 'light',
      compactView: false,
    });
    this.snackBar.open('Settings reset to defaults', 'Close', { duration: 3000 });
  }
}
