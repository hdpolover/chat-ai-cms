#!/usr/bin/env python3
"""
Interactive admin user management script.
"""

import sys
import psycopg2
from passlib.context import CryptContext
from uuid import uuid4
from datetime import datetime

# Password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/chatbot_db"

def list_admin_users():
    """List all admin users."""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT email, name, role, is_active, created_at, last_login_at 
            FROM admin_users 
            ORDER BY created_at DESC
        """)
        
        users = cursor.fetchall()
        
        print("\n👥 Current Admin Users:")
        print("=" * 80)
        print(f"{'Email':<25} {'Name':<20} {'Role':<12} {'Active':<8} {'Created':<12}")
        print("-" * 80)
        
        for user in users:
            email, name, role, is_active, created_at, last_login_at = user
            status = "✅ Yes" if is_active else "❌ No"
            created_str = created_at.strftime("%Y-%m-%d") if created_at else "Unknown"
            
            print(f"{email:<25} {name:<20} {role:<12} {status:<8} {created_str:<12}")
        
        print(f"\nTotal: {len(users)} admin users")
        
    except Exception as e:
        print(f"❌ Error listing users: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

def create_admin_user_interactive():
    """Create admin user interactively."""
    print("\n➕ Create New Admin User")
    print("=" * 30)
    
    # Get user input
    email = input("📧 Email: ").strip()
    if not email or '@' not in email:
        print("❌ Valid email is required!")
        return False
        
    name = input("👤 Full Name: ").strip()
    if not name:
        print("❌ Name is required!")
        return False
    
    password = input("🔑 Password (min 6 chars): ").strip()
    if len(password) < 6:
        print("❌ Password must be at least 6 characters!")
        return False
    
    print("🔐 Role options:")
    print("  1. admin - Regular admin access")
    print("  2. super_admin - Full system access")
    role_choice = input("Choose role (1-2) [1]: ").strip() or "1"
    
    if role_choice == "1":
        role = "admin"
    elif role_choice == "2":
        role = "super_admin"
    else:
        print("❌ Invalid role choice!")
        return False
    
    # Confirm creation
    print(f"\n📋 Review new admin user:")
    print(f"   Email: {email}")
    print(f"   Name: {name}")
    print(f"   Role: {role}")
    
    confirm = input("\n✅ Create this user? (y/N): ").strip().lower()
    if confirm != 'y':
        print("❌ User creation cancelled.")
        return False
    
    # Create user
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM admin_users WHERE email = %s", (email,))
        if cursor.fetchone():
            print(f"❌ User with email '{email}' already exists!")
            return False
        
        # Hash password and create user
        password_hash = pwd_context.hash(password)
        user_id = str(uuid4())
        
        cursor.execute("""
            INSERT INTO admin_users (id, email, name, password_hash, role, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id,
            email,
            name,
            password_hash,
            role,
            True,
            datetime.now(),
            datetime.now()
        ))
        
        conn.commit()
        
        print(f"\n🎉 Admin user created successfully!")
        print(f"   ID: {user_id}")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
        print(f"   Role: {role}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

def delete_admin_user():
    """Delete an admin user."""
    print("\n🗑️  Delete Admin User")
    print("=" * 25)
    
    email = input("📧 Email of user to delete: ").strip()
    if not email:
        print("❌ Email is required!")
        return False
    
    # Confirm deletion
    confirm = input(f"⚠️  Really delete user '{email}'? (y/N): ").strip().lower()
    if confirm != 'y':
        print("❌ Deletion cancelled.")
        return False
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT name FROM admin_users WHERE email = %s", (email,))
        user = cursor.fetchone()
        if not user:
            print(f"❌ User with email '{email}' not found!")
            return False
        
        # Delete user
        cursor.execute("DELETE FROM admin_users WHERE email = %s", (email,))
        conn.commit()
        
        print(f"✅ User '{user[0]}' ({email}) deleted successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error deleting user: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

def main():
    """Main interactive menu."""
    while True:
        print("\n🔐 Admin User Management")
        print("=" * 30)
        print("1. 👥 List all admin users")
        print("2. ➕ Create new admin user")
        print("3. 🗑️  Delete admin user")
        print("4. 🚪 Exit")
        
        choice = input("\nChoose an option (1-4): ").strip()
        
        if choice == "1":
            list_admin_users()
        elif choice == "2":
            create_admin_user_interactive()
        elif choice == "3":
            delete_admin_user()
        elif choice == "4":
            print("👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please choose 1-4.")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--list":
        list_admin_users()
    else:
        main()