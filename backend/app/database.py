# backend/app/database.py
"""
Database connection and session management
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from typing import Generator
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

# Create engine
# For production, use connection pooling
# Note: If migrating to SQLite for local dev, these pool args might need adjustment
# Try to use psycopg (v3) if available, otherwise use psycopg2
DATABASE_URL_FIXED = DATABASE_URL
try:
    import psycopg
    # psycopg3 is available, use it
    DATABASE_URL_FIXED = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://")
except ImportError:
    # psycopg3 not available, use default psycopg2
    pass

engine = create_engine(
    DATABASE_URL_FIXED,
    pool_pre_ping=True,  # Verify connections before using
    pool_size=10,  # Number of connections to maintain
    max_overflow=20,  # Additional connections if needed
    echo=False,  # Set to True for SQL debugging
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency for FastAPI
    Usage: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Database initialization function
def init_db():
    """
    Initialize database tables
    Only use this in development - in production, use migrations
    """
    from app.models import Base
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")


# Test database connection
def test_connection():
    """Test if database connection is working"""
    from sqlalchemy import text
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        print("✅ Database connection successful!")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
