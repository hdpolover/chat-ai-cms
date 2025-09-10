# Admin Dashboard Setup Guide

This guide will help you set up the admin dashboard system for the Chat AI CMS API, including database tables, admin users, and configuration.

## 🗃️ Database Setup

### Step 1: Run Migrations

First, make sure your database is set up and run the migrations to create all necessary tables:

```bash
# Set your database URL
export DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"

# Run migrations to create all tables
alembic upgrade head
```

This will create the following admin-related tables:
- `admin_users` - Admin user accounts
- `system_settings` - Global system configuration
- `global_ai_providers` - System-wide AI provider configurations

### Step 2: Verify Tables

Check that the tables were created successfully:

```sql
-- Connect to your database and run:
\dt admin_users
\dt system_settings  
\dt global_ai_providers

-- Check the admin_users table structure
\d admin_users
```

## 👤 Creating Admin Users

### Method 1: Using the Setup Script (Recommended)

Run the admin user creation script:

```bash
# Navigate to project root
cd /path/to/chat-ai-cms-api

# Run the admin user creation script
python3 scripts/create_admin_users.py
```

The script will:
1. Create a default super admin user:
   - Email: `admin@example.com`
   - Password: `admin123` (⚠️ **Change this in production!**)
   - Role: `super_admin`

2. Allow you to create additional admin users interactively

### Method 2: Manual Database Insert

You can also create admin users directly in the database:

```sql
-- Create a super admin user
INSERT INTO admin_users (id, email, name, password_hash, role, is_active, created_at, updated_at)
VALUES (
    gen_random_uuid()::text,
    'admin@yourdomain.com',
    'System Administrator',
    -- Password hash for 'your_secure_password' (use bcrypt)
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewbIsKPtuEvbKZZ2',
    'super_admin',
    true,
    now(),
    now()
);
```

To generate a password hash in Python:

```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed_password = pwd_context.hash("your_secure_password")
print(hashed_password)
```

## 🚀 Starting the API Server

### 1. Install Dependencies

```bash
# Using pip
pip install -e .

# Or install specific packages
pip install fastapi uvicorn sqlalchemy alembic psycopg2-binary passlib python-jose
```

### 2. Set Environment Variables

Create a `.env` file or set environment variables:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/chatbot_db

# JWT Authentication
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production

# CORS (for admin dashboard)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# AI Provider Keys
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### 3. Start the Server

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: `http://localhost:8000`
- Interactive docs: `http://localhost:8000/docs`
- Admin endpoints: `http://localhost:8000/admin/`

## 🖥️ Admin Dashboard Frontend

### 1. Start the Admin Dashboard

```bash
# Navigate to admin dashboard
cd admin-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

The admin dashboard will be available at `http://localhost:3000`.

### 2. Login to Admin Dashboard

1. Open `http://localhost:3000` in your browser
2. You'll be redirected to the login page
3. Use the default admin credentials:
   - Email: `admin@example.com`
   - Password: `admin123`

⚠️ **Important**: Change the default password immediately after first login!

## 🔧 Admin API Endpoints

### Authentication Endpoints

```bash
# Login
POST /admin/auth/login
Body: {"email": "admin@example.com", "password": "admin123"}

# Get current user info
GET /admin/auth/me
Headers: Authorization: Bearer <token>

# Refresh token
POST /admin/auth/refresh
Headers: Authorization: Bearer <token>

# Logout
POST /admin/auth/logout
```

### System Settings Endpoints

```bash
# Get all system settings
GET /admin/settings/system
Headers: Authorization: Bearer <token>

# Get specific setting
GET /admin/settings/system/maintenance_mode
Headers: Authorization: Bearer <token>

# Update setting (super_admin only)
PUT /admin/settings/system/maintenance_mode
Headers: Authorization: Bearer <token>
Body: {"value": true, "description": "System in maintenance mode"}
```

### AI Provider Management

```bash
# Get all AI providers
GET /admin/settings/ai-providers
Headers: Authorization: Bearer <token>

# Create new AI provider (super_admin only)
POST /admin/settings/ai-providers
Headers: Authorization: Bearer <token>
Body: {
    "name": "Custom OpenAI",
    "provider_type": "openai",
    "config": {"base_url": "https://api.openai.com", "models": ["gpt-4"]},
    "is_active": true,
    "is_default": false
}
```

### Tenant Management

```bash
# Get all tenants
GET /admin/tenants
Headers: Authorization: Bearer <token>

# Create new tenant
POST /admin/tenants
Headers: Authorization: Bearer <token>
Body: {
    "name": "Acme Corp",
    "slug": "acme-corp",
    "owner_email": "admin@acme.com",
    "plan": "pro"
}
```

## 🔒 Security Configuration

### 1. Change Default Passwords

**Critical**: Change all default passwords before deploying to production:

```sql
-- Update admin password
UPDATE admin_users 
SET password_hash = '$2b$12$NEW_HASHED_PASSWORD' 
WHERE email = 'admin@example.com';
```

### 2. JWT Secret Key

Generate a secure JWT secret key:

```python
import secrets
jwt_secret = secrets.token_urlsafe(32)
print(f"JWT_SECRET_KEY={jwt_secret}")
```

### 3. Database Security

- Use strong database passwords
- Restrict database access to authorized IPs
- Enable SSL/TLS for database connections
- Regular password rotation

## 📊 System Monitoring

### Default System Settings

The system comes with these default settings:

```json
{
    "ai_provider_default": "openai",
    "max_tenants_per_plan": {
        "free": 10,
        "pro": 100, 
        "enterprise": 1000
    },
    "rate_limits": {
        "requests_per_minute": 60,
        "tokens_per_day": 100000
    },
    "maintenance_mode": false,
    "registration_enabled": true
}
```

### Admin Roles

- **admin**: Can view and manage tenants, view settings
- **super_admin**: Full access including system settings and AI provider management

## 🐛 Troubleshooting

### Common Issues

1. **Migration fails**: Check database connection and permissions
2. **Admin login fails**: Verify user exists and password is correct
3. **Token errors**: Check JWT_SECRET_KEY is set correctly
4. **CORS errors**: Update CORS_ORIGINS to include your frontend URL

### Logs

Check application logs for detailed error information:

```bash
# If using uvicorn with --log-level debug
uvicorn app.main:app --reload --log-level debug
```

### Database Connection Test

```python
from sqlalchemy import create_engine, text
engine = create_engine("your_database_url")
with engine.connect() as conn:
    result = conn.execute(text("SELECT 1"))
    print("Database connected successfully!")
```

## 📝 Next Steps

1. **Change default passwords** and create your admin users
2. **Configure AI providers** with your API keys
3. **Set up system settings** according to your requirements
4. **Create tenants** and test the system
5. **Set up monitoring** and logging for production
6. **Configure backups** for your database
7. **Set up SSL/TLS** for production deployment

## 🚨 Production Checklist

- [ ] Changed all default passwords
- [ ] Set secure JWT_SECRET_KEY
- [ ] Configured proper CORS origins
- [ ] Set up database backups
- [ ] Configured SSL/TLS
- [ ] Set up monitoring and alerts
- [ ] Reviewed and updated system settings
- [ ] Created production admin users
- [ ] Tested admin dashboard functionality
- [ ] Set up log rotation and monitoring