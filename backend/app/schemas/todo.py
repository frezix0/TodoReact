from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from ..models.todo import PriorityEnum
from .category import CategoryResponse

class TodoBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Title of the todo item")
    description: Optional[str] = Field(None, description="Detailed description of the todo item")
    priority: PriorityEnum = Field(default=PriorityEnum.MEDIUM, description="Priority level of the todo item")
    due_date: Optional[datetime] = Field(None, description="Due date for the todo item")

class TodoCreate(TodoBase):
    category_id: Optional[int] = Field(None, description="ID of the category this todo belongs to")

class TodoUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    priority: Optional[PriorityEnum] = None
    due_date: Optional[datetime] = None
    category_id: Optional[int] = Field(None, gt=0)

class TodoStatusUpdate(BaseModel):
    completed: bool = Field(..., description="Completion status of the todo item")

class TodoResponse(TodoBase):
    id: int
    completed: bool
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None

    class Config:
        orm_mode = True

class TodoSummary(BaseModel):
    total: int 
    completed: int
    pending: int
    high_priority: int
    medium_priority: int
    low_priority: int
    overdue: int