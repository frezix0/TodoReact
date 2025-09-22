from fastapi import APIRouter, Depends, HTTPException, logger, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..schemas import (
    TodoCreate, 
    TodoUpdate,
    TodoResponse,
    TodoStatusUpdate,
    TodoSummary
)
from ..crud import todo as todo_crud, category as category_crud
from ..models import PriorityEnum
from ..config import settings

router = APIRouter()

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_todo(
    todo: TodoCreate,
    db: Session = Depends(get_db)
):
    """Create a new todo item"""
    try:
        # Verify category exists
        if todo.category_id:
            db_category = category_crud.get_category(db, todo.category_id)
            if not db_category:
                raise HTTPException(status_code=400, detail="Category not found")
        
        db_todo = todo_crud.create_todo(db, todo)
        updated_todo = todo_crud.get_todo(db, db_todo.id)
        
        # Return in expected format
        return {
            "id": updated_todo.id,
            "title": updated_todo.title,
            "description": updated_todo.description,
            "completed": updated_todo.completed,
            "priority": updated_todo.priority,
            "due_date": updated_todo.due_date.isoformat() if updated_todo.due_date else None,
            "created_at": updated_todo.created_at.isoformat(),
            "updated_at": updated_todo.updated_at.isoformat(),
            "category": {
                "id": updated_todo.category.id,
                "name": updated_todo.category.name,
                "color": updated_todo.category.color,
                "created_at": updated_todo.category.created_at.isoformat()
            } if updated_todo.category else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=dict)
def list_todos(
    page: int = 1,
    per_page: int = 10,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    completed: Optional[bool] = None,
    priority: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db)
):
    
    """Get a paginated list of todos with optional filtering and sorting"""
    try:
        # Validate pagination parameters
        if page < 1:
            page = 1
        if per_page < 1:
            per_page = settings.default_limit
        if per_page > settings.max_limit:
            per_page = settings.max_limit

        # Calculate offset for pagination
        offset = (page - 1) * per_page

        priority_enum = PriorityEnum(priority) if priority else None
        
        # Fetch todos with applied filters and pagination
        todos = todo_crud.get_todos(
            db=db,
            skip=offset,
            limit=per_page,
            search=search,
            category_id=category_id,
            completed=completed,
            priority=priority_enum,
            sort_by=sort_by,
            sort_order=sort_order
        )

        # Get total count for pagination
        total = todo_crud.count_todos(
            db=db,
            search=search,
            category_id=category_id,
            completed=completed,
            priority=priority_enum
        )

        # Calculate pagination info
        total_pages = (total + per_page - 1) // per_page if total > 0 else 1

        # Convert todos to response format
        todos_data = []
        for todo in todos:
            todo_dict = {
                "id": todo.id,
                "title": todo.title,
                "description": todo.description,
                "completed": todo.completed,
                "priority": todo.priority,
                "due_date": todo.due_date.isoformat() if todo.due_date else None,
                "created_at": todo.created_at.isoformat(),
                "updated_at": todo.updated_at.isoformat(),
                "category": {
                    "id": todo.category.id,
                    "name": todo.category.name,
                    "color": todo.category.color,
                    "created_at": todo.category.created_at.isoformat()
                } if todo.category else None
            }
            todos_data.append(todo_dict)

        return {
            "data": todos_data if todos_data else [],
            "pagination": {
                "current_page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1,
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching todos: {str(e)}")

@router.get("/", response_model=dict)
def get_todos(
    page: int = 1,
    per_page: int = 10,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    completed: Optional[bool] = None,
    priority: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db)
):
    try:
        # Validate pagination parameters
        if page < 1:
            page = 1
        if per_page < 1:
            per_page = settings.default_limit
        if per_page > settings.max_limit:
            per_page = settings.max_limit

        # Calculate offset for pagination
        offset = (page - 1) * per_page

        priority_enum = PriorityEnum(priority) if priority else None
        
        # Get todos and total count
        todos, total = todo_crud.get_todos(  # Modified to unpack both values
            db=db,
            skip=offset,
            limit=per_page,
            search=search,
            category_id=category_id,
            completed=completed,
            priority=priority_enum,
            sort_by=sort_by,
            sort_order=sort_order
        )

        # Calculate pagination info using the actual total
        total_pages = (total + per_page - 1) // per_page if total > 0 else 1

        # Convert todos to response format
        todos_data = []
        for todo in todos:
            todo_dict = {
                "id": todo.id,
                "title": todo.title,
                "description": todo.description,
                "completed": todo.completed,
                "priority": todo.priority,
                "due_date": todo.due_date.isoformat() if todo.due_date else None,
                "created_at": todo.created_at.isoformat(),
                "updated_at": todo.updated_at.isoformat(),
                "category": {
                    "id": todo.category.id,
                    "name": todo.category.name,
                    "color": todo.category.color,
                    "created_at": todo.category.created_at.isoformat()
                } if todo.category else None
            }
            todos_data.append(todo_dict)

        return {
            "data": todos_data,
            "pagination": {
                "current_page": page,
                "per_page": per_page,
                "total": total,  # Use the actual total count
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1,
            }
        }
    except Exception as e:
        print(f"Error in get_todos API: {str(e)}")  # Add logging
        raise HTTPException(status_code=500, detail=f"Error fetching todos: {str(e)}")
    
@router.get("/summary", response_model=TodoSummary)
def get_todo_summary(db: Session = Depends(get_db)):
    """Get a summary of todo statistics"""
    try:
        summary = todo_crud.get_todo_summary(db)
        return TodoSummary(**summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching summary: {str(e)}")

@router.get("/{todo_id}", response_model=dict)
def get_todo(todo_id: int, db: Session = Depends(get_db)):
    """Get a specific todo by ID"""
    try:
        db_todo = todo_crud.get_todo(db, todo_id)
        if not db_todo:
            raise HTTPException(status_code=404, detail="Todo not found")
        
        return {
            "id": db_todo.id,
            "title": db_todo.title,
            "description": db_todo.description,
            "completed": db_todo.completed,
            "priority": db_todo.priority,
            "due_date": db_todo.due_date.isoformat() if db_todo.due_date else None,
            "created_at": db_todo.created_at.isoformat(),
            "updated_at": db_todo.updated_at.isoformat(),
            "category": {
                "id": db_todo.category.id,
                "name": db_todo.category.name,
                "color": db_todo.category.color,
                "created_at": db_todo.category.created_at.isoformat()
            } if db_todo.category else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{todo_id}", response_model=dict)
def update_todo(
    todo_id: int,
    todo_update: TodoUpdate,
    db: Session = Depends(get_db)
):
    """Update a todo item"""
    try:
        if todo_update.category_id:
            db_category = category_crud.get_category(db, todo_update.category_id)
            if not db_category:
                raise HTTPException(status_code=400, detail="Category not found")
        
        db_todo = todo_crud.update_todo(db, todo_id, todo_update)
        if not db_todo:
            raise HTTPException(status_code=404, detail="Todo not found")
        
        # Get updated todo with category
        updated_todo = todo_crud.get_todo(db, db_todo.id)
        
        # Return in expected format
        return {
            "id": updated_todo.id,
            "title": updated_todo.title,
            "description": updated_todo.description,
            "completed": updated_todo.completed,
            "priority": updated_todo.priority,
            "due_date": updated_todo.due_date.isoformat() if updated_todo.due_date else None,
            "created_at": updated_todo.created_at.isoformat(),
            "updated_at": updated_todo.updated_at.isoformat(),
            "category": {
                "id": updated_todo.category.id,
                "name": updated_todo.category.name,
                "color": updated_todo.category.color,
                "created_at": updated_todo.category.created_at.isoformat()
            } if updated_todo.category else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{todo_id}/complete", response_model=dict)
def toggle_todo_completion(
    todo_id: int,
    status_update: TodoStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update the completion status of a todo"""
    try:
        db_todo = todo_crud.update_todo_status(db, todo_id, status_update)
        if not db_todo:
            raise HTTPException(status_code=404, detail="Todo not found")
        
        # Get updated todo with category
        updated_todo = todo_crud.get_todo(db, db_todo.id)
        
        # Return in expected format
        return {
            "id": updated_todo.id,
            "title": updated_todo.title,
            "description": updated_todo.description,
            "completed": updated_todo.completed,
            "priority": updated_todo.priority,
            "due_date": updated_todo.due_date.isoformat() if updated_todo.due_date else None,
            "created_at": updated_todo.created_at.isoformat(),
            "updated_at": updated_todo.updated_at.isoformat(),
            "category": {
                "id": updated_todo.category.id,
                "name": updated_todo.category.name,
                "color": updated_todo.category.color,
                "created_at": updated_todo.category.created_at.isoformat()
            } if updated_todo.category else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    """Delete a todo item"""
    try:
        success = todo_crud.delete_todo(db, todo_id)
        if not success:
            raise HTTPException(status_code=404, detail="Todo not found")
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
