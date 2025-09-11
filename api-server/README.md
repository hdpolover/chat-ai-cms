# Chat AI CMS Backend

FastAPI-based backend service for the multi-tenant chatbot platform.

## Features

- Multi-tenant architecture with complete data isolation
- FastAPI with automatic OpenAPI documentation
- PostgreSQL database with pgvector for embeddings
- Redis for caching and background tasks
- JWT authentication for admins and tenants
- RAG pipeline for document-based chatbots

## Development

```bash
# Install dependencies
pip install -e .

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Visit http://localhost:8000/docs for interactive API documentation.