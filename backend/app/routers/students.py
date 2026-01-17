# backend/app/routers/students.py
"""
Student management API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.models import User
from app.schemas import UserResponse, UserUpdate
from app.auth import get_current_admin_user, get_current_user

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("/", response_model=List[UserResponse])
def list_students(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    is_active: bool = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    List all students (Admin only)
    
    Query parameters:
    - skip: Number of records to skip (pagination)
    - limit: Maximum number of records to return
    - is_active: Filter by active status (optional)
    """
    query = db.query(User).filter(User.role == "student")
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    students = query.offset(skip).limit(limit).all()
    
    return students


@router.get("/{student_id}", response_model=UserResponse)
def get_student(
    student_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific student by ID
    
    Students can only view their own profile
    Admins can view any student
    """
    # Assuming student_id is passed as UUID object by FastAPI
    # We might need to cast to str for SQLite if using String(36)
    student = db.query(User).filter(
        User.id == str(student_id),
        User.role == "student"
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Check permissions (comparing string IDs)
    if current_user.role != "admin" and str(current_user.id) != str(student_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this student"
        )
    
    return student


@router.put("/{student_id}", response_model=UserResponse)
def update_student(
    student_id: UUID,
    student_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Update a student (Admin only)
    """
    student = db.query(User).filter(
        User.id == str(student_id),
        User.role == "student"
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Update fields
    if student_update.full_name is not None:
        student.full_name = student_update.full_name
    
    if student_update.phone is not None:
        student.phone = student_update.phone
    
    if student_update.is_active is not None:
        student.is_active = student_update.is_active
    
    db.commit()
    db.refresh(student)
    
    return student


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Delete a student (Admin only)
    
    Note: This will cascade delete all associated data
    """
    student = db.query(User).filter(
        User.id == str(student_id),
        User.role == "student"
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    db.delete(student)
    db.commit()
    
    return None


@router.get("/{student_id}/stats")
def get_student_stats(
    student_id: UUID,
    semester: str = Query(..., description="Semester code (e.g., 'Spring 2026')"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get statistics for a student in a specific semester
    """
    # Check permissions
    if current_user.role != "admin" and str(current_user.id) != str(student_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this student's stats"
        )
    
    student = db.query(User).filter(
        User.id == str(student_id),
        User.role == "student"
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # TODO: Calculate actual stats from schedule assignments
    # For now, return placeholder data
    
    return {
        "student_id": student_id,
        "semester": semester,
        "total_shifts_assigned": 0,
        "total_hours": 0,
        "preferred_shifts_count": 0,
        "preference_satisfaction_rate": 0.0
    }
