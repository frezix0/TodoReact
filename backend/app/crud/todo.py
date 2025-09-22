from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, desc, asc
from typing import List, Optional, Dict, Any
from datetime import datetime
from ..models import Todo, Category, PriorityEnum
from ..schemas import TodoCreate, TodoUpdate, TodoStatusUpdate

def create_todo(db: Session, todo: TodoCreate) -> Todo:
    db_todo = Todo(**todo.model_dump())
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo

def get_todo(db: Session, todo_id: int) -> Optional[Todo]:
    return (
        db.query(Todo)
        .options(joinedload(Todo.category))
        .filter(Todo.id == todo_id)
        .first()
    )

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
) -> List[Todo]:
    try:
        query = db.query(Todo).options(joinedload(Todo.category))

        # This section should be updated to match the count_todos function
        if search:
            query = query.filter(
                or_(
                    Todo.title.ilike(f"%{search}%"),
                    Todo.description.ilike(f"%{search}%") # Add this line to match
                )
            )

        if category_id is not None:
            query = query.filter(Todo.category_id == category_id)
        
        if completed is not None:
            query = query.filter(Todo.completed == completed)
        
        if priority is not None:
            query = query.filter(Todo.priority == priority)
        
        # Validate sort_by field exists
        valid_sort_fields = ["created_at", "updated_at", "title", "priority", "due_date"]
        if sort_by not in valid_sort_fields:
            sort_by = "created_at"
            
        # Sorting
        sort_field = getattr(Todo, sort_by, Todo.created_at)
        if sort_order.lower() == "asc":
            query = query.order_by(asc(sort_field))
        else:
            query = query.order_by(desc(sort_field))
        
        result = query.offset(skip).limit(limit).all()
        print(f"Found {len(result)} todos")

        return result
    except Exception as e:
        print(f"Error in get_todos: {e}")
        return []

def count_todos(
        db: Session,
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        completed: Optional[bool] = None,
        priority: Optional[PriorityEnum] = None
    ) -> int:
    query = db.query(Todo)

    if search:
        query = query.filter(
            or_(
                Todo.title.ilike(f"%{search}%"),
                Todo.description.ilike(f"%{search}%")
            )
        )
    
    if category_id is not None:
        query = query.filter(Todo.category_id == category_id)
    
    if completed is not None:
        query = query.filter(Todo.completed == completed)
    
    if priority is not None:
        query = query.filter(Todo.priority == priority)
    
    return query.count()

def update_todo(
        db: Session, 
        todo_id: int, 
        todo_update: TodoUpdate
    ) -> Optional[Todo]:
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

def update_todo_status(
        db: Session, 
        todo_id: int, 
        status_update: TodoStatusUpdate
    ) -> Optional[Todo]:
    db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not db_todo:
        return None
    
    db_todo.completed = status_update.completed
    db_todo.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_todo)
    return db_todo

def delete_todo(db: Session, todo_id: int) -> bool:
    db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not db_todo:
        return False
    
    db.delete(db_todo)
    db.commit()
    return True

def get_todo_summary(db: Session) -> Dict[str, Any]:
    try:
        total = db.query(Todo).count()
        completed = db.query(Todo).filter(Todo.completed == True).count()
        pending = total - completed

        # Safely get priority counts
        try:
            high_priority = db.query(Todo).filter(Todo.priority == PriorityEnum.HIGH).count()
            medium_priority = db.query(Todo).filter(Todo.priority == PriorityEnum.MEDIUM).count()
            low_priority = db.query(Todo).filter(Todo.priority == PriorityEnum.LOW).count()
        except:
            high_priority = medium_priority = low_priority = 0
        
        # Safely get overdue count
        try:
            overdue = db.query(Todo).filter(
                Todo.due_date < datetime.utcnow(),
                Todo.completed == False
            ).count()
        except:
            overdue = 0
        
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
            "total": 0, "completed": 0, "pending": 0,
            "high_priority": 0, "medium_priority": 0, "low_priority": 0, "overdue": 0
        }