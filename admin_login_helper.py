#!/usr/bin/env python3
"""
Quick admin login troubleshooter - shows available admin accounts and helps reset passwords
"""
import sys
import os
from datetime import datetime
from uuid import uuid4

# Add the parent directory to sys.path to import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api-server'))

try:
    from sqlalchemy import create_engine, text
    from sqlalchemy.orm import sessionmaker
    from passlib.context import CryptContext
except ImportError:
    print("❌ Required packages not found. Run from the api-server directory.")
    sys.exit(1)

# Database URL
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/chatbot_db"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def list_admin_users():
    """List all admin users in the database."""
    print("🔍 Current Admin Users")
    print("=====================")
    
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    
    with Session() as session:
        try:
            result = session.execute(
                text("SELECT email, role, is_active, created_at FROM admin_users ORDER BY created_at")
            )
            
            users = result.fetchall()
            if not users:
                print("❌ No admin users found")
                return False
            
            for user in users:
                status = "✅ Active" if user.is_active else "❌ Inactive"
                print(f"📧 {user.email} ({user.role}) - {status}")
                print(f"   Created: {user.created_at}")
                print()
            
            return True
            
        except Exception as e:
            print(f"❌ Database error: {e}")
            return False
        finally:
            engine.dispose()

def test_login():
    """Test login with known credentials."""
    print("🧪 Testing Admin Login")
    print("======================")
    
    import requests
    
    test_credentials = [
        ("admin@chatai.com", "admin123"),
        ("admin@test.com", "admin123"),
        ("admin@example.com", "admin123"),
    ]
    
    for email, password in test_credentials:
        try:
            response = requests.post(
                "http://localhost:8000/admin/auth/login",
                json={"email": email, "password": password},
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ SUCCESS: {email} / {password}")
                print(f"   Role: {data['user']['role']}")
                print(f"   Token: {data['access_token'][:50]}...")
                print()
                return True
            else:
                print(f"❌ FAILED: {email} / {password} - {response.status_code}")
                
        except Exception as e:
            print(f"❌ ERROR testing {email}: {e}")
    
    return False

def create_test_admin():
    """Create a test admin user."""
    print("🔧 Creating Test Admin User")
    print("===========================")
    
    email = "admin@test.local"
    password = "test123"
    
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    
    with Session() as session:
        try:
            # Check if user exists
            result = session.execute(
                text("SELECT id FROM admin_users WHERE email = :email"),
                {"email": email}
            )
            
            if result.fetchone():
                print(f"⚠️  User {email} already exists")
                return
            
            # Create new admin
            user_id = str(uuid4())
            password_hash = pwd_context.hash(password)
            
            session.execute(
                text("""
                    INSERT INTO admin_users (id, email, password_hash, role, is_active, created_at, updated_at)
                    VALUES (:id, :email, :password_hash, :role, :is_active, :created_at, :updated_at)
                """),
                {
                    "id": user_id,
                    "email": email,
                    "password_hash": password_hash,
                    "role": "admin",
                    "is_active": True,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            )
            
            session.commit()
            print(f"✅ Created admin user: {email} / {password}")
            
        except Exception as e:
            print(f"❌ Error creating admin: {e}")
            session.rollback()
        finally:
            engine.dispose()

def main():
    """Main function."""
    print("🛠️  Admin Login Troubleshooter")
    print("==============================\n")
    
    # List current users
    if not list_admin_users():
        print("Creating initial admin user...")
        create_test_admin()
        print()
    
    # Test login
    if test_login():
        print("✅ At least one admin login is working!")
    else:
        print("❌ No working admin logins found")
        print("\n🔧 Try creating a test admin:")
        create_test_admin()
    
    print("\n📋 Summary:")
    print("• Admin Dashboard: http://localhost:3000")
    print("• Working credentials should be shown above")
    print("• If issues persist, check if services are running: ./status.sh")

if __name__ == "__main__":
    main()