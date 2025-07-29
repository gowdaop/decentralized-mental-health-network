# backend/app/services/mood.py
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.user import MoodEntry
from app.crypto.identity import AnonymousIdentity
from typing import List, Dict
from fastapi import APIRouter
router = APIRouter()


class MoodService:
    def __init__(self):
        self.identity_manager = AnonymousIdentity()
    
    def record_mood(self, user_commitment: str, mood_data: Dict, db: Session) -> MoodEntry:
        """Record encrypted mood entry"""
        # Encrypt sensitive mood data
        encrypted_data = self.identity_manager.encrypt_sensitive_data(
            f"{mood_data.get('description', '')}:{mood_data.get('triggers', '')}"
        )
        
        # Create mood entry
        mood_entry = MoodEntry(
            user_commitment=user_commitment,
            encrypted_data=encrypted_data,
            mood_score=mood_data.get("score", 5),
            crisis_flag=mood_data.get("crisis_flag", False)
        )
        
        db.add(mood_entry)
        db.commit()
        db.refresh(mood_entry)
        
        return mood_entry
    
    def get_mood_history(self, user_commitment: str, db: Session, limit: int = 30) -> List[Dict]:
        """Get user's mood history"""
        entries = db.query(MoodEntry).filter(
            MoodEntry.user_commitment == user_commitment
        ).order_by(MoodEntry.timestamp.desc()).limit(limit).all()
        
        return [
            {
                "id": entry.id,
                "mood_score": entry.mood_score,
                "timestamp": entry.timestamp.isoformat(),
                "crisis_flag": entry.crisis_flag
            }
            for entry in entries
        ]
    
    def analyze_mood_trends(self, user_commitment: str, db: Session) -> Dict:
        """Analyze user's mood trends"""
        entries = db.query(MoodEntry).filter(
            MoodEntry.user_commitment == user_commitment
        ).order_by(MoodEntry.timestamp.desc()).limit(14).all()  # Last 2 weeks
        
        if not entries:
            return {"trend": "insufficient_data", "average": 0, "crisis_count": 0}
        
        scores = [entry.mood_score for entry in entries]
        crisis_count = sum(1 for entry in entries if entry.crisis_flag)
        
        return {
            "trend": "improving" if scores[0] > scores[-1] else "declining",
            "average": sum(scores) / len(scores),
            "crisis_count": crisis_count,
            "total_entries": len(entries)
        }
