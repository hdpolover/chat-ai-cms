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
from ...models import Tenant
from jose import JWTError, jwt
import os

router = APIRouter(prefix="/v1/tenant/auth", tags=["Tenant - Authentication"])

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours for tenants

# Schemas
class TenantLoginRequest(BaseModel):
    email: EmailStr
    password: str

class TenantLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    tenant: dict

class TenantResponse(BaseModel):
    id: str
    email: Optional[str] = None
    name: str
    slug: str
    description: Optional[str] = None
    plan: str
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

async def get_current_tenant(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_sync_db)
) -> Tenant:
    """Get current authenticated tenant."""
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
    
    # Get tenant from database
    tenant = db.query(Tenant).filter(Tenant.email == email).first()
    if tenant is None or not tenant.is_active:
        raise credentials_exception
    
    return tenant

# Routes
@router.post("/login", response_model=TenantLoginResponse)
async def login_tenant(
    login_data: TenantLoginRequest,
    db: Session = Depends(get_sync_db)
):
    """Authenticate tenant and return access token."""
    
    # Find tenant by email
    tenant = db.query(Tenant).filter(Tenant.email == login_data.email).first()
    
    if not tenant or not tenant.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Check if password hash exists
    if not tenant.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not configured for login"
        )
    
    # Verify password
    if not verify_password(login_data.password, tenant.password_hash):
        # Increment failed login attempts
        tenant.login_attempts = (tenant.login_attempts or 0) + 1
        if tenant.login_attempts >= 5:
            tenant.locked_until = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Check if account is locked
    if tenant.locked_until and tenant.locked_until > datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Account is temporarily locked due to failed login attempts"
        )
    
    # Reset login attempts on successful login
    tenant.login_attempts = 0
    tenant.locked_until = None
    tenant.last_login_at = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": tenant.email, 
            "tenant_id": tenant.id,
            "role": "tenant"  # Default role for tenant users
        },
        expires_delta=access_token_expires
    )
    
    return TenantLoginResponse(
        access_token=access_token,
        tenant={
            "id": tenant.id,
            "email": tenant.email,
            "name": tenant.name,
            "slug": tenant.slug,
            "description": tenant.description,
            "plan": tenant.plan,
            "is_active": tenant.is_active,
            "last_login_at": tenant.last_login_at,
            "created_at": tenant.created_at
        }
    )

@router.get("/me", response_model=TenantResponse)
async def get_current_tenant_info(
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Get current authenticated tenant information."""
    
    return TenantResponse(
        id=current_tenant.id,
        email=current_tenant.email,
        name=current_tenant.name,
        slug=current_tenant.slug,
        description=current_tenant.description,
        plan=current_tenant.plan,
        is_active=current_tenant.is_active,
        last_login_at=current_tenant.last_login_at,
        created_at=current_tenant.created_at
    )

@router.post("/logout")
async def logout_tenant_user():
    """Logout tenant user (client should delete token)."""
    return {"message": "Successfully logged out"}

@router.post("/refresh", response_model=dict)
async def refresh_tenant_token(
    current_tenant: Tenant = Depends(get_current_tenant)
):
    """Refresh access token for authenticated tenant."""
    # Create new access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": current_tenant.email, 
            "tenant_id": current_tenant.id,
            "role": "tenant"
        },
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}