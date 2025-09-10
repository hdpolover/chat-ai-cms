#!/usr/bin/env python3
"""Create initial admin user for the admin dashboard."""
import asyncio
import sys
from getpass import getpass

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.db import engine
from app.models import AdminUser


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_admin_user():
    """Create an admin user interactively."""
    print("Creating initial admin user for Chat AI CMS")
    print("=" * 50)
    
    # Get user input
    email = input("Admin email: ").strip()
    if not email:
        print("Email is required")
        sys.exit(1)
    
    name = input("Admin name: ").strip()
    if not name:
        print("Name is required")
        sys.exit(1)
    
    password = getpass("Password: ").strip()
    if len(password) < 6:
        print("Password must be at least 6 characters")
        sys.exit(1)
    
    confirm_password = getpass("Confirm password: ").strip()
    if password != confirm_password:
        print("Passwords don't match")
        sys.exit(1)
    
    role = input("Role (admin/super_admin) [admin]: ").strip() or "admin"
    if role not in ["admin", "super_admin"]:
        print("Invalid role")
        sys.exit(1)
    
    # Hash password
    password_hash = pwd_context.hash(password)
    
    # Create user in database
    try:
        with Session(engine) as db:
            # Check if user already exists
            existing_user = db.query(AdminUser).filter(AdminUser.email == email).first()
            if existing_user:
                print(f"User with email '{email}' already exists")
                sys.exit(1)
            
            # Create new admin user
            from uuid import uuid4
            admin_user = AdminUser(
                id=str(uuid4()),
                email=email,
                name=name,
                password_hash=password_hash,
                role=role,
                is_active=True
            )
            
            db.add(admin_user)
            db.commit()
            
            print(f"\nAdmin user created successfully!")
            print(f"Email: {email}")
            print(f"Name: {name}")
            print(f"Role: {role}")
            print("\nYou can now login to the admin dashboard.")
            
    except Exception as e:
        print(f"Failed to create admin user: {e}")
        sys.exit(1)


if __name__ == "__main__":
    create_admin_user()