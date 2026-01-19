/**
 * Addresses Page Component
 * ========================
 * Manage user delivery and billing addresses.
 */

import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault: boolean;
  type: 'home' | 'work' | 'other';
}

@Component({
  selector: 'smc-addresses',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './addresses.component.html',
  styleUrl: './addresses.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressesComponent {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly isLoading = signal(false);
  
  readonly addresses = signal<Address[]>([
    {
      id: '1',
      label: 'Home',
      fullName: 'Ramesh Patil',
      phone: '+91 98765 43210',
      addressLine1: '123, Green Valley Apartments',
      addressLine2: 'Near City Mall',
      city: 'Nashik',
      state: 'Maharashtra',
      pincode: '422001',
      landmark: 'Opposite SBI Bank',
      isDefault: true,
      type: 'home',
    },
    {
      id: '2',
      label: 'Farm',
      fullName: 'Ramesh Patil',
      phone: '+91 98765 43210',
      addressLine1: 'Survey No. 45, Village Road',
      city: 'Sinnar',
      state: 'Maharashtra',
      pincode: '422103',
      isDefault: false,
      type: 'work',
    },
  ]);

  readonly addressTypeIcons: Record<string, string> = {
    home: 'home',
    work: 'business',
    other: 'location_on',
  };

  onAddAddress(): void {
    // TODO: Open add address dialog
    this.snackBar.open('Add address dialog coming soon', 'Close', { duration: 3000 });
  }

  onEditAddress(address: Address): void {
    // TODO: Open edit address dialog
    this.snackBar.open(`Editing: ${address.label}`, 'Close', { duration: 3000 });
  }

  onDeleteAddress(address: Address): void {
    // TODO: Confirm and delete
    this.addresses.update(addrs => addrs.filter(a => a.id !== address.id));
    this.snackBar.open('Address deleted', 'Undo', { duration: 3000 });
  }

  onSetDefault(address: Address): void {
    this.addresses.update(addrs => 
      addrs.map(a => ({ ...a, isDefault: a.id === address.id }))
    );
    this.snackBar.open(`${address.label} set as default`, 'Close', { duration: 3000 });
  }

  trackByAddressId(_index: number, address: Address): string {
    return address.id;
  }
}
