from fastapi import Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..config import settings
from ..models import PriorityEnum

class PaginationParams:
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number"),
        per_page: int = Query(
            default=settings.default_limit,
            ge=1, 
            le=settings.max_limit, 
            description=f"Number of items per page (max {settings.max_limit})"
        )
    ):
        self.page = page
        self.per_page = per_page
    
class TodoFilterParams:
    def __init__(
        self,
        search: Optional[str] = Query(None, description="Search term for title or description"),
        category_id: Optional[int] = Query(None, ge=1, description="Filter by category ID"),
        completed: Optional[bool] = Query(None, description="Filter by completion status"),
        priority: Optional[PriorityEnum] = Query(None, description="Filter by priority level"),
        sort_by: str = Query(
            "created_at",
            regex="^(created_at|updated_at|title|priority|due_date)$",
            description="Field to sort by"
        ),
        sort_order: str = Query(
            "desc", 
            regex="^(asc|desc)$", 
            description="Sort order: asc or desc"
        )
    ):
        self.search = search
        self.category_id = category_id
        self.completed = completed
        self.priority = priority
        self.sort_by = sort_by
        self.sort_order = sort_order

def get_pagination_params() -> PaginationParams:
    return Depends(PaginationParams)

def get_todo_filter_params() -> TodoFilterParams:
    return Depends(TodoFilterParams)

def validate_category_exists(category_id: int, db: Session = Depends(get_db)):
    from ..crud import category as category_crud

    db_category = category_crud.get_category(db, category_id)
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with ID {category_id} not found."
        )
    return db_category
