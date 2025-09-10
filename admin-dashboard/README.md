# Chat AI CMS Admin Dashboard

A modern admin dashboard for managing tenants, settings, and monitoring the Chat AI CMS API system.

## Features

- **Admin Authentication**: Secure login/logout with JWT tokens
- **Tenant Management**: Full CRUD operations for managing tenants
- **Dashboard Analytics**: Overview of system metrics and usage statistics  
- **Settings Management**: System configuration and AI provider settings
- **Responsive Design**: Modern Material-UI based interface
- **Clean Architecture**: Well-organized codebase following best practices

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Library**: Material-UI (MUI) v5
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **HTTP Client**: Axios with interceptors
- **Authentication**: JWT with automatic token refresh

## Project Structure

```
admin-dashboard/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── dashboard/       # Dashboard page
│   │   ├── tenants/         # Tenant management page
│   │   ├── settings/        # Settings page
│   │   └── login/           # Login page
│   ├── components/          # Reusable components
│   │   ├── auth/            # Authentication components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── layout/          # Layout components
│   │   ├── settings/        # Settings components
│   │   └── tenants/         # Tenant management components
│   ├── hooks/               # Custom hooks
│   ├── services/            # API services
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   └── config/              # Configuration files
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Chat AI CMS API running on http://localhost:8000

### Installation

1. Navigate to the admin dashboard directory:
   ```bash
   cd admin-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Update `.env.local` with your configuration:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

5. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Default Admin User

Create an admin user in your backend database:

```sql
INSERT INTO admin_users (id, email, name, password_hash, role, is_active)
VALUES (
  gen_random_uuid()::text,
  'admin@example.com',
  'System Admin',
  -- Password: 'admin123' (use proper hashing in production)
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewbIsKPtuEvbKZZ2',
  'admin',
  true
);
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Architecture

### Clean Architecture Principles

- **Components**: Reusable UI components organized by feature
- **Services**: API interaction layer with proper error handling
- **Hooks**: Custom React hooks for state management and side effects
- **Types**: Comprehensive TypeScript definitions for type safety
- **Utils**: Pure utility functions for common operations

### Authentication Flow

1. User logs in with email/password
2. Server returns access token (30min) and refresh token (7 days)
3. Tokens stored in HTTP-only cookies
4. Access token automatically refreshed when expired
5. Protected routes redirect to login if not authenticated

### API Integration

- Centralized HTTP client with interceptors
- Automatic token refresh handling
- Request/response logging for debugging
- Error handling with user-friendly messages
- Loading states and optimistic updates

## Features Overview

### Dashboard
- System statistics (tenants, users, chats)
- Real-time metrics with interactive charts
- System health monitoring
- Recent activity feed

### Tenant Management
- View all tenants with pagination and search
- Create new tenants with form validation
- Edit tenant details and settings
- Manage tenant status (active/inactive)
- View detailed usage statistics per tenant

### Settings Management
- System configuration (maintenance mode, registrations)
- AI provider management (OpenAI, Anthropic, Azure, Custom)
- Rate limiting and plan restrictions
- Global defaults and feature flags

## Contributing

1. Follow the existing code structure and naming conventions
2. Add TypeScript types for all new components and functions
3. Use Material-UI components consistently
4. Implement proper error handling and loading states
5. Write meaningful commit messages

## Security

- JWT tokens with automatic refresh
- Protected routes with role-based access
- Input validation and sanitization
- CORS configuration
- Environment variable protection

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set production environment variables
3. Deploy using your preferred platform (Vercel, Netlify, Docker, etc.)
4. Configure proper domain and HTTPS
5. Set up monitoring and error tracking

## License

This project is part of the Chat AI CMS system.