"""Pydantic schemas for request/response models."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class BaseSchema(BaseModel):
    """Base schema with common configuration."""
    model_config = ConfigDict(from_attributes=True)


# Chat schemas
class ChatMessage(BaseSchema):
    """Chat message schema."""
    role: str = Field(..., description="Message role: user, assistant, or system")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseSchema):
    """Chat request schema."""
    bot_id: str = Field(..., description="Bot ID to use for the chat")
    messages: List[ChatMessage] = Field(..., description="List of messages in the conversation")
    session_id: Optional[str] = Field(None, description="Session ID for conversation continuity")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")
    stream: bool = Field(False, description="Whether to stream the response")


class Citation(BaseSchema):
    """Citation schema for referenced sources."""
    document_id: str = Field(..., description="Document ID")
    document_title: str = Field(..., description="Document title")
    chunk_id: str = Field(..., description="Chunk ID")
    content: str = Field(..., description="Cited content")
    score: float = Field(..., description="Relevance score")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class TokenUsage(BaseSchema):
    """Token usage statistics."""
    prompt_tokens: int = Field(0, description="Tokens used in the prompt")
    completion_tokens: int = Field(0, description="Tokens used in the completion")
    total_tokens: int = Field(0, description="Total tokens used")


class ChatResponse(BaseSchema):
    """Chat response schema."""
    session_id: str = Field(..., description="Session ID")
    message: ChatMessage = Field(..., description="Assistant response message")
    citations: List[Citation] = Field(default_factory=list, description="Source citations")
    usage: TokenUsage = Field(default_factory=TokenUsage, description="Token usage statistics")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


# Tenant schemas
class TenantBase(BaseSchema):
    """Base tenant schema."""
    name: str = Field(..., max_length=255)
    slug: str = Field(..., max_length=100)
    settings: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = Field(True)


class TenantCreate(TenantBase):
    """Tenant creation schema."""
    pass


class TenantUpdate(BaseSchema):
    """Tenant update schema."""
    name: Optional[str] = Field(None, max_length=255)
    settings: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class TenantResponse(TenantBase):
    """Tenant response schema."""
    id: str
    created_at: datetime
    updated_at: datetime


# Bot schemas
class BotBase(BaseSchema):
    """Base bot schema."""
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    model: str = Field("gpt-3.5-turbo", max_length=100)
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, gt=0)
    is_active: bool = Field(True)
    settings: Dict[str, Any] = Field(default_factory=dict)


class BotCreate(BotBase):
    """Bot creation schema."""
    tenant_id: str


class BotUpdate(BaseSchema):
    """Bot update schema."""
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    model: Optional[str] = Field(None, max_length=100)
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None
    settings: Optional[Dict[str, Any]] = None


class BotResponse(BotBase):
    """Bot response schema."""
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime


# Scope schemas
class ScopeBase(BaseSchema):
    """Base scope schema."""
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    dataset_filters: Dict[str, Any] = Field(default_factory=dict)
    guardrails: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = Field(True)


class ScopeCreate(ScopeBase):
    """Scope creation schema."""
    bot_id: str


class ScopeUpdate(BaseSchema):
    """Scope update schema."""
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    dataset_filters: Optional[Dict[str, Any]] = None
    guardrails: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class ScopeResponse(ScopeBase):
    """Scope response schema."""
    id: str
    bot_id: str
    created_at: datetime
    updated_at: datetime


# Dataset schemas
class DatasetBase(BaseSchema):
    """Base dataset schema."""
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = Field(True)


class DatasetCreate(DatasetBase):
    """Dataset creation schema."""
    tenant_id: str


class DatasetUpdate(BaseSchema):
    """Dataset update schema."""
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class DatasetResponse(DatasetBase):
    """Dataset response schema."""
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime


# Document schemas
class DocumentBase(BaseSchema):
    """Base document schema."""
    title: str = Field(..., max_length=500)
    source_type: str = Field(..., max_length=50)
    source_url: Optional[str] = Field(None, max_length=1000)
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class DocumentCreate(DocumentBase):
    """Document creation schema."""
    dataset_id: str
    content: str


class DocumentUpdate(BaseSchema):
    """Document update schema."""
    title: Optional[str] = Field(None, max_length=500)
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class DocumentResponse(DocumentBase):
    """Document response schema."""
    id: str
    dataset_id: str
    content_hash: str
    status: str
    error_message: Optional[str]
    file_size: Optional[int]
    created_at: datetime
    updated_at: datetime


# API Key schemas
class APIKeyBase(BaseSchema):
    """Base API key schema."""
    name: str = Field(..., max_length=255)
    scopes: List[str] = Field(default_factory=list)
    rate_limit: int = Field(1000, gt=0)
    expires_at: Optional[datetime] = None


class APIKeyCreate(APIKeyBase):
    """API key creation schema."""
    tenant_id: str


class APIKeyUpdate(BaseSchema):
    """API key update schema."""
    name: Optional[str] = Field(None, max_length=255)
    scopes: Optional[List[str]] = None
    rate_limit: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None


class APIKeyResponse(APIKeyBase):
    """API key response schema."""
    id: str
    tenant_id: str
    key_prefix: str
    is_active: bool
    last_used_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class APIKeyCreateResponse(APIKeyResponse):
    """API key creation response with the actual key."""
    key: str = Field(..., description="The actual API key (only shown once)")


# Health check schema
class HealthResponse(BaseSchema):
    """Health check response."""
    status: str = Field(..., description="Service status")
    timestamp: datetime = Field(..., description="Current timestamp")
    version: str = Field(..., description="API version")
    database: str = Field(..., description="Database status")
    redis: str = Field(..., description="Redis status")


# Error schemas
class ErrorDetail(BaseSchema):
    """Error detail schema."""
    field: Optional[str] = Field(None, description="Field that caused the error")
    message: str = Field(..., description="Error message")
    code: Optional[str] = Field(None, description="Error code")


class ErrorResponse(BaseSchema):
    """Error response schema."""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[List[ErrorDetail]] = Field(None, description="Error details")
    request_id: Optional[str] = Field(None, description="Request ID for tracking")


# Pagination schemas
class PaginationParams(BaseSchema):
    """Pagination parameters."""
    page: int = Field(1, ge=1, description="Page number")
    limit: int = Field(20, ge=1, le=100, description="Items per page")


class PaginatedResponse(BaseSchema):
    """Paginated response wrapper."""
    items: List[Any] = Field(..., description="List of items")
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number")
    limit: int = Field(..., description="Items per page")
    pages: int = Field(..., description="Total number of pages")
    has_next: bool = Field(..., description="Whether there are more pages")
    has_prev: bool = Field(..., description="Whether there are previous pages")