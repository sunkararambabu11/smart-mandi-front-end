/**
 * Conversation Page Component
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'smc-conversation',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './conversation.component.html',
  styleUrl: './conversation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationComponent {
  readonly conversationId = input.required<string>();
}

