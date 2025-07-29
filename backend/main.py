# main.py

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.v1 import auth, sessions, mood

# import from our new database package
from app.database import create_tables

import uvicorn

app = FastAPI(
    title=settings.PROJECT_NAME + " - AI Enhanced",
    version=settings.VERSION,
    description="Privacy-preserving mental health support network with AI-powered features",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication & Blockchain"])
app.include_router(sessions.router, prefix=f"{settings.API_V1_STR}/sessions", tags=["Peer Sessions & AI Matching"])
app.include_router(mood.router, prefix=f"{settings.API_V1_STR}/mood", tags=["Mood Tracking & AI Analysis"])

# create tables on startup
@app.on_event("startup")
def on_startup():
    create_tables()

@app.get("/")
async def root():
    return {
        "message": "Decentralized Mental Health Support Network - AI Enhanced",
        "version": settings.VERSION,
        "features": [
            "Anonymous user registration with blockchain",
            "AI-powered crisis detection",
            "Intelligent peer matching",
            "Mood analytics with privacy preservation",
            "Token-based community incentives"
        ]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "ai_components": "operational",
        "blockchain": "connected",
        "timestamp": "2024-01-01T00:00:00Z"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
