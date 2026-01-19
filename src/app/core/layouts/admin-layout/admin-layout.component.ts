/**
 * Admin Layout Component (Smart)
 * 
 * Layout for admin panel with admin-specific navigation.
 */

import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';

import { AuthService } from '@core/services/auth.service';

interface AdminNavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'smc-admin-layout',
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
    MatDividerModule,
    MatTooltipModule,
    MatListModule,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent {
  readonly authService = inject(AuthService);

  readonly navItems: AdminNavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' },
    { label: 'Users', icon: 'people', route: '/admin/users', badge: 12 },
    { label: 'Products', icon: 'inventory', route: '/admin/products', badge: 5 },
    { label: 'Categories', icon: 'category', route: '/admin/categories' },
    { label: 'Reports', icon: 'analytics', route: '/admin/reports' },
    { label: 'Settings', icon: 'settings', route: '/admin/settings' },
  ];
}

