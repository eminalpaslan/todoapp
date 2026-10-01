from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

HabitPeriod = Literal["daily", "weekly", "monthly"]


class HabitCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    period: HabitPeriod = "daily"


class HabitResponse(BaseModel):
    id: int
    name: str
    period: HabitPeriod
    created_at: datetime

    model_config = {"from_attributes": True}


class HabitCheckInCreate(BaseModel):
    period_key: str = Field(min_length=1, max_length=20)


class HabitCheckInResponse(BaseModel):
    id: int
    habit_id: int
    period_key: str
    created_at: datetime

    model_config = {"from_attributes": True}
