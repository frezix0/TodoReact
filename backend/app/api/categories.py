# Create backend/app/api/categories.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas import (
    CategoryCreate, 
    CategoryUpdate,
    CategoryResponse,
    CategoryWithTodoCount
)
from ..crud import category as category_crud

router = APIRouter()

@router.get("/", response_model=List[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    """Get all categories"""
    try:
        categories = category_crud.get_categories(db)
        return categories
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/with-counts", response_model=List[CategoryWithTodoCount])
def list_categories_with_counts(db: Session = Depends(get_db)):
    """Get all categories with todo counts"""
    try:
        categories = category_crud.get_categories_with_counts(db)
        return categories
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)):
    """Get a specific category"""
    try:
        category = category_crud.get_category(db, category_id)
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        return category
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    """Create a new category"""
    try:
        return category_crud.create_category(db, category)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category: CategoryUpdate,
    db: Session = Depends(get_db)
):
    """Update a category"""
    try:
        db_category = category_crud.update_category(db, category_id, category)
        if not db_category:
            raise HTTPException(status_code=404, detail="Category not found")
        return db_category
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    """Delete a category"""
    try:
        success = category_crud.delete_category(db, category_id)
        if not success:
            raise HTTPException(status_code=404, detail="Category not found")
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))