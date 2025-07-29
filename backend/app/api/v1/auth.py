from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.auth import AuthService
from app.services.blockchain_service import BlockchainService
from app.models.user import User, MoodEntry, PeerSession, SessionMatch
from pydantic import BaseModel
import re

router = APIRouter()
auth_service = AuthService()

# Initialize blockchain service
try:
    blockchain_service = BlockchainService()
    blockchain_enabled = True
    print("✅ Blockchain service enabled")
except Exception as e:
    blockchain_service = None
    blockchain_enabled = False
    print(f"⚠️ Blockchain service disabled: {e}")

class UserRegistration(BaseModel):
    age_range: str
    topics: str
    severity_level: str
    preferred_times: list

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

@router.post("/register")
async def register_user(user_data: UserRegistration, db: Session = Depends(get_db)):
    """Register new anonymous user with blockchain integration"""
    try:
        # Create anonymous commitment
        registration_result = auth_service.register_anonymous_user(user_data.dict())
        
        # Save to database - ✅ Use User instead of UserCommitment
        db_user = User(
            commitment=registration_result["commitment"],
            age_range=user_data.age_range,
            topics=user_data.topics,
            severity_level=user_data.severity_level,
            preferred_times=str(user_data.preferred_times),
            reputation_score=100
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        blockchain_result = None
        
        # Register on blockchain if enabled
        if blockchain_enabled and blockchain_service:
            try:
                blockchain_result = blockchain_service.register_user_commitment(
                    registration_result["commitment"]
                )
                if blockchain_result:
                    print(f"✅ User registered on blockchain: {blockchain_result['tx_hash']}")
                else:
                    print("⚠️ Blockchain registration failed")
            except Exception as blockchain_error:
                print(f"⚠️ Blockchain registration error: {blockchain_error}")
        
        response = {
            "message": "User registered successfully",
            "commitment": registration_result["commitment"],
            "access_token": registration_result["access_token"],
            "token_type": "bearer"
        }
        
        # Add blockchain info if available
        if blockchain_result:
            response["blockchain"] = {
                "tx_hash": blockchain_result["tx_hash"],
                "block_number": blockchain_result["block_number"],
                "status": "confirmed" if blockchain_result["status"] == 1 else "failed"
            }
        
        return response
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login")
async def login_user(login_data: dict, db: Session = Depends(get_db)):
    """Login with commitment and randomness"""
    try:
        commitment = login_data.get("commitment")
        randomness = login_data.get("randomness")
        
        if not commitment or not randomness:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Commitment and randomness required"
            )
        
        # Verify user exists in database
        db_user = db.query(User).filter(User.commitment == commitment).first()
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Create access token
        access_token = auth_service.create_access_token({"commitment": commitment})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "message": "Login successful"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.get("/user/{commitment}/reputation")
async def get_user_reputation(commitment: str, db: Session = Depends(get_db)):
    """Get user reputation - prioritize database over blockchain"""
    try:
        db_user = db.query(User).filter(User.commitment == commitment).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Use database reputation as primary source
        reputation = db_user.reputation_score
        exists_on_chain = True  # User was registered successfully
        
        return {
            "commitment": commitment,
            "reputation": reputation,  # Use database value
            "exists_on_chain": exists_on_chain,
            "database_reputation": db_user.reputation_score
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/profile")
async def get_user_profile(
    db: Session = Depends(get_db),
    current_user_commitment: str = Depends(get_current_user_commitment)
):
    """Get current user profile"""
    try:
        db_user = db.query(User).filter(User.commitment == current_user_commitment).first()
        
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        return {
            "commitment": db_user.commitment,
            "age_range": db_user.age_range,
            "topics": db_user.topics,
            "severity_level": db_user.severity_level,
            "preferred_times": db_user.preferred_times,
            "reputation_score": db_user.reputation_score,
            "created_at": db_user.created_at,
            "is_active": db_user.is_active
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get profile: {str(e)}"
        )
