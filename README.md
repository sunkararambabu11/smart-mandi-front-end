# 🌾 SMART MANDI CONNECT

> Real-time Farmer to Buyer Marketplace - Connecting farms to tables directly.

## 🏗️ Project Architecture

This is an **Angular 20** application built with:

- ✅ **Standalone Components Only** - No NgModules
- ✅ **Signals-First Architecture** - Reactive state management
- ✅ **OnPush Change Detection** - Optimal performance
- ✅ **Clean Architecture** - Domain-driven design
- ✅ **Angular Material + Tailwind CSS** - Beautiful, responsive UI
- ✅ **Socket.io** - Real-time features
- ✅ **Strict TypeScript** - Type-safe codebase

---

## 📁 Folder Structure

```
src/
├── app/
│   ├── core/                    # 🔐 Singleton services, guards, interceptors
│   │   ├── guards/              # Route protection
│   │   │   ├── auth.guard.ts    # Authentication check
│   │   │   ├── guest.guard.ts   # Redirect logged-in users
│   │   │   ├── role.guard.ts    # Role-based access control
│   │   │   └── index.ts
│   │   │
│   │   ├── interceptors/        # HTTP interceptors
│   │   │   ├── auth.interceptor.ts     # Attach JWT token
│   │   │   ├── error.interceptor.ts    # Global error handling
│   │   │   ├── loading.interceptor.ts  # Loading state management
│   │   │   └── index.ts
│   │   │
│   │   ├── layouts/             # Application layouts
│   │   │   ├── main-layout/     # Main app layout (header, sidebar, footer)
│   │   │   ├── admin-layout/    # Admin panel layout
│   │   │   └── index.ts
│   │   │
│   │   ├── services/            # Singleton services
│   │   │   ├── auth.service.ts         # Authentication state
│   │   │   ├── loading.service.ts      # Global loading state
│   │   │   ├── notification.service.ts # Toast notifications
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── domain/                  # 🧠 Business logic & entities
│   │   ├── models/              # Domain models/entities
│   │   │   ├── user.model.ts    # User, roles, profiles
│   │   │   ├── product.model.ts # Products, categories
│   │   │   ├── order.model.ts   # Orders, payments
│   │   │   └── index.ts
│   │   │
│   │   ├── repositories/        # Data access interfaces
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── infrastructure/          # 🔌 External services & APIs
│   │   ├── services/
│   │   │   ├── api.service.ts   # Base HTTP client
│   │   │   ├── socket.service.ts # Socket.io real-time
│   │   │   └── index.ts
│   │   │
│   │   ├── repositories/        # Concrete implementations
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── features/                # 📦 Feature modules (lazy-loaded)
│   │   │
│   │   ├── auth/                # Authentication feature
│   │   │   ├── pages/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   ├── forgot-password/
│   │   │   │   ├── reset-password/
│   │   │   │   └── verify-email/
│   │   │   ├── components/      # Feature-specific components
│   │   │   ├── services/        # Feature-specific services
│   │   │   └── index.ts
│   │   │
│   │   ├── dashboard/           # Dashboard feature
│   │   │   ├── pages/
│   │   │   │   └── dashboard/
│   │   │   ├── components/
│   │   │   │   ├── stats-card/
│   │   │   │   ├── recent-orders/
│   │   │   │   └── price-chart/
│   │   │   └── index.ts
│   │   │
│   │   ├── marketplace/         # Product browsing
│   │   │   ├── pages/
│   │   │   │   ├── marketplace/
│   │   │   │   ├── category/
│   │   │   │   └── search-results/
│   │   │   ├── components/
│   │   │   │   ├── product-card/
│   │   │   │   ├── filter-panel/
│   │   │   │   └── category-nav/
│   │   │   └── index.ts
│   │   │
│   │   ├── products/            # Product management (Farmers)
│   │   │   ├── pages/
│   │   │   │   ├── product-list/
│   │   │   │   ├── product-detail/
│   │   │   │   └── product-form/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   │   └── product.service.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── orders/              # Order management
│   │   │   ├── pages/
│   │   │   │   ├── order-list/
│   │   │   │   └── order-detail/
│   │   │   ├── components/
│   │   │   │   ├── order-card/
│   │   │   │   ├── order-timeline/
│   │   │   │   └── order-actions/
│   │   │   └── index.ts
│   │   │
│   │   ├── cart/                # Shopping cart (Buyers)
│   │   │   ├── pages/
│   │   │   │   ├── cart/
│   │   │   │   └── checkout/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   │   └── cart.service.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── messages/            # Real-time messaging
│   │   │   ├── pages/
│   │   │   │   ├── inbox/
│   │   │   │   └── conversation/
│   │   │   ├── components/
│   │   │   └── index.ts
│   │   │
│   │   ├── profile/             # User profile & settings
│   │   │   ├── pages/
│   │   │   │   ├── profile/
│   │   │   │   ├── settings/
│   │   │   │   └── addresses/
│   │   │   ├── components/
│   │   │   └── index.ts
│   │   │
│   │   ├── notifications/       # Notifications center
│   │   │   ├── pages/
│   │   │   │   └── notifications/
│   │   │   ├── components/
│   │   │   └── index.ts
│   │   │
│   │   └── admin/               # Admin panel
│   │       ├── pages/
│   │       │   ├── admin-dashboard/
│   │       │   ├── user-management/
│   │       │   ├── product-moderation/
│   │       │   ├── category-management/
│   │       │   ├── reports/
│   │       │   └── admin-settings/
│   │       ├── components/
│   │       └── index.ts
│   │
│   ├── shared/                  # 🔧 Reusable components, pipes, directives
│   │   ├── components/          # Dumb/presentational components
│   │   │   ├── loading-bar/
│   │   │   ├── empty-state/
│   │   │   ├── confirm-dialog/
│   │   │   ├── image-upload/
│   │   │   ├── pagination/
│   │   │   ├── rating/
│   │   │   └── index.ts
│   │   │
│   │   ├── directives/          # Custom directives
│   │   │   ├── lazy-image.directive.ts
│   │   │   ├── click-outside.directive.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── pipes/               # Custom pipes
│   │   │   ├── currency-inr.pipe.ts
│   │   │   ├── relative-time.pipe.ts
│   │   │   ├── truncate.pipe.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── pages/               # Shared pages (errors)
│   │   │   ├── not-found/
│   │   │   ├── forbidden/
│   │   │   ├── server-error/
│   │   │   └── index.ts
│   │   │
│   │   ├── validators/          # Form validators
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── app.component.ts         # Root component
│   ├── app.config.ts            # Application configuration
│   └── app.routes.ts            # Route definitions
│
├── environments/                # Environment configurations
│   ├── environment.ts           # Development
│   └── environment.prod.ts      # Production
│
├── styles.scss                  # Global styles
├── main.ts                      # Application entry point
└── index.html                   # HTML entry point
```

---

## 📂 Folder Purposes

### 🔐 Core (`/core`)

> **Singleton services and app-wide providers. Imported only in `app.config.ts`.**

| Folder | Purpose |
|--------|---------|
| `guards/` | Route protection (auth, roles, guest) |
| `interceptors/` | HTTP request/response handling |
| `layouts/` | Application shell layouts |
| `services/` | Singleton state services (auth, loading, notifications) |

### 🧠 Domain (`/domain`)

> **Business logic layer. Pure TypeScript, no Angular dependencies.**

| Folder | Purpose |
|--------|---------|
| `models/` | Domain entities, value objects, DTOs |
| `repositories/` | Abstract data access interfaces |

### 🔌 Infrastructure (`/infrastructure`)

> **External integrations and concrete implementations.**

| Folder | Purpose |
|--------|---------|
| `services/` | API clients, Socket.io, storage |
| `repositories/` | Concrete repository implementations |

### 📦 Features (`/features`)

> **Self-contained feature modules. Each feature is lazy-loaded.**

Each feature follows this structure:
```
feature/
├── pages/           # Smart components (route targets)
├── components/      # Dumb components (feature-specific)
├── services/        # Feature-specific services
└── index.ts         # Public API
```

### 🔧 Shared (`/shared`)

> **Reusable, stateless components, pipes, and directives.**

| Folder | Purpose |
|--------|---------|
| `components/` | Generic UI components (buttons, cards, modals) |
| `directives/` | DOM manipulation utilities |
| `pipes/` | Data transformation |
| `pages/` | Error pages (404, 403, 500) |
| `validators/` | Custom form validators |

---

## 📛 Naming Conventions

### Files

| Type | Pattern | Example |
|------|---------|---------|
| Component | `feature.component.ts` | `login.component.ts` |
| Service | `feature.service.ts` | `auth.service.ts` |
| Guard | `feature.guard.ts` | `auth.guard.ts` |
| Interceptor | `feature.interceptor.ts` | `auth.interceptor.ts` |
| Pipe | `feature.pipe.ts` | `currency-inr.pipe.ts` |
| Directive | `feature.directive.ts` | `lazy-image.directive.ts` |
| Model | `feature.model.ts` | `user.model.ts` |

### Classes

| Type | Pattern | Example |
|------|---------|---------|
| Component | `PascalCase + Component` | `LoginComponent` |
| Service | `PascalCase + Service` | `AuthService` |
| Guard | `camelCase + Guard` | `authGuard` |
| Interceptor | `camelCase + Interceptor` | `authInterceptor` |
| Pipe | `PascalCase + Pipe` | `CurrencyInrPipe` |
| Directive | `PascalCase + Directive` | `LazyImageDirective` |

### Selectors

- **Components**: `smc-feature-name` (e.g., `smc-login`, `smc-product-card`)
- **Directives**: `smcFeatureName` (e.g., `smcLazyImage`)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Angular CLI 20+

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build:prod
```

### Development Server

Navigate to `http://localhost:4200/`. The app will auto-reload on changes.

---

## 🔐 Authentication Flow

1. **Guest users** → Redirected to `/auth/login`
2. **Authenticated users** → Access to `/dashboard` and role-specific routes
3. **Role-based access**:
   - `farmer` → Product management, orders
   - `buyer` → Marketplace, cart, orders
   - `admin` → Admin panel

---

## 📡 Real-time Features

Socket.io integration for:

- 🔔 Live notifications
- 💬 Real-time messaging
- 📊 Price updates
- 🛒 Order status changes

---

## 🎨 UI/UX

- **Mobile-first** responsive design
- **Angular Material** for complex components
- **Tailwind CSS** for utility-first styling
- **Custom theme** with earthy, mandi-inspired colors

---

## 📜 License

MIT License - See [LICENSE](LICENSE) for details.

---

Built with ❤️ for Indian farmers and buyers.

