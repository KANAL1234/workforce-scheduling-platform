"""
Script to create or update all 27 student worker accounts with correct password hashing
Run this once to populate the database
"""

import os
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash
from datetime import datetime

# List of all student workers
STUDENTS = [
    "Archie",
    "Vivian", 
    "Olivia",
    "Brad",
    "William",
    "Jasmine",
    "Yoav",
    "Varsha",
    "Darien",
    "Yaokai",
    "Ashley",
    "Mari",
    "Olivia Rose",
    "Muhammad",
    "Rushabh",
    "Manuela",
    "OliviaS",
    "Adrian",
    "Catherine",
    "Daniela",
    "Taylor",
    "Letizia",
    "Sebastian",
    "Homan",
    "Joshua (Josh)",
    "Augustus (Gus)",
    "Josephine (Josie)"
]

DEFAULT_PASSWORD = os.getenv("STUDENT_DEFAULT_PASSWORD", "password123")

def create_email(name):
    """Generate email from name"""
    # Remove parentheses and nicknames
    clean_name = name.split('(')[0].strip()
    # Replace spaces with dots, lowercase
    email_name = clean_name.lower().replace(' ', '.')
    return f"{email_name}@example.com"

def create_students():
    """Create all student accounts"""
    db = SessionLocal()
    
    try:
        created = 0
        updated = 0
        
        print("=" * 60)
        print("Creating/Updating Student Worker Accounts")
        print("=" * 60)
        
        # Hash the default password once
        hashed_pwd = get_password_hash(DEFAULT_PASSWORD)
        
        for name in STUDENTS:
            email = create_email(name)
            
            # Check if user already exists
            existing = db.query(User).filter(User.email == email).first()
            
            if existing:
                # Update existing user's password if not set or just to be safe
                existing.hashed_password = hashed_pwd
                existing.is_active = True
                updated += 1
                print(f"🔄 Updated: {name:25} ({email}) - password reset")
                continue
            
            # Create new student
            student = User(
                email=email,
                full_name=name,
                role="student",
                is_active=True,
                hashed_password=hashed_pwd
            )
            
            db.add(student)
            created += 1
            print(f"✅ Created: {name:25} ({email})")
        
        db.commit()
        
        print("\n" + "=" * 60)
        print(f"Summary: {created} created, {updated} updated")
        print("=" * 60)
        print("\n🎉 All student accounts ready!")
        print("\nDefault login for all students:")
        print(f"  Password: [See .env]")
        print("\n📧 Example logins:")
        print(f"  {STUDENTS[0]}: {create_email(STUDENTS[0])}")
        print(f"  {STUDENTS[1]}: {create_email(STUDENTS[1])}")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_students()
