from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime, timezone
import uuid as uuid_pkg


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Profile(SQLModel, table=True):
    __tablename__ = "profiles"
    
    id: uuid_pkg.UUID = Field(default_factory=uuid_pkg.uuid4, primary_key=True)
    created_at: Optional[datetime] = Field(default_factory=_utcnow)
    username: str = Field(unique=True, index=True)
    password_hash: str


class UserRegister(SQLModel):
    username: str
    password: str


class UserLogin(SQLModel):
    username: str
    password: str


class UserResponse(SQLModel):
    id: uuid_pkg.UUID
    username: str
    created_at: datetime

