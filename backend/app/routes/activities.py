from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.models.activity import (
    Activity, ActivityCreate, ActivityResponse,
    Submission, SubmissionCreate, SubmissionResponse
)
from app.models.user import Profile
from app.db.connection import get_session
from app.routes.leaderboard import invalidate_leaderboard_cache
import uuid as uuid_pkg
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

MAX_TEXT_LENGTH = 150


# Additional request models
class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


# ============= ACTIVITY ROUTES =============

@router.get(
    "/activities",
    response_model=List[ActivityResponse],
    summary="List bingo board activities",
    description=(
        "Returns all activities available for board generation."
    ),
    response_description="List of activities",
)
def get_activities(session: Session = Depends(get_session)):
    statement = select(Activity).order_by(Activity.created_at.desc())
    return session.exec(statement).all()


@router.get(
    "/activities/{activity_id}",
    response_model=ActivityResponse,
    summary="Get activity by ID",
    description="Retrieve a single bingo activity by its UUID.",
    response_description="The requested activity",
    responses={
        200: {"description": "Activity found"},
        404: {"description": "No activity exists for the given `activity_id`"},
    },
)
def get_activity(activity_id: uuid_pkg.UUID, session: Session = Depends(get_session)):
    """Get an activity by ID"""
    activity = session.get(Activity, activity_id)
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found"
        )
    return activity


# ============= SUBMISSION ROUTES =============

@router.post(
    "/submissions",
    response_model=SubmissionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit activity proof",
    description=(
        "Record that a user has completed a bingo activity.\n\n"
        "**Validation rules**:\n"
        "- The `user_id` must reference an existing profile.\n"
        "- The `activity_id` must reference an existing activity.\n"
        "- A user may only submit once per activity (duplicate submissions return **400**)."
    ),
    response_description="The newly created submission record",
    responses={
        201: {"description": "Submission created successfully"},
        400: {"description": "User has already submitted for this activity"},
        404: {"description": "User or activity not found"},
    },
)
def create_submission(submission_data: SubmissionCreate, session: Session = Depends(get_session)):
    # Verify user exists
    user = session.get(Profile, submission_data.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify activity exists
    activity = session.get(Activity, submission_data.activity_id)
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found"
        )
    
    # Check if user already submitted for this activity
    statement = select(Submission).where(
        Submission.user_id == submission_data.user_id,
        Submission.activity_id == submission_data.activity_id
    )
    existing = session.exec(statement).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already submitted for this activity"
        )

    text_response = submission_data.textResponse
    if text_response is not None:
        text_response = text_response.strip()
        if not text_response:
            text_response = None

    if activity.isTextRequired and not text_response:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text response is required for this activity"
        )

    if text_response and len(text_response) > MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Text response must be {MAX_TEXT_LENGTH} characters or fewer"
        )

    image_url = submission_data.imageUrl
    if image_url is not None:
        image_url = image_url.strip() or None
    
    submission_payload = submission_data.model_dump()
    submission_payload["textResponse"] = text_response
    submission_payload["imageUrl"] = image_url
    new_submission = Submission(**submission_payload)
    session.add(new_submission)
    session.commit()
    session.refresh(new_submission)

    # The leaderboard endpoints are read-cached (TTL). Invalidate on write so
    # clients see updated ranks immediately after completing an activity.
    invalidate_leaderboard_cache()
    return new_submission


@router.get(
    "/submissions/user/{user_id}",
    response_model=List[SubmissionResponse],
    summary="Get submissions by user",
    description="Returns activity submissions made by the specified user.",
    response_description="List of submissions for the user",
)
def get_user_submissions(
    user_id: uuid_pkg.UUID,
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
):
    """Get submissions for a specific user (paginated)"""
    statement = (
        select(Submission)
        .where(Submission.user_id == user_id)
        .order_by(Submission.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    submissions = session.exec(statement).all()
    return submissions


@router.get(
    "/submissions/activity/{activity_id}",
    response_model=List[SubmissionResponse],
    summary="Get submissions by activity",
    description="Returns user submissions for the specified activity.",
    response_description="List of submissions for the activity",
)
def get_activity_submissions(
    activity_id: uuid_pkg.UUID,
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
):
    """Get submissions for a specific activity (paginated)"""
    statement = (
        select(Submission)
        .where(Submission.activity_id == activity_id)
        .order_by(Submission.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    submissions = session.exec(statement).all()
    return submissions


@router.get(
    "/submissions/{submission_id}",
    response_model=SubmissionResponse,
    summary="Get submission by ID",
    description="Retrieve a single submission record by its UUID.",
    response_description="The requested submission",
    responses={
        200: {"description": "Submission found"},
        404: {"description": "No submission exists for the given `submission_id`"},
    },
)
def get_submission(submission_id: uuid_pkg.UUID, session: Session = Depends(get_session)):
    """Get a specific submission"""
    submission = session.get(Submission, submission_id)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    return submission
