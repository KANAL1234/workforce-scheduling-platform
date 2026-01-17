"""
Pydantic schemas for request/response validation
These define the structure of data sent to/from the API
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime, time
from uuid import UUID


# ============================================
# USER SCHEMAS
# ============================================

class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)


class UserCreate(UserBase):
    role: str = Field(..., pattern="^(student|admin)$")
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: UUID
    role: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================
# SHIFT SCHEMAS
# ============================================

class ShiftBase(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    start_time: time
    end_time: time
    shift_type: str = Field(..., pattern="^(weekday|weekend|rotating)$")
    required_students: int = Field(default=2, ge=1, le=5)


class ShiftCreate(ShiftBase):
    pass


class ShiftResponse(ShiftBase):
    id: UUID
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class ShiftWithDetails(ShiftResponse):
    """Shift with calculated fields"""
    day_name: str
    duration_hours: float


# ============================================
# STUDENT PREFERENCE SCHEMAS
# ============================================

class StudentPreferenceBase(BaseModel):
    desired_hours_per_week: int = Field(..., ge=1, le=40)
    max_shifts_per_day: int = Field(default=1, ge=1, le=3)
    max_shifts_per_week: int = Field(default=5, ge=1, le=15)
    can_work_weekends: bool = True
    can_work_rotating: bool = False
    notes: Optional[str] = None
    semester: str = Field(..., min_length=1, max_length=50)


class StudentPreferenceCreate(StudentPreferenceBase):
    pass


class StudentPreferenceUpdate(BaseModel):
    desired_hours_per_week: Optional[int] = Field(None, ge=1, le=40)
    max_shifts_per_day: Optional[int] = Field(None, ge=1, le=3)
    max_shifts_per_week: Optional[int] = Field(None, ge=1, le=15)
    can_work_weekends: Optional[bool] = None
    can_work_rotating: Optional[bool] = None
    notes: Optional[str] = None


class StudentPreferenceResponse(StudentPreferenceBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============================================
# AVAILABILITY SCHEMAS
# ============================================

class AvailabilityBase(BaseModel):
    shift_id: UUID
    is_available: bool = True
    preference_rank: Optional[int] = Field(None, ge=1, le=5)
    semester: str = Field(..., min_length=1, max_length=50)
    
    @validator('preference_rank')
    def validate_preference(cls, v, values):
        """Only allow preference_rank if is_available is True"""
        if v is not None and not values.get('is_available', True):
            raise ValueError("Cannot set preference_rank if not available")
        return v


class AvailabilityCreate(AvailabilityBase):
    pass


class AvailabilityUpdate(BaseModel):
    is_available: Optional[bool] = None
    preference_rank: Optional[int] = Field(None, ge=1, le=5)


class AvailabilityResponse(AvailabilityBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AvailabilityBulkCreate(BaseModel):
    """For submitting all availability at once"""
    semester: str
    availabilities: List[dict]  # List of {shift_id, is_available, preference_rank}


class AvailabilityWithShift(AvailabilityResponse):
    """Availability with shift details"""
    shift: ShiftResponse


# ============================================
# SCHEDULE SCHEMAS
# ============================================

class ScheduleBase(BaseModel):
    semester: str = Field(..., min_length=1, max_length=50)
    notes: Optional[str] = None


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(draft|published|archived)$")
    notes: Optional[str] = None


class ScheduleResponse(ScheduleBase):
    id: UUID
    status: str
    generated_at: datetime
    published_at: Optional[datetime]
    generated_by: Optional[UUID]
    algorithm_version: Optional[str]
    optimization_score: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ScheduleWithStats(ScheduleResponse):
    """Schedule with summary statistics"""
    total_assignments: int
    shifts_covered: int
    students_assigned: int
    conflicts_count: int


# ============================================
# SCHEDULE ASSIGNMENT SCHEMAS
# ============================================

class ScheduleAssignmentBase(BaseModel):
    shift_id: UUID
    user_id: UUID
    week_number: Optional[int] = Field(None, ge=1, le=20)
    notes: Optional[str] = None


class ScheduleAssignmentCreate(ScheduleAssignmentBase):
    schedule_id: UUID


class ScheduleAssignmentUpdate(BaseModel):
    user_id: Optional[UUID] = None
    week_number: Optional[int] = Field(None, ge=1, le=20)
    is_manual_override: Optional[bool] = None
    notes: Optional[str] = None


class ScheduleAssignmentResponse(ScheduleAssignmentBase):
    id: UUID
    schedule_id: UUID
    is_manual_override: bool
    assignment_score: Optional[float]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ScheduleAssignmentDetailed(ScheduleAssignmentResponse):
    """Assignment with related data"""
    shift: ShiftResponse
    user: UserResponse


# ============================================
# SCHEDULE CONFLICT SCHEMAS
# ============================================

class ScheduleConflictBase(BaseModel):
    conflict_type: str = Field(..., min_length=1, max_length=50)
    severity: str = Field(..., pattern="^(error|warning|info)$")
    description: str = Field(..., min_length=1)
    shift_id: Optional[UUID] = None
    user_id: Optional[UUID] = None


class ScheduleConflictCreate(ScheduleConflictBase):
    schedule_id: UUID


class ScheduleConflictResponse(ScheduleConflictBase):
    id: UUID
    schedule_id: UUID
    resolved: bool
    resolved_at: Optional[datetime]
    resolved_by: Optional[UUID]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================
# AUTHENTICATION SCHEMAS
# ============================================

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[UUID] = None
    email: Optional[str] = None
    role: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# ============================================
# WEEKLY CALENDAR SCHEMAS (For Frontend)
# ============================================

class WeeklyAvailability(BaseModel):
    """Structured weekly availability for calendar view"""
    user_id: UUID
    semester: str
    monday: List[AvailabilityResponse] = []
    tuesday: List[AvailabilityResponse] = []
    wednesday: List[AvailabilityResponse] = []
    thursday: List[AvailabilityResponse] = []
    friday: List[AvailabilityResponse] = []
    saturday: List[AvailabilityResponse] = []
    sunday: List[AvailabilityResponse] = []


class WeeklySchedule(BaseModel):
    """Student's weekly schedule"""
    user_id: UUID
    semester: str
    schedule_id: UUID
    assignments_by_day: dict  # {day_name: [assignments]}


# ============================================
# STATISTICS & SUMMARY SCHEMAS
# ============================================

class StudentStats(BaseModel):
    """Statistics for a student"""
    user_id: UUID
    full_name: str
    total_hours_assigned: float
    total_shifts: int
    preferred_shifts_assigned: int
    preference_satisfaction_rate: float


class ShiftCoverage(BaseModel):
    """Coverage status for a shift"""
    shift_id: UUID
    shift: ShiftResponse
    assigned_count: int
    required_count: int
    is_fully_staffed: bool
    assigned_students: List[UserResponse]


class SchedulingSummary(BaseModel):
    """Overall scheduling statistics"""
    schedule_id: UUID
    semester: str
    total_students: int
    total_shifts: int
    total_assignments: int
    fully_staffed_shifts: int
    understaffed_shifts: int
    avg_hours_per_student: float
    avg_preference_satisfaction: float
    conflicts_count: int
