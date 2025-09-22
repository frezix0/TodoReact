from pydantic import BaseModel
from typing import Generic, TypeVar, List, Any
from math import ceil

T = TypeVar('T')

class PaginationMeta(BaseModel):
    current_page: int
    per_page: int
    total: int
    total_pages: int
    has_next: bool
    has_prev: bool

class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    meta: PaginationMeta

def create_pagination_meta(
        current_page: int,
        per_page: int,
        total: int
) -> PaginationMeta:
    total_pages = ceil(total / per_page) if total > 0 else 0
    
    return PaginationMeta(
        current_page=current_page,
        per_page=per_page,
        total=total,
        total_pages=total_pages,
        has_next=current_page < total_pages,
        has_prev=current_page > 1
    )

def calculate_offset(page: int, per_page: int) -> int:
    return (page - 1) * per_page