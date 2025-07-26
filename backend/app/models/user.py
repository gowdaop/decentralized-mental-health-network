# backend/app/models/user.py
from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class UserCommitment(Base):
    __tablename__ = "user_commitments"
    
    id = Column(Integer, primary_key=True, index=True)
    commitment_hash = Column(String(64), unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reputation_score = Column(Integer, default=100)
    is_active = Column(Boolean, default=True)
    last_active = Column(DateTime(timezone=True), server_default=func.now())

class MoodEntry(Base):
    __tablename__ = "mood_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_commitment = Column(String(64), nullable=False, index=True)
    encrypted_data = Column(Text, nullable=False)
    mood_score = Column(Float, nullable=False)  # 1-10 scale
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    crisis_flag = Column(Boolean, default=False)

class PeerSession(Base):
    __tablename__ = "peer_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_hash = Column(String(64), unique=True, index=True, nullable=False)
    creator_commitment = Column(String(64), nullable=False)
    participant_count = Column(Integer, default=1)
    max_participants = Column(Integer, default=4)
    status = Column(String(20), default="active")  # active, full, ended
    topic = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)

