/**
 * Category Management Page Component
 * ===================================
 * Admin tool for managing product categories.
 */

import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  productCount: number;
  isActive: boolean;
}

@Component({
  selector: 'smc-category-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSlideToggleModule,
  ],
  templateUrl: './category-management.component.html',
  styleUrl: './category-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryManagementComponent {
  /** Search query */
  readonly searchQuery = signal('');

  /** Categories list */
  readonly categories = signal<Category[]>([
    {
      id: '1',
      name: 'Vegetables',
      icon: 'eco',
      description: 'Fresh vegetables from local farms',
      productCount: 245,
      isActive: true,
    },
    {
      id: '2',
      name: 'Fruits',
      icon: 'nutrition',
      description: 'Seasonal and exotic fruits',
      productCount: 189,
      isActive: true,
    },
    {
      id: '3',
      name: 'Grains',
      icon: 'grain',
      description: 'Rice, wheat, and other grains',
      productCount: 156,
      isActive: true,
    },
    {
      id: '4',
      name: 'Pulses',
      icon: 'spa',
      description: 'Lentils, beans, and legumes',
      productCount: 98,
      isActive: true,
    },
    {
      id: '5',
      name: 'Spices',
      icon: 'local_fire_department',
      description: 'Fresh and dried spices',
      productCount: 134,
      isActive: true,
    },
    {
      id: '6',
      name: 'Dairy',
      icon: 'water_drop',
      description: 'Milk, cheese, and dairy products',
      productCount: 67,
      isActive: false,
    },
  ]);

  /** Add new category */
  addCategory(): void {
    console.log('Adding new category');
    // TODO: Open dialog to add category
  }

  /** Edit category */
  editCategory(category: Category): void {
    console.log('Editing category:', category);
    // TODO: Open dialog to edit category
  }

  /** Delete category */
  deleteCategory(categoryId: string): void {
    console.log('Deleting category:', categoryId);
    // TODO: Confirm and delete category
  }

  /** Toggle category status */
  toggleCategoryStatus(category: Category): void {
    const updatedCategories = this.categories().map((c) =>
      c.id === category.id ? { ...c, isActive: !c.isActive } : c
    );
    this.categories.set(updatedCategories);
  }

  /** Filter categories based on search */
  get filteredCategories(): Category[] {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.categories();
    return this.categories().filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query)
    );
  }
}