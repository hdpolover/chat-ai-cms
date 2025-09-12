# Copilot Prompt & System Requirements

This document defines the system requirements and development plan for building a multi-tenant chatbot API service using FastAPI, Postgres (pgvector), and an admin interface. It also includes a TODO list for Copilot to track implementation progress.

## High-Level Goals
- Multi-tenant chatbot service with configurable bots and scopes.
- Endpoints for chat and admin management.
- RAG pipeline with document ingestion, embeddings, and citations.
- Scope-based guardrails and PII protection.
- Clean architecture, observability, and Dockerized deployment.

## Tech Stack
- FastAPI + Uvicorn
- SQLAlchemy 2.0 + Alembic
- Pydantic v2
- Postgres + pgvector
- RQ (Redis) for workers
- sqladmin for Admin UI
- JWT + TOTP for authentication
- ruff + black + mypy for lint/format/type-check
- pytest for testing

## Core Entities
- Tenants, Bots, Scopes, Datasets, Documents, Chunks, Conversations, Messages, API Keys, Audit Logs

## Required Endpoints
- GET /v1/health
- POST /v1/chat (SSE streaming supported)
- Admin endpoints for bots, scopes, datasets, API keys

## Ingestion Pipeline
- Upload → Parse → Chunk → Embed → Store
- Support for JSON, PDF, DOCX, Markdown, URLs
- Embeddings stored in pgvector

## Retrieval & Scope Enforcement
- Hybrid semantic + keyword search
- Filter by tenant, bot, tags
- Apply scope guardrails, refusal policy, PII masking
- Prevent prompt injection

## Non-Functional Requirements
- Alembic migrations
- Structured logging
- Environment-based config
- Rate limiting per API key
- Token usage tracking
- Dockerized deployment

## Project Structure
```
app/ (main.py, deps.py, models.py, schemas.py, routers/, services/, workers/, admin/)
alembic/
tests/
docker/, docker-compose.yml, pyproject.toml
```

## Database & Indexing
- Enable pgvector
- Chunks table with embedding column
- IVFFLAT index for vectors
- Optional FTS hybrid search

## API Contracts
- **ChatRequest**: bot_id, session_id?, messages[], metadata?
- **ChatResponse**: session_id, output, citations[], usage{}

## Admin UI
- sqladmin views for Tenant, Bot, Scope, Dataset, Document
- Upload datasets, monitor ingestion status

## Security & Auth
- JWT for tenant API keys
- Username/password + TOTP for admin
- CORS restricted to configured origins

## Streaming
- SSE for /v1/chat with token streaming

## Error Handling
- Consistent JSON error shape with code/message/details

---

# TODO List for Copilot
- [ ] Scaffold repo with the described structure and placeholder modules.
- [ ] Add pyproject.toml with required dependencies.
- [ ] Implement db.py, models.py, and Alembic migrations for tables + pgvector.
- [ ] Implement /v1/chat endpoint and retrieval service.
- [ ] Implement OpenAI client wrapper for chat + embeddings.
- [ ] Implement ingestion pipeline (parse, chunk, embed) and worker.
- [ ] Implement admin dataset routes and CRUD for bots/scopes.
- [ ] Add sqladmin views and admin login with TOTP.
- [ ] Add SSE streaming for chat responses.
- [ ] Implement Redis-based rate limiting per API key.
- [ ] Add tests for chat, scope refusal, and ingestion.
- [ ] Provide docker-compose.yml with API, worker, Postgres, Redis, Nginx.
- [ ] Verify health endpoint, dataset ingestion lifecycle, and scope enforcement.
