from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy import func
from app.models.user import Profile, UserRegister, UserLogin, UserResponse
from app.models.activity import Activity, ActivityResponse
from app.models.user_board import UserBoardActivity
from app.db.connection import get_session
import uuid as uuid_pkg
import base64
import hashlib
import hmac
import secrets

router = APIRouter()

_PBKDF2_ROUNDS = 120_000


def _hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        _PBKDF2_ROUNDS,
    )
    return f"{base64.b64encode(salt).decode()}.{base64.b64encode(derived).decode()}"


def _verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_b64, derived_b64 = stored_hash.split(".", 1)
        salt = base64.b64decode(salt_b64)
        derived = base64.b64decode(derived_b64)
    except Exception:
        return False

    check = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        _PBKDF2_ROUNDS,
    )
    return hmac.compare_digest(check, derived)


@router.post(
    "/auth/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a new user with a username and password.",
    response_description="The created user profile",
    responses={
        201: {"description": "User registered"},
        409: {"description": "Username already exists"},
    },
)
def register_user(user_data: UserRegister, session: Session = Depends(get_session)):
    username = user_data.username.strip()
    if not username:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username is required",
        )
    if len(user_data.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 6 characters",
        )

    existing = session.exec(
        select(Profile).where(Profile.username == username)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists",
        )

    new_profile = Profile(
        username=username,
        password_hash=_hash_password(user_data.password),
    )
    session.add(new_profile)
    session.commit()
    session.refresh(new_profile)
    return new_profile


@router.post(
    "/auth/login",
    response_model=UserResponse,
    summary="Login",
    description="Login using a username and password.",
    response_description="The authenticated user profile",
    responses={
        200: {"description": "Login successful"},
        401: {"description": "Invalid username or password"},
    },
)
def login_user(user_data: UserLogin, session: Session = Depends(get_session)):
    username = user_data.username.strip()
    if not username:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username is required",
        )

    user = session.exec(
        select(Profile).where(Profile.username == username)
    ).first()
    if not user or not _verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    return user


@router.get(
    "/users/check-username",
    summary="Check username availability",
    description="Returns whether the given username is available (not yet used by any profile).",
    responses={
        200: {"description": "Availability status"},
    },
)
def check_username_availability(username: str, session: Session = Depends(get_session)):
    existing = session.exec(
        select(Profile).where(Profile.username == username)
    ).first()
    return {"available": existing is None}


@router.get(
    "/users/{user_id}",
    response_model=UserResponse,
    summary="Get user by ID",
    description="Retrieve a single user profile by their UUID.",
    response_description="The requested user profile",
    responses={
        200: {"description": "User profile found"},
        404: {"description": "No profile exists for the given `user_id`"},
    },
)
def get_user(user_id: uuid_pkg.UUID, session: Session = Depends(get_session)):
    """Get a user by ID"""
    user = session.get(Profile, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.get(
    "/users",
    response_model=list[UserResponse],
    summary="List users",
    description="Returns user profiles with pagination support.",
    response_description="Array of user profiles",
)
def list_users(
    skip: int = 0,
    limit: int = 50,
    session: Session = Depends(get_session),
):
    """List users (paginated)"""
    users = session.exec(select(Profile).offset(skip).limit(limit)).all()
    return users


@router.get(
    "/users/{user_id}/board",
    response_model=list[ActivityResponse],
    summary="Get user's bingo board",
    description=(
        "Returns the user's persisted 25-activity board. "
        "If the user has no board yet, a random set of 25 activities is generated and stored."
    ),
    response_description="Ordered list of 25 activities for the user's board",
    responses={
        200: {"description": "Board returned"},
        400: {"description": "Not enough activities to generate a board"},
        404: {"description": "User not found"},
    },
)
def get_user_board(user_id: uuid_pkg.UUID, session: Session = Depends(get_session)):
    user = session.get(Profile, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    existing = session.exec(
        select(UserBoardActivity)
        .where(UserBoardActivity.user_id == user_id)
        .order_by(UserBoardActivity.position)
    ).all()

    if not existing:
        activities = session.exec(
            select(Activity).order_by(func.random()).limit(25)
        ).all()
        if len(activities) < 25:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least 25 activities are required to generate a board",
            )

        for position, activity in enumerate(activities):
            session.add(
                UserBoardActivity(
                    user_id=user_id,
                    activity_id=activity.id,
                    position=position,
                )
            )
        session.commit()

    statement = (
        select(Activity)
        .join(UserBoardActivity, Activity.id == UserBoardActivity.activity_id)
        .where(UserBoardActivity.user_id == user_id)
        .order_by(UserBoardActivity.position)
    )
    return session.exec(statement).all()
