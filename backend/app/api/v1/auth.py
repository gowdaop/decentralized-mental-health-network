from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.auth import AuthService
from app.services.blockchain_service import BlockchainService
from app.models.user import UserCommitment
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

@router.post("/register")
async def register_user(user_data: UserRegistration, db: Session = Depends(get_db)):
    """Register new anonymous user with blockchain integration"""
    try:
        # Create anonymous commitment
        registration_result = auth_service.register_anonymous_user(user_data.dict())
        
        # Save to database
        db_user = UserCommitment(
            commitment_hash=registration_result["commitment"],
            reputation_score=100
        )
        db.add(db_user)
        db.commit()
        
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.get("/user/{commitment}/reputation")
async def get_user_reputation(commitment: str):
    """Get user reputation from blockchain"""
    
    # Validate commitment format (64-character hex string)
    if not re.match(r'^[a-fA-F0-9]{64}$', commitment):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid commitment format. Must be 64-character hex string."
        )
    
    if not blockchain_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Blockchain service unavailable"
        )
    
    try:
        reputation = blockchain_service.get_user_reputation(commitment)
        exists = blockchain_service.check_user_exists(commitment)
        
        return {
            "commitment": commitment,
            "reputation": reputation,
            "exists_on_chain": exists
        }
    except Exception as e:
        print(f"Reputation endpoint error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get reputation: {str(e)}"
        )
