"""
SQLAlchemy ORM Models for Workforce Scheduling Platform
These models map to the PostgreSQL tables in Supabase
"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, Time, ForeignKey, Text, Numeric, DECIMAL, CheckConstraint, Uuid
from sqlalchemy.dialects.postgresql import JSONB, INET
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

class User(Base):
    """User model - represents both students and admins"""
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, autoincrement=False, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, index=True)  # 'student' or 'admin'
    phone = Column(String(20))
    hashed_password = Column(String(255), nullable=True) # Modified to support local auth
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    preferences = relationship("StudentPreference", back_populates="user", cascade="all, delete-orphan")
    availability = relationship("Availability", back_populates="user", cascade="all, delete-orphan")
    assignments = relationship("ScheduleAssignment", back_populates="user")
    generated_schedules = relationship("Schedule", foreign_keys="Schedule.generated_by", back_populates="generator")
    
    __table_args__ = (
        CheckConstraint("role IN ('student', 'admin')", name="check_user_role"),
    )

    def __repr__(self):
        return f"<User {self.full_name} ({self.role})>"


class Shift(Base):
    """Shift model - represents shift time blocks"""
    __tablename__ = "shifts"

    id = Column(String(36), primary_key=True, autoincrement=False, default=lambda: str(uuid.uuid4()))
    day_of_week = Column(Integer, nullable=False, index=True)  # 0=Monday, 6=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    shift_type = Column(String(20), nullable=False, index=True)  # 'weekday', 'weekend', 'rotating'
    required_students = Column(Integer, default=2)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    availability = relationship("Availability", back_populates="shift")
    assignments = relationship("ScheduleAssignment", back_populates="shift")
    
    __table_args__ = (
        CheckConstraint("day_of_week BETWEEN 0 AND 6", name="check_day_of_week"),
        CheckConstraint("shift_type IN ('weekday', 'weekend', 'rotating')", name="check_shift_type"),
    )

    @property
    def day_name(self):
        """Get the name of the day"""
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        return days[self.day_of_week]

    @property
    def duration_hours(self):
        """Calculate shift duration in hours"""
        from datetime import datetime, timedelta
        dt = datetime.combine(datetime.min, self.end_time) - datetime.combine(datetime.min, self.start_time)
        return dt.total_seconds() / 3600

    def __repr__(self):
        return f"<Shift {self.day_name} {self.start_time}-{self.end_time}>"


class StudentPreference(Base):
    """Student preferences for scheduling"""
    __tablename__ = "student_preferences"

    id = Column(String(36), primary_key=True, autoincrement=False, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    desired_hours_per_week = Column(Integer, nullable=False)
    max_shifts_per_day = Column(Integer, default=1)
    max_shifts_per_week = Column(Integer, default=5)
    can_work_weekends = Column(Boolean, default=True)
    can_work_rotating = Column(Boolean, default=False)
    notes = Column(Text)
    semester = Column(String(50), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="preferences")
    
    __table_args__ = (
        CheckConstraint("desired_hours_per_week > 0 AND desired_hours_per_week <= 40", name="check_desired_hours"),
        CheckConstraint("max_shifts_per_day > 0 AND max_shifts_per_day <= 3", name="check_max_shifts_day"),
        CheckConstraint("max_shifts_per_week > 0 AND max_shifts_per_week <= 15", name="check_max_shifts_week"),
    )

    def __repr__(self):
        return f"<StudentPreference {self.user_id} - {self.desired_hours_per_week}hrs/week>"


class Availability(Base):
    """Student availability for specific shifts"""
    __tablename__ = "availability"

    id = Column(String(36), primary_key=True, autoincrement=False, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    shift_id = Column(String(36), ForeignKey("shifts.id", ondelete="CASCADE"), nullable=False, index=True)
    is_available = Column(Boolean, default=True)
    preference_rank = Column(Integer)  # 1=highest, 5=lowest, NULL=neutral
    semester = Column(String(50), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="availability")
    shift = relationship("Shift", back_populates="availability")
    
    __table_args__ = (
        CheckConstraint("preference_rank IS NULL OR (preference_rank >= 1 AND preference_rank <= 5)", name="check_preference_rank"),
    )

    def __repr__(self):
        return f"<Availability {self.user_id} - {self.shift_id} (rank: {self.preference_rank})>"


class Schedule(Base):
    """Generated schedules"""
    __tablename__ = "schedules"

    id = Column(String(36), primary_key=True, autoincrement=False, default=lambda: str(uuid.uuid4()))
    semester = Column(String(50), nullable=False, index=True)
    status = Column(String(20), nullable=False, index=True)  # 'draft', 'published', 'archived'
    generated_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    published_at = Column(DateTime(timezone=True))
    generated_by = Column(String(36), ForeignKey("users.id"))
    algorithm_version = Column(String(20))
    optimization_score = Column(DECIMAL(10, 2))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    generator = relationship("User", foreign_keys=[generated_by], back_populates="generated_schedules")
    assignments = relationship("ScheduleAssignment", back_populates="schedule", cascade="all, delete-orphan")
    conflicts = relationship("ScheduleConflict", back_populates="schedule", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint("status IN ('draft', 'published', 'archived')", name="check_schedule_status"),
    )

    def __repr__(self):
        return f"<Schedule {self.semester} - {self.status}>"


class ScheduleAssignment(Base):
    """Individual shift assignments in a schedule"""
    __tablename__ = "schedule_assignments"

    id = Column(String(36), primary_key=True, autoincrement=False, default=lambda: str(uuid.uuid4()))
    schedule_id = Column(String(36), ForeignKey("schedules.id", ondelete="CASCADE"), nullable=False, index=True)
    shift_id = Column(String(36), ForeignKey("shifts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    week_number = Column(Integer, index=True)  # For rotating shifts, NULL for regular
    is_manual_override = Column(Boolean, default=False)
    assignment_score = Column(DECIMAL(5, 2))  # How well this matches preferences
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    schedule = relationship("Schedule", back_populates="assignments")
    shift = relationship("Shift", back_populates="assignments")
    user = relationship("User", back_populates="assignments")
    
    __table_args__ = (
        CheckConstraint("week_number IS NULL OR (week_number >= 1 AND week_number <= 20)", name="check_week_number"),
    )

    def __repr__(self):
        return f"<ScheduleAssignment {self.user_id} -> {self.shift_id}>"


class ScheduleConflict(Base):
    """Tracks scheduling conflicts and issues"""
    __tablename__ = "schedule_conflicts"

    id = Column(String(36), primary_key=True, autoincrement=False, default=lambda: str(uuid.uuid4()))
    schedule_id = Column(String(36), ForeignKey("schedules.id", ondelete="CASCADE"), nullable=False, index=True)
    conflict_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)  # 'error', 'warning', 'info'
    shift_id = Column(String(36), ForeignKey("shifts.id"))
    user_id = Column(String(36), ForeignKey("users.id"))
    description = Column(Text, nullable=False)
    resolved = Column(Boolean, default=False, index=True)
    resolved_at = Column(DateTime(timezone=True))
    resolved_by = Column(String(36), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    schedule = relationship("Schedule", back_populates="conflicts")
    
    __table_args__ = (
        CheckConstraint("severity IN ('error', 'warning', 'info')", name="check_conflict_severity"),
    )

    def __repr__(self):
        return f"<ScheduleConflict {self.conflict_type} - {self.severity}>"


class AuditLog(Base):
    """Audit trail for all changes"""
    __tablename__ = "audit_log"

    id = Column(String(36), primary_key=True, autoincrement=False, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"))
    action = Column(String(50), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(36), nullable=False, index=True)
    old_value = Column(JSONB)
    new_value = Column(JSONB)
    ip_address = Column(INET)
    user_agent = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)

    def __repr__(self):
        return f"<AuditLog {self.action} on {self.entity_type}>"
