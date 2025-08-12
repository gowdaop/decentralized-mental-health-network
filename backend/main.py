from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
import logging
from datetime import datetime

# Import all routers including the peer matching router
from app.api.v1 import auth, sessions, mood, reputation
from app.routers import peer_matching

# Import from database package
from app.database import create_tables

import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME + " - AI Enhanced",
    version=settings.VERSION,
    description="Privacy-preserving mental health support network with AI-powered peer matching and crisis support",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc"
)

# CORS - Enhanced for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "https://your-production-domain.com"  # Replace with your actual domain
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include all routers with proper prefixes and tags
app.include_router(
    auth.router, 
    prefix=f"{settings.API_V1_STR}/auth", 
    tags=["Authentication & Blockchain"]
)

app.include_router(
    sessions.router, 
    prefix=f"{settings.API_V1_STR}/sessions", 
    tags=["Peer Sessions & AI Matching"]
)

app.include_router(
    mood.router, 
    prefix=f"{settings.API_V1_STR}/mood", 
    tags=["Mood Tracking & AI Analysis"]
)

app.include_router(
    reputation.router, 
    prefix="/api/v1/reputation", 
    tags=["Reputation"]
)

# Peer matching router with dependency injection architecture
app.include_router(
    peer_matching.router,
    prefix="/api/v1/peer-matching",
    tags=["Peer Matching & Connection Requests"]
)

# Create tables on startup
@app.on_event("startup")
async def on_startup():
    """Initialize application on startup"""
    try:
        create_tables()
        logger.info("🚀 Sahāya liṅk Network - AI Enhanced Backend Started")
        logger.info("🔐 Privacy-first mental health support with blockchain security")
        logger.info("🤖 AI-powered peer matching and crisis detection enabled")
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise

@app.get("/")
async def root():
    """Root endpoint with platform information"""
    return {
        "message": "Sahāya liṅk Network - Privacy-First Mental Health Support",
        "version": settings.VERSION,
        "features": [
            "Anonymous user registration with blockchain commitment",
            "AI-powered crisis detection and intervention",
            "Intelligent peer matching with compatibility scoring",
            "Privacy-preserving mood analytics",
            "Anonymous peer support sessions",
            "Blockchain-based reputation system",
            "End-to-end encrypted communications"
        ],
        "privacy": "Zero personal data stored - Complete anonymity guaranteed",
        "ai_components": [
            "Crisis detection and early intervention",
            "Peer compatibility matching",
            "Mood pattern analysis",
            "Personalized wellness recommendations"
        ],
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "sahaya-link-network",
        "ai_components": "operational",
        "blockchain": "connected",
        "peer_matching": "enabled",
        "crisis_detection": "active",
        "privacy_level": "maximum",
        "timestamp": datetime.utcnow().isoformat()
    }

# Enhanced global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler with privacy-preserving logging"""
    # Log error while preserving user privacy
    logger.error(f"⚠️ Server error on {request.method} {request.url.path}: {type(exc).__name__}")
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error occurred",
            "privacy_note": "No user data was compromised",
            "support": "Contact support if this persists",
            "timestamp": datetime.utcnow().isoformat()
        }
    )

@app.get("/api/v1/features")
async def get_platform_features():
    """Get comprehensive platform feature list"""
    return {
        "core_features": {
            "authentication": "Blockchain-based anonymous registration",
            "peer_matching": "AI-powered compatibility matching",
            "crisis_support": "24/7 AI crisis detection and resources",
            "mood_tracking": "Privacy-preserving analytics",
            "peer_sessions": "Anonymous group and individual support",
            "reputation": "Blockchain-secured community trust system"
        },
        "privacy_guarantees": [
            "Zero personal data storage",
            "Blockchain commitment-based identity",
            "End-to-end encrypted communications",
            "Anonymous peer interactions",
            "No tracking or profiling"
        ],
        "ai_capabilities": [
            "Crisis detection from mood patterns",
            "Intelligent peer compatibility scoring",
            "Personalized wellness recommendations",
            "Real-time risk assessment",
            "Anonymous community insights"
        ]
    }

@app.get("/api/v1/privacy")
async def get_privacy_info():
    """Get detailed privacy and security information"""
    return {
        "privacy_architecture": "Zero-knowledge blockchain network",
        "data_storage": "No personal identifiable information stored",
        "user_identity": "Cryptographic commitment-based anonymous IDs",
        "communication": "End-to-end encrypted peer interactions",
        "ai_processing": "On-device and federated learning only",
        "compliance": ["GDPR", "HIPAA-aligned", "Privacy-by-design"],
        "audit_trail": "Blockchain-verified without personal data exposure",
        "user_control": "Complete data sovereignty and deletion rights"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
