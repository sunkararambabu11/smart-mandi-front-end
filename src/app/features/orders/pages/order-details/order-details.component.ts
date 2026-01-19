/**
 * Order Details Component
 * =======================
 * Displays detailed order information with timeline.
 */

import { Component, ChangeDetectionStrategy, input, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

import { OrdersService, Order } from '../../services/orders.service';

@Component({
  selector: 'smc-order-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailsComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);

  readonly id = input.required<string>();

  readonly isLoading = signal(true);
  readonly order = signal<Order | null>(null);

  ngOnInit(): void {
    this.loadOrder();
  }

  private loadOrder(): void {
    this.isLoading.set(true);
    
    // Simulate API call
    setTimeout(() => {
      // In real app, fetch from service
      this.isLoading.set(false);
    }, 500);
  }
}
