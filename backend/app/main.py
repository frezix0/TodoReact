from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
from .config import settings
from .database import engine, Base
from .api import api_router

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create all database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app instance
app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description=settings.description,
)

# SIMPLIFIED CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SIMPLIFIED: Single global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "detail": str(exc) if settings.app_name == "Todo App API" else "An error occurred"
        }
    )

# Root endpoints
@app.get("/health")
async def health_check():
    return {"status": "ok", "version": settings.version}

@app.get("/")
async def root():
    return {
        "message": "Todo App API!",
        "version": settings.version,
        "docs": "/api/docs"
    }

# Include API router
app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="debug"  # Enable debug logging
    )