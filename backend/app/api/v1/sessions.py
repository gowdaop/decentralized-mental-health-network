from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.auth import AuthService
from app.ai.services.peer_matcher import PeerMatcher
from app.models.user import PeerSession, UserCommitment
from app.crypto.identity import AnonymousIdentity
from pydantic import BaseModel
from typing import List

router = APIRouter()
auth_service = AuthService()
identity_manager = AnonymousIdentity()
peer_matcher = PeerMatcher()

class SessionCreate(BaseModel):
    topic: str
    max_participants: int = 4
    preferences: dict = {}

@router.post("/create")
async def create_session(
    session_data: SessionCreate,
    current_user: str = Depends(auth_service.verify_token),
    db: Session = Depends(get_db)
):
    """Create new peer support session with AI matching"""
    try:
        # Generate session hash
        session_hash = identity_manager.generate_session_hash([current_user])
        
        # Create session
        new_session = PeerSession(
            session_hash=session_hash,
            creator_commitment=current_user,
            topic=session_data.topic,
            max_participants=session_data.max_participants
        )
        
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        
        # Create or update user profile for matching
        user_data = db.query(UserCommitment).filter(
            UserCommitment.commitment_hash == current_user
        ).first()
        
        if user_data:
            peer_matcher.create_user_profile(current_user, session_data.preferences, db)
        
        return {
            "session_id": new_session.id,
            "session_hash": session_hash,
            "topic": session_data.topic,
            "status": "active",
            "matching_enabled": True
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Session creation failed: {str(e)}"
        )

@router.get("/matches")
async def get_peer_matches(
    limit: int = 5,
    current_user: str = Depends(auth_service.verify_token),
    db: Session = Depends(get_db)
):
    """Get AI-recommended peer matches"""
    try:
        # Find compatible peers
        matches = peer_matcher.find_compatible_peers(current_user, db, limit)
        
        return {
            "matches": matches,
            "total_found": len(matches),
            "matching_algorithm": "Multi-factor compatibility analysis",
            "privacy_note": "Matches based on anonymous preference vectors"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to find peer matches: {str(e)}"
        )

@router.post("/update-profile")
async def update_matching_profile(
    preferences: dict,
    current_user: str = Depends(auth_service.verify_token),
    db: Session = Depends(get_db)
):
    """Update user profile for better peer matching"""
    try:
        profile = peer_matcher.create_user_profile(current_user, preferences, db)
        
        return {
            "message": "Profile updated successfully",
            "profile_created": bool(profile),
            "matching_enabled": True
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )
