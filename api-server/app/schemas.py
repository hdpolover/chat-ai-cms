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
    email: str = Field(..., max_length=255, description="Tenant login email")
    password: str = Field(..., min_length=8, description="Tenant password")
    description: Optional[str] = Field(None, description="Tenant description")
    plan: str = Field("free", description="Tenant plan: free, pro, enterprise")


class TenantUpdate(BaseSchema):
    """Tenant update schema."""
    name: Optional[str] = Field(None, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    settings: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None
    plan: Optional[str] = None


class TenantResponse(TenantBase):
    """Tenant response schema."""
    id: str
    email: Optional[str] = None
    is_email_verified: bool = False
    last_login_at: Optional[datetime] = None
    login_attempts: int = 0
    description: Optional[str] = None
    owner_email: Optional[str] = None
    plan: str = "free"
    created_at: datetime
    updated_at: datetime


class TenantLoginRequest(BaseSchema):
    """Tenant login request schema."""
    email: str = Field(..., description="Tenant email")
    password: str = Field(..., description="Tenant password")


class TenantLoginResponse(BaseSchema):
    """Tenant login response schema."""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field("bearer", description="Token type")
    tenant: TenantResponse = Field(..., description="Tenant information")


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
    tenant_ai_provider_id: str = Field(..., description="Tenant AI provider ID")
    is_public: bool = Field(False, description="Whether the bot is public")
    allowed_domains: List[str] = Field(default_factory=list, description="Allowed domains for public bots")
    dataset_ids: List[str] = Field(default_factory=list, description="Dataset IDs to assign to the bot")


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
    tenant_ai_provider_id: Optional[str] = None
    is_public: Optional[bool] = None
    allowed_domains: Optional[List[str]] = None
    dataset_ids: Optional[List[str]] = Field(None, description="Dataset IDs to assign to the bot")


class BotResponse(BotBase):
    """Bot response schema."""
    id: str
    tenant_id: str
    tenant_ai_provider_id: str
    is_public: bool = False
    allowed_domains: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    ai_provider_name: Optional[str] = None
    scopes: List[Dict[str, Any]] = Field(default_factory=list)
    datasets: List[Dict[str, Any]] = Field(default_factory=list, description="Assigned datasets")


# BotDataset schemas
class BotDatasetBase(BaseSchema):
    """Base bot-dataset relationship schema."""
    is_active: bool = Field(True)
    priority: int = Field(1, description="Priority for dataset ordering")


class BotDatasetCreate(BotDatasetBase):
    """Bot-dataset relationship creation schema."""
    bot_id: str
    dataset_id: str


class BotDatasetUpdate(BaseSchema):
    """Bot-dataset relationship update schema."""
    is_active: Optional[bool] = None
    priority: Optional[int] = None


class BotDatasetResponse(BotDatasetBase):
    """Bot-dataset relationship response schema."""
    id: str
    bot_id: str
    dataset_id: str
    created_at: datetime


# TenantAIProvider schemas
class TenantAIProviderBase(BaseSchema):
    """Base tenant AI provider schema."""
    provider_name: str = Field(..., max_length=50, description="Provider name (openai, anthropic, google, etc.)")
    base_url: Optional[str] = Field(None, max_length=255, description="Custom endpoint URL")
    custom_settings: Dict[str, Any] = Field(default_factory=dict, description="Provider-specific settings")
    is_active: bool = Field(True, description="Whether the provider is active")


class TenantAIProviderCreate(TenantAIProviderBase):
    """Tenant AI provider creation schema."""
    global_ai_provider_id: str = Field(..., description="Global AI provider ID")
    api_key: str = Field(..., description="API key for the provider")


class TenantAIProviderUpdate(BaseSchema):
    """Tenant AI provider update schema."""
    provider_name: Optional[str] = Field(None, max_length=50)
    api_key: Optional[str] = None
    base_url: Optional[str] = Field(None, max_length=255)
    custom_settings: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class TenantAIProviderResponse(TenantAIProviderBase):
    """Tenant AI provider response schema."""
    id: str
    tenant_id: str
    global_ai_provider_id: str
    created_at: datetime
    updated_at: datetime
    # Note: api_key is not included in response for security


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
    pass  # tenant_id comes from authentication


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
    content: str = Field(..., description="Document content")
    # dataset_id comes from URL path


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