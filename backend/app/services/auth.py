# backend/app/services/auth.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings
from app.crypto.identity import AnonymousIdentity

class AuthService:
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.identity_manager = AnonymousIdentity()
    
    def create_access_token(self, data: dict, expires_delta: timedelta = None):
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
    
    def verify_token(self, token: str):
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            commitment: str = payload.get("sub")
            if commitment is None:
                return None
            return commitment
        except JWTError:
            return None
    
    def register_anonymous_user(self, preferences: dict) -> dict:
        """Register user with anonymous commitment"""
        user_data = f"{preferences.get('age_range', '')}:{preferences.get('topics', '')}"
        commitment, randomness = self.identity_manager.create_commitment(user_data)
        
        # Create access token
        access_token = self.create_access_token(
            data={"sub": commitment}, 
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        return {
            "commitment": commitment,
            "randomness": randomness,
            "access_token": access_token,
            "token_type": "bearer"
        }
