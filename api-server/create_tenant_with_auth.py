#!/usr/bin/env python3
"""
Script to create a tenant with login credentials.
Usage: python create_tenant_with_auth.py
"""

import sys
import os
from passlib.context import CryptContext
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from uuid import uuid4
from datetime import datetime

# Database URL for Docker setup (synchronous)
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/chatbot_db"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_tenant_with_auth():
    """Create a sample tenant with authentication credentials."""
    
    # Database setup
    engine = create_engine(DATABASE_URL, echo=True)
    Session = sessionmaker(bind=engine)
    
    with Session() as session:
        try:
            # Check if tenant already exists
            result = session.execute(
                text("SELECT id, email FROM tenants WHERE email = 'tenant@example.com'")
            )
            if result.fetchone():
                print("✅ Tenant with email 'tenant@example.com' already exists")
                return
            
            # Create new tenant with authentication
            hashed_password = pwd_context.hash("tenant123")
            tenant_id = str(uuid4())
            
            # Insert tenant using raw SQL since we don't have the models imported
            session.execute(
                text("""
                    INSERT INTO tenants (
                        id, name, slug, email, password_hash, is_email_verified, 
                        description, plan, is_active, created_at, updated_at, 
                        global_rate_limit, feature_flags, settings, login_attempts
                    ) VALUES (
                        :id, :name, :slug, :email, :password_hash, :is_email_verified,
                        :description, :plan, :is_active, :created_at, :updated_at,
                        :global_rate_limit, :feature_flags, :settings, :login_attempts
                    )
                """),
                {
                    "id": tenant_id,
                    "name": "Demo Tenant Company",
                    "slug": "demo-tenant",
                    "email": "tenant@example.com",
                    "password_hash": hashed_password,
                    "is_email_verified": True,
                    "description": "Demo tenant for testing authentication",
                    "plan": "free",
                    "is_active": True,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "global_rate_limit": 1000,
                    "feature_flags": "{}",
                    "settings": "{}",
                    "login_attempts": 0
                }
            )
            
            session.commit()
            
            print(f"✅ Successfully created tenant:")
            print(f"   ID: {tenant_id}")
            print(f"   Name: Demo Tenant Company")
            print(f"   Email: tenant@example.com")
            print(f"   Slug: demo-tenant")
            print(f"   Password: tenant123")
            print(f"   Plan: free")
            
        except Exception as e:
            print(f"❌ Error creating tenant: {e}")
            session.rollback()
        finally:
            engine.dispose()

if __name__ == "__main__":
    create_tenant_with_auth()