# backend/app/models/user.py
from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
# Import Base from connection.py instead of creating new one
from app.database.connection import Base


class User(Base):
    """Main user model (renamed from UserCommitment for consistency)"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    commitment = Column(String(64), unique=True, index=True, nullable=False)  # renamed from commitment_hash
    age_range = Column(String(20), nullable=True)  # Added for user registration
    topics = Column(Text, nullable=True)  # JSON string of topics
    severity_level = Column(String(20), nullable=True)  # Added for matching
    preferred_times = Column(Text, nullable=True)  # JSON string of times
    reputation_score = Column(Integer, default=100)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_active = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    mood_entries = relationship("MoodEntry", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("PeerSession", back_populates="creator", cascade="all, delete-orphan")


class MoodEntry(Base):
    __tablename__ = "mood_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Foreign key relationship
    user_commitment = Column(String(64), nullable=False, index=True)  # Keep for quick lookups
    encrypted_data = Column(Text, nullable=False)
    mood_score = Column(Float, nullable=False)  # 1-10 scale
    description = Column(Text, nullable=True)  # Added for crisis detection
    triggers = Column(Text, nullable=True)  # Added for analysis
    notes = Column(Text, nullable=True)  # Added for user notes
    risk_level = Column(String(20), nullable=True)  # MINIMAL, LOW, MEDIUM, HIGH
    needs_intervention = Column(Boolean, default=False)  # Crisis flag
    crisis_flag = Column(Boolean, default=False)  # Keep your original field
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="mood_entries")


class PeerSession(Base):
    __tablename__ = "peer_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_hash = Column(String(64), unique=True, index=True, nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Foreign key
    creator_commitment = Column(String(64), nullable=False)  # Keep for quick lookups
    participant_count = Column(Integer, default=1)
    max_participants = Column(Integer, default=4)
    status = Column(String(20), default="active")  # active, full, ended
    topic = Column(String(100), nullable=True)
    session_type = Column(String(50), default="group")  # one-on-one, group
    scheduled_time = Column(DateTime(timezone=True), nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    feedback_score = Column(Integer, nullable=True)  # 1-5 rating
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", back_populates="sessions")
    matches = relationship("SessionMatch", back_populates="session", cascade="all, delete-orphan")


class SessionMatch(Base):
    """Session matching for peer connections"""
    __tablename__ = "session_matches"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("peer_sessions.id"), nullable=False)
    matched_user_commitment = Column(String(64), nullable=False)
    compatibility_score = Column(Float, nullable=False)
    match_factors = Column(Text, nullable=True)  # JSON string of matching factors
    status = Column(String(20), default="pending")  # pending, accepted, declined
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    session = relationship("PeerSession", back_populates="matches")
