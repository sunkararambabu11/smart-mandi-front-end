/**
 * Top Products List Component
 * ===========================
 * Displays top performing products.
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule, DecimalPipe, CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { TopProduct } from '../../services/admin-dashboard.service';

@Component({
  selector: 'smc-top-products-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, DecimalPipe, CurrencyPipe],
  templateUrl: './top-products-list.component.html',
  styleUrl: './top-products-list.component.scss',
    .products-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .product-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: #f9f9f9;
      border-radius: 10px;
      transition: background 0.2s;

      &:hover {
        background: #f0f0f0;
      }
    }

    .rank {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1b5e20;
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: 6px;

      .product-item:nth-child(1) & { background: #ffc107; color: #333; }
      .product-item:nth-child(2) & { background: #9e9e9e; color: white; }
      .product-item:nth-child(3) & { background: #cd7f32; color: white; }
    }

    .product-image {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      overflow: hidden;
      background: #eee;
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      mat-icon {
        color: #999;
      }
    }

    .product-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;

      .product-name {
        font-size: 0.875rem;
        font-weight: 600;
        color: #333;
      }

      .product-category {
        font-size: 0.75rem;
        color: #999;
      }
    }

    .product-stats {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.125rem;

      .revenue {
        font-size: 0.875rem;
        font-weight: 700;
        color: #1b5e20;
      }

      .orders {
        font-size: 0.6875rem;
        color: #999;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopProductsListComponent {
  readonly products = input.required<TopProduct[]>();
}

