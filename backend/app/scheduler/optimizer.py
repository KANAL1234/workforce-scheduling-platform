from ortools.sat.python import cp_model
from sqlalchemy.orm import Session
from .. import models
from datetime import datetime
import pandas as pd

class ScheduleOptimizer:
    def __init__(self, db: Session, semester: str, user_id: str):
        self.db = db
        self.semester = semester
        self.user_id = user_id
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()
        self.assignments = {} # (student_id, shift_id) -> BoolVar

    def generate(self):
        # 1. Fetch Data
        shifts = self.db.query(models.Shift).filter(models.Shift.is_active == True).all()
        
        # Get all students who have availability for this semester
        # Changed from join with preferences to join with availability
        students = self.db.query(models.User).join(models.Availability).filter(
            models.User.role == "student",
            models.User.is_active == True,
            models.Availability.semester == self.semester,
            models.Availability.is_available == True
        ).distinct().all()
        
        availability_entries = self.db.query(models.Availability).filter(
            models.Availability.semester == self.semester
        ).all()
        
        # Map availability: (user_id, shift_id) -> is_available
        avail_map = {}
        for a in availability_entries:
            avail_map[(a.user_id, a.shift_id)] = (a.is_available, a.preference_rank)
            
        print(f"Found {len(shifts)} shifts and {len(students)} students.")


        # 2. Create Variables
        # x[student, shift] = 1 if assigned
        for student in students:
            for shift in shifts:
                # Check if available
                is_avail, rank = avail_map.get((student.id, shift.id), (True, None)) # Default available?
                # If explicitly not available, can't assign.
                # If no availability record, assume available or not? 
                # Usually assume NOT available if not set? Or Available?
                # Let's assume Valid Submission Required -> So if not in map, maybe assume unavailable?
                # For now, if no record, we assume unavailable to be safe (opt-in).
                if not is_avail:
                    continue
                if (student.id, shift.id) not in avail_map:
                    # Student didn't say anything. Let's look at implementation plan.
                    # Plan says "Honor is_available=False".
                    # Let's assume if no record, they are NOT available.
                    continue

                self.assignments[(student.id, shift.id)] = self.model.NewBoolVar(f'assign_{student.id}_{shift.id}')
        
        # 3. Constraints
        
        # C1: Shift Coverage
        # Each shift should have required_students, but can have fewer if not enough candidates
        for shift in shifts:
            candidates = [self.assignments[(s.id, shift.id)] for s in students if (s.id, shift.id) in self.assignments]
            if len(candidates) == 0:
                print(f"Warning: Shift {shift.day_name} {shift.start_time} has no available students!")
                continue
            
            # Flexible constraint: Assign AT MOST required_students, but try to fill it
            # Don't force exact match - this makes it more flexible
            target = min(len(candidates), shift.required_students)
            # Only require we don't exceed the required number
            self.model.Add(sum(candidates) <= shift.required_students)

        # C2: Student Max Hours / Max Shifts (Make these SOFT constraints)
        for student in students:
            student_shifts = [self.assignments[(student.id, s.id)] for s in shifts if (student.id, s.id) in self.assignments]
            
            if not student_shifts:
                continue
                
            prefs = next((p for p in student.preferences if p.semester == self.semester), None)
            if prefs:
                # Max shifts per week - soft constraint (try not to exceed but allow if needed)
                self.model.Add(sum(student_shifts) <= prefs.max_shifts_per_week + 2)  # Allow some flexibility
                
                # Max hours - soft constraint
                scaled_limit = int(prefs.desired_hours_per_week * 100)
                scaled_expr = sum(self.assignments[(student.id, s.id)] * int(s.duration_hours * 100) for s in shifts if (student.id, s.id) in self.assignments)
                # Allow going over by 50% if needed
                self.model.Add(scaled_expr <= int(scaled_limit * 1.5))

        # C3: Fairness - Try to distribute shifts evenly among students
        # Calculate average assignments per student
        total_required = sum(shift.required_students for shift in shifts)
        num_students = len(students)
        if num_students > 0:
            avg_per_student = max(1, total_required // num_students)
            
            # Each student should get at least some shifts if available
            for student in students:
                student_shifts = [self.assignments[(student.id, s.id)] for s in shifts if (student.id, s.id) in self.assignments]
                if student_shifts:
                    # Try to give each student at least 1 shift if they're available for any
                    # But don't make it a hard requirement
                    pass  # Handled by objective

        # 4. Objective: Multi-criteria optimization
        # Priority 1: Fill all shifts (maximize total assignments)
        # Priority 2: Maximize preference satisfaction
        # Priority 3: Distribute evenly
        
        objective_terms = []
        
        # Weight for filling shifts (highest priority)
        fill_weight = 1000
        for (sid, shid), var in self.assignments.items():
            objective_terms.append(var * fill_weight)
        
        # Weight for preferences (medium priority)
        for (sid, shid), var in self.assignments.items():
            _, rank = avail_map.get((sid, shid), (True, None))
            if rank:
                # Rank 1 = best (5 points), Rank 5 = worst (1 point)
                pref_weight = (6 - rank) * 100
            else:
                pref_weight = 300  # Neutral preference
            objective_terms.append(var * pref_weight)
        
        # Weight for fairness - penalize having too many shifts on one student
        fairness_weight = -50  # Negative weight to penalize imbalance
        for student in students:
            student_shifts = [self.assignments[(student.id, s.id)] for s in shifts if (student.id, s.id) in self.assignments]
            if len(student_shifts) > 1:
                # Penalize the square of assignments to encourage distribution
                # This is approximate since we can't do squares in CP-SAT directly
                # Instead, penalize each additional assignment
                for i, var in enumerate(student_shifts):
                    objective_terms.append(var * fairness_weight * i)
            
        self.model.Maximize(sum(objective_terms))


        # 5. Solve
        status = self.solver.Solve(self.model)
        
        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            print(f"Solution found! Objective value: {self.solver.ObjectiveValue()}")
            return self.save_solution(shifts, students)
        else:
            print("No solution found.")
            return None

    def save_solution(self, shifts, students):
        # Fetch availability map again for preference ranks
        availability_entries = self.db.query(models.Availability).filter(
            models.Availability.semester == self.semester
        ).all()
        
        avail_map = {}
        for a in availability_entries:
            avail_map[(a.user_id, a.shift_id)] = (a.is_available, a.preference_rank)
        
        # Create Schedule
        schedule = models.Schedule(
            semester=self.semester,
            status='draft',
            generated_by=self.user_id,
            optimization_score=self.solver.ObjectiveValue(),
            algorithm_version="v2_flexible"
        )
        self.db.add(schedule)
        self.db.flush() # Get ID

        count = 0
        for (sid, shid), var in self.assignments.items():
            if self.solver.Value(var) == 1:
                # Get preference rank from availability
                _, pref_rank = avail_map.get((sid, shid), (True, None))
                
                assignment = models.ScheduleAssignment(
                    schedule_id=schedule.id,
                    shift_id=shid,
                    user_id=sid,
                    assignment_score=float(pref_rank) if pref_rank else None
                )
                self.db.add(assignment)
                count += 1
        
        print(f"Created {count} assignments")
        self.db.commit()
        self.db.refresh(schedule)
        return schedule

def generate_schedule(db: Session, semester: str, user_id: str):
    optimizer = ScheduleOptimizer(db, semester, user_id)
    return optimizer.generate()
