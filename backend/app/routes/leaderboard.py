from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func
from app.models.user import Profile
from app.models.activity import Submission, Activity
from app.db.connection import get_session
import uuid as uuid_pkg
from typing import List
from pydantic import BaseModel
import time

router = APIRouter()

# ── Simple in-memory TTL cache for read-heavy endpoints ──
_cache: dict[str, tuple[float, object]] = {}

def _get_cached(key: str, ttl: float):
    """Return cached value if still valid, else None."""
    entry = _cache.get(key)
    if entry and (time.monotonic() - entry[0]) < ttl:
        return entry[1]
    return None

def _set_cached(key: str, value: object):
    _cache[key] = (time.monotonic(), value)


class LeaderboardEntry(BaseModel):
    user_id: uuid_pkg.UUID
    name: str | None = None
    completed_activities: int
    rank: int


class UserStats(BaseModel):
    user_id: uuid_pkg.UUID
    username: str
    completed_activities: int


@router.get(
    "/leaderboard/top",
    response_model=List[LeaderboardEntry],
    summary="Top users by completed activities",
    description=(
        "Returns the highest-scoring users ranked by number of completed activities.\n\n"
        "Use the `limit` query parameter to control how many entries to return (default **5**)."
    ),
    response_description="Ranked list of top users with their completed activity count",
)
def get_top_users(
    limit: int = 5,
    session: Session = Depends(get_session)
):
    cache_key = f"leaderboard_top_{limit}"
    cached = _get_cached(cache_key, ttl=30.0)
    if cached is not None:
        return cached

    # Rank users by number of submissions (completed activities).
    # On a tie, the user whose latest submission is oldest wins (finished first).
    statement = (
        select(
            Profile.id,
            Profile.username,
            func.count(Submission.id).label("completed_activities"),
            func.max(Submission.created_at).label("last_submission_at"),
        )
        .join(Submission, Profile.id == Submission.user_id)
        .group_by(Profile.id, Profile.username)
        .order_by(
            func.count(Submission.id).desc(),
            func.max(Submission.created_at).asc(),
        )
        .limit(limit)
    )
    
    results = session.exec(statement).all()
    
    leaderboard = [
        LeaderboardEntry(
            user_id=user_id,
            name=name,
            completed_activities=completed_activities or 0,
            rank=idx + 1
        )
        for idx, (user_id, name, completed_activities, _last_sub) in enumerate(results)
    ]
    
    _set_cached(cache_key, leaderboard)
    return leaderboard


@router.get(
    "/stats/user/{user_id}",
    response_model=UserStats,
    summary="User statistics",
    description=(
        "Returns the number of completed activities for a single user."
    ),
    response_description="Aggregated stats for the requested user",
    responses={
        200: {"description": "Stats returned successfully"},
        404: {"description": "No profile exists for the given `user_id`"},
    },
)
def get_user_stats(user_id: uuid_pkg.UUID, session: Session = Depends(get_session)):
    """Get comprehensive statistics for a specific user"""
    # Verify user exists
    user = session.get(Profile, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Count completed activities
    stats_statement = (
        select(
            func.count(Submission.id).label("completed_activities")
        )
        .where(Submission.user_id == user_id)
    )
    stats_result = session.exec(stats_statement).first()
    completed_activities = stats_result[0] or 0 if stats_result else 0
    
    return UserStats(
        user_id=user_id,
        username=user.username,
        completed_activities=int(completed_activities)
    )


@router.get(
    "/stats/global",
    summary="Global platform statistics",
    description=(
        "Returns high-level counters for the entire platform:\n\n"
        "- `total_users` – total registered profiles\n"
        "- `total_activities` – total activities in the database\n"
        "- `total_submissions` – total activity submissions across all users"
    ),
    response_description="Aggregated platform-wide statistics",
)
def get_global_stats(session: Session = Depends(get_session)):
    """Get overall platform statistics (cached 60s)"""
    cached = _get_cached("global_stats", ttl=60.0)
    if cached is not None:
        return cached

    # Single round-trip using scalar subqueries instead of 3 separate queries
    result = session.exec(
        select(
            select(func.count(Profile.id)).scalar_subquery(),
            select(func.count(Activity.id)).scalar_subquery(),
            select(func.count(Submission.id)).scalar_subquery(),
        )
    ).first()
    
    stats = {
        "total_users": result[0] if result else 0,
        "total_activities": result[1] if result else 0,
        "total_submissions": result[2] if result else 0,
    }
    _set_cached("global_stats", stats)
    return stats
