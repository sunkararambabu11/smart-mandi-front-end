/**
 * User Management Page Component
 * ===============================
 * Admin page for managing users, viewing accounts, and moderation.
 */

import { Component, ChangeDetectionStrategy, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'farmer' | 'buyer' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  verified: boolean;
  joinedAt: Date;
  lastActive: Date;
  ordersCount: number;
  avatar?: string;
}

@Component({
  selector: 'smc-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatDividerModule,
  ],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagementComponent implements OnInit {
  private readonly snackBar = inject(MatSnackBar);

  readonly isLoading = signal(true);
  readonly searchQuery = signal('');
  readonly roleFilter = signal<string>('all');
  readonly statusFilter = signal<string>('all');

  readonly users = signal<User[]>([]);
  readonly pageSize = signal(10);
  readonly pageIndex = signal(0);
  readonly totalUsers = signal(0);

  readonly displayedColumns = ['user', 'role', 'status', 'joined', 'activity', 'actions'];

  readonly stats = computed(() => {
    const allUsers = this.users();
    return {
      total: allUsers.length,
      farmers: allUsers.filter(u => u.role === 'farmer').length,
      buyers: allUsers.filter(u => u.role === 'buyer').length,
      suspended: allUsers.filter(u => u.status === 'suspended').length,
    };
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.isLoading.set(true);

    // Simulate API call
    setTimeout(() => {
      const mockUsers: User[] = [
        {
          id: '1',
          fullName: 'Ramesh Patil',
          email: 'ramesh.patil@email.com',
          phone: '+91 98765 43210',
          role: 'farmer',
          status: 'active',
          verified: true,
          joinedAt: new Date('2024-01-15'),
          lastActive: new Date(),
          ordersCount: 45,
        },
        {
          id: '2',
          fullName: 'Priya Sharma',
          email: 'priya.sharma@email.com',
          phone: '+91 87654 32109',
          role: 'buyer',
          status: 'active',
          verified: true,
          joinedAt: new Date('2024-02-20'),
          lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          ordersCount: 12,
        },
        {
          id: '3',
          fullName: 'Suresh Kumar',
          email: 'suresh.kumar@email.com',
          phone: '+91 76543 21098',
          role: 'farmer',
          status: 'pending',
          verified: false,
          joinedAt: new Date('2024-03-10'),
          lastActive: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          ordersCount: 0,
        },
        {
          id: '4',
          fullName: 'Vikram Singh',
          email: 'vikram.singh@email.com',
          phone: '+91 65432 10987',
          role: 'buyer',
          status: 'suspended',
          verified: true,
          joinedAt: new Date('2023-12-01'),
          lastActive: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          ordersCount: 3,
        },
        {
          id: '5',
          fullName: 'Anita Desai',
          email: 'anita.desai@email.com',
          phone: '+91 54321 09876',
          role: 'admin',
          status: 'active',
          verified: true,
          joinedAt: new Date('2023-06-15'),
          lastActive: new Date(),
          ordersCount: 0,
        },
      ];

      this.users.set(mockUsers);
      this.totalUsers.set(mockUsers.length);
      this.isLoading.set(false);
    }, 600);
  }

  get filteredUsers(): User[] {
    let result = this.users();
    
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      result = result.filter(u => 
        u.fullName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.phone.includes(query)
      );
    }
    
    if (this.roleFilter() !== 'all') {
      result = result.filter(u => u.role === this.roleFilter());
    }
    
    if (this.statusFilter() !== 'all') {
      result = result.filter(u => u.status === this.statusFilter());
    }
    
    return result;
  }

  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }

  onSort(sort: Sort): void {
    // Handle sorting
  }

  onViewUser(user: User): void {
    this.snackBar.open(`Viewing ${user.fullName}`, 'Close', { duration: 2000 });
  }

  onEditUser(user: User): void {
    this.snackBar.open(`Editing ${user.fullName}`, 'Close', { duration: 2000 });
  }

  onSuspendUser(user: User): void {
    this.users.update(list =>
      list.map(u => u.id === user.id ? { ...u, status: 'suspended' as const } : u)
    );
    this.snackBar.open(`${user.fullName} has been suspended`, 'Undo', { duration: 3000 });
  }

  onActivateUser(user: User): void {
    this.users.update(list =>
      list.map(u => u.id === user.id ? { ...u, status: 'active' as const } : u)
    );
    this.snackBar.open(`${user.fullName} has been activated`, 'Close', { duration: 3000 });
  }

  onVerifyUser(user: User): void {
    this.users.update(list =>
      list.map(u => u.id === user.id ? { ...u, verified: true, status: 'active' as const } : u)
    );
    this.snackBar.open(`${user.fullName} has been verified`, 'Close', { duration: 3000 });
  }

  onDeleteUser(user: User): void {
    this.users.update(list => list.filter(u => u.id !== user.id));
    this.snackBar.open(`${user.fullName} has been deleted`, 'Undo', { duration: 3000 });
  }

  getRoleIcon(role: string): string {
    const icons: Record<string, string> = {
      farmer: 'agriculture',
      buyer: 'shopping_bag',
      admin: 'admin_panel_settings',
    };
    return icons[role] || 'person';
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      active: 'success',
      suspended: 'error',
      pending: 'warning',
    };
    return colors[status] || 'default';
  }

  trackByUserId(_index: number, user: User): string {
    return user.id;
  }
}
