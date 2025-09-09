"""FastAPI application dependencies and utilities."""
import os
import time
from datetime import datetime
from typing import Annotated, Optional

import redis
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import select

from .db import get_db
from .models import APIKey, Tenant

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Redis client for rate limiting
redis_client = redis.from_url(REDIS_URL, decode_responses=True)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(data: dict) -> str:
    """Create JWT access token."""
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> dict:
    """Verify JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_api_key(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: AsyncSession = Depends(get_db),
) -> APIKey:
    """Get current API key from Bearer token."""
    token = credentials.credentials
    
    # Hash the token to match stored hash
    token_hash = hash_password(token)
    
    # Query for API key
    result = await db.execute(
        select(APIKey)
        .options(selectinload(APIKey.tenant))
        .where(APIKey.key_hash == token_hash, APIKey.is_active == True)
    )
    api_key = result.scalar_one_or_none()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if API key is expired
    if api_key.expires_at and api_key.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return api_key


async def get_current_tenant(
    api_key: APIKey = Depends(get_current_api_key),
) -> Tenant:
    """Get current tenant from API key."""
    if not api_key.tenant.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant is not active",
        )
    
    return api_key.tenant


async def check_rate_limit(
    request: Request,
    api_key: APIKey = Depends(get_current_api_key),
) -> None:
    """Check rate limiting for API key."""
    key = f"rate_limit:{api_key.id}"
    current_hour = int(time.time()) // 3600
    rate_key = f"{key}:{current_hour}"
    
    try:
        current_count = redis_client.get(rate_key) or 0
        current_count = int(current_count)
        
        if current_count >= api_key.rate_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded",
                headers={
                    "X-Rate-Limit": str(api_key.rate_limit),
                    "X-Rate-Limit-Remaining": "0",
                    "X-Rate-Limit-Reset": str((current_hour + 1) * 3600),
                },
            )
        
        # Increment counter
        pipe = redis_client.pipeline()
        pipe.incr(rate_key)
        pipe.expire(rate_key, 3600)  # Expire in 1 hour
        pipe.execute()
        
        # Add headers
        request.state.rate_limit_remaining = api_key.rate_limit - current_count - 1
        request.state.rate_limit_reset = (current_hour + 1) * 3600
        
    except redis.RedisError:
        # If Redis is down, allow the request but log the error
        pass


# Type aliases for dependency injection
DatabaseDep = Annotated[AsyncSession, Depends(get_db)]
APIKeyDep = Annotated[APIKey, Depends(get_current_api_key)]
TenantDep = Annotated[Tenant, Depends(get_current_tenant)]
RateLimitDep = Annotated[None, Depends(check_rate_limit)]