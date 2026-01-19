/**
 * Image Gallery Component
 * =======================
 * Displays crop images with thumbnails and zoom functionality.
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { CropImage } from '../../services/crop-details.service';

@Component({
  selector: 'smc-image-gallery',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './image-gallery.component.html',
  styleUrl: './image-gallery.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageGalleryComponent {
  readonly images = input.required<CropImage[]>();
  readonly selectedIndex = input(0);
  readonly imageSelect = output<number>();

  readonly showLightbox = signal(false);

  readonly currentImage = computed(() => {
    const imgs = this.images();
    const idx = this.selectedIndex();
    return imgs[idx] || null;
  });

  selectImage(index: number): void {
    this.imageSelect.emit(index);
  }

  prevImage(): void {
    const currentIdx = this.selectedIndex();
    if (currentIdx > 0) {
      this.imageSelect.emit(currentIdx - 1);
    }
  }

  nextImage(): void {
    const currentIdx = this.selectedIndex();
    if (currentIdx < this.images().length - 1) {
      this.imageSelect.emit(currentIdx + 1);
    }
  }

  openLightbox(): void {
    this.showLightbox.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.showLightbox.set(false);
    document.body.style.overflow = '';
  }
}
