from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, desc, asc
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
from ..models import Todo, Category, PriorityEnum
from ..schemas import TodoCreate, TodoUpdate, TodoStatusUpdate

def create_todo(db: Session, todo: TodoCreate) -> Todo:
    try:
        db_todo = Todo(**todo.model_dump())
        db.add(db_todo)
        db.commit()
        db.refresh(db_todo)
        return db_todo
    except Exception as e:
        db.rollback()
        print(f"Error creating todo: {e}")
        raise e

def get_todo(db: Session, todo_id: int) -> Optional[Todo]:
    try:
        return (
            db.query(Todo)
            .options(joinedload(Todo.category))
            .filter(Todo.id == todo_id)
            .first()
        )
    except Exception as e:
        print(f"Error fetching todo {todo_id}: {e}")
        return None

def get_todos(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    completed: Optional[bool] = None,
    priority: Optional[PriorityEnum] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc"
) -> Tuple[List[Todo], int]:
    """Returns tuple of (todos, total_count)"""
    try:
        # Build base query
        query = db.query(Todo).options(joinedload(Todo.category))

        # Validate pagination parameters
        if skip < 0:
            skip = 0
        if limit < 1:
            limit = 20
        if limit > 100:
            limit = 100

        # Apply filters
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Todo.title.ilike(search_term),
                    Todo.description.ilike(search_term)
                )
            )

        if category_id is not None:
            query = query.filter(Todo.category_id == category_id)
        
        if completed is not None:
            query = query.filter(Todo.completed == completed)
        
        if priority is not None:
            query = query.filter(Todo.priority == priority)
        
        # Get total count before applying pagination
        total = query.count()

        # Apply sorting
        if hasattr(Todo, sort_by):
            sort_field = getattr(Todo, sort_by)
        else:
            sort_field = Todo.created_at
            
        if sort_order.lower() == "asc":
            query = query.order_by(asc(sort_field))
        else:
            query = query.order_by(desc(sort_field))
        
        # Apply pagination
        todos = query.offset(skip).limit(limit).all()
        
        return todos, total

    except Exception as e:
        print(f"Error in get_todos: {e}")
        return [], 0

def count_todos(
    db: Session,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    completed: Optional[bool] = None,
    priority: Optional[PriorityEnum] = None
) -> int:
    """Count todos with applied filters"""
    try:
        query = db.query(Todo)

        # Apply same filters as get_todos
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Todo.title.ilike(search_term),
                    Todo.description.ilike(search_term)
                )
            )
        
        if category_id is not None:
            query = query.filter(Todo.category_id == category_id)
        
        if completed is not None:
            query = query.filter(Todo.completed == completed)
        
        if priority is not None:
            query = query.filter(Todo.priority == priority)
        
        return query.count()
    except Exception as e:
        print(f"Error counting todos: {e}")
        return 0

def update_todo(
    db: Session, 
    todo_id: int, 
    todo_update: TodoUpdate
) -> Optional[Todo]:
    try:
        db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
        if not db_todo:
            return None
        
        update_data = todo_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_todo, field, value)
        
        db_todo.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_todo)
        return db_todo
    except Exception as e:
        db.rollback()
        print(f"Error updating todo {todo_id}: {e}")
        return None

def update_todo_status(
    db: Session, 
    todo_id: int, 
    status_update: TodoStatusUpdate
) -> Optional[Todo]:
    try:
        db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
        if not db_todo:
            return None
        
        db_todo.completed = status_update.completed
        db_todo.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_todo)
        return db_todo
    except Exception as e:
        db.rollback()
        print(f"Error updating todo status {todo_id}: {e}")
        return None

def delete_todo(db: Session, todo_id: int) -> bool:
    try:
        db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
        if not db_todo:
            return False
        
        db.delete(db_todo)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"Error deleting todo {todo_id}: {e}")
        return False

def get_todo_summary(db: Session) -> Dict[str, Any]:
    try:
        total = db.query(Todo).count()
        completed = db.query(Todo).filter(Todo.completed == True).count()
        pending = total - completed

        # Get priority counts with safe handling
        high_priority = db.query(Todo).filter(Todo.priority == PriorityEnum.HIGH).count()
        medium_priority = db.query(Todo).filter(Todo.priority == PriorityEnum.MEDIUM).count()
        low_priority = db.query(Todo).filter(Todo.priority == PriorityEnum.LOW).count()
        
        # Get overdue count with safe handling
        current_time = datetime.utcnow()
        overdue = db.query(Todo).filter(
            Todo.due_date < current_time,
            Todo.completed == False
        ).count()
        
        return {
            "total": total,
            "completed": completed,
            "pending": pending,
            "high_priority": high_priority,
            "medium_priority": medium_priority,
            "low_priority": low_priority,
            "overdue": overdue
        }
    except Exception as e:
        print(f"Error in get_todo_summary: {e}")
        return {
            "total": 0,
            "completed": 0,
            "pending": 0,
            "high_priority": 0,
            "medium_priority": 0,
            "low_priority": 0,
            "overdue": 0
        }