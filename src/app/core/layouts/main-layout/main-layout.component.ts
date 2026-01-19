/**
 * Main Layout Component (Smart)
 * 
 * Primary layout for authenticated users.
 * Includes header, sidebar, and main content area.
 */

import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';

import { AuthService } from '@core/services/auth.service';
import { UserRole } from '@domain/models/user.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: UserRole[];
  badge?: number;
}

@Component({
  selector: 'smc-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatTooltipModule,
    MatListModule,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
      <!-- Sidebar -->
      <mat-sidenav
        #sidenav
        [mode]="sidenavMode()"
        [opened]="sidenavOpened()"
        (closedStart)="sidenavOpened.set(false)"
        class="w-64 border-r border-gray-200"
      >
        <!-- Logo -->
        <div class="p-4 border-b border-gray-200">
          <a routerLink="/dashboard" class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <span class="text-white font-bold text-lg">🌾</span>
            </div>
            <div>
              <h1 class="font-display font-bold text-primary-700 text-lg leading-tight">
                Smart Mandi
              </h1>
              <span class="text-xs text-gray-500">Connect</span>
            </div>
          </a>
        </div>

        <!-- Navigation -->
        <nav class="p-3 flex-1">
          <ul class="space-y-1">
            @for (item of visibleNavItems(); track item.route) {
              <li>
                <a
                  [routerLink]="item.route"
                  routerLinkActive="bg-primary-50 text-primary-700 border-primary-200"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 
                         hover:bg-gray-100 transition-colors border border-transparent"
                >
                  <mat-icon class="text-xl">{{ item.icon }}</mat-icon>
                  <span class="font-medium">{{ item.label }}</span>
                  @if (item.badge) {
                    <span class="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {{ item.badge }}
                    </span>
                  }
                </a>
              </li>
            }
          </ul>
        </nav>

        <!-- User Info -->
        <div class="p-4 border-t border-gray-200">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center
                     text-primary-700 font-semibold"
            >
              {{ authService.displayName().charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ authService.displayName() }}
              </p>
              <p class="text-xs text-gray-500 capitalize">
                {{ authService.userRole() }}
              </p>
            </div>
          </div>
        </div>
      </mat-sidenav>

      <!-- Main Content -->
      <mat-sidenav-content class="flex flex-col bg-gray-50">
        <!-- Header -->
        <header
          class="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 lg:px-6"
        >
          <div class="flex items-center justify-between h-16">
            <!-- Left: Menu Toggle & Search -->
            <div class="flex items-center gap-4">
              <button
                mat-icon-button
                (click)="toggleSidenav()"
                class="lg:hidden"
              >
                <mat-icon>menu</mat-icon>
              </button>

              <!-- Search Bar -->
              <div class="hidden sm:flex items-center">
                <div class="relative">
                  <mat-icon
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    search
                  </mat-icon>
                  <input
                    type="text"
                    placeholder="Search products, farmers..."
                    class="w-64 lg:w-80 pl-10 pr-4 py-2 rounded-lg border border-gray-300 
                           focus:border-primary-500 focus:ring-2 focus:ring-primary-200 
                           outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <!-- Right: Actions -->
            <div class="flex items-center gap-2">
              <!-- Mobile Search -->
              <button mat-icon-button class="sm:hidden">
                <mat-icon>search</mat-icon>
              </button>

              <!-- Notifications -->
              <button mat-icon-button matTooltip="Notifications" routerLink="/notifications">
                <mat-icon matBadge="3" matBadgeColor="warn" matBadgeSize="small">
                  notifications_outlined
                </mat-icon>
              </button>

              <!-- Messages -->
              <button mat-icon-button matTooltip="Messages" routerLink="/messages">
                <mat-icon matBadge="2" matBadgeColor="accent" matBadgeSize="small">
                  chat_bubble_outline
                </mat-icon>
              </button>

              <!-- Cart (Buyer only) -->
              @if (authService.isBuyer()) {
                <button mat-icon-button matTooltip="Cart" routerLink="/cart">
                  <mat-icon matBadge="5" matBadgeColor="primary" matBadgeSize="small">
                    shopping_cart_outlined
                  </mat-icon>
                </button>
              }

              <mat-divider vertical class="h-8 mx-2"></mat-divider>

              <!-- User Menu -->
              <button mat-button [matMenuTriggerFor]="userMenu" class="!px-2">
                <div class="flex items-center gap-2">
                  <div
                    class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center
                           text-primary-700 font-semibold text-sm"
                  >
                    {{ authService.displayName().charAt(0).toUpperCase() }}
                  </div>
                  <span class="hidden md:inline text-sm font-medium">
                    {{ authService.displayName() }}
                  </span>
                  <mat-icon class="text-gray-400">arrow_drop_down</mat-icon>
                </div>
              </button>

              <mat-menu #userMenu="matMenu" xPosition="before">
                <a mat-menu-item routerLink="/profile">
                  <mat-icon>person_outlined</mat-icon>
                  <span>My Profile</span>
                </a>
                <a mat-menu-item routerLink="/profile/settings">
                  <mat-icon>settings_outlined</mat-icon>
                  <span>Settings</span>
                </a>
                @if (authService.isAdmin()) {
                  <mat-divider></mat-divider>
                  <a mat-menu-item routerLink="/admin">
                    <mat-icon>admin_panel_settings</mat-icon>
                    <span>Admin Panel</span>
                  </a>
                }
                <mat-divider></mat-divider>
                <button mat-menu-item (click)="authService.logout()">
                  <mat-icon>logout</mat-icon>
                  <span>Logout</span>
                </button>
              </mat-menu>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 p-4 lg:p-6 overflow-auto">
          <div class="page-enter">
            <router-outlet />
          </div>
        </main>

        <!-- Footer -->
        <footer class="py-4 px-6 text-center text-sm text-gray-500 border-t border-gray-200 bg-white">
          © 2024 Smart Mandi Connect. All rights reserved.
        </footer>
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  readonly authService = inject(AuthService);

  readonly sidenavOpened = signal(true);
  readonly sidenavMode = signal<'side' | 'over'>('side');

  private readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Marketplace', icon: 'storefront', route: '/marketplace' },
    {
      label: 'My Products',
      icon: 'inventory_2',
      route: '/products',
      roles: [UserRole.FARMER],
    },
    {
      label: 'Add Product',
      icon: 'add_circle_outline',
      route: '/products/new',
      roles: [UserRole.FARMER],
    },
    { label: 'Orders', icon: 'receipt_long', route: '/orders', badge: 2 },
    {
      label: 'Cart',
      icon: 'shopping_cart',
      route: '/cart',
      roles: [UserRole.BUYER],
      badge: 5,
    },
    { label: 'Messages', icon: 'chat', route: '/messages', badge: 3 },
    { label: 'Profile', icon: 'person', route: '/profile' },
  ];

  readonly visibleNavItems = signal(
    this.navItems.filter(
      (item) => !item.roles || this.authService.hasRole(item.roles)
    )
  );

  constructor() {
    // Adjust sidenav based on screen size
    this.checkScreenSize();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.checkScreenSize());
    }
  }

  toggleSidenav(): void {
    this.sidenavOpened.update((opened) => !opened);
  }

  private checkScreenSize(): void {
    if (typeof window === 'undefined') return;

    if (window.innerWidth < 1024) {
      this.sidenavMode.set('over');
      this.sidenavOpened.set(false);
    } else {
      this.sidenavMode.set('side');
      this.sidenavOpened.set(true);
    }
  }
}

