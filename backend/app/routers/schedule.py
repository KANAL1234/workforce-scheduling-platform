from typing import List
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from .. import models, schemas, database
from app.auth import get_current_admin_user, get_current_active_user
from ..scheduler import optimizer

router = APIRouter(
    prefix="/schedules",
    tags=["schedules"],
    responses={404: {"description": "Not found"}},
)

@router.post("/generate", response_model=schemas.ScheduleResponse, status_code=status.HTTP_201_CREATED)
def generate_schedule_endpoint(
    schedule_req: schemas.ScheduleCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    """
    Trigger schedule generation. 
    Warning: This is a blocking operation in this simple implementation.
    """
    schedule = optimizer.generate_schedule(db, schedule_req.semester, str(current_user.id))
    if not schedule:
        raise HTTPException(status_code=400, detail="Could not generate a valid schedule (infeasible constraints)")
    
    return schedule

@router.get("/", response_model=List[schemas.ScheduleResponse])
def list_schedules(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    schedules = db.query(models.Schedule).order_by(models.Schedule.created_at.desc()).offset(skip).limit(limit).all()
    return schedules

@router.get("/{schedule_id}", response_model=schemas.ScheduleResponse)
def get_schedule(
    schedule_id: UUID, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    schedule = db.query(models.Schedule).filter(models.Schedule.id == str(schedule_id)).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return schedule

@router.get("/{schedule_id}/assignments", response_model=List[schemas.ScheduleAssignmentDetailed])
def get_schedule_assignments(
    schedule_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    assignments = db.query(models.ScheduleAssignment).filter(models.ScheduleAssignment.schedule_id == str(schedule_id)).all()
    return assignments

@router.post("/{schedule_id}/publish", response_model=schemas.ScheduleResponse)
def publish_schedule(
    schedule_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    schedule = db.query(models.Schedule).filter(models.Schedule.id == str(schedule_id)).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    schedule.status = 'published'
    schedule.published_at = datetime.utcnow()
    db.commit()
    db.refresh(schedule)
    return schedule

@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(
    schedule_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    schedule = db.query(models.Schedule).filter(models.Schedule.id == str(schedule_id)).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Delete the schedule (assignments will be cascade deleted due to relationship)
    db.delete(schedule)
    db.commit()
    return None
