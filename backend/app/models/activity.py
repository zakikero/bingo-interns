from sqlmodel import SQLModel, Field, UniqueConstraint
from typing import Optional
from datetime import datetime, timezone
import uuid as uuid_pkg


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Activity(SQLModel, table=True):
    __tablename__ = "activities"
    
    id: uuid_pkg.UUID = Field(default_factory=uuid_pkg.uuid4, primary_key=True)
    created_at: Optional[datetime] = Field(default_factory=_utcnow)
    title: str
    description: str
    isImageRequired: bool = False
    isTextRequired: bool = False

class ActivityCreate(SQLModel):
    title: str
    description: str
    isTextRequired: bool = False


class ActivityResponse(SQLModel):
    id: uuid_pkg.UUID
    created_at: datetime
    title: str
    description: str
    isImageRequired: bool
    isTextRequired: bool


class Submission(SQLModel, table=True):
    __tablename__ = "submissions"
    __table_args__ = (
        UniqueConstraint("user_id", "activity_id", name="uq_submission_user_activity"),
    )
    
    id: uuid_pkg.UUID = Field(default_factory=uuid_pkg.uuid4, primary_key=True)
    created_at: Optional[datetime] = Field(default_factory=_utcnow)
    user_id: uuid_pkg.UUID = Field(foreign_key="profiles.id")
    activity_id: uuid_pkg.UUID = Field(foreign_key="activities.id", index=True)
    textResponse: Optional[str] = None
    imageUrl: Optional[str] = None


class SubmissionCreate(SQLModel):
    user_id: uuid_pkg.UUID
    activity_id: uuid_pkg.UUID
    textResponse: Optional[str] = None
    imageUrl: Optional[str] = None


class SubmissionResponse(SQLModel):
    id: uuid_pkg.UUID
    created_at: datetime
    user_id: uuid_pkg.UUID
    activity_id: uuid_pkg.UUID
    textResponse: Optional[str] = None
    imageUrl: Optional[str] = None