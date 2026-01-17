# backend/app/routers/availability.py
"""
Student availability API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.models import User, Shift, Availability, StudentPreference
from app.schemas import (
    AvailabilityCreate, AvailabilityResponse, AvailabilityUpdate,
    AvailabilityWithShift, AvailabilityBulkCreate,
    StudentPreferenceCreate, StudentPreferenceResponse, StudentPreferenceUpdate
)
from app.auth import get_current_user, get_current_admin_user

router = APIRouter(prefix="/availability", tags=["Availability"])


# ============================================
# STUDENT PREFERENCES ENDPOINTS
# ============================================

@router.post("/preferences", response_model=StudentPreferenceResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_preferences(
    preferences: StudentPreferenceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create or update student preferences for a semester
    Students can only manage their own preferences
    """
    # Check if preferences already exist
    existing = db.query(StudentPreference).filter(
        StudentPreference.user_id == current_user.id,
        StudentPreference.semester == preferences.semester
    ).first()
    
    if existing:
        # Update existing preferences
        existing.desired_hours_per_week = preferences.desired_hours_per_week
        existing.max_shifts_per_day = preferences.max_shifts_per_day
        existing.max_shifts_per_week = preferences.max_shifts_per_week
        existing.can_work_weekends = preferences.can_work_weekends
        existing.can_work_rotating = preferences.can_work_rotating
        existing.notes = preferences.notes
        
        db.commit()
        db.refresh(existing)
        return existing
    
    # Create new preferences
    new_pref = StudentPreference(
        user_id=current_user.id,
        **preferences.model_dump()
    )
    
    db.add(new_pref)
    db.commit()
    db.refresh(new_pref)
    
    return new_pref


@router.get("/preferences/{semester}", response_model=StudentPreferenceResponse)
def get_my_preferences(
    semester: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's preferences for a semester
    """
    preferences = db.query(StudentPreference).filter(
        StudentPreference.user_id == current_user.id,
        StudentPreference.semester == semester
    ).first()
    
    if not preferences:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferences not found for this semester"
        )
    
    return preferences


# ============================================
# AVAILABILITY ENDPOINTS
# ============================================

@router.post("/", response_model=AvailabilityResponse, status_code=status.HTTP_201_CREATED)
def create_availability(
    availability: AvailabilityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create or update availability for a single shift
    """
    # Verify shift exists (ensure shift_id is string)
    shift_id_str = str(availability.shift_id)
    shift = db.query(Shift).filter(Shift.id == shift_id_str).first()
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shift not found"
        )
    
    # Check if availability already exists
    existing = db.query(Availability).filter(
        Availability.user_id == current_user.id,
        Availability.shift_id == shift_id_str,
        Availability.semester == availability.semester
    ).first()
    
    if existing:
        # Update existing availability
        existing.is_available = availability.is_available
        existing.preference_rank = availability.preference_rank
        
        db.commit()
        db.refresh(existing)
        return existing
    
    # Create new availability
    # Ensure model dump uses correct types if needed, but pydantic UUID will be handled by SQLAlchemy or we might need string
    avail_data = availability.model_dump()
    avail_data['shift_id'] = shift_id_str # Force string
    
    new_avail = Availability(
        user_id=current_user.id,
        **avail_data
    )
    
    db.add(new_avail)
    db.commit()
    db.refresh(new_avail)
    
    return new_avail


@router.post("/bulk", response_model=dict)
def create_bulk_availability(
    bulk_data: AvailabilityBulkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create or update availability for multiple shifts at once
    This is the main endpoint students will use to submit their weekly availability
    """
    created_count = 0
    updated_count = 0
    errors = []
    
    for avail_data in bulk_data.availabilities:
        try:
            # Parse and cast to string for DB
            shift_id = str(UUID(str(avail_data["shift_id"])))
            is_available = avail_data.get("is_available", True)
            preference_rank = avail_data.get("preference_rank")
            
            # Verify shift exists
            shift = db.query(Shift).filter(Shift.id == shift_id).first()
            if not shift:
                errors.append(f"Shift {shift_id} not found")
                continue
            
            # Check if availability exists
            existing = db.query(Availability).filter(
                Availability.user_id == current_user.id,
                Availability.shift_id == shift_id,
                Availability.semester == bulk_data.semester
            ).first()
            
            if existing:
                # Update
                existing.is_available = is_available
                existing.preference_rank = preference_rank
                updated_count += 1
            else:
                # Create
                new_avail = Availability(
                    user_id=current_user.id,
                    shift_id=shift_id,
                    is_available=is_available,
                    preference_rank=preference_rank,
                    semester=bulk_data.semester
                )
                db.add(new_avail)
                created_count += 1
        
        except Exception as e:
            errors.append(f"Error processing shift: {str(e)}")
    
    db.commit()
    
    return {
        "success": True,
        "created": created_count,
        "updated": updated_count,
        "errors": errors
    }


@router.get("/my-availability/{semester}", response_model=List[AvailabilityWithShift])
def get_my_availability(
    semester: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's availability for all shifts in a semester
    Returns availability with shift details
    """
    availabilities = db.query(Availability).filter(
        Availability.user_id == current_user.id,
        Availability.semester == semester
    ).all()
    
    # Load shift relationships
    result = []
    for avail in availabilities:
        shift = db.query(Shift).filter(Shift.id == avail.shift_id).first()
        avail_dict = {
            "id": avail.id,
            "user_id": avail.user_id,
            "shift_id": avail.shift_id,
            "is_available": avail.is_available,
            "preference_rank": avail.preference_rank,
            "semester": avail.semester,
            "created_at": avail.created_at,
            "updated_at": avail.updated_at,
            "shift": shift
        }
        result.append(avail_dict)
    
    return result


@router.get("/student/{student_id}/{semester}", response_model=List[AvailabilityWithShift])
def get_student_availability(
    student_id: UUID,
    semester: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get a student's availability (Admin only)
    """
    availabilities = db.query(Availability).filter(
        Availability.user_id == str(student_id),
        Availability.semester == semester
    ).all()
    
    result = []
    for avail in availabilities:
        shift = db.query(Shift).filter(Shift.id == avail.shift_id).first()
        avail_dict = {
            "id": avail.id,
            "user_id": avail.user_id,
            "shift_id": avail.shift_id,
            "is_available": avail.is_available,
            "preference_rank": avail.preference_rank,
            "semester": avail.semester,
            "created_at": avail.created_at,
            "updated_at": avail.updated_at,
            "shift": shift
        }
        result.append(avail_dict)
    
    return result


@router.delete("/{availability_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_availability(
    availability_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete an availability entry
    Students can only delete their own
    """
    availability = db.query(Availability).filter(
        Availability.id == str(availability_id)
    ).first()
    
    if not availability:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Availability not found"
        )
    
    # Check permissions
    if current_user.role != "admin" and availability.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this availability"
        )
    
    db.delete(availability)
    db.commit()
    
    return None


@router.get("/summary/{semester}")
def get_availability_summary(
    semester: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get availability summary for all students (Admin only)
    Shows how many students are available for each shift
    """
    from sqlalchemy import func
    
    # Get all shifts
    shifts = db.query(Shift).filter(Shift.is_active == True).all()
    
    summary = []
    for shift in shifts:
        # Count available students
        available_count = db.query(func.count(Availability.id)).filter(
            Availability.shift_id == shift.id,
            Availability.semester == semester,
            Availability.is_available == True
        ).scalar()
        
        # Count students who marked it as top preference
        top_pref_count = db.query(func.count(Availability.id)).filter(
            Availability.shift_id == shift.id,
            Availability.semester == semester,
            Availability.is_available == True,
            Availability.preference_rank == 1
        ).scalar()
        
        summary.append({
            "shift": {
                "id": shift.id,
                "day_name": shift.day_name,
                "start_time": str(shift.start_time),
                "end_time": str(shift.end_time),
                "shift_type": shift.shift_type
            },
            "available_students": available_count,
            "top_preference_count": top_pref_count,
            "required_students": shift.required_students,
            "is_adequately_staffed": available_count >= shift.required_students
        })
    
    return {
        "semester": semester,
        "shifts": summary,
        "total_shifts": len(shifts)
    }
