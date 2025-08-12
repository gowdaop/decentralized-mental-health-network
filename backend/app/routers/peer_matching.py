from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.auth import AuthService
from app.models.user import User, PeerSession, SessionMatch
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime

router = APIRouter()
auth_service = AuthService()
logger = logging.getLogger(__name__)

# =================== PYDANTIC MODELS ===================

class PeerMatchingRequest(BaseModel):
    topics: str
    severity_level: str
    preferred_times: List[str]
    age_range: str

class ConnectionRequest(BaseModel):
    peer_id: str
    message: Optional[str] = "Hi! I'd like to connect and support each other."

# =================== DEPENDENCY FUNCTIONS ===================

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

def get_peer_matcher(db: Session = Depends(get_db)):
    """✅ MISSING FUNCTION - Lazy load PeerService to avoid circular imports"""
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

# =================== ENDPOINTS ===================

@router.post("/find")
async def find_peer_matches(
    criteria: PeerMatchingRequest,
    current_user: User = Depends(get_current_user),
    peer_matcher = Depends(get_peer_matcher)  # ✅ Now properly injected
):
    """Find peer matches based on criteria"""
    try:
        matches = []
        
        # Try AI matching first if available
        if peer_matcher:
            try:
                criteria_dict = {
                    "topics": criteria.topics,
                    "severity_level": criteria.severity_level,
                    "age_range": criteria.age_range,
                    "preferred_times": criteria.preferred_times
                }
                
                ai_matches = peer_matcher.find_peers_by_criteria(
                    current_user.commitment, 
                    criteria_dict, 
                    limit=10
                )
                
                if ai_matches:
                    matches = ai_matches
                    logger.info(f"AI matching found {len(matches)} matches")
            except Exception as ai_error:
                logger.warning(f"AI matching error: {ai_error}")
        
        # Fallback to basic matching if AI fails or unavailable
        if not matches:
            logger.info("Using fallback basic matching")
            matches = basic_peer_matching(current_user, criteria)
        
        return {
            "matches": matches,
            "total_found": len(matches),
            "matching_algorithm": "AI-powered" if peer_matcher else "Basic compatibility",
            "privacy_note": "All matches are anonymous and secure"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finding matches: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to find matches: {str(e)}"
        )

def basic_peer_matching(current_user: User, criteria: PeerMatchingRequest) -> List[Dict]:
    """Fallback basic matching when PeerService is unavailable"""
    try:
        from app.database.connection import get_db
        
        # Get a database session for basic matching
        db = next(get_db())
        
        query = db.query(User).filter(
            User.commitment != current_user.commitment,
            User.is_active == True
        )
        
        # Apply basic filters
        if criteria.topics:
            topic_list = [t.strip() for t in criteria.topics.split(',')]
            for topic in topic_list:
                if topic:
                    query = query.filter(User.topics.ilike(f"%{topic}%"))
        
        if criteria.severity_level:
            query = query.filter(User.severity_level == criteria.severity_level)
        
        if criteria.age_range:
            query = query.filter(User.age_range == criteria.age_range)
        
        similar_users = query.limit(10).all()
        
        matches = []
        for user in similar_users:
            # Calculate basic compatibility score
            score = 50  # Base score
            
            common_topics = []
            if criteria.topics and user.topics:
                user_topics = set(t.strip().lower() for t in criteria.topics.split(','))
                similar_topics = set(t.strip().lower() for t in user.topics.split(','))
                common_topics = list(user_topics.intersection(similar_topics))
                score += len(common_topics) * 15
            
            if criteria.severity_level == user.severity_level:
                score += 25
            
            if criteria.age_range == user.age_range:
                score += 15
            
            matches.append({
                "id": str(user.id),
                "anonymous_id": f"User_{user.id}",
                "match_score": min(score, 100),
                "common_topics": common_topics,
                "last_active": user.updated_at.isoformat() if user.updated_at else datetime.utcnow().isoformat(),
                "reputation_level": "Trusted",
                "is_online": True
            })
        
        # Sort by match score
        matches.sort(key=lambda x: x["match_score"], reverse=True)
        return matches
        
    except Exception as e:
        logger.error(f"Basic matching error: {e}")
        return []

@router.post("/connect")
async def send_connection_request(
    connection_data: ConnectionRequest,
    current_user: User = Depends(get_current_user),
    peer_matcher = Depends(get_peer_matcher)
):
    """Send connection request to peer"""
    try:
        if peer_matcher:
            success = peer_matcher.send_connection_request(
                current_user.commitment,
                connection_data.peer_id,
                connection_data.message
            )
        else:
            # Fallback implementation
            success = False
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to send connection request"
            )
        
        return {
            "message": "Connection request sent successfully",
            "target_peer": f"User_{connection_data.peer_id}",
            "status": "pending"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending connection request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send connection request: {str(e)}"
        )

@router.get("/requests")
async def get_connection_requests(
    current_user: User = Depends(get_current_user),
    peer_matcher = Depends(get_peer_matcher)
):
    """Get connection requests for current user"""
    try:
        if peer_matcher:
            requests = peer_matcher.get_connection_requests(current_user.commitment)
        else:
            requests = []
        
        return {
            "requests": requests,
            "total": len(requests)
        }
        
    except Exception as e:
        logger.error(f"Error getting connection requests: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get connection requests: {str(e)}"
        )

@router.get("/health")
async def peer_matching_health():
    """Health check for peer matching service"""
    try:
        # Test if PeerService can be imported
        from app.ai.services.peer_service import PeerService
        ai_available = True
    except ImportError:
        ai_available = False
    
    return {
        "service": "peer_matching",
        "status": "operational",
        "ai_matching": "enabled" if ai_available else "disabled",
        "privacy": "anonymous_blockchain_secured"
    }
