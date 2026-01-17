#!/usr/bin/env python3
"""
Initialize Render PostgreSQL database with tables and seed data
Run this script locally after deploying to Render
"""

import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import init_db, SessionLocal
from app.models import User, Shift
from app.auth import get_password_hash
from datetime import datetime, time

def seed_database():
    """Seed database with initial test data"""
    db = SessionLocal()
    
    try:
        # Check if users already exist
        existing_users = db.query(User).count()
        if existing_users > 0:
            print(f"✅ Database already has {existing_users} users - skipping seed")
            return
        
        print("🌱 Seeding database with test data...")
        
        admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
        admin = User(
            email=os.getenv("ADMIN_EMAIL", "admin@example.com"),
            full_name="Admin User",
            hashed_password=get_password_hash(admin_password),
            role="admin",
            is_active=True
        )
        db.add(admin)
        
        student_password = os.getenv("STUDENT_PASSWORD", "password123")
        student = User(
            email=os.getenv("STUDENT_EMAIL", "john.doe@example.com"),
            full_name="John Doe",
            hashed_password=get_password_hash(student_password),
            role="student",
            is_active=True
        )
        db.add(student)
        
        db.commit()
        print("✅ Created admin and student users")
        
        # Create sample shifts (matching actual Shift model)
        shifts = [
            Shift(
                day_of_week=0,  # Monday
                start_time=time(9, 0),
                end_time=time(12, 0),
                shift_type="weekday",
                required_students=2,
                is_active=True
            ),
            Shift(
                day_of_week=0,  # Monday  
                start_time=time(13, 0),
                end_time=time(17, 0),
                shift_type="weekday",
                required_students=2,
                is_active=True
            ),
            Shift(
                day_of_week=1,  # Tuesday
                start_time=time(9, 0),
                end_time=time(12, 0),
                shift_type="weekday",
                required_students=2,
                is_active=True
            )
        ]
        
        for shift in shifts:
            db.add(shift)
        
        db.commit()
        print(f"✅ Created {len(shifts)} sample shifts")
        print("\n🎉 Database initialization complete!")
        print("\n📝 Test Credentials:")
        print(f"   Admin: {os.getenv('ADMIN_EMAIL', 'admin@example.com')} / [See .env]")
        print(f"   Student: {os.getenv('STUDENT_EMAIL', 'john.doe@example.com')} / [See .env]")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Workforce Scheduling Platform - Database Initialization")
    print("=" * 60)
    
    # Initialize database tables
    print("\n📦 Creating database tables...")
    init_db()
    
    # Seed with test data
    seed_database()
    
    print("\n" + "=" * 60)
    print("✅ Setup complete! Your database is ready to use.")
    print("=" * 60)
