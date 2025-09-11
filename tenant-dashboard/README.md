# Tenant Dashboard

Self-service interface for tenants to manage their chatbots and analyze usage on the Chat AI CMS platform.

## Features

- **Bot Management**: Create, configure, and manage chatbots
- **Chat Interface**: Test bots and view conversation history
- **Usage Analytics**: Monitor bot performance and usage statistics
- **Settings**: Configure tenant preferences and API keys
- **Document Management**: Upload and manage knowledge base documents

## Technology Stack

- Next.js 15 with App Router
- TypeScript for type safety
- Material-UI v5 for components
- TanStack Query for server state
- React Hook Form with Zod validation

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=Tenant Dashboard
```

## API Integration

The tenant dashboard connects to the backend API at `/v1/tenant/*` endpoints:

- `/v1/tenant/auth/*` - Tenant authentication  
- `/v1/tenant/bots/*` - Bot management
- `/v1/tenant/chats/*` - Chat operations
- `/v1/tenant/analytics/*` - Usage analytics
- `/v1/tenant/settings/*` - Tenant settings

## Access

Tenant users must be created by administrators through the admin dashboard.

Visit: http://localhost:3000 (or assigned port)
