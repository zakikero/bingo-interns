from sqlmodel import SQLModel, Field, UniqueConstraint
from datetime import datetime, timezone
import uuid as uuid_pkg


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserBoardActivity(SQLModel, table=True):
    __tablename__ = "user_board_activities"
    __table_args__ = (
        UniqueConstraint("user_id", "position", name="uq_user_board_position"),
        UniqueConstraint("user_id", "activity_id", name="uq_user_board_activity"),
    )

    id: uuid_pkg.UUID = Field(default_factory=uuid_pkg.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=_utcnow)
    user_id: uuid_pkg.UUID = Field(foreign_key="profiles.id", index=True)
    activity_id: uuid_pkg.UUID = Field(foreign_key="activities.id")
    position: int
