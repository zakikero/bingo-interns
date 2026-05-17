from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlmodel import Session, text
from contextlib import asynccontextmanager
import os
from app.db.connection import engine
from app.routes import users, activities, leaderboard

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Tables already exist in Supabase, no need to create
    # If you need to create tables programmatically, uncomment:
    # from app.db.connection import create_db_and_tables
    # create_db_and_tables()
    yield
    # Shutdown: cleanup if needed

tags_metadata = [
    {
        "name": "users",
        "description": (
            "Operations related to user profiles and authentication. "
            "Handles username-based registration/login and profile retrieval."
        ),
    },
    {
        "name": "activities",
        "description": (
            "Manage bingo activities (challenges) and submissions. "
            "Activities occupy positions 0-24 on the bingo board. "
            "Submissions represent proof (image URL) that a user completed a challenge."
        ),
    },
    {
        "name": "leaderboard",
        "description": (
            "Leaderboard and statistics endpoints. "
            "Returns ranked users by completed activities as well as per-user and global platform stats."
        ),
    },
]

app = FastAPI(
    lifespan=lifespan,
    title="Bingo App API",
    description=(
        "## Bingo Challenge Game API\n\n"
        "Backend REST API powering the Bingo intern challenge game.\n\n"
        "### Features\n"
        "- **Auth** – username/password registration and login\n"
        "- **Activities** – 25-cell bingo board challenges\n"
        "- **Submissions** – image-proof submissions for completed activities\n"
        "- **Leaderboard** – real-time ranking by completed activities and per-board rankings\n\n"
        "All IDs are UUIDs. Timestamps are UTC ISO-8601 strings."
    ),
    version="1.0.0",
    openapi_tags=tags_metadata,
    contact={
        "name": "Bingo Interns Team",
    },
    license_info={
        "name": "MIT",
    },
)

# Configure CORS for frontend
_default_origins = [
    "http://localhost:3000", "http://localhost:3001",
    "http://127.0.0.1:3000", "http://127.0.0.1:3001",
    "https://bingointerns.onrender.com",
]
_cors_origins_env = os.getenv("CORS_ORIGINS", "")
cors_origins = (
    [o.strip() for o in _cors_origins_env.split(",") if o.strip()]
    if _cors_origins_env
    else _default_origins
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/api", tags=["users"])
app.include_router(activities.router, prefix="/api", tags=["activities"])
app.include_router(leaderboard.router, prefix="/api", tags=["leaderboard"])

@app.get(
    "/",
    summary="Root",
    description="Returns basic information about the running API.",
    include_in_schema=False,
)
def root():
    return {
        "message": "Bingo App API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get(
    "/health",
    summary="Health check",
    description="Verifies the API process is alive and that the database connection is working.",
    tags=["health"],
    responses={
        200: {"description": "Service and database are healthy"},
        500: {"description": "Database connection failed"},
    },
)
def test_database():
    """Test database connection"""
    try:
        with Session(engine) as session:
            result = session.exec(text("SELECT 1")).scalar_one()
            return {"status": "healthy", "database_connection": "ok", "result": int(result)}
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "error": str(e)},
        )


