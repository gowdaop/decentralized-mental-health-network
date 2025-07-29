# backend/app/database/connection.py

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

DATABASE_URL = settings.DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
    if DATABASE_URL.startswith("sqlite")
    else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def create_tables() -> None:
    """Import all models and create tables"""
    # Import all models so Base.metadata knows about them
    from app.models.user import User, MoodEntry, PeerSession, SessionMatch
    
    Base.metadata.create_all(bind=engine)

def get_db():
    """Database dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
