"""Database configuration and setup."""
import os
from typing import AsyncGenerator

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost/chatbot_db")
ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# Sync engine for migrations and admin
sync_engine = create_engine(DATABASE_URL, echo=os.getenv("DB_ECHO", "false").lower() == "true")
sync_session = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

# Async engine for main app
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=os.getenv("DB_ECHO", "false").lower() == "true",
    pool_pre_ping=True,
    pool_recycle=300,
)
async_session = async_sessionmaker(
    async_engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


def get_sync_db():
    """Get synchronous database session for admin."""
    db = sync_session()
    try:
        yield db
    finally:
        db.close()