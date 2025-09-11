# 🚀 Chat AI CMS API - Dashboard - **🔧 API Server**: **http://localhost:8000** (REST API & docs)e

## 📊 System Overview

You n### API Server Services (Docker)
```bash
docker-compose up -d
```

### Admin Dashboard
```bash
cd admin-dashboard
PORT=3000 npm run dev
```

### Tenant Dashboard
```bash
cd tenant-dashboard  
PORT=3002 npm run dev
```parate dashboards** running as part of your multi-tenant chatbot system:

### 🛡️ **Admin Dashboard** - Port 3000
- **URL**: http://localhost:3000
- **Purpose**: System administration and tenant management
- **Users**: System administrators
- **Login**: admin@test.com / admin123

**Features:**
- ✅ Tenant Management (CRUD operations)
- ✅ System Analytics & Statistics  
- ✅ Global Settings & Configuration
- ✅ AI Provider Management
- ✅ User Management
- ✅ System Health Monitoring

### 👥 **Tenant Dashboard** - Port 3002
- **URL**: http://localhost:3002
- **Purpose**: Self-service tenant portal
- **Users**: Individual tenants
- **Login**: Tenant-specific credentials (created by admins)

**Features:** (Currently in development)
- 🔄 Bot Management & Configuration
- 🔄 Chat Interface & Testing
- 🔄 Usage Analytics & Metrics
- 🔄 Tenant-specific Settings
- 🔄 Document Management

### 🔧 **Backend API** - Port 8000
- **URL**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

---

## 🎮 Quick Start Commands

### Start Everything
```bash
./start-all.sh
```
This script will automatically:
1. Start Docker services (PostgreSQL, Redis, FastAPI backend)
2. Start Admin Dashboard on port 3002
3. Start Tenant Dashboard on port 3000
4. Show you all the URLs and credentials

### Check Status
```bash
./status.sh
```
Shows the current status of all services and provides quick access URLs.

### Stop Everything
```bash
./stop-all.sh
```
Stops all dashboards and Docker services.

---

## 🔄 Manual Start (if needed)

### Backend Services (Docker)
```bash
docker-compose up -d
```

### Admin Dashboard
```bash
cd admin-dashboard
PORT=3002 npm run dev
```

### Tenant Dashboard
```bash
cd tenant-dashboard  
PORT=3000 npm run dev
```

---

## 🎯 Current Status

**✅ Fully Functional:**
- Backend API with authentication
- Admin Dashboard with full tenant management
- Docker environment with PostgreSQL + Redis
- Multi-tenant architecture

**🔄 In Development:**
- Tenant Dashboard core features
- Bot management interface
- Chat testing interface
- Tenant analytics

---

## 🔐 Access Credentials

### Admin Dashboard
- **Email**: admin@test.com
- **Password**: admin123

### Tenant Dashboard
Tenant accounts are created through the Admin Dashboard. Each tenant gets their own isolated login credentials.

---

## 🌐 System Architecture

```
┌─────────────────┐    ┌─────────────────┐
│  Admin Dashboard│    │ Tenant Dashboard│
│   (Port 3000)   │    │   (Port 3002)   │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────────┬───────────┘
                     │
            ┌────────▼────────┐
            │   Backend API   │
            │   (Port 8000)   │
            └─────────┬───────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
┌───▼────┐    ┌──────▼──────┐    ┌─────▼─────┐
│PostgreSQL│    │    Redis    │    │  Worker   │
│(Port 5432)│    │ (Port 6379) │    │ Services  │
└────────┘    └─────────────┘    └───────────┘
```

---

## 🛠️ Development Workflow

1. **Start Services**: Run `./start-all.sh`
2. **Check Status**: Run `./status.sh` anytime
3. **Access Admin**: Go to http://localhost:3002
4. **Access Tenant**: Go to http://localhost:3000  
5. **API Testing**: Use http://localhost:8000/docs
6. **Stop Services**: Run `./stop-all.sh` when done

---

## 📝 Next Steps

The tenant dashboard foundation is complete. Next development priorities:

1. **Build Core Layout** - Main navigation and dashboard structure
2. **Bot Management** - CRUD interface for chatbot configuration
3. **Chat Interface** - Testing and conversation management  
4. **Analytics Dashboard** - Usage statistics and metrics
5. **Settings Panel** - Tenant-specific configuration options

---

*All services are now running and accessible! Use the provided scripts for easy management.*