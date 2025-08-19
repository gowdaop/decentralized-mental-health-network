# backend/app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Use model_config for Pydantic v2+
    # Set extra='ignore' to prevent validation errors from unexpected fields.
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding='utf-8', 
        extra='ignore',
        case_sensitive=False
    )
    
    PROJECT_NAME: str = "Mental Health Support Network - AI Enhanced"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "postgresql://gowdaop:9481911456Vig@host.docker.internal:5432/mydatabase"
    
    # Blockchain Configuration - Updated field names to match your usage
    WEB3_PROVIDER_URL: str = "http://127.0.0.1:8545"  # Changed from GANACHE_URL to match your code
    USER_REGISTRY_ADDRESS: Optional[str] = None
    TOKEN_SYSTEM_ADDRESS: Optional[str] = None
    PRIVATE_KEY: Optional[str] = None
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Security - Updated with your test key
    SECRET_KEY: str = "test_key_3a8f9b2e1d7c4a9e8f2b1a3c9e7f4d2a1b8c5e9f3a7b4d1c8e2f9a6b3d7c4e1f8a2b5c9e"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Encryption
    ENCRYPTION_KEY: Optional[str] = None

settings = Settings()
