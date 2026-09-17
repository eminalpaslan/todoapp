from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.todo import Todo
from app.models.user import User
from app.schemas.todo import TodoCreate, TodoResponse, TodoUpdate

router = APIRouter(prefix="/todos", tags=["todos"])


async def _get_owned_todo(todo_id: int, current_user: User, db: AsyncSession) -> Todo:
    result = await db.execute(
        select(Todo).where(Todo.id == todo_id, Todo.owner_id == current_user.id)
    )
    todo = result.scalar_one_or_none()
    if todo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo bulunamadi")
    return todo


@router.post("", response_model=TodoResponse, status_code=status.HTTP_201_CREATED)
async def create_todo(
    todo_in: TodoCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    todo = Todo(
        title=todo_in.title,
        description=todo_in.description,
        owner_id=current_user.id,
    )
    db.add(todo)
    await db.commit()
    await db.refresh(todo)
    return todo


@router.get("", response_model=list[TodoResponse])
async def list_todos(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Todo).where(Todo.owner_id == current_user.id).order_by(Todo.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{todo_id}", response_model=TodoResponse)
async def get_todo(
    todo_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _get_owned_todo(todo_id, current_user, db)


@router.patch("/{todo_id}", response_model=TodoResponse)
async def update_todo(
    todo_id: int,
    todo_in: TodoUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    todo = await _get_owned_todo(todo_id, current_user, db)

    updates = todo_in.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(todo, field, value)

    await db.commit()
    await db.refresh(todo)
    return todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(
    todo_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    todo = await _get_owned_todo(todo_id, current_user, db)
    await db.delete(todo)
    await db.commit()
