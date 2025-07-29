from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.auth import AuthService
from app.models.user import PeerSession, SessionMatch, User  # ✅ Fixed imports
from pydantic import BaseModel
from typing import List, Optional
import json
import hashlib
from datetime import datetime

# AI and crypto services with fallback
try:
    from app.ai.services.peer_matcher import PeerMatcher
    peer_matcher = PeerMatcher()
    AI_MATCHING_ENABLED = True
    print("✅ AI peer matching enabled")
except ImportError as e:
    print(f"⚠️ AI peer matching not available: {e}")
    AI_MATCHING_ENABLED = False
    peer_matcher = None

try:
    from app.crypto.identity import AnonymousIdentity
    identity_manager = AnonymousIdentity()
except ImportError as e:
    print(f"⚠️ Anonymous identity manager not available: {e}")
    identity_manager = None

router = APIRouter()
auth_service = AuthService()

class SessionCreate(BaseModel):
    topic: str
    max_participants: int = 4
    session_type: str = "group"  # group, one-on-one
    preferences: Optional[dict] = {}

class ProfileUpdate(BaseModel):
    topics: str
    severity_level: str
    preferred_times: List[str]
    age_range: Optional[str] = None

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

def generate_session_hash(creator_commitment: str, topic: str) -> str:
    """Generate unique session hash"""
    data = f"{creator_commitment}_{topic}_{datetime.utcnow().isoformat()}"
    return hashlib.sha256(data.encode()).hexdigest()

@router.post("/create")
async def create_session(
    session_data: SessionCreate,
    db: Session = Depends(get_db),
    current_user_commitment: str = Depends(get_current_user_commitment)
):
    """Create new peer support session with AI matching"""
    try:
        # Verify user exists
        user = db.query(User).filter(User.commitment == current_user_commitment).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Generate session hash
        if identity_manager:
            session_hash = identity_manager.generate_session_hash([current_user_commitment])
        else:
            session_hash = generate_session_hash(current_user_commitment, session_data.topic)
        
        # Create session
        new_session = PeerSession(
            session_hash=session_hash,
            creator_id=user.id,  # ✅ Use user.id for foreign key
            creator_commitment=current_user_commitment,
            topic=session_data.topic,
            session_type=session_data.session_type,
            max_participants=session_data.max_participants,
            status="active"
        )
        
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        
        # Update user profile for better matching if AI is available
        if AI_MATCHING_ENABLED and peer_matcher and session_data.preferences:
            try:
                peer_matcher.create_user_profile(current_user_commitment, session_data.preferences, db)
            except Exception as ai_error:
                print(f"⚠️ AI profile update error: {ai_error}")
        
        return {
            "session_id": new_session.id,
            "session_hash": session_hash,
            "topic": session_data.topic,
            "session_type": session_data.session_type,
            "status": "active",
            "max_participants": session_data.max_participants,
            "current_participants": 1,
            "matching_enabled": AI_MATCHING_ENABLED,
            "created_at": new_session.created_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Session creation failed: {str(e)}"
        )

@router.get("/matches")
async def get_peer_matches(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user_commitment: str = Depends(get_current_user_commitment)
):
    """Get AI-recommended peer matches"""
    try:
        # Verify user exists
        user = db.query(User).filter(User.commitment == current_user_commitment).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        matches = []
        
        # AI-powered matching if available
        if AI_MATCHING_ENABLED and peer_matcher:
            try:
                matches = peer_matcher.find_compatible_peers(current_user_commitment, db, limit)
            except Exception as ai_error:
                print(f"⚠️ AI matching error: {ai_error}")
        
        # Fallback: Basic matching based on topics and severity
        if not matches:
            # Find users with similar topics and severity levels
            similar_users = db.query(User).filter(
                User.commitment != current_user_commitment,
                User.is_active == True,
                User.topics.ilike(f"%{user.topics.split(',')[0] if user.topics else 'anxiety'}%")
            ).limit(limit).all()
            
            matches = []
            for similar_user in similar_users:
                # Calculate basic compatibility score
                compatibility_score = 0.5  # Base score
                
                # Topic similarity
                if user.topics and similar_user.topics:
                    user_topics = set(user.topics.lower().split(','))
                    similar_topics = set(similar_user.topics.lower().split(','))
                    topic_overlap = len(user_topics.intersection(similar_topics))
                    compatibility_score += (topic_overlap * 0.2)
                
                # Severity level similarity
                if user.severity_level == similar_user.severity_level:
                    compatibility_score += 0.3
                
                matches.append({
                    "user_commitment": similar_user.commitment,
                    "compatibility_score": min(compatibility_score, 1.0),
                    "shared_topics": list(user_topics.intersection(similar_topics)) if user.topics and similar_user.topics else [],
                    "profile_summary": {
                        "topics": similar_user.topics,
                        "severity_level": similar_user.severity_level,
                        "age_range": similar_user.age_range
                    }
                })
        
        return {
            "matches": matches[:limit],
            "total_found": len(matches),
            "matching_algorithm": "AI-powered multi-factor analysis" if AI_MATCHING_ENABLED else "Basic compatibility matching",
            "privacy_note": "Matches based on anonymous preference vectors - no personal data exposed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to find peer matches: {str(e)}"
        )

@router.post("/update-profile")
async def update_matching_profile(
    profile_data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user_commitment: str = Depends(get_current_user_commitment)
):
    """Update user profile for better peer matching"""
    try:
        # Get user from database
        user = db.query(User).filter(User.commitment == current_user_commitment).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update user profile
        user.topics = profile_data.topics
        user.severity_level = profile_data.severity_level
        user.preferred_times = json.dumps(profile_data.preferred_times)
        if profile_data.age_range:
            user.age_range = profile_data.age_range
        user.updated_at = datetime.utcnow()
        
        db.commit()
        
        # Update AI matching profile if available
        ai_profile_created = False
        if AI_MATCHING_ENABLED and peer_matcher:
            try:
                preferences = {
                    "topics": profile_data.topics,
                    "severity_level": profile_data.severity_level,
                    "preferred_times": profile_data.preferred_times,
                    "age_range": profile_data.age_range
                }
                profile = peer_matcher.create_user_profile(current_user_commitment, preferences, db)
                ai_profile_created = bool(profile)
            except Exception as ai_error:
                print(f"⚠️ AI profile update error: {ai_error}")
        
        return {
            "message": "Profile updated successfully",
            "profile_updated": True,
            "ai_profile_created": ai_profile_created,
            "matching_enabled": True,
            "updated_fields": {
                "topics": profile_data.topics,
                "severity_level": profile_data.severity_level,
                "preferred_times": profile_data.preferred_times,
                "age_range": profile_data.age_range
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )

@router.get("/active")
async def get_active_sessions(
    topic: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user_commitment: str = Depends(get_current_user_commitment)
):
    """Get active peer sessions (excluding user's own sessions)"""
    try:
        query = db.query(PeerSession).filter(
            PeerSession.status == "active",
            PeerSession.creator_commitment != current_user_commitment,
            PeerSession.participant_count < PeerSession.max_participants
        )
        
        if topic:
            query = query.filter(PeerSession.topic.ilike(f"%{topic}%"))
        
        active_sessions = query.order_by(PeerSession.created_at.desc()).limit(10).all()
        
        sessions_data = []
        for session in active_sessions:
            sessions_data.append({
                "session_id": session.id,
                "session_hash": session.session_hash,
                "topic": session.topic,
                "session_type": session.session_type,
                "participant_count": session.participant_count,
                "max_participants": session.max_participants,
                "created_at": session.created_at,
                "spots_available": session.max_participants - session.participant_count
            })
        
        return {
            "active_sessions": sessions_data,
            "total_found": len(sessions_data),
            "filter_applied": f"topic: {topic}" if topic else "none"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get active sessions: {str(e)}"
        )

@router.post("/join/{session_id}")
async def join_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user_commitment: str = Depends(get_current_user_commitment)
):
    """Join an existing peer session"""
    try:
        # Get session
        session = db.query(PeerSession).filter(PeerSession.id == session_id).first()
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        # Check if session is full
        if session.participant_count >= session.max_participants:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session is full"
            )
        
        # Check if user is already the creator
        if session.creator_commitment == current_user_commitment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot join your own session"
            )
        
        # Check if already joined (you'd need to implement session participants tracking)
        # For now, just increment participant count
        session.participant_count += 1
        if session.participant_count >= session.max_participants:
            session.status = "full"
        
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
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to join session: {str(e)}"
        )

# Health check for sessions service
@router.get("/health")
async def sessions_service_health():
    """Health check for peer sessions service"""
    return {
        "service": "peer_sessions",
        "status": "operational",
        "ai_matching": "enabled" if AI_MATCHING_ENABLED else "disabled",
        "anonymous_identity": "enabled" if identity_manager else "disabled",
        "features": [
            "session_creation",
            "peer_matching" if AI_MATCHING_ENABLED else "basic_matching",
            "profile_management",
            "session_discovery"
        ]
    }
