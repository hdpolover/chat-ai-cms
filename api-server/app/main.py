"""Main FastAPI application."""
import os
import time
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .routers import chat, health
from .db import async_engine


# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info("Starting up chatbot API service")
    
    # Startup logic here
    try:
        # Test database connection
        async with async_engine.begin() as conn:
            logger.info("Database connection established")
    except Exception as e:
        logger.error("Failed to connect to database", error=str(e))
        raise
    
    yield
    
    # Shutdown logic here
    logger.info("Shutting down chatbot API service")
    await async_engine.dispose()


# Create FastAPI app
app = FastAPI(
    title="Chatbot API",
    description="Multi-tenant chatbot API service with RAG pipeline",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
    swagger_ui_parameters={
        "tryItOutEnabled": True,
        "persistAuthorization": True,
        "displayRequestDuration": True,
    }
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001,http://localhost:3002").split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Log all requests and responses."""
    start_time = time.time()
    
    # Log request
    logger.info(
        "Request started",
        method=request.method,
        url=str(request.url),
        client_ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    
    try:
        response = await call_next(request)
        
        # Add rate limit headers if available
        if hasattr(request.state, "rate_limit_remaining"):
            response.headers["X-Rate-Limit-Remaining"] = str(request.state.rate_limit_remaining)
            response.headers["X-Rate-Limit-Reset"] = str(request.state.rate_limit_reset)
        
        # Log response
        process_time = time.time() - start_time
        logger.info(
            "Request completed",
            method=request.method,
            url=str(request.url),
            status_code=response.status_code,
            process_time=process_time,
        )
        
        response.headers["X-Process-Time"] = str(process_time)
        return response
        
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(
            "Request failed",
            method=request.method,
            url=str(request.url),
            process_time=process_time,
            error=str(e),
        )
        raise


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Handle 404 errors."""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": "The requested resource was not found",
            "path": str(request.url.path),
        },
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    """Handle 500 errors."""
    logger.error("Internal server error", error=str(exc), path=str(request.url.path))
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
            "path": str(request.url.path),
        },
    )


# Include routers
app.include_router(health.router)
app.include_router(chat.router, prefix="/v1")

# Include admin routers
try:
    from .routers.admin import auth as admin_auth, tenants as admin_tenants, dashboard as admin_dashboard, settings as admin_settings
    app.include_router(admin_auth.router)
    app.include_router(admin_tenants.router)
    app.include_router(admin_dashboard.router)
    app.include_router(admin_settings.router)
    logger.info("Full admin routes loaded successfully with Python 3.12")
except ImportError as e:
    logger.warning("Admin routes not available", error=str(e))

# Include tenant routers
try:
    from .routers.tenant import auth as tenant_auth
    app.include_router(tenant_auth.router)
    logger.info("Tenant routes loaded successfully")
except ImportError as e:
    logger.warning("Tenant routes not available", error=str(e))


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Chatbot API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/v1/health",
    }