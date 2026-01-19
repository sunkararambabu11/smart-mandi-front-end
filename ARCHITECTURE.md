# Smart Mandi Connect - Architecture Documentation

## 📁 Folder Structure

```
src/
├── app/
│   ├── core/                    # Singleton services, guards, interceptors
│   │   ├── guards/              # Route protection
│   │   │   ├── auth.guard.ts    # Authenticated routes
│   │   │   ├── guest.guard.ts   # Public-only routes
│   │   │   ├── role.guard.ts    # Role-based access
│   │   │   └── index.ts
│   │   ├── interceptors/        # HTTP interceptors
│   │   │   ├── auth.interceptor.ts     # JWT token attachment
│   │   │   ├── loading.interceptor.ts  # Loading state tracking
│   │   │   ├── error.interceptor.ts    # Global error handling
│   │   │   └── index.ts
│   │   ├── services/            # Singleton services
│   │   │   ├── auth.service.ts         # Authentication (signals-based)
│   │   │   ├── loading.service.ts      # Global loading state
│   │   │   ├── notification.service.ts # Toast notifications
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── domain/                  # Domain layer (DDD)
│   │   ├── models/              # Domain entities & value objects
│   │   │   ├── user.model.ts    # User, roles, profiles
│   │   │   ├── product.model.ts # Products, categories
│   │   │   ├── order.model.ts   # Orders, payments
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── infrastructure/          # External integrations
│   │   ├── api/                 # HTTP API services
│   │   │   ├── user.api.ts
│   │   │   ├── product.api.ts
│   │   │   └── order.api.ts
│   │   ├── socket/              # Socket.io services
│   │   │   ├── socket.service.ts
│   │   │   ├── chat.socket.ts
│   │   │   └── notification.socket.ts
│   │   └── storage/             # Local storage abstractions
│   │       └── storage.service.ts
│   │
│   ├── features/                # Feature modules (lazy-loaded)
│   │   ├── auth/                # Authentication feature
│   │   │   ├── pages/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   ├── forgot-password/
│   │   │   │   ├── reset-password/
│   │   │   │   └── verify-email/
│   │   │   ├── components/      # Auth-specific components
│   │   │   ├── services/        # Auth feature services
│   │   │   └── auth.routes.ts   # Feature routes
│   │   │
│   │   ├── dashboard/           # Dashboard feature
│   │   │   └── dashboard.component.ts
│   │   │
│   │   ├── marketplace/         # Marketplace feature
│   │   │   ├── pages/
│   │   │   │   ├── browse/
│   │   │   │   ├── search/
│   │   │   │   ├── product-detail/
│   │   │   │   ├── cart/
│   │   │   │   ├── checkout/
│   │   │   │   └── category/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── marketplace.routes.ts
│   │   │
│   │   ├── products/            # Product management (Farmers)
│   │   │   ├── pages/
│   │   │   │   ├── product-list/
│   │   │   │   ├── product-form/
│   │   │   │   └── product-view/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── products.routes.ts
│   │   │
│   │   ├── orders/              # Order management
│   │   │   ├── pages/
│   │   │   │   ├── order-list/
│   │   │   │   ├── order-detail/
│   │   │   │   └── order-tracking/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── orders.routes.ts
│   │   │
│   │   ├── profile/             # User profile
│   │   │   ├── pages/
│   │   │   │   ├── profile-overview/
│   │   │   │   ├── profile-edit/
│   │   │   │   ├── settings/
│   │   │   │   ├── addresses/
│   │   │   │   └── security/
│   │   │   ├── components/
│   │   │   └── profile.routes.ts
│   │   │
│   │   ├── chat/                # Real-time chat
│   │   │   ├── pages/
│   │   │   │   ├── chat-inbox/
│   │   │   │   └── chat-conversation/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── chat.routes.ts
│   │   │
│   │   ├── notifications/       # Notifications
│   │   │   └── notifications.component.ts
│   │   │
│   │   └── admin/               # Admin panel
│   │       ├── pages/
│   │       │   ├── admin-dashboard/
│   │       │   ├── user-management/
│   │       │   ├── product-moderation/
│   │       │   ├── order-oversight/
│   │       │   ├── reports/
│   │       │   └── system-settings/
│   │       ├── components/
│   │       └── admin.routes.ts
│   │
│   ├── shared/                  # Shared/reusable components
│   │   ├── components/          # Dumb/presentational components
│   │   │   ├── ui/              # UI primitives
│   │   │   │   ├── button/
│   │   │   │   ├── card/
│   │   │   │   ├── input/
│   │   │   │   └── ...
│   │   │   ├── layout/          # Layout components
│   │   │   │   ├── header/
│   │   │   │   ├── sidebar/
│   │   │   │   ├── footer/
│   │   │   │   └── shell/
│   │   │   ├── loading-bar/
│   │   │   └── errors/          # Error pages
│   │   │       ├── forbidden.component.ts
│   │   │       ├── not-found.component.ts
│   │   │       └── server-error.component.ts
│   │   ├── directives/          # Custom directives
│   │   ├── pipes/               # Custom pipes
│   │   └── utils/               # Utility functions
│   │
│   ├── app.component.ts         # Root component
│   ├── app.config.ts            # Application configuration
│   └── app.routes.ts            # Root routes
│
├── environments/                # Environment configs
│   ├── environment.ts           # Development
│   └── environment.prod.ts      # Production
│
├── styles.scss                  # Global styles
├── index.html                   # HTML entry point
└── main.ts                      # Bootstrap entry
```

---

## 🏗️ Architecture Principles

### 1. Clean Architecture

```
┌─────────────────────────────────────────────────┐
│                  Presentation                    │
│     (Components, Pages, Routes, Templates)       │
├─────────────────────────────────────────────────┤
│                  Application                     │
│        (Services, Use Cases, State)              │
├─────────────────────────────────────────────────┤
│                    Domain                        │
│       (Entities, Value Objects, Enums)           │
├─────────────────────────────────────────────────┤
│                Infrastructure                    │
│      (APIs, Socket.io, Storage, External)        │
└─────────────────────────────────────────────────┘
```

### 2. Domain-Driven Design (DDD)

- **Entities**: `User`, `Product`, `Order`
- **Value Objects**: `GeoLocation`, `ProductPrice`, `DeliveryAddress`
- **Aggregates**: Orders contain OrderItems
- **Domain Events**: Real-time updates via Socket.io

### 3. Smart vs Dumb Components

| Smart (Container)          | Dumb (Presentational)       |
| -------------------------- | --------------------------- |
| Inject services            | @Input() / @Output() only   |
| Handle business logic      | Pure display logic          |
| Manage state               | Stateless                   |
| Located in `pages/`        | Located in `components/`    |
| Call APIs                  | Emit events                 |

---

## 📡 Signals-First Architecture

### State Management with Signals

```typescript
// Service with signals
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Private writable signal
  private readonly _currentUser = signal<User | null>(null);

  // Public read-only signal
  readonly currentUser = this._currentUser.asReadonly();

  // Computed signals
  readonly isAuthenticated = computed(() => !!this._currentUser());
  readonly userRole = computed(() => this._currentUser()?.role);
}
```

### Component Pattern

```typescript
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);

  // Direct signal access in template
  readonly user = this.authService.currentUser;
  readonly isAdmin = this.authService.isAdmin;
}
```

---

## 🛣️ Routing Strategy

### Lazy Loading Pattern

```typescript
{
  path: 'marketplace',
  canActivate: [authGuard],
  loadChildren: () =>
    import('@features/marketplace/marketplace.routes')
      .then((m) => m.MARKETPLACE_ROUTES),
}
```

### Role-Based Protection

```typescript
{
  path: 'admin',
  canActivate: [authGuard, roleGuard],
  data: { roles: [UserRole.ADMIN] },
  loadChildren: () => import('@features/admin/admin.routes')
}
```

---

## 📝 Naming Conventions

| Type            | Convention              | Example                    |
| --------------- | ----------------------- | -------------------------- |
| Components      | `kebab-case.component`  | `product-card.component.ts`|
| Services        | `kebab-case.service`    | `auth.service.ts`          |
| Guards          | `kebab-case.guard`      | `role.guard.ts`            |
| Interceptors    | `kebab-case.interceptor`| `auth.interceptor.ts`      |
| Models          | `kebab-case.model`      | `user.model.ts`            |
| Routes          | `kebab-case.routes`     | `auth.routes.ts`           |
| Pipes           | `kebab-case.pipe`       | `currency-inr.pipe.ts`     |
| Directives      | `kebab-case.directive`  | `click-outside.directive`  |

### File Organization

```
feature/
├── pages/              # Smart components (containers)
│   └── login/
│       ├── login.component.ts
│       ├── login.component.html
│       └── login.component.scss
├── components/         # Dumb components (presentational)
│   └── login-form/
├── services/           # Feature-specific services
├── models/             # Feature-specific types
└── feature.routes.ts   # Feature routes
```

---

## 🔌 Real-Time Architecture (Socket.io)

```typescript
@Injectable({ providedIn: 'root' })
export class SocketService {
  private readonly socket = signal<Socket | null>(null);
  readonly isConnected = computed(() => !!this.socket()?.connected);

  connect(token: string): void {
    const socket = io(environment.socketUrl, {
      auth: { token },
    });
    this.socket.set(socket);
  }

  on<T>(event: string): Observable<T> {
    return new Observable((observer) => {
      this.socket()?.on(event, (data: T) => observer.next(data));
    });
  }
}
```

---

## 🎨 UI/UX Guidelines

- **Mobile-First**: All components designed for mobile, enhanced for desktop
- **Angular Material**: For complex components (dialogs, tables, forms)
- **Tailwind CSS**: For utility-first styling and customization
- **OnPush Change Detection**: All components use OnPush for performance
- **Accessible**: WCAG 2.1 AA compliance

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build:prod
```

---

© 2024 Smart Mandi Connect - Connecting Farmers to Buyers



