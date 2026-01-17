# backend/app/routers/shifts.py
"""
Shift management API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.models import Shift, User
from app.schemas import ShiftResponse, ShiftCreate, ShiftWithDetails
from app.auth import get_current_user, get_current_admin_user

router = APIRouter(prefix="/shifts", tags=["Shifts"])


@router.get("/", response_model=List[ShiftWithDetails])
def list_shifts(
    day_of_week: Optional[int] = Query(None, ge=0, le=6),
    shift_type: Optional[str] = Query(None, pattern="^(weekday|weekend|rotating)$"),
    is_active: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all shifts
    
    Query parameters:
    - day_of_week: Filter by day (0=Monday, 6=Sunday)
    - shift_type: Filter by type (weekday, weekend, rotating)
    - is_active: Filter by active status (default: True)
    """
    query = db.query(Shift)
    
    if day_of_week is not None:
        query = query.filter(Shift.day_of_week == day_of_week)
    
    if shift_type:
        query = query.filter(Shift.shift_type == shift_type)
    
    query = query.filter(Shift.is_active == is_active)
    
    
    shifts = query.order_by(Shift.day_of_week, Shift.start_time).all()
    
    # Convert to Pydantic models with calculated fields
    result = []
    for shift in shifts:
        shift_data = ShiftWithDetails(
            id=shift.id,
            day_of_week=shift.day_of_week,
            start_time=shift.start_time,
            end_time=shift.end_time,
            shift_type=shift.shift_type,
            required_students=shift.required_students,
            is_active=shift.is_active,
            created_at=shift.created_at,
            day_name=shift.day_name,  # Computed property
            duration_hours=shift.duration_hours  # Computed property
        )
        result.append(shift_data)
    
    return result


@router.get("/weekly-grid")
def get_weekly_grid(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get shifts organized by day of week
    Returns a structured weekly grid for easy calendar display
    """
    shifts = db.query(Shift).filter(Shift.is_active == True).order_by(
        Shift.day_of_week, Shift.start_time
    ).all()
    
    # Organize by day
    weekly_grid = {
        "monday": [],
        "tuesday": [],
        "wednesday": [],
        "thursday": [],
        "friday": [],
        "saturday": [],
        "sunday": []
    }
    
    day_map = {
        0: "monday",
        1: "tuesday",
        2: "wednesday",
        3: "thursday",
        4: "friday",
        5: "saturday",
        6: "sunday"
    }
    
    for shift in shifts:
        day_key = day_map[shift.day_of_week]
        weekly_grid[day_key].append({
            "id": str(shift.id),
            "start_time": str(shift.start_time),
            "end_time": str(shift.end_time),
            "shift_type": shift.shift_type,
            "required_students": shift.required_students,
            "duration_hours": shift.duration_hours
        })
    
    return weekly_grid


@router.get("/{shift_id}", response_model=ShiftWithDetails)
def get_shift(
    shift_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific shift by ID
    """
    shift = db.query(Shift).filter(Shift.id == str(shift_id)).first()
    
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found"
        )
    
    return {
        "id": shift.id,
        "day_of_week": shift.day_of_week,
        "start_time": shift.start_time,
        "end_time": shift.end_time,
        "shift_type": shift.shift_type,
        "required_students": shift.required_students,
        "is_active": shift.is_active,
        "created_at": shift.created_at,
        "day_name": shift.day_name,
        "duration_hours": shift.duration_hours
    }


@router.post("/", response_model=ShiftResponse, status_code=status.HTTP_201_CREATED)
def create_shift(
    shift_data: ShiftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Create a new shift (Admin only)
    """
    # Check if shift already exists
    existing = db.query(Shift).filter(
        Shift.day_of_week == shift_data.day_of_week,
        Shift.start_time == shift_data.start_time
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A shift already exists for this day and time"
        )
    
    new_shift = Shift(**shift_data.model_dump())
    
    db.add(new_shift)
    db.commit()
    db.refresh(new_shift)
    
    return new_shift


@router.put("/{shift_id}", response_model=ShiftResponse)
def update_shift(
    shift_id: UUID,
    shift_data: ShiftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Update a shift (Admin only)
    """
    shift = db.query(Shift).filter(Shift.id == str(shift_id)).first()
    
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found"
        )
    
    # Update fields
    shift.day_of_week = shift_data.day_of_week
    shift.start_time = shift_data.start_time
    shift.end_time = shift_data.end_time
    shift.shift_type = shift_data.shift_type
    shift.required_students = shift_data.required_students
    
    db.commit()
    db.refresh(shift)
    
    return shift


@router.delete("/{shift_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shift(
    shift_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Delete a shift (Admin only)
    
    Note: This will also delete all availability and assignments for this shift
    """
    shift = db.query(Shift).filter(Shift.id == str(shift_id)).first()
    
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found"
        )
    
    db.delete(shift)
    db.commit()
    
    return None


@router.patch("/{shift_id}/toggle-active", response_model=ShiftResponse)
def toggle_shift_active(
    shift_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Toggle shift active status (Admin only)
    Useful for temporarily disabling a shift without deleting it
    """
    shift = db.query(Shift).filter(Shift.id == str(shift_id)).first()
    
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found"
        )
    
    shift.is_active = not shift.is_active
    
    db.commit()
    db.refresh(shift)
    
    return shift
