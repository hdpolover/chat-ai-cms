"""SQLAlchemy models for the chatbot API."""
from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from .db import Base


class AdminUser(Base):
    """Admin User model for system administration."""
    __tablename__ = "admin_users"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="admin")  # admin, super_admin
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("idx_admin_user_email", "email"),
    )


class Tenant(Base):
    """Tenant model for multi-tenancy."""
    __tablename__ = "tenants"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    login_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    locked_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    settings: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    global_rate_limit: Mapped[int] = mapped_column(Integer, nullable=False, default=1000)
    feature_flags: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    owner_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    plan: Mapped[str] = mapped_column(String(50), nullable=False, default="free")  # free, pro, enterprise

    # Relationships
    bots: Mapped[List["Bot"]] = relationship("Bot", back_populates="tenant", cascade="all, delete-orphan")
    ai_providers: Mapped[List["TenantAIProvider"]] = relationship("TenantAIProvider", back_populates="tenant", cascade="all, delete-orphan")
    api_keys: Mapped[List["APIKey"]] = relationship("APIKey", back_populates="tenant", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_tenant_email", "email"),
    )


class TenantAIProvider(Base):
    """Tenant-specific AI Provider model."""
    __tablename__ = "tenant_ai_providers"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    tenant_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("tenants.id"), nullable=False)
    global_ai_provider_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("global_ai_providers.id"), nullable=False)
    provider_name: Mapped[str] = mapped_column(String(50), nullable=False)  # openai, anthropic, google, etc.
    api_key: Mapped[str] = mapped_column(Text, nullable=False)
    base_url: Mapped[Optional[str]] = mapped_column(String(255))  # Custom endpoint URLs
    custom_settings: Mapped[dict] = mapped_column(JSON, default=dict)  # Provider-specific settings
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="ai_providers")
    global_provider: Mapped["GlobalAIProvider"] = relationship("GlobalAIProvider")
    bots: Mapped[List["Bot"]] = relationship("Bot", back_populates="ai_provider")

    __table_args__ = (
        UniqueConstraint("tenant_id", "provider_name", name="uq_tenant_provider"),
        Index("idx_tenant_ai_provider_tenant", "tenant_id"),
        Index("idx_tenant_ai_provider_name", "provider_name"),
    )


class Bot(Base):
    """Bot configuration model."""
    __tablename__ = "bots"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    tenant_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("tenants.id"), nullable=False)
    tenant_ai_provider_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("tenant_ai_providers.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    system_prompt: Mapped[Optional[str]] = mapped_column(Text)
    model: Mapped[str] = mapped_column(String(100), default="gpt-3.5-turbo")
    temperature: Mapped[float] = mapped_column(default=0.7)
    max_tokens: Mapped[Optional[int]] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    settings: Mapped[dict] = mapped_column(JSON, default=dict)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    allowed_domains: Mapped[list] = mapped_column(JSON, default=list)
    guardrails: Mapped[dict] = mapped_column(JSON, default=dict)  # Response guardrails configuration
    dataset_filters: Mapped[dict] = mapped_column(JSON, default=dict)  # Dataset content filters
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="bots")
    ai_provider: Mapped[Optional["TenantAIProvider"]] = relationship("TenantAIProvider", back_populates="bots")
    scopes: Mapped[List["Scope"]] = relationship("Scope", back_populates="bot", cascade="all, delete-orphan")
    conversations: Mapped[List["Conversation"]] = relationship("Conversation", back_populates="bot", cascade="all, delete-orphan")
    datasets: Mapped[List["Dataset"]] = relationship("Dataset", secondary="bot_datasets", back_populates="bots")

    __table_args__ = (
        UniqueConstraint("tenant_id", "name", name="uq_bot_tenant_name"),
    )


class BotDataset(Base):
    """Bot-Dataset relationship model for knowledge base assignment."""
    __tablename__ = "bot_datasets"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    bot_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("bots.id", ondelete="CASCADE"), nullable=False)
    dataset_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    priority: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("bot_id", "dataset_id", name="uq_bot_dataset"),
        Index("idx_bot_datasets_bot_id", "bot_id"),
        Index("idx_bot_datasets_dataset_id", "dataset_id"),
    )


class Scope(Base):
    """Scope model for bot access control."""
    __tablename__ = "scopes"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    bot_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("bots.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    dataset_filters: Mapped[dict] = mapped_column(JSON, default=dict)  # Tags, categories, etc.
    guardrails: Mapped[dict] = mapped_column(JSON, default=dict)  # Refusal rules, PII masking
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    bot: Mapped["Bot"] = relationship("Bot", back_populates="scopes")

    __table_args__ = (
        UniqueConstraint("bot_id", "name", name="uq_scope_bot_name"),
    )


class Dataset(Base):
    """Dataset model for document collections."""
    __tablename__ = "datasets"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    tenant_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("tenants.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    tags: Mapped[List[str]] = mapped_column(JSON, default=list)
    meta_data: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    documents: Mapped[List["Document"]] = relationship("Document", back_populates="dataset", cascade="all, delete-orphan")
    bots: Mapped[List["Bot"]] = relationship("Bot", secondary="bot_datasets", back_populates="datasets")

    __table_args__ = (
        UniqueConstraint("tenant_id", "name", name="uq_dataset_tenant_name"),
    )


class Document(Base):
    """Document model for uploaded files."""
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    dataset_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("datasets.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)  # file, url, text
    source_url: Mapped[Optional[str]] = mapped_column(String(1000))
    file_path: Mapped[Optional[str]] = mapped_column(String(1000))
    file_size: Mapped[Optional[int]] = mapped_column(Integer)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    tags: Mapped[List[str]] = mapped_column(JSON, default=list)
    meta_data: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, processing, completed, failed
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    dataset: Mapped["Dataset"] = relationship("Dataset", back_populates="documents")
    chunks: Mapped[List["Chunk"]] = relationship("Chunk", back_populates="document", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_document_content_hash", "content_hash"),
        Index("idx_document_status", "status"),
    )


class Chunk(Base):
    """Chunk model for document pieces with embeddings."""
    __tablename__ = "chunks"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    document_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("documents.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[Optional[List[float]]] = mapped_column(Vector(1536))  # OpenAI ada-002 dimension
    token_count: Mapped[int] = mapped_column(Integer, nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    start_char: Mapped[int] = mapped_column(Integer, nullable=False)
    end_char: Mapped[int] = mapped_column(Integer, nullable=False)
    meta_data: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    document: Mapped["Document"] = relationship("Document", back_populates="chunks")

    __table_args__ = (
        Index("idx_chunk_document_id", "document_id"),
        Index("idx_chunk_embedding", "embedding", postgresql_using="ivfflat", postgresql_with={"lists": 100}),
    )


class Conversation(Base):
    """Conversation model for chat sessions."""
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    bot_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("bots.id"), nullable=False)
    session_id: Mapped[Optional[str]] = mapped_column(String(255))
    title: Mapped[Optional[str]] = mapped_column(String(500))
    meta_data: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    bot: Mapped["Bot"] = relationship("Bot", back_populates="conversations")
    messages: Mapped[List["Message"]] = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_conversation_session_id", "session_id"),
        Index("idx_conversation_bot_id", "bot_id"),
    )


class Message(Base):
    """Message model for chat messages."""
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    conversation_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("conversations.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)  # user, assistant, system
    content: Mapped[str] = mapped_column(Text, nullable=False)
    citations: Mapped[List[dict]] = mapped_column(JSON, default=list)
    token_usage: Mapped[dict] = mapped_column(JSON, default=dict)
    meta_data: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")

    __table_args__ = (
        Index("idx_message_conversation_id", "conversation_id"),
        Index("idx_message_sequence", "conversation_id", "sequence_number"),
    )


class APIKey(Base):
    """API Key model for authentication."""
    __tablename__ = "api_keys"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    tenant_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("tenants.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    key_hash: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    key_prefix: Mapped[str] = mapped_column(String(20), nullable=False)
    scopes: Mapped[List[str]] = mapped_column(JSON, default=list)
    rate_limit: Mapped[int] = mapped_column(Integer, default=1000)  # requests per hour
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="api_keys")

    __table_args__ = (
        Index("idx_api_key_hash", "key_hash"),
        Index("idx_api_key_prefix", "key_prefix"),
    )


class AuditLog(Base):
    """Audit log model for tracking actions."""
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    tenant_id: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), ForeignKey("tenants.id"))
    user_id: Mapped[Optional[str]] = mapped_column(String(255))
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_id: Mapped[Optional[str]] = mapped_column(String(255))
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))
    user_agent: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_audit_log_tenant_id", "tenant_id"),
        Index("idx_audit_log_action", "action"),
        Index("idx_audit_log_created_at", "created_at"),
    )


class SystemSettings(Base):
    """System settings model for global configuration."""
    __tablename__ = "system_settings"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    key: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    value: Mapped[dict] = mapped_column(JSON, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("idx_system_settings_key", "key"),
    )


class GlobalAIProvider(Base):
    """Global AI Provider model for system-wide AI configurations."""
    __tablename__ = "global_ai_providers"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    provider_type: Mapped[str] = mapped_column(String(50), nullable=False)  # openai, anthropic, azure, custom
    config: Mapped[dict] = mapped_column(JSON, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("idx_global_ai_provider_type", "provider_type"),
    )