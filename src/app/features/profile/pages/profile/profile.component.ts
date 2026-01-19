/**
 * Profile Page Component
 * ======================
 * User profile overview with personal info, stats, and quick actions.
 */

import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { AuthService } from '@core/services/auth.service';

interface ProfileStats {
  totalOrders: number;
  activeListings: number;
  totalEarnings: number;
  rating: number;
  reviewsCount: number;
}

@Component({
  selector: 'smc-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressBarModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  readonly authService = inject(AuthService);

  readonly isLoading = signal(true);
  readonly stats = signal<ProfileStats>({
    totalOrders: 0,
    activeListings: 0,
    totalEarnings: 0,
    rating: 0,
    reviewsCount: 0,
  });

  readonly quickActions = [
    { icon: 'edit', label: 'Edit Profile', route: '/profile/edit', color: 'primary' },
    { icon: 'location_on', label: 'Addresses', route: '/profile/addresses', color: 'accent' },
    { icon: 'settings', label: 'Settings', route: '/profile/settings', color: 'warn' },
    { icon: 'security', label: 'Security', route: '/profile/security', color: 'primary' },
  ];

  ngOnInit(): void {
    // Simulate loading profile data
    setTimeout(() => {
      this.stats.set({
        totalOrders: 24,
        activeListings: 8,
        totalEarnings: 125000,
        rating: 4.8,
        reviewsCount: 156,
      });
      this.isLoading.set(false);
    }, 500);
  }

  get profileCompletion(): number {
    // Calculate based on filled fields
    const user = this.authService.currentUser();
    if (!user) return 0;
    
    let filled = 0;
    if (user.fullName) filled++;
    if (user.email) filled++;
    if (user.profile?.phoneNumber) filled++;
    if (user.profile?.avatarUrl) filled++;
    
    return Math.round((filled / 4) * 100);
  }
}
