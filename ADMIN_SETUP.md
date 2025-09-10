# Admin Dashboard Setup Guide

This guide will help you set up and run the Chat AI CMS Admin Dashboard.

## Quick Start

### 1. Backend Setup (API)

First, make sure your backend API is running:

```bash
# Install backend dependencies
pip install -e .

# Run database migrations
alembic upgrade head

# Create an admin user (interactive script)
python scripts/create_admin_user.py

# Start the backend API
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: http://localhost:8000

### 2. Frontend Setup (Admin Dashboard)

```bash
# Navigate to the admin dashboard directory
cd admin-dashboard

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Update .env.local if needed (default API URL is correct)
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Start the development server
npm run dev
```

The admin dashboard will be available at: http://localhost:3000

### 3. Login to Admin Dashboard

1. Open http://localhost:3000 in your browser
2. Use the credentials from the admin user you created
3. You'll be redirected to the dashboard after successful login

## Docker Setup (Recommended)

For a complete setup with all services:

```bash
# Build and start all services
docker-compose -f docker-compose.admin.yml up --build

# Or run in detached mode
docker-compose -f docker-compose.admin.yml up -d --build
```

This will start:
- Backend API at http://localhost:8000
- Admin Dashboard at http://localhost:3001
- PostgreSQL database at localhost:5432
- Redis at localhost:6379

### Create Admin User (Docker)

```bash
# Create admin user in the running container
docker-compose -f docker-compose.admin.yml exec api python scripts/create_admin_user.py

# Or run database migrations if needed
docker-compose -f docker-compose.admin.yml exec api alembic upgrade head
```

## Default Admin Credentials

If you prefer to create an admin user directly in the database:

```sql
-- Connect to your PostgreSQL database and run:
INSERT INTO admin_users (id, email, name, password_hash, role, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid()::text,
  'admin@example.com',
  'System Administrator',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewbIsKPtuEvbKZZ2',  -- Password: admin123
  'admin',
  true,
  now(),
  now()
);
```

**Login credentials:**
- Email: `admin@example.com`
- Password: `admin123`

⚠️ **Important**: Change this password immediately after first login in a production environment!

## Development Workflow

### Backend Development

```bash
# Install development dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Format code
black app/
ruff check app/ --fix

# Type checking
mypy app/
```

### Frontend Development

```bash
cd admin-dashboard

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build
```

## Features Available

### 🏠 Dashboard Overview
- System statistics and metrics
- Real-time charts and graphs
- System health monitoring
- Recent activity feed

### 👥 Tenant Management
- View all tenants with search and filtering
- Create, edit, and delete tenants
- Manage tenant status and plans
- View detailed usage statistics

### ⚙️ Settings Management
- System configuration options
- AI provider management
- Rate limiting and security settings
- Global defaults and preferences

### 🔐 Authentication & Security
- Secure JWT-based authentication
- Automatic token refresh
- Role-based access control
- Session management

## Troubleshooting

### Common Issues

**1. CORS Errors**
```bash
# Make sure CORS_ORIGINS includes your frontend URL
export CORS_ORIGINS="http://localhost:3000,http://localhost:3001"
```

**2. Database Connection Issues**
```bash
# Check database is running
docker ps | grep postgres

# Check connection string
echo $DATABASE_URL
```

**3. Frontend Build Errors**
```bash
# Clear Next.js cache
rm -rf admin-dashboard/.next
rm -rf admin-dashboard/node_modules
cd admin-dashboard && npm install
```

**4. Authentication Issues**
```bash
# Verify admin user exists
psql $DATABASE_URL -c "SELECT email, is_active FROM admin_users;"

# Check JWT secret configuration
# Make sure SECRET_KEY is set in backend environment
```

### Logs and Debugging

**Backend logs:**
```bash
# View API logs
docker-compose -f docker-compose.admin.yml logs -f api

# Or if running locally
tail -f logs/app.log
```

**Frontend logs:**
```bash
# View frontend logs
docker-compose -f docker-compose.admin.yml logs -f admin-dashboard

# Or check browser console for client-side errors
```

### Database Management

**Connect to database:**
```bash
# Using Docker
docker-compose -f docker-compose.admin.yml exec db psql -U postgres -d chatbot_db

# Or directly
psql postgresql://postgres:postgres@localhost:5432/chatbot_db
```

**Run migrations:**
```bash
# Apply migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "Description"
```

## Production Deployment

### Environment Variables

Create production environment files:

**Backend (.env.prod):**
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://host:6379
SECRET_KEY=your-super-secret-key-here
CORS_ORIGINS=https://yourdomain.com
ENVIRONMENT=production
```

**Frontend (.env.production):**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NODE_ENV=production
```

### Deployment Options

**Docker Compose (Simple):**
```bash
# Production compose file
docker-compose -f docker-compose.prod.yml up -d
```

**Kubernetes:**
- Use the provided k8s manifests in `k8s/` directory
- Update ConfigMaps and Secrets with your values

**Cloud Platforms:**
- **Backend**: Deploy to AWS ECS, Google Cloud Run, or similar
- **Frontend**: Deploy to Vercel, Netlify, or static hosting
- **Database**: Use managed PostgreSQL (AWS RDS, Google Cloud SQL)

### Security Checklist

- [ ] Change default admin password
- [ ] Set strong JWT secret key
- [ ] Configure HTTPS/TLS certificates
- [ ] Set up proper CORS origins
- [ ] Enable database SSL connections
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular security updates

## Support

For issues and questions:

1. Check the [troubleshooting section](#troubleshooting)
2. Review the logs for error messages
3. Check the GitHub issues for similar problems
4. Create a new issue with detailed information

## Next Steps

After successful setup:

1. **Configure System Settings**: Set up AI providers and system preferences
2. **Create Test Tenants**: Add some test tenants to explore the interface
3. **Explore Features**: Try out all the dashboard features
4. **Customize**: Modify the theme and add custom functionality
5. **Monitor**: Set up proper monitoring and logging for production