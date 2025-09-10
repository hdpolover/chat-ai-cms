#!/usr/bin/env python3
"""
Simple script to create admin user.
"""
import os
from uuid import uuid4

# Install passlib if needed
try:
    from passlib.context import CryptContext
except ImportError:
    print("Installing passlib...")
    os.system("pip install passlib[bcrypt]")
    from passlib.context import CryptContext

# Create password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Database connection
try:
    import psycopg2
except ImportError:
    print("Installing psycopg2...")
    os.system("pip install psycopg2-binary")
    import psycopg2

# Connect to database
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/chatbot_db"

try:
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Hash password
    password_hash = pwd_context.hash("admin123")
    
    # Insert admin user
    cursor.execute("""
        INSERT INTO admin_users (id, email, name, password_hash, role, is_active, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, now(), now())
        ON CONFLICT (email) DO NOTHING;
    """, (
        str(uuid4()),
        "admin@example.com", 
        "System Administrator",
        password_hash,
        "super_admin",
        True
    ))
    
    conn.commit()
    print("✅ Admin user created successfully!")
    print("Email: admin@example.com")
    print("Password: admin123")
    
except Exception as e:
    print(f"❌ Error: {e}")
finally:
    if conn:
        conn.close()