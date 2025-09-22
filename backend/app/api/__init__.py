from fastapi import APIRouter
from .todos import router as todos_router
from .categories import router as categories_router

# Create the main API router
api_router = APIRouter()

# Include individual routers
api_router.include_router(todos_router, prefix="/todos", tags=["todos"])
api_router.include_router(categories_router, prefix="/categories", tags=["categories"])

__all__ = ["api_router"]