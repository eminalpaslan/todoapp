from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

Period = Literal["daily", "weekly", "monthly", "yearly"]


class TodoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    period: Period = "daily"


class TodoUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    is_done: bool | None = None
    period: Period | None = None


class TodoResponse(BaseModel):
    id: int
    title: str
    description: str | None
    is_done: bool
    period: Period
    created_at: datetime

    model_config = {"from_attributes": True}
