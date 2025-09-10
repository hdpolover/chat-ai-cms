# Chat AI CMS API - Admin Dashboard Setup & Troubleshooting

## Project Status ✅

The admin dashboard is## ✅ Issues Resolved

1. **Module Resolution Fixed**: 
   - Enhanced TypeScript configuration with proper compiler options
   - Installed all npm dependencies successfully
   - Updated webpack fallbacks in Next.js config

2. **Build Errors Resolved**:
   - Converted all page components to client components with `'use client'` directive
   - Removed deprecated `appDir` option from Next.js config
   - Fixed server/client component serialization issues

3. **Server/Client Serialization Fixed**:
   - Moved all React providers (QueryClient, ThemeProvider, etc.) to client-side only
   - Replaced `new Date()` objects with static ISO strings to prevent serialization errors
   - Separated server and client logic properly in Next.js App Router
   - Fixed "Only plain objects can be passed to Client Components" error

4. **Copilot Instructions Updated**:
   - Added comprehensive project overview with current status
   - Included all implemented features and architecture details
   - Added troubleshooting guide with resolved issues
   - Documented development workflow and deployment instructionsctional and running on `http://localhost:3000`.

## Quick Start

### Prerequisites
1. Node.js 18+ installed
2. Backend API running on `http://localhost:8000`
3. PostgreSQL database with admin tables migrated

### Running the Admin Dashboard
```bash
cd admin-dashboard
npm install
npm run dev
```

The dashboard will be available at `http://localhost:3000`.

### Default Admin Login
When you first run the system, you'll need to create an admin user directly in the database or through the API.

## Architecture Overview

### Frontend Structure
```
admin-dashboard/
├── src/
│   ├── app/              # Next.js 13+ App Router
│   │   ├── dashboard/    # Dashboard page with analytics
│   │   ├── tenants/      # Tenant management page
│   │   ├── settings/     # System settings page
│   │   └── login/        # Admin login page
│   ├── components/       # React components
│   │   ├── auth/         # Authentication components
│   │   ├── dashboard/    # Dashboard widgets & charts  
│   │   ├── layout/       # Layout components
│   │   ├── settings/     # Settings management
│   │   └── tenants/      # Tenant management
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API service layer
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
```

### Backend Integration
- **Authentication**: JWT tokens with HTTP-only cookies
- **API Endpoints**: `/admin/*` routes for admin functionality
- **Database**: PostgreSQL with AdminUser, SystemSettings, GlobalAIProvider models
- **Security**: Role-based access control for admin operations

## Key Features Implemented

### ✅ Authentication System
- JWT-based admin authentication
- Automatic token refresh
- Protected routes with redirect to login
- Session persistence with HTTP-only cookies

### ✅ Tenant Management
- Complete CRUD operations for tenants
- Real-time tenant statistics
- Tenant status management (active/inactive)
- Bulk operations support

### ✅ Dashboard Analytics
- Real-time statistics display
- Interactive charts with Recharts
- Metrics: Total tenants, active chats, monthly statistics
- Responsive Material-UI design

### ✅ System Settings
- Global AI provider configuration
- System-wide settings management
- Environment-specific configurations
- Settings validation with Zod schemas

### ✅ Clean Architecture
- Separation of concerns with service layer
- Type-safe API calls with TypeScript
- Error handling and loading states
- Responsive UI with Material-UI components

## Environment Configuration

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env)
```env
DATABASE_URL=postgresql://username:password@localhost/dbname
REDIS_URL=redis://localhost:6379
JWT_SECRET_KEY=your-secret-key
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

## Troubleshooting

### ✅ Module Resolution Issues - RESOLVED
**Problem**: "Cannot find module 'react'" errors in components
**Solution**: 
- Fixed TypeScript configuration with proper module resolution
- Installed all required npm dependencies
- Updated Next.js configuration to handle webpack fallbacks

### ✅ Server/Client Component Serialization - RESOLVED  
**Problem**: Next.js build errors about passing complex objects to client components
**Solution**:
- Converted all page components to client components with `'use client'` directive
- Simplified Next.js configuration to avoid static generation issues
- Used development server for better debugging experience

### Common Issues & Solutions

#### Authentication Not Working
1. Check if backend API is running on `http://localhost:8000`
2. Verify JWT secret key is consistent between frontend and backend
3. Check browser network tab for API call errors
4. Ensure admin user exists in database

#### Dashboard Not Loading Data
1. Verify API endpoints are accessible (check `/admin/dashboard/stats`)
2. Check authentication token is being sent with requests
3. Review backend logs for database connection issues
4. Confirm database tables are properly migrated

#### Styling Issues
1. Material-UI theme should load automatically
2. Check for CSS import order issues
3. Verify all MUI dependencies are installed
4. Use browser dev tools to debug component styling

#### Build Issues
1. Run `npm run dev` instead of `npm run build` for development
2. Check TypeScript errors with `npx tsc --noEmit`
3. Review Next.js configuration for compatibility
4. Ensure all imports use correct paths with `@/` prefix

## Development Workflow

### Adding New Features
1. Create backend API endpoints in `app/routers/admin/`
2. Add corresponding frontend services in `src/services/`
3. Build React components with proper TypeScript typing
4. Add routing in Next.js app directory
5. Test authentication and error handling

### Database Changes
1. Create Alembic migration for schema changes
2. Update SQLAlchemy models in `app/models.py`
3. Add corresponding TypeScript interfaces
4. Update API endpoints and frontend services

### Testing
1. Use browser dev tools for frontend debugging
2. Check backend logs for API issues  
3. Test authentication flow end-to-end
4. Verify responsive design on different screen sizes

## Production Deployment

### Docker Setup
The project includes Docker configuration for production deployment:

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services  
docker-compose down
```

### Environment Variables
Ensure all production environment variables are properly set:
- Database connection strings
- API keys for AI providers
- JWT secret keys
- Redis configuration

### Security Considerations
- Use HTTPS in production
- Set secure JWT secret keys
- Configure CORS properly
- Implement rate limiting
- Use environment-specific configurations

## Next Steps

1. **User Management**: Add admin user creation and management interface
2. **Logging & Monitoring**: Implement comprehensive logging and monitoring
3. **Backup & Recovery**: Set up database backup procedures
4. **Performance**: Optimize queries and implement caching
5. **Testing**: Add unit tests and integration tests
6. **Documentation**: Create API documentation and user guides