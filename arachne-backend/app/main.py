import uvicorn
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import engine, Base
from app.routers import api_router
from app.middlewares.logging_middleware import LoggingMiddleware
from app.middlewares.security import RateLimitMiddleware, SecurityHeadersMiddleware

# Initialize all database tables (fallback local migrations check)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Microservice for serving intelligence graphs, incidents, predictions, and security context",
    version="1.2.0"
)

# Parse allowed origins from environment
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

# Register security and rate limiting middlewares (OWASP best practices)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware, limit=120, window_secs=60)
app.add_middleware(LoggingMiddleware)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception/Error Handling
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "System processing failure. Operator log telemetry captured.", "error": str(exc)}
    )

# Include central modular routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "status": "ARACHNE_ONLINE",
        "api_docs": "/docs",
        "version": "1.2.0"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
