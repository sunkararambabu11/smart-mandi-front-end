/**
 * Chat Conversation Component
 * ===========================
 * Displays chat conversation with a specific user.
 * Uses signals-based state management with OnPush change detection.
 */

import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  isMine: boolean;
}

interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

@Component({
  selector: 'smc-chat-conversation',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './chat-conversation.component.html',
  styleUrl: './chat-conversation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatConversationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  /** Current user ID from route */
  readonly userId = signal<string>('');

  /** Loading state */
  readonly isLoading = signal(false);

  /** Sending message state */
  readonly isSending = signal(false);

  /** New message input */
  newMessage = '';

  /** Chat recipient */
  readonly recipient = signal<ChatUser>({
    id: 'user1',
    name: 'Rajesh Kumar',
    isOnline: true,
  });

  /** Messages in the conversation */
  readonly messages = signal<ChatMessage[]>([
    {
      id: '1',
      senderId: 'user1',
      content: 'Hello! I saw your wheat listing.',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      isRead: true,
      isMine: false,
    },
    {
      id: '2',
      senderId: 'me',
      content: 'Hi! Yes, it\'s fresh from this season\'s harvest.',
      timestamp: new Date(Date.now() - 1000 * 60 * 25),
      isRead: true,
      isMine: true,
    },
    {
      id: '3',
      senderId: 'user1',
      content: 'What\'s the best price you can offer for 10 quintals?',
      timestamp: new Date(Date.now() - 1000 * 60 * 20),
      isRead: true,
      isMine: false,
    },
    {
      id: '4',
      senderId: 'me',
      content: 'For 10 quintals, I can offer ₹2,200 per quintal. That includes loading.',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      isRead: true,
      isMine: true,
    },
    {
      id: '5',
      senderId: 'user1',
      content: 'Is the wheat still available?',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      isRead: false,
      isMine: false,
    },
  ]);

  /** Format time for messages */
  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const userId = params.get('userId');
      if (userId) {
        this.userId.set(userId);
      }
    });
  }

  /** Send a new message */
  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    this.isSending.set(true);

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'me',
      content: this.newMessage.trim(),
      timestamp: new Date(),
      isRead: false,
      isMine: true,
    };

    this.messages.update((msgs) => [...msgs, newMsg]);
    this.newMessage = '';
    this.isSending.set(false);
  }

  /** Track by function for messages */
  trackByMessage(index: number, message: ChatMessage): string {
    return message.id;
  }
}

