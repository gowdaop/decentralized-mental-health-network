# backend/app/crypto/identity.py
import hashlib
import secrets
from cryptography.fernet import Fernet
from typing import Tuple, Dict
from app.core.config import settings

class AnonymousIdentity:
    def __init__(self):
        # Generate or load encryption key
        if settings.ENCRYPTION_KEY:
            self.cipher = Fernet(settings.ENCRYPTION_KEY.encode())
        else:
            key = Fernet.generate_key()
            self.cipher = Fernet(key)
            print(f"Generated encryption key: {key.decode()}")
    
    def create_commitment(self, user_data: str) -> Tuple[str, str]:
        """
        Create cryptographic commitment for anonymous user
        Returns: (commitment_hash, randomness)
        """
        randomness = secrets.token_hex(32)
        commitment_input = f"{user_data}:{randomness}"
        commitment_hash = hashlib.sha256(commitment_input.encode()).hexdigest()
        return commitment_hash, randomness
    
    def verify_commitment(self, commitment: str, user_data: str, randomness: str) -> bool:
        """Verify user commitment without revealing identity"""
        expected_input = f"{user_data}:{randomness}"
        expected_hash = hashlib.sha256(expected_input.encode()).hexdigest()
        return commitment == expected_hash
    
    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive user data"""
        return self.cipher.encrypt(data.encode()).decode()
    
    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive user data"""
        return self.cipher.decrypt(encrypted_data.encode()).decode()
    
    def generate_session_hash(self, participants: list) -> str:
        """Generate unique hash for peer sessions"""
        session_data = ":".join(sorted(participants)) + ":" + secrets.token_hex(16)
        return hashlib.sha256(session_data.encode()).hexdigest()
