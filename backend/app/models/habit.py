from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Habit(Base):
    __tablename__ = "habits"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    # "daily" / "weekly" / "monthly" - bu alışkanlık ne sıklıkla işaretlenir
    period: Mapped[str] = mapped_column(String(10), default="daily")
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class HabitCheckIn(Base):
    __tablename__ = "habit_checkins"
    __table_args__ = (UniqueConstraint("habit_id", "period_key", name="uq_habit_period"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    habit_id: Mapped[int] = mapped_column(ForeignKey("habits.id"), index=True)
    # Hangi periyot icin isaretlendigi: gunluk "2026-10-01", haftalik "2026-W40",
    # aylik "2026-10" gibi - client hesaplar, sunucu sadece saklar/benzersizligi garanti eder
    period_key: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
