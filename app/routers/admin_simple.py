"""Simple admin auth route for testing."""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..db import get_sync_db

router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])

security = HTTPBearer()

# Simple schemas
class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str

class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

@router.post("/login", response_model=AdminLoginResponse)
async def login_admin(login_data: AdminLoginRequest, db: Session = Depends(get_sync_db)):
    """Simple login endpoint for testing."""
    
    # For testing purposes, accept admin@example.com with admin123
    if login_data.email == "admin@example.com" and login_data.password == "admin123":
        return AdminLoginResponse(
            access_token="test-token-12345",
            user={
                "id": "test-admin-id",
                "email": "admin@example.com",
                "name": "System Administrator",
                "role": "super_admin",
                "is_active": True,
                "created_at": datetime.utcnow()
            }
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

@router.get("/me")
async def get_current_user():
    """Get current user info."""
    return {
        "id": "test-admin-id",
        "email": "admin@example.com",
        "name": "System Administrator",
        "role": "super_admin",
        "is_active": True,
        "created_at": datetime.utcnow()
    }