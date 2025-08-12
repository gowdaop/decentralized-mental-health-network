from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.auth import AuthService
from app.models.user import User
from typing import Dict
from datetime import datetime, timezone

router = APIRouter()
auth_service = AuthService()

# Import the reputation service we created earlier
try:
    from app.services.token_automation import TokenAutomationService
    reputation_service = TokenAutomationService()
    REPUTATION_ENABLED = True
except ImportError:
    print("⚠️ TokenAutomationService not available")
    REPUTATION_ENABLED = False
    reputation_service = None

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

@router.get("/score")
async def get_reputation_score(
    db: Session = Depends(get_db),
    current_user_commitment: str = Depends(get_current_user_commitment)
):
    """Get current user's reputation score and breakdown"""
    try:
        user = db.query(User).filter(User.commitment == current_user_commitment).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {
            "user_commitment": current_user_commitment,
            "current_reputation": user.reputation_score,
            "last_updated": user.updated_at.isoformat() if user.updated_at else None,
            "reputation_level": _get_reputation_level(user.reputation_score),
            "next_milestone": _get_next_milestone(user.reputation_score)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get reputation score: {str(e)}"
        )

@router.post("/update")
async def update_reputation_score(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user_commitment: str = Depends(get_current_user_commitment)
):
    """Manually trigger reputation score recalculation"""
    try:
        if not REPUTATION_ENABLED or not reputation_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Reputation service not available"
            )
        
        # Calculate new reputation
        reputation_result = reputation_service.update_user_reputation(current_user_commitment, db)
        
        if reputation_result.get('error'):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=reputation_result['error']
            )
        
        return {
            "message": "Reputation updated successfully",
            "reputation_data": reputation_result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update reputation: {str(e)}"
        )

@router.get("/breakdown")
async def get_reputation_breakdown(
    db: Session = Depends(get_db),
    current_user_commitment: str = Depends(get_current_user_commitment)
):
    """Get detailed breakdown of reputation factors"""
    try:
        user = db.query(User).filter(User.commitment == current_user_commitment).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Basic breakdown since we don't have the advanced service yet
        breakdown = {
            "current_reputation": user.reputation_score,
            "reputation_level": _get_reputation_level(user.reputation_score),
            "factors": {
                "mood_consistency": 75.0,  # Placeholder values
                "data_quality": 60.0,
                "peer_support": 40.0,
                "crisis_recovery": 80.0,
                "community_engagement": 50.0,
                "platform_longevity": 65.0
            },
            "improvement_suggestions": [
                "💭 Track your mood more consistently - aim for daily entries",
                "📝 Provide more detailed descriptions in your mood entries",
                "🤝 Engage more with the community features"
            ]
        }
        
        return {"reputation_breakdown": breakdown}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get reputation breakdown: {str(e)}"
        )

@router.get("/leaderboard")
async def get_reputation_leaderboard(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get anonymized reputation leaderboard"""
    try:
        top_users = db.query(User).filter(
            User.is_active == True,
            User.reputation_score > 0
        ).order_by(User.reputation_score.desc()).limit(limit).all()
        
        leaderboard = []
        for i, user in enumerate(top_users, 1):
            leaderboard.append({
                "rank": i,
                "anonymous_id": user.commitment[:8] + "...",
                "reputation_score": user.reputation_score,
                "reputation_level": _get_reputation_level(user.reputation_score),
                "joined": user.created_at.strftime("%Y-%m") if user.created_at else "Unknown"
            })
        
        return {
            "leaderboard": leaderboard,
            "total_active_users": db.query(User).filter(User.is_active == True).count(),
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get leaderboard: {str(e)}"
        )

def _get_reputation_level(score: float) -> str:
    """Convert reputation score to level"""
    if score >= 90:
        return "Guardian"
    elif score >= 75:
        return "Mentor"
    elif score >= 60:
        return "Supporter"
    elif score >= 40:
        return "Member"
    elif score >= 20:
        return "Newcomer"
    else:
        return "Observer"

def _get_next_milestone(score: float) -> Dict:
    """Get next reputation milestone"""
    milestones = [20, 40, 60, 75, 90, 100]
    
    for milestone in milestones:
        if score < milestone:
            return {
                "next_level": _get_reputation_level(milestone),
                "points_needed": milestone - score,
                "current_progress": (score / milestone) * 100
            }
    
    return {
        "next_level": "Maximum Level Reached",
        "points_needed": 0,
        "current_progress": 100
    }
