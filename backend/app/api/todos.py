from fastapi import APIRouter, Depends, HTTPException, status
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

def format_todo_response(todo) -> dict:
    """Helper function to format todo response consistently"""
    if not todo:
        return None
    
    return {
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

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_todo(
    todo: TodoCreate,
    db: Session = Depends(get_db)
):
    """Create a new todo item"""
    try:
        # Verify category exists if provided
        if todo.category_id:
            db_category = category_crud.get_category(db, todo.category_id)
            if not db_category:
                raise HTTPException(status_code=400, detail="Category not found")
        
        # Create todo
        db_todo = todo_crud.create_todo(db, todo)
        
        # Get the created todo with category relationship
        updated_todo = todo_crud.get_todo(db, db_todo.id)
        
        # Return formatted response
        return format_todo_response(updated_todo)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating todo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create todo: {str(e)}")

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
            per_page = getattr(settings, 'default_limit', 10)
        if per_page > getattr(settings, 'max_limit', 100):
            per_page = getattr(settings, 'max_limit', 100)

        # Calculate offset for pagination
        offset = (page - 1) * per_page

        # Convert priority string to enum if provided
        priority_enum = None
        if priority:
            try:
                priority_enum = PriorityEnum(priority)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid priority: {priority}")
        
        # Fetch todos and total count
        todos, total = todo_crud.get_todos(
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

        # Calculate pagination info
        total_pages = (total + per_page - 1) // per_page if total > 0 else 1

        # Format todos response
        todos_data = []
        for todo in todos:
            formatted_todo = format_todo_response(todo)
            if formatted_todo:
                todos_data.append(formatted_todo)

        return {
            "data": todos_data,
            "pagination": {
                "current_page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1,
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching todos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch todos: {str(e)}")
    
@router.get("/summary", response_model=TodoSummary)
def get_todo_summary(db: Session = Depends(get_db)):
    """Get a summary of todo statistics"""
    try:
        summary = todo_crud.get_todo_summary(db)
        return TodoSummary(**summary)
    except Exception as e:
        print(f"Error fetching summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch summary: {str(e)}")

@router.get("/{todo_id}", response_model=dict)
def get_todo(todo_id: int, db: Session = Depends(get_db)):
    """Get a specific todo by ID"""
    try:
        db_todo = todo_crud.get_todo(db, todo_id)
        if not db_todo:
            raise HTTPException(status_code=404, detail="Todo not found")
        
        return format_todo_response(db_todo)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching todo {todo_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch todo: {str(e)}")

@router.put("/{todo_id}", response_model=dict)
def update_todo(
    todo_id: int,
    todo_update: TodoUpdate,
    db: Session = Depends(get_db)
):
    """Update a todo item"""
    try:
        # Verify category exists if provided
        if todo_update.category_id:
            db_category = category_crud.get_category(db, todo_update.category_id)
            if not db_category:
                raise HTTPException(status_code=400, detail="Category not found")
        
        # Update todo
        db_todo = todo_crud.update_todo(db, todo_id, todo_update)
        if not db_todo:
            raise HTTPException(status_code=404, detail="Todo not found")
        
        # Get updated todo with category relationship
        updated_todo = todo_crud.get_todo(db, db_todo.id)
        
        return format_todo_response(updated_todo)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating todo {todo_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update todo: {str(e)}")

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
        
        # Get updated todo with category relationship
        updated_todo = todo_crud.get_todo(db, db_todo.id)
        
        return format_todo_response(updated_todo)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating todo status {todo_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update todo status: {str(e)}")

@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    """Delete a todo item"""
    try:
        success = todo_crud.delete_todo(db, todo_id)
        if not success:
            raise HTTPException(status_code=404, detail="Todo not found")
        return None
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting todo {todo_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete todo: {str(e)}")