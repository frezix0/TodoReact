# Create backend/app/crud/category.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from ..models import Category, Todo
from ..schemas import CategoryCreate, CategoryUpdate

def get_categories(db: Session) -> List[Category]:
    """Get all categories"""
    try:
        return db.query(Category).order_by(Category.name).all()
    except Exception as e:
        print(f"Error fetching categories: {e}")
        return []

def get_categories_with_counts(db: Session) -> List[dict]:
    """Get all categories with todo counts"""
    try:
        results = (
            db.query(
                Category,
                func.count(Todo.id).label("todo_count")
            )
            .outerjoin(Todo)
            .group_by(Category.id)
            .order_by(Category.name)
            .all()
        )
        
        categories_with_counts = []
        for category, todo_count in results:
            category_dict = {
                "id": category.id,
                "name": category.name,
                "color": category.color,
                "created_at": category.created_at,
                "todo_count": todo_count or 0
            }
            categories_with_counts.append(category_dict)
            
        return categories_with_counts
    except Exception as e:
        print(f"Error fetching categories with counts: {e}")
        return []

def get_category(db: Session, category_id: int) -> Optional[Category]:
    """Get a category by ID"""
    try:
        return db.query(Category).filter(Category.id == category_id).first()
    except Exception as e:
        print(f"Error fetching category {category_id}: {e}")
        return None

def create_category(db: Session, category: CategoryCreate) -> Category:
    """Create a new category"""
    try:
        db_category = Category(**category.model_dump())
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        return db_category
    except Exception as e:
        db.rollback()
        print(f"Error creating category: {e}")
        raise e

def update_category(
    db: Session, 
    category_id: int, 
    category_update: CategoryUpdate
) -> Optional[Category]:
    """Update a category"""
    try:
        db_category = db.query(Category).filter(Category.id == category_id).first()
        if not db_category:
            return None
        
        update_data = category_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_category, field, value)
        
        db.commit()
        db.refresh(db_category)
        return db_category
    except Exception as e:
        db.rollback()
        print(f"Error updating category {category_id}: {e}")
        return None

def delete_category(db: Session, category_id: int) -> bool:
    """Delete a category (only if it has no todos)"""
    try:
        db_category = db.query(Category).filter(Category.id == category_id).first()
        if not db_category:
            return False
        
        # Check if category has todos
        todo_count = db.query(Todo).filter(Todo.category_id == category_id).count()
        if todo_count > 0:
            raise Exception(f"Cannot delete category with {todo_count} todos")
        
        db.delete(db_category)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"Error deleting category {category_id}: {e}")
        return False