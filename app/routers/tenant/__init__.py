"""Tenant authentication routes."""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...db import get_sync_db
from ...models import Tenant, TenantUser
from jose import JWTError, jwt
import os

router = APIRouter(prefix="/v1/tenant/auth", tags=["Tenant - Authentication"])

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours for tenant users

# Schemas
class TenantLoginRequest(BaseModel):
    email: EmailStr
    password: str

class TenantLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class TenantUserResponse(BaseModel):
    id: str
    email: str
    name: str
    tenant_id: str
    tenant_slug: str
    role: str
    is_active: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime

# Helper functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash."""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_tenant_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_sync_db)
) -> TenantUser:
    """Get current authenticated tenant user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Get tenant user from database
    user = db.query(TenantUser).filter(TenantUser.email == email).first()
    if user is None or not user.is_active:
        raise credentials_exception
    
    # Ensure tenant is also active
    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    if tenant is None or not tenant.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant account is inactive"
        )
    
    return user

# Routes
@router.post("/login", response_model=TenantLoginResponse)
async def login_tenant_user(
    login_data: TenantLoginRequest,
    db: Session = Depends(get_sync_db)
):
    """Authenticate tenant user and return access token."""
    
    # Find user by email
    user = db.query(TenantUser).filter(TenantUser.email == login_data.email).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Check if tenant is active
    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    if not tenant or not tenant.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant account is inactive"
        )
    
    # Verify password
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Update last login
    user.last_login_at = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.email, 
            "tenant_id": user.tenant_id,
            "role": user.role
        },
        expires_delta=access_token_expires
    )
    
    return TenantLoginResponse(
        access_token=access_token,
        user={
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "tenant_id": user.tenant_id,
            "tenant_slug": tenant.slug,
            "role": user.role,
            "is_active": user.is_active,
            "last_login_at": user.last_login_at,
            "created_at": user.created_at
        }
    )

@router.get("/me", response_model=TenantUserResponse)
async def get_current_user(
    current_user: TenantUser = Depends(get_current_tenant_user),
    db: Session = Depends(get_sync_db)
):
    """Get current authenticated tenant user info."""
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    
    return TenantUserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        tenant_id=current_user.tenant_id,
        tenant_slug=tenant.slug if tenant else "",
        role=current_user.role,
        is_active=current_user.is_active,
        last_login_at=current_user.last_login_at,
        created_at=current_user.created_at
    )

@router.post("/logout")
async def logout_tenant_user():
    """Logout tenant user (client should delete token)."""
    return {"message": "Successfully logged out"}

@router.post("/refresh")
async def refresh_token(
    current_user: TenantUser = Depends(get_current_tenant_user)
):
    """Refresh access token for authenticated tenant user."""
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": current_user.email,
            "tenant_id": current_user.tenant_id,
            "role": current_user.role
        },
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }