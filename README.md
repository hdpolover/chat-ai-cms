# Chatbot API

A multi-tenant chatbot API service built with FastAPI, PostgreSQL (with pgvector), and Redis. This service provides a complete RAG (Retrieval-Augmented Generation) pipeline with document ingestion, vector embeddings, and scope-based access control.

## Features

- **Multi-tenant Architecture**: Separate tenants with isolated data and configurations
- **RAG Pipeline**: Document ingestion, chunking, embedding, and retrieval
- **Vector Search**: Powered by pgvector for semantic similarity search  
- **Scope-based Access Control**: Fine-grained permissions and guardrails
- **Streaming Chat**: Server-sent events (SSE) for real-time responses
- **Rate Limiting**: Per-API-key rate limiting with Redis
- **Admin Interface**: SQLAdmin-powered UI for management
- **Document Processing**: Support for PDF, DOCX, JSON, Markdown, and URLs
- **Authentication**: JWT tokens and TOTP for admin access
- **Observability**: Structured logging and health checks

## Tech Stack

- **FastAPI** + Uvicorn for the API server
- **SQLAlchemy 2.0** + Alembic for database ORM and migrations
- **PostgreSQL** + pgvector for data storage and vector search
- **Redis** for caching, rate limiting, and task queues
- **RQ** for background job processing
- **OpenAI API** for chat completions and embeddings
- **Pydantic v2** for data validation
- **Docker** + docker-compose for containerization

## Quick Start

### Prerequisites

- Docker and Docker Compose
- OpenAI API key
- Python 3.11+ (for local development)

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd chat-ai-cms-api
cp .env.example .env
# Edit .env with your OpenAI API key and other settings
```

### 2. Start with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Check health
curl http://localhost:8000/v1/health
```

### 3. Run Database Migrations

```bash
# Migrations run automatically in Docker, but you can run manually:
docker-compose exec api alembic upgrade head
```

### 4. Create Initial Data

The API will be available at `http://localhost:8000`. Access the interactive docs at `http://localhost:8000/docs`.

## API Endpoints

### Core Endpoints

- `GET /v1/health` - Health check
- `POST /v1/chat` - Chat with bots (supports streaming)

### Admin Endpoints (Coming Soon)

- Bot management
- Dataset and document upload
- API key management
- Tenant configuration

## Development

### Local Setup

```bash
# Install dependencies
pip install -e ".[dev]"

# Start PostgreSQL and Redis
docker-compose up postgres redis -d

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload

# Run tests
pytest

# Format code
black .
ruff check . --fix
```

### Project Structure

```
app/
├── main.py              # FastAPI application
├── deps.py              # Dependencies and auth
├── db.py                # Database configuration
├── models.py            # SQLAlchemy models
├── schemas.py           # Pydantic schemas
├── routers/             # API route handlers
│   ├── chat.py          # Chat endpoints
│   └── health.py        # Health check
├── services/            # Business logic
│   ├── chat_service.py  # AI model interactions
│   └── retrieval_service.py  # Vector search
├── workers/             # Background job workers
└── admin/               # Admin interface

alembic/                 # Database migrations
tests/                   # Test suite
docker/                  # Docker configuration
```

## Configuration

Key environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `OPENAI_API_KEY` - OpenAI API key for chat and embeddings
- `SECRET_KEY` - JWT signing secret
- `CORS_ORIGINS` - Allowed CORS origins

## Database Schema

Core entities:
- **Tenants** - Multi-tenant isolation
- **Bots** - Chat bot configurations
- **Scopes** - Access control and guardrails
- **Datasets** - Document collections
- **Documents** - Individual files/content
- **Chunks** - Document pieces with embeddings
- **Conversations** - Chat sessions
- **Messages** - Individual chat messages
- **API Keys** - Authentication tokens

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run linting: `ruff check . --fix && black .`
6. Submit a pull request

## License

MIT License - see LICENSE file for details.