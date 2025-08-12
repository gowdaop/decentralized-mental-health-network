from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.auth import AuthService
from app.services.peer_service import PeerMatchingService
from app.models.user import User

auth_service = AuthService()

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

def get_peer_matching_service(db: Session = Depends(get_db)) -> PeerMatchingService:
    """Get peer matching service instance"""
    return PeerMatchingService(db)
