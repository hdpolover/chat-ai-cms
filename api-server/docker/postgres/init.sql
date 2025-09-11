-- Initialize database with pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Note: Additional indexes will be created by Alembic migrations after tables are created