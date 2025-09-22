from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum
from ..database import Base

class PriorityEnum(str, PyEnum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class Todo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    completed = Column(Boolean, default=False, nullable=False, index=True)
    priority = Column(Enum(PriorityEnum), default=PriorityEnum.MEDIUM, nullable=False)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    # FIXED: Make category_id required but handle it properly in CRUD
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    category = relationship("Category", back_populates="todos")

    def __repr__(self):
        return f"<Todo(id={self.id}, title='{self.title}', completed={self.completed})>"