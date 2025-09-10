"""Health check router."""
from datetime import datetime

import redis
from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from ..db import async_engine
from ..deps import redis_client
from ..schemas import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/v1/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    timestamp = datetime.utcnow()
    
    # Check database
    try:
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        database_status = "healthy"
    except Exception as e:
        database_status = f"unhealthy: {str(e)}"
    
    # Check Redis
    try:
        redis_client.ping()
        redis_status = "healthy"
    except redis.RedisError as e:
        redis_status = f"unhealthy: {str(e)}"
    
    # Determine overall status
    if database_status == "healthy" and redis_status == "healthy":
        status = "healthy"
    else:
        status = "unhealthy"
    
    return HealthResponse(
        status=status,
        timestamp=timestamp,
        version="0.1.0",
        database=database_status,
        redis=redis_status,
    )