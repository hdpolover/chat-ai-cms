# Chat AI CMS - Multi-Tenant Chatbot Platform

A comprehensive multi-tenant chatbot API service with admin and tenant dashboards, built with FastAPI, PostgreSQL, Redis, and Next.js.

## 🏗️ Project Structure

```
chat-ai-cms/
├── README.md                    # This file - project overview
├── docker-compose.yml           # Multi-service Docker setup
├── .gitignore                   # Git ignore patterns
│
├── backend/                     # FastAPI Backend API
│   ├── app/                     # Main application code
│   ├── alembic/                 # Database migrations
│   ├── docker/                  # Docker configurations
│   ├── scripts/                 # Utility scripts
│   ├── tests/                   # Backend tests
│   ├── pyproject.toml           # Python dependencies
│   └── requirements.txt         # Legacy requirements
│
├── admin-dashboard/             # Admin Management Interface
│   ├── src/                     # Next.js source code
│   ├── package.json             # Node dependencies
│   └── README.md                # Admin dashboard docs
│
├── tenant-dashboard/            # Tenant Self-Service Interface
│   ├── src/                     # Next.js source code
│   ├── package.json             # Node dependencies
│   └── README.md                # Tenant dashboard docs
│
└── docs/                        # Project Documentation
    ├── API.md                   # API documentation
    ├── DEPLOYMENT.md            # Deployment guides
    └── DEVELOPMENT.md           # Development setup
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for dashboard development)
- Python 3.12+ (for backend development)

### 1. Start All Services
```bash
# Start backend services (API, Database, Redis)
docker-compose up -d

# Start admin dashboard (in separate terminal)
cd admin-dashboard && npm install && npm run dev

# Start tenant dashboard (in separate terminal)  
cd tenant-dashboard && npm install && npm run dev
```

### 2. Access Applications
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Admin Dashboard**: http://localhost:3002 (or next available port)
- **Tenant Dashboard**: http://localhost:3000 (or next available port)

## 🔧 Development

### Backend Development
```bash
cd backend
pip install -e .
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
# Admin Dashboard
cd admin-dashboard
npm run dev

# Tenant Dashboard
cd tenant-dashboard
npm run dev
```

## 📦 Components

### Backend API (`/backend`)
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Primary database with pgvector for embeddings
- **Redis** - Caching and session management
- **Alembic** - Database migrations
- **Multi-tenant architecture** with complete isolation

### Admin Dashboard (`/admin-dashboard`)
- **Next.js 14** - React framework with App Router
- **Material-UI** - Component library
- **TanStack Query** - Server state management
- **TypeScript** - Type safety
- **Features**: Tenant management, analytics, system settings

### Tenant Dashboard (`/tenant-dashboard`)
- **Next.js 15** - Latest React framework
- **Material-UI** - Consistent design system
- **TanStack Query** - API state management  
- **TypeScript** - Full type safety
- **Features**: Bot management, chat interface, usage analytics

## 🛠️ Technology Stack

**Backend:**
- Python 3.12 + FastAPI
- PostgreSQL 15 + pgvector
- Redis 7
- SQLAlchemy + Alembic
- JWT Authentication
- Docker containerization

**Frontend:**
- Next.js 14/15 + TypeScript
- Material-UI v5
- TanStack Query v5
- React Hook Form + Zod
- Axios for API calls

## 📚 Documentation

Comprehensive documentation is available in the `/docs` directory:

### 🗂️ Core Documentation
- **[Database Schema](./docs/DATABASE_SCHEMA.md)** - Complete database structure, relationships, and data flow patterns
- **[API Endpoints](./docs/API_ENDPOINTS.md)** - Full API reference with examples and integration patterns
- **[Development Workflow](./docs/DEVELOPMENT_WORKFLOW.md)** - Development setup, testing, deployment, and maintenance

### 📋 Reference Guides
- [Dashboard Guide](./DASHBOARD_GUIDE.md) - Admin and tenant dashboard usage
- [Folder Structure](./FOLDER_RENAME_SUMMARY.md) - Project organization overview

### 🔍 Quick References
- **Database Relationships**: Multi-tenant architecture with global AI providers → tenant AI providers → bots → conversations
- **Current State**: 1 tenant configured, 2 AI providers (OpenAI, Anthropic), ready for bot creation
- **Service Ports**: API (8000), Admin Dashboard (3000), Tenant Dashboard (3002)

## 🔐 Authentication

- **Admin Dashboard**: JWT-based admin authentication
- **Tenant Dashboard**: JWT-based tenant-scoped authentication
- **API**: Bearer token authentication with role-based access

## 🚢 Deployment

The project is designed for containerized deployment:

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Or deploy individual services
docker-compose up -d backend redis postgres
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support, email support@example.com or create an issue in this repository.