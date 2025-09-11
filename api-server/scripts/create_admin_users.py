#!/usr/bin/env python3
"""
Script to create initial admin users for the Chat AI CMS system.
Run this script after running database migrations.
"""

import asyncio
import os
import sys
from datetime import datetime
from getpass import getpass
from pathlib import Path
from uuid import uuid4

# Add the app directory to the path
sys.path.append(str(Path(__file__).parent / "app"))

from passlib.context import CryptContext
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)

def create_admin_user(session, email: str, name: str, password: str, role: str = "admin") -> str:
    """Create a new admin user."""
    user_id = str(uuid4())
    password_hash = hash_password(password)
    
    # Check if user already exists
    result = session.execute(
        text("SELECT id FROM admin_users WHERE email = :email"), 
        {"email": email}
    )
    
    if result.fetchone():
        print(f"❌ User with email {email} already exists!")
        return None
    
    # Insert new admin user
    session.execute(
        text("""
            INSERT INTO admin_users (id, email, name, password_hash, role, is_active, created_at, updated_at)
            VALUES (:id, :email, :name, :password_hash, :role, true, now(), now())
        """),
        {
            "id": user_id,
            "email": email,
            "name": name,
            "password_hash": password_hash,
            "role": role
        }
    )
    
    session.commit()
    print(f"✅ Created admin user: {name} ({email}) with role '{role}'")
    return user_id

def main():
    """Main function to create admin users."""
    print("🚀 Chat AI CMS Admin User Creation Script")
    print("=" * 50)
    
    # Get database URL from environment or prompt
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        database_url = input("Enter DATABASE_URL (postgresql://user:pass@host:port/dbname): ").strip()
        if not database_url:
            print("❌ DATABASE_URL is required!")
            sys.exit(1)
    
    # Create database connection
    try:
        engine = create_engine(database_url)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # Test connection
        session.execute(text("SELECT 1"))
        print("✅ Database connection successful!")
        
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        sys.exit(1)
    
    try:
        # Check if admin_users table exists
        result = session.execute(
            text("SELECT to_regclass('public.admin_users')")
        )
        
        if result.fetchone()[0] is None:
            print("❌ admin_users table not found! Please run migrations first:")
            print("   alembic upgrade head")
            sys.exit(1)
        
        print("✅ admin_users table found!")
        
        # Create default admin users
        print("\n📝 Creating admin users...")
        
        # Default super admin
        create_admin_user(
            session=session,
            email="admin@example.com",
            name="System Administrator",
            password="admin123",  # Change this in production!
            role="super_admin"
        )
        
        # Interactive user creation
        while True:
            print("\n" + "─" * 30)
            create_another = input("Create another admin user? (y/N): ").strip().lower()
            
            if create_another not in ['y', 'yes']:
                break
            
            print("\nEnter admin user details:")
            email = input("Email: ").strip()
            if not email:
                print("❌ Email is required!")
                continue
                
            name = input("Full Name: ").strip()
            if not name:
                print("❌ Name is required!")
                continue
                
            while True:
                password = getpass("Password: ").strip()
                if len(password) < 6:
                    print("❌ Password must be at least 6 characters!")
                    continue
                
                confirm_password = getpass("Confirm Password: ").strip()
                if password != confirm_password:
                    print("❌ Passwords don't match!")
                    continue
                break
            
            role = input("Role (admin/super_admin) [admin]: ").strip() or "admin"
            if role not in ["admin", "super_admin"]:
                print("❌ Invalid role! Using 'admin'")
                role = "admin"
            
            create_admin_user(session, email, name, password, role)
        
        # Show created users
        print("\n📊 Current admin users:")
        result = session.execute(
            text("SELECT email, name, role, is_active, created_at FROM admin_users ORDER BY created_at")
        )
        
        for row in result.fetchall():
            status = "🟢 Active" if row.is_active else "🔴 Inactive"
            print(f"  • {row.email} ({row.name}) - {row.role} - {status}")
        
        print("\n✅ Admin user creation completed!")
        print("\n🔐 Security Notes:")
        print("  • Change default passwords in production!")
        print("  • Use strong passwords for all admin accounts")
        print("  • Regularly rotate admin passwords")
        print("  • Monitor admin user activity")
        
    except Exception as e:
        print(f"❌ Error creating admin users: {e}")
        session.rollback()
        sys.exit(1)
    
    finally:
        session.close()

if __name__ == "__main__":
    main()