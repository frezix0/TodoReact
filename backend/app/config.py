from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = ConfigDict(
        env_file = ".env",
        case_sensitive =False,
        extra='allow'
    )

    # Database settings
    database_url: str = "postgresql://todo_user:Marsya19!@localhost:5432/todo_db"
    database_url_async: Optional[str] = None

    # API settings
    api_v1_str: str = "/api"
    app_name: str = "Todo App API"
    version: str = "1.0.0"
    description: str = "API for managing a todo list application."

    # CORS settings
    allow_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000", "*"]

    #Pagination settings
    default_limit: int = 10
    max_limit: int = 50

settings = Settings()