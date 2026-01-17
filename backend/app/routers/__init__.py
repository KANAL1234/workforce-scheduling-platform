# backend/app/routers/__init__.py
"""
API Routers package
Exports all routers for easy importing
"""

from app.routers import auth, students, availability, shifts

__all__ = ["auth", "students", "availability", "shifts"]
