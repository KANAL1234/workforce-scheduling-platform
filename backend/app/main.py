# backend/app/main.py
"""
Workforce Scheduling Platform - FastAPI Application
Main entry point with all routes configured
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import auth, students, availability, shifts
try:
    from app.routers import schedule
except ImportError:
    schedule = None

from app.database import test_connection, init_db

# Create FastAPI app
app = FastAPI(
    title="Workforce Scheduling Platform API",
    description="API for managing employee and student worker shift scheduling",
    version="1.0.0",
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc"  # ReDoc
)

# CORS Configuration - Allow frontend to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative React port
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(students.router, prefix="/api")
app.include_router(availability.router, prefix="/api")
app.include_router(shifts.router, prefix="/api")

if schedule:
    app.include_router(schedule.router, prefix="/api")

# Root endpoint
@app.get("/")
def read_root():
    """API root - basic info"""
    return {
        "message": "Workforce Scheduling Platform API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }

# Health check endpoint
@app.get("/health")
def health_check():
    """Health check endpoint for monitoring"""
    db_status = "connected" if test_connection() else "disconnected"
    
    return {
        "status": "healthy",
        "database": db_status,
        "api_version": "1.0.0"
    }

# Exception handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "Resource not found"}
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# Startup event
@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    print("=" * 60)
    print("🚀 Workforce Scheduling Platform API Starting...")
    print("=" * 60)
    
    # Test database connection
    if test_connection():
        print("✅ Database connection successful")
    else:
        print("❌ Database connection failed")
    
    print("📚 API Documentation available at: /docs")
    print("=" * 60)

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    print("👋 Shutting down Workforce Scheduling Platform API...")
