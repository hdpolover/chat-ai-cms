# Development Workflow Guide

## Overview

This guide provides a comprehensive workflow for developing, testing, and maintaining the Chat AI CMS API system. It covers database management, API development, frontend integration, and deployment procedures.

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)
- PostgreSQL client tools (optional, for direct DB access)

### Environment Setup

1. **Clone and Navigate**:
```bash
cd /path/to/chat-ai-cms-api
```

2. **Start All Services**:
```bash
./start-all.sh
```

3. **Check Service Status**:
```bash
./status.sh
```

4. **Stop All Services**:
```bash
./stop-all.sh
```

### Service URLs

- **API Server**: http://localhost:8000
- **Admin Dashboard**: http://localhost:3000
- **Tenant Dashboard**: http://localhost:3002
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Database Development Workflow

### 1. Schema Changes

#### Creating Migrations
```bash
cd api-server
docker exec chataicmsapi-api-1 alembic revision --autogenerate -m "Description of changes"
```

#### Applying Migrations
```bash
docker exec chataicmsapi-api-1 alembic upgrade head
```

#### Checking Migration Status
```bash
docker exec chataicmsapi-api-1 alembic current
docker exec chataicmsapi-api-1 alembic history
```

#### Rolling Back Migrations
```bash
docker exec chataicmsapi-api-1 alembic downgrade -1  # Go back one migration
docker exec chataicmsapi-api-1 alembic downgrade base  # Go to initial state
```

### 2. Database Access

#### Connect to PostgreSQL
```bash
docker exec -e PGPASSWORD=postgres chataicmsapi-postgres-1 psql -h localhost -U postgres -d chatbot_db
```

#### Common Database Queries
```sql
-- Check table structure
\d table_name

-- List all tables
\dt

-- Check relationships
SELECT 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

### 3. Test Data Management

#### Create Admin User
```bash
cd api-server
python scripts/create_admin_user.py
```

#### Create Test Tenant
```bash
cd api-server
python create_tenant_with_auth.py
```

#### Seed Global AI Providers
```sql
INSERT INTO global_ai_providers (id, name, provider_type, config, is_active, is_default)
VALUES 
    (gen_random_uuid(), 'OpenAI', 'openai', '{"base_url": "https://api.openai.com", "models": ["gpt-3.5-turbo", "gpt-4"]}', true, true),
    (gen_random_uuid(), 'Anthropic', 'anthropic', '{"base_url": "https://api.anthropic.com", "models": ["claude-3-sonnet"]}', true, false);
```

## API Development Workflow

### 1. Backend Development (FastAPI)

#### Project Structure
```
api-server/
├── app/
│   ├── main.py              # FastAPI app initialization
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── deps.py              # Dependencies (auth, db)
│   ├── routers/             # API route handlers
│   │   ├── admin/           # Admin endpoints
│   │   ├── tenant/          # Tenant endpoints
│   │   └── chat.py          # Public chat endpoints
│   └── services/            # Business logic
│       ├── ai_provider_service.py
│       ├── chat_service.py
│       └── retrieval_service.py
├── alembic/                 # Database migrations
├── tests/                   # Test files
└── requirements.txt         # Python dependencies
```

#### Adding New Endpoints

1. **Define Pydantic Schema** (`schemas.py`):
```python
class BotCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    tenant_ai_provider_id: UUID
    system_prompt: Optional[str] = None
    model: str = "gpt-3.5-turbo"
    temperature: float = Field(0.7, ge=0.0, le=2.0)
```

2. **Create Router** (`routers/tenant/bots.py`):
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.deps import get_db, get_current_tenant

router = APIRouter()

@router.post("/", response_model=BotResponse)
def create_bot(
    bot: BotCreate,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    # Implementation
    pass
```

3. **Include Router** (`main.py`):
```python
from app.routers.tenant import bots

app.include_router(
    bots.router,
    prefix="/v1/tenant/bots",
    tags=["tenant-bots"]
)
```

#### Testing Endpoints
```bash
# Start development server
cd api-server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Test with curl
curl -X POST http://localhost:8000/v1/tenant/bots \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Bot", "tenant_ai_provider_id": "uuid"}'
```

### 2. Frontend Development

#### Admin Dashboard Structure
```
admin-dashboard/
├── src/
│   ├── app/                 # Next.js 13+ app directory
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Dashboard home
│   │   ├── login/           # Auth pages
│   │   ├── tenants/         # Tenant management
│   │   └── settings/        # System settings
│   ├── components/          # Reusable components
│   │   ├── layout/          # Layout components
│   │   ├── tenants/         # Tenant-specific components
│   │   └── providers/       # Context providers
│   ├── services/            # API client services
│   │   ├── api.ts           # Base API client
│   │   ├── auth.ts          # Authentication service
│   │   └── tenant.ts        # Tenant service
│   └── types/               # TypeScript type definitions
├── package.json
└── next.config.js
```

#### Tenant Dashboard Structure
```
tenant-dashboard/
├── src/
│   ├── app/
│   │   ├── dashboard/       # Main dashboard
│   │   ├── bots/            # Bot management
│   │   ├── datasets/        # Dataset management
│   │   ├── analytics/       # Usage analytics
│   │   └── settings/        # Tenant settings
│   ├── components/
│   │   ├── bots/            # Bot components
│   │   ├── datasets/        # Dataset components
│   │   └── analytics/       # Analytics components
│   └── services/
│       ├── bot.ts           # Bot service
│       ├── dataset.ts       # Dataset service
│       └── analytics.ts     # Analytics service
```

#### Adding New Features

1. **Create Service** (`services/bot.ts`):
```typescript
export class BotService {
    static async create(bot: CreateBotRequest): Promise<Bot> {
        const response = await apiClient.post('/v1/tenant/bots', bot);
        return response.data;
    }

    static async list(): Promise<Bot[]> {
        const response = await apiClient.get('/v1/tenant/bots');
        return response.data;
    }
}
```

2. **Create Component** (`components/bots/BotForm.tsx`):
```typescript
'use client';
import { useState } from 'react';
import { BotService } from '@/services/bot';

export default function BotForm() {
    const [bot, setBot] = useState<CreateBotRequest>({
        name: '',
        description: '',
        tenant_ai_provider_id: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await BotService.create(bot);
            // Handle success
        } catch (error) {
            // Handle error
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* Form fields */}
        </form>
    );
}
```

3. **Create Page** (`app/bots/page.tsx`):
```typescript
import BotForm from '@/components/bots/BotForm';
import BotList from '@/components/bots/BotList';

export default function BotsPage() {
    return (
        <div>
            <h1>Bot Management</h1>
            <BotForm />
            <BotList />
        </div>
    );
}
```

#### Frontend Development Commands
```bash
# Install dependencies
cd admin-dashboard  # or tenant-dashboard
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

## Testing Workflow

### 1. Backend Testing

#### Unit Tests
```bash
cd api-server
pytest tests/unit/
```

#### Integration Tests
```bash
pytest tests/integration/
```

#### Test Database Setup
```bash
# Create test database
createdb chatbot_test

# Run migrations on test DB
TESTING=true alembic upgrade head
```

#### Example Test
```python
# tests/test_bots.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_bot():
    response = client.post(
        "/v1/tenant/bots",
        json={
            "name": "Test Bot",
            "tenant_ai_provider_id": "uuid"
        },
        headers={"Authorization": "Bearer test-token"}
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Test Bot"
```

### 2. Frontend Testing

#### Component Tests
```bash
cd admin-dashboard
npm run test
```

#### E2E Tests
```bash
npm run test:e2e
```

#### Example Component Test
```typescript
// __tests__/BotForm.test.tsx
import { render, screen } from '@testing-library/react';
import BotForm from '@/components/bots/BotForm';

test('renders bot form', () => {
    render(<BotForm />);
    expect(screen.getByLabelText(/bot name/i)).toBeInTheDocument();
});
```

## Deployment Workflow

### 1. Production Environment

#### Docker Compose Production
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  api:
    build: ./api-server
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/chatbot_prod
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET_KEY=prod-secret-key
    ports:
      - "8000:8000"
  
  postgres:
    image: pgvector/pgvector:pg15
    environment:
      - POSTGRES_DB=chatbot_prod
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=secure-password
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_prod_data:/data

volumes:
  postgres_prod_data:
  redis_prod_data:
```

#### Environment Variables
```bash
# .env.prod
DATABASE_URL=postgresql://user:pass@postgres:5432/chatbot_prod
REDIS_URL=redis://redis:6379
JWT_SECRET_KEY=super-secure-secret-key
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
ENVIRONMENT=production
LOG_LEVEL=INFO
```

### 2. CI/CD Pipeline

#### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Tests
        run: |
          docker-compose -f docker-compose.test.yml up --abort-on-container-exit
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        run: |
          ssh user@server 'cd /app && docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d'
```

### 3. Database Migration in Production

```bash
# Backup database
pg_dump chatbot_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Apply migrations
docker exec production_api alembic upgrade head

# Verify migration
docker exec production_api alembic current
```

## Monitoring and Maintenance

### 1. Health Checks

#### API Health
```bash
curl http://localhost:8000/v1/health
```

#### Database Health
```sql
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE tablename IN ('tenants', 'bots', 'conversations');
```

### 2. Performance Monitoring

#### Database Performance
```sql
-- Slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Index usage
SELECT 
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_tup_read / NULLIF(idx_tup_fetch, 0) as ratio
FROM pg_stat_user_indexes;
```

#### API Performance
```python
# Add to FastAPI middleware
import time
from fastapi import Request

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response
```

### 3. Backup and Recovery

#### Database Backup
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump chatbot_prod > /backups/chatbot_backup_$DATE.sql
aws s3 cp /backups/chatbot_backup_$DATE.sql s3://backups/
```

#### Recovery Process
```bash
# Restore from backup
psql chatbot_prod < backup_20250911_120000.sql

# Verify data integrity
psql chatbot_prod -c "SELECT COUNT(*) FROM tenants;"
```

## Common Issues and Solutions

### 1. Database Issues

#### Migration Conflicts
```bash
# Check current state
docker exec chataicmsapi-api-1 alembic current

# Stamp specific revision
docker exec chataicmsapi-api-1 alembic stamp revision_id

# Force migration
docker exec chataicmsapi-api-1 alembic upgrade head --sql > migration.sql
```

#### Connection Issues
```python
# Add connection pooling
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True
)
```

### 2. API Issues

#### Authentication Problems
```python
# Debug JWT tokens
import jwt

try:
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    print(f"Token payload: {payload}")
except jwt.ExpiredSignatureError:
    print("Token has expired")
except jwt.InvalidTokenError:
    print("Invalid token")
```

#### CORS Issues
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. Frontend Issues

#### API Connection Errors
```typescript
// Add retry logic
const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 10000,
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Handle authentication error
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
```

## Development Best Practices

### 1. Code Organization

- **Separation of Concerns**: Keep business logic in services, not in route handlers
- **Type Safety**: Use TypeScript for frontend and Pydantic for backend validation
- **Error Handling**: Consistent error responses and proper HTTP status codes
- **Documentation**: Keep API documentation updated with schema changes

### 2. Database Best Practices

- **Migrations**: Always use Alembic for schema changes
- **Indexes**: Add indexes for frequently queried columns
- **Foreign Keys**: Maintain referential integrity
- **Soft Deletes**: Use `is_active` flags instead of hard deletes

### 3. Security Best Practices

- **Authentication**: Use JWT tokens with appropriate expiration
- **Authorization**: Implement tenant isolation
- **Input Validation**: Validate all inputs with Pydantic schemas
- **Rate Limiting**: Implement rate limiting for API endpoints

This development workflow guide provides a comprehensive framework for working with the Chat AI CMS API system, from initial setup through production deployment and maintenance.