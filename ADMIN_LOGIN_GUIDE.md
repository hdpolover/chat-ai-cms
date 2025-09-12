# Admin Dashboard Login Instructions

## 🚀 Quick Start

The admin dashboard is accessible at: **http://localhost:3000**

## 🔑 Login Credentials

**Email:** `admin@example.com`  
**Password:** `admin123`

## ⚠️ Important Notes

### Correct Admin Credentials
- The status script shows `admin@test.com` but the actual working credentials are:
  - **Email:** `admin@example.com` 
  - **Password:** `admin123`

### API Endpoints
The admin authentication uses these endpoints:
- **Login:** `POST /admin/auth/login`
- **Profile:** `GET /admin/auth/me` 
- **Logout:** `POST /admin/auth/logout`
- **Refresh:** `POST /admin/auth/refresh`

### Recent Fixes Applied
1. ✅ **Created Admin User**: Added admin user to database with proper credentials
2. ✅ **Fixed Type Interfaces**: Updated `AuthResponse` and `User` types to match backend
3. ✅ **Verified API Connection**: Confirmed backend login endpoint is working
4. ✅ **Updated Auth Service**: Removed refresh token dependency (not provided by backend)

## 🔧 Troubleshooting

### If Login Still Fails:
1. **Check Browser Console**: Press F12 and look for any JavaScript errors
2. **Verify API Connection**: Ensure backend is running on port 8000
3. **Clear Browser Cache**: Clear cookies and local storage
4. **Check Network Tab**: Verify API requests are reaching the backend

### Test API Directly:
```bash
curl -X POST http://localhost:8000/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

Expected response:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer", 
  "user": {
    "id": "948b4a41-6d59-4e3c-811a-99c37591280b",
    "email": "admin@example.com",
    "name": "System Administrator",
    "role": "super_admin",
    "is_active": true,
    "last_login_at": "2025-09-11T11:40:30.520945Z",
    "created_at": "2025-09-11T11:37:19.814288Z"
  }
}
```

## 📊 System Status

All services should be running:
- ✅ **Backend API**: http://localhost:8000
- ✅ **Admin Dashboard**: http://localhost:3000  
- ✅ **Tenant Dashboard**: http://localhost:3002
- ✅ **Database**: PostgreSQL on port 5432
- ✅ **Redis**: Redis on port 6379

## 🎯 Next Steps

After successful login, you should be able to:
1. **Access Dashboard**: View system overview and statistics
2. **Manage Tenants**: Create, edit, and delete tenant organizations
3. **System Settings**: Configure global AI providers and system settings
4. **User Management**: Manage admin users and permissions

---

**Summary**: Use `admin@example.com` / `admin123` to log into the admin dashboard at http://localhost:3000