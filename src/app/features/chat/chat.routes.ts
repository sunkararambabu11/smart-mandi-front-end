import { Routes } from '@angular/router';

/**
 * Chat Routes
 * ===========
 * Routes for real-time messaging between farmers and buyers.
 * 
 * URL Structure:
 * - /chat              → Chat inbox / conversations list
 * - /chat/:userId      → Chat with specific user
 */
export const CHAT_ROUTES: Routes = [
  // Chat routes
  {
    path: '',
    loadComponent: () =>
      import('./pages/chat-inbox/chat-inbox.component').then(
        (m) => m.ChatInboxComponent
      ),
    title: 'Messages | Smart Mandi Connect',
  },
  {
    path: ':userId',
    loadComponent: () =>
      import('./pages/chat-conversation/chat-conversation.component').then(
        (m) => m.ChatConversationComponent
      ),
    title: 'Chat | Smart Mandi Connect',
  },
];


