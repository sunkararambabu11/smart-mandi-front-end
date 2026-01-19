/**
 * Chat Inbox Component
 * ====================
 * Displays list of conversations/chat threads for the user.
 * Uses signals-based state management with OnPush change detection.
 */

import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface ChatThread {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
}

@Component({
  selector: 'smc-chat-inbox',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './chat-inbox.component.html',
  styleUrl: './chat-inbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatInboxComponent {
  /** Loading state */
  readonly isLoading = signal(false);

  /** Chat threads/conversations */
  readonly threads = signal<ChatThread[]>([
    {
      id: '1',
      recipientId: 'user1',
      recipientName: 'Rajesh Kumar',
      lastMessage: 'Is the wheat still available?',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
      unreadCount: 2,
      isOnline: true,
    },
    {
      id: '2',
      recipientId: 'user2',
      recipientName: 'Amit Sharma',
      lastMessage: 'Thank you for the quick delivery!',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60),
      unreadCount: 0,
      isOnline: false,
    },
    {
      id: '3',
      recipientId: 'user3',
      recipientName: 'Priya Patel',
      lastMessage: 'Can you offer a better price?',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 3),
      unreadCount: 1,
      isOnline: true,
    },
  ]);

  /** Total unread count */
  readonly totalUnread = computed(() =>
    this.threads().reduce((sum, thread) => sum + thread.unreadCount, 0)
  );

  /** Format relative time */
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return new Date(date).toLocaleDateString();
  }

  /** Track by function for threads */
  trackByThread(index: number, thread: ChatThread): string {
    return thread.id;
  }
}

