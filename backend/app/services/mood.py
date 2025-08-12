from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.models.user import MoodEntry
from app.crypto.identity import AnonymousIdentity
from app.ai.services.crisis_detector import CrisisDetector
from app.ai.services.mood_analyzer import MoodAnalyzer
from app.services.token_automation import TokenAutomationService
from typing import List, Dict, Optional
from fastapi import APIRouter, HTTPException
import logging

router = APIRouter()

class MoodService:
    def __init__(self):
        self.identity_manager = AnonymousIdentity()
        self.crisis_detector = CrisisDetector()
        self.mood_analyzer = MoodAnalyzer()
        self.token_service = TokenAutomationService()
        self.logger = logging.getLogger(__name__)
    
    def record_mood(self, user_commitment: str, mood_data: Dict, db: Session) -> Dict:
        """Record mood entry with AI crisis detection and reward processing"""
        try:
            # Combine text for AI analysis
            full_text = f"{mood_data.get('description', '')} {mood_data.get('triggers', '')} {mood_data.get('notes', '')}"
            
            # AI Crisis Detection
            crisis_analysis = self.crisis_detector.analyze_text(full_text.strip())
            
            # Encrypt sensitive mood data for storage
            encrypted_data = self.identity_manager.encrypt_sensitive_data(
                f"desc:{mood_data.get('description', '')}|triggers:{mood_data.get('triggers', '')}|notes:{mood_data.get('notes', '')}"
            )
            
            # Create mood entry with AI-determined crisis flag
            mood_entry = MoodEntry(
                user_commitment=user_commitment,
                encrypted_data=encrypted_data,
                mood_score=mood_data.get("score", 5),
                crisis_flag=crisis_analysis.get("needs_intervention", False),
                timestamp=datetime.now(timezone.utc)
            )
            
            db.add(mood_entry)
            db.commit()
            db.refresh(mood_entry)
            
            # Process token rewards (async in background)
            try:
                user_address = self._get_user_blockchain_address(user_commitment, db)
                if user_address:
                    self.token_service.process_mood_entry_reward(
                        user_commitment, user_address, db
                    )
            except Exception as reward_error:
                self.logger.error(f"Token reward processing failed: {reward_error}")
            
            # Get crisis resources if high risk
            crisis_resources = []
            if crisis_analysis.get("risk_level") == "HIGH":
                crisis_resources = [
                    "🇮🇳 AASRA: 91-9820466726 (24/7 suicide prevention helpline)",
                    "🇮🇳 iCall: 9152987821 (Psychosocial support - TISS Mumbai)",
                    "🇮🇳 Vandrevala Foundation: 9999666555 (24/7 mental health helpline)",
                    "🇮🇳 Sumaitri: 011-23389090 (Delhi-based crisis helpline)",
                    "🇮🇳 Sneha Foundation: 044-24640050 (Chennai crisis helpline)",
                    "🇮🇳 Sahai: 080-25497777 (Bangalore emotional support)",
                    "🇮🇳 Roshni Trust: 040-66202000 (Hyderabad crisis helpline)",
                    "🇮🇳 Lifeline Foundation: 033-24637401 (Kolkata suicide prevention)"
                ]
                
                self.logger.warning(f"🚨 Crisis intervention triggered for user: {user_commitment[:8]}...")
                self.logger.warning(f"Risk level: {crisis_analysis.get('risk_level')}")
            
            return {
                "message": "Mood recorded successfully",
                "mood_entry_id": mood_entry.id,
                "crisis_analysis": {
                    "risk_level": crisis_analysis.get("risk_level", "UNKNOWN"),
                    "needs_intervention": crisis_analysis.get("needs_intervention", False),
                    "recommendations": crisis_analysis.get("recommendations", [])
                },
                "crisis_resources": crisis_resources if crisis_resources else None
            }
            
        except Exception as e:
            self.logger.error(f"Error recording mood: {e}")
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to record mood: {str(e)}")
    
    def get_mood_history(self, user_commitment: str, db: Session, limit: int = 30) -> List[Dict]:
        """Get user's mood history with decrypted data"""
        try:
            entries = db.query(MoodEntry).filter(
                MoodEntry.user_commitment == user_commitment
            ).order_by(MoodEntry.timestamp.desc()).limit(limit).all()
            
            history = []
            for entry in entries:
                # Decrypt sensitive data for user's own history
                try:
                    decrypted = self.identity_manager.decrypt_sensitive_data(entry.encrypted_data)
                    parts = decrypted.split('|')
                    description = parts[0].replace('desc:', '') if len(parts) > 0 else ""
                    triggers = parts[1].replace('triggers:', '') if len(parts) > 1 else ""
                    notes = parts[2].replace('notes:', '') if len(parts) > 2 else ""
                except:
                    description = triggers = notes = "[Encrypted]"
                
                history.append({
                    "id": entry.id,
                    "mood_score": entry.mood_score,
                    "description": description,
                    "triggers": triggers,
                    "notes": notes,
                    "timestamp": entry.timestamp.isoformat(),
                    "crisis_flag": entry.crisis_flag
                })
            
            return history
            
        except Exception as e:
            self.logger.error(f"Error getting mood history: {e}")
            raise HTTPException(status_code=500, detail="Failed to retrieve mood history")
    
    def analyze_mood_trends(self, user_commitment: str, db: Session, days: int = 30) -> Dict:
        """Advanced mood trend analysis using MoodAnalyzer AI"""
        try:
            # Use the sophisticated MoodAnalyzer instead of simple logic
            analysis = self.mood_analyzer.analyze_user_trends(user_commitment, db, days)
            
            # Format for API response
            return {
                "user_analysis": {
                    "period_days": analysis.get("period_days", days),
                    "entries_count": analysis.get("total_entries", 0),
                    "trend": {
                        "direction": analysis.get("trend", {}).get("direction", "unknown"),
                        "average_mood": analysis.get("trend", {}).get("average_mood", 0.0)
                    },
                    "patterns": analysis.get("patterns", {}),
                    "risk": analysis.get("risk", {}),
                    "recommendations": analysis.get("recommendations", [])
                },
                "privacy_note": "Analysis conducted on encrypted data with zero-knowledge architecture"
            }
            
        except Exception as e:
            self.logger.error(f"Error analyzing mood trends: {e}")
            raise HTTPException(status_code=500, detail="Failed to analyze mood trends")
    
    def get_community_insights(self, db: Session, days: int = 7) -> Dict:
        """Get anonymized community mood insights"""
        try:
            return self.mood_analyzer.generate_community_insights(db, days)
        except Exception as e:
            self.logger.error(f"Error generating community insights: {e}")
            raise HTTPException(status_code=500, detail="Failed to generate community insights")
    
    def _get_user_blockchain_address(self, user_commitment: str, db: Session) -> Optional[str]:
        """Get user's blockchain address for token rewards"""
        try:
            # This would get the user's blockchain address from your User model
            # Placeholder implementation
            return None  # Implement based on your User model structure
        except Exception as e:
            self.logger.error(f"Error getting blockchain address: {e}")
            return None
    
    def decrypt_mood_data_for_analysis(self, encrypted_data: str) -> Dict:
        """Helper to decrypt mood data for internal analysis"""
        try:
            decrypted = self.identity_manager.decrypt_sensitive_data(encrypted_data)
            parts = decrypted.split('|')
            
            return {
                "description": parts[0].replace('desc:', '') if len(parts) > 0 else "",
                "triggers": parts[1].replace('triggers:', '') if len(parts) > 1 else "",
                "notes": parts[2].replace('notes:', '') if len(parts) > 2 else ""
            }
        except Exception as e:
            self.logger.error(f"Error decrypting mood data: {e}")
            return {"description": "", "triggers": "", "notes": ""}
