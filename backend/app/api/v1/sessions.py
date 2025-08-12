from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.auth import AuthService
from app.models.user import User, PeerSession
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import hashlib
import logging

router = APIRouter()
auth_service = AuthService()
logger = logging.getLogger(__name__)

# =================== PYDANTIC MODELS ===================

class SessionCreateRequest(BaseModel):
    topic: str
    max_participants: int = 4
    session_type: str = "group"  # group, individual, workshop
    preferences: Optional[Dict[str, Any]] = {}

# =================== DEPENDENCY INJECTION ===================

def get_current_user_commitment(token: str = Depends(auth_service.verify_token)) -> str:
    """Extract user commitment from token"""
    try:
        if isinstance(token, dict):
            return token.get("commitment")
        return token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )

def get_peer_service(db: Session = Depends(get_db)):
    """Lazy load PeerService to avoid circular import issues"""
    try:
        from app.ai.services.peer_service import PeerService
        return PeerService(db)
    except ImportError as e:
        logger.warning(f"PeerService not available: {e}")
        return None

def get_current_user(
    db: Session = Depends(get_db),
    user_commitment: str = Depends(get_current_user_commitment)
) -> User:
    """Get current user from database"""
    user = db.query(User).filter(User.commitment == user_commitment).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

# =================== SESSION ENDPOINTS ===================

@router.post("/create")
async def create_session(
    session_data: SessionCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    peer_service = Depends(get_peer_service)
):
    """Create a new peer support session"""
    try:
        # Generate unique session hash
        session_hash = hashlib.sha256(
            f"{current_user.commitment}_{session_data.topic}_{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()
        
        # Create new session
        new_session = PeerSession(
            session_hash=session_hash,
            creator_id=current_user.id,
            creator_commitment=current_user.commitment,
            topic=session_data.topic,
            session_type=session_data.session_type,
            max_participants=session_data.max_participants,
            participant_count=1,  # Creator is first participant
            status="active",
            created_at=datetime.utcnow()
        )
        
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        
        # Update user profile for better matching if PeerService is available
        if peer_service and session_data.preferences:
            try:
                peer_service.create_user_profile(
                    current_user.commitment, 
                    session_data.preferences, 
                    db
                )
            except Exception as e:
                logger.warning(f"Failed to update user profile: {e}")
        
        return {
            "session_id": new_session.id,
            "session_hash": new_session.session_hash,
            "topic": new_session.topic,
            "session_type": new_session.session_type,
            "max_participants": new_session.max_participants,
            "current_participants": new_session.participant_count,
            "status": new_session.status,
            "created_at": new_session.created_at.isoformat(),
            "matching_enabled": peer_service is not None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating session: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Session creation failed: {str(e)}"
        )

@router.get("/my-sessions")
async def get_my_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get sessions created by the current user"""
    try:
        sessions = db.query(PeerSession).filter(
            PeerSession.creator_commitment == current_user.commitment
        ).order_by(PeerSession.created_at.desc()).all()
        
        sessions_data = []
        for session in sessions:
            sessions_data.append({
                "id": session.id,
                "topic": session.topic,
                "session_type": session.session_type,
                "max_participants": session.max_participants,
                "current_participants": session.participant_count,
                "status": session.status,
                "created_at": session.created_at.isoformat(),
                "host_id": current_user.commitment,
                "is_host": True
            })
        
        return {
            "sessions": sessions_data,
            "total_sessions": len(sessions_data)
        }
        
    except Exception as e:
        logger.error(f"Error fetching user sessions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get your sessions: {str(e)}"
        )

@router.get("/available")
async def get_available_sessions(
    topic: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get available sessions (excluding user's own sessions)"""
    try:
        query = db.query(PeerSession).filter(
            PeerSession.status.in_(["active", "scheduled"]),
            PeerSession.creator_commitment != current_user.commitment,
            PeerSession.participant_count < PeerSession.max_participants
        )
        
        if topic:
            query = query.filter(PeerSession.topic.ilike(f"%{topic}%"))
        
        sessions = query.order_by(PeerSession.created_at.desc()).limit(limit).all()
        
        sessions_data = []
        for session in sessions:
            sessions_data.append({
                "id": session.id,
                "topic": session.topic,
                "session_type": session.session_type,
                "max_participants": session.max_participants,
                "current_participants": session.participant_count,
                "status": session.status,
                "created_at": session.created_at.isoformat(),
                "spots_available": session.max_participants - session.participant_count
            })
        
        return {
            "sessions": sessions_data,
            "total_found": len(sessions_data),
            "filter_applied": f"topic: {topic}" if topic else "none"
        }
        
    except Exception as e:
        logger.error(f"Error fetching available sessions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get available sessions: {str(e)}"
        )

@router.post("/{session_id}/join")
async def join_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Join an existing peer session"""
    try:
        session = db.query(PeerSession).filter(PeerSession.id == session_id).first()
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        # Validation checks
        if session.participant_count >= session.max_participants:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session is full"
            )
        
        if session.creator_commitment == current_user.commitment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot join your own session"
            )
        
        # Update session
        session.participant_count += 1
        if session.participant_count >= session.max_participants:
            session.status = "full"
        elif session.status == "scheduled":
            session.status = "active"
        
        db.commit()
        
        return {
            "message": "Successfully joined session",
            "session_id": session.id,
            "topic": session.topic,
            "participant_count": session.participant_count,
            "status": session.status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error joining session: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to join session: {str(e)}"
        )

@router.delete("/{session_id}/cancel")
async def cancel_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel a session (only by creator)"""
    try:
        session = db.query(PeerSession).filter(
            PeerSession.id == session_id,
            PeerSession.creator_commitment == current_user.commitment
        ).first()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found or not authorized"
            )
        
        session.status = "cancelled"
        db.commit()
        
        return {
            "message": "Session cancelled successfully",
            "session_id": session_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling session: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel session: {str(e)}"
        )

@router.get("/health")
async def sessions_health():
    """Health check for sessions service"""
    return {
        "service": "peer_sessions",
        "status": "operational",
        "features": [
            "session_creation",
            "session_discovery", 
            "session_management",
            "peer_matching_integration"
        ],
        "privacy": "anonymous_blockchain_secured"
    }
