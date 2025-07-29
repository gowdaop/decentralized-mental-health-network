from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
import hashlib
import secrets

# Security scheme for JWT
security = HTTPBearer()

class AuthService:
    def __init__(self):
        self.secret_key = getattr(settings, 'SECRET_KEY', 'your-secret-key-here-change-this-in-production')
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 30

    def register_anonymous_user(self, user_data: dict):
        """Register anonymous user and return commitment + token"""
        # Generate anonymous commitment
        random_data = secrets.token_hex(32)
        commitment_data = f"{user_data}_{random_data}_{datetime.utcnow()}"
        commitment = hashlib.sha256(commitment_data.encode()).hexdigest()
        
        # Create access token
        access_token = self.create_access_token({"commitment": commitment})
        
        return {
            "commitment": commitment,
            "access_token": access_token
        }
    
    def create_access_token(self, data: dict):
        """Create JWT access token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, credentials: HTTPAuthorizationCredentials = Depends(security)):
        """Verify JWT token from Authorization header"""
        try:
            token = credentials.credentials
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            commitment: str = payload.get("commitment")
            if commitment is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication credentials",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            return commitment
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    def get_current_user(self, credentials: HTTPAuthorizationCredentials = Depends(security)):
        """Get current user from token - returns user dict"""
        try:
            token = credentials.credentials
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            commitment: str = payload.get("commitment")
            if commitment is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication credentials",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            return {"commitment": commitment}
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

    def decode_token(self, token: str):
        """Decode token without dependency (for internal use)"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload.get("commitment")
        except JWTError:
            return None
