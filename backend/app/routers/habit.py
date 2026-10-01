from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.habit import Habit, HabitCheckIn
from app.models.user import User
from app.schemas.habit import (
    HabitCheckInCreate,
    HabitCheckInResponse,
    HabitCreate,
    HabitResponse,
)

router = APIRouter(prefix="/habits", tags=["habits"])


async def _get_owned_habit(habit_id: int, current_user: User, db: AsyncSession) -> Habit:
    result = await db.execute(
        select(Habit).where(Habit.id == habit_id, Habit.owner_id == current_user.id)
    )
    habit = result.scalar_one_or_none()
    if habit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alışkanlık bulunamadı")
    return habit


@router.post("", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
async def create_habit(
    habit_in: HabitCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    habit = Habit(name=habit_in.name, period=habit_in.period, owner_id=current_user.id)
    db.add(habit)
    await db.commit()
    await db.refresh(habit)
    return habit


@router.get("", response_model=list[HabitResponse])
async def list_habits(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Habit).where(Habit.owner_id == current_user.id).order_by(Habit.created_at.desc())
    )
    return result.scalars().all()


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_habit(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    habit = await _get_owned_habit(habit_id, current_user, db)
    await db.delete(habit)
    await db.commit()


@router.get("/{habit_id}/checkins", response_model=list[HabitCheckInResponse])
async def list_checkins(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_owned_habit(habit_id, current_user, db)
    result = await db.execute(
        select(HabitCheckIn)
        .where(HabitCheckIn.habit_id == habit_id)
        .order_by(HabitCheckIn.period_key.desc())
    )
    return result.scalars().all()


@router.post(
    "/{habit_id}/checkins",
    response_model=HabitCheckInResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_checkin(
    habit_id: int,
    checkin_in: HabitCheckInCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_owned_habit(habit_id, current_user, db)

    result = await db.execute(
        select(HabitCheckIn).where(
            HabitCheckIn.habit_id == habit_id,
            HabitCheckIn.period_key == checkin_in.period_key,
        )
    )
    existing = result.scalar_one_or_none()
    if existing is not None:
        # Ayni periyot icin tekrar isaretleme - idempotent, var olani don
        return existing

    checkin = HabitCheckIn(habit_id=habit_id, period_key=checkin_in.period_key)
    db.add(checkin)
    await db.commit()
    await db.refresh(checkin)
    return checkin


@router.delete("/{habit_id}/checkins/{period_key}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_checkin(
    habit_id: int,
    period_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_owned_habit(habit_id, current_user, db)

    result = await db.execute(
        select(HabitCheckIn).where(
            HabitCheckIn.habit_id == habit_id,
            HabitCheckIn.period_key == period_key,
        )
    )
    checkin = result.scalar_one_or_none()
    if checkin is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bu periyot için işaret bulunamadı"
        )
    await db.delete(checkin)
    await db.commit()
