# backend/app/services/token_automation.py
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.models.user import User, MoodEntry
from typing import Dict, Optional, List
import logging

try:
    from app.services.blockchain_service import BlockchainService
    from app.ai.services.mood_analyzer import MoodAnalyzer
    from app.ai.services.crisis_detector import CrisisDetector
    BLOCKCHAIN_ENABLED = True
except ImportError as e:
    print(f"⚠️ Blockchain/AI services not available: {e}")
    BLOCKCHAIN_ENABLED = False
    BlockchainService = None
    MoodAnalyzer = None
    CrisisDetector = None

class TokenAutomationService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Initialize services if available
        if BLOCKCHAIN_ENABLED:
            try:
                self.blockchain_service = BlockchainService()
                self.mood_analyzer = MoodAnalyzer()
                self.crisis_detector = CrisisDetector()
            except Exception as e:
                self.logger.warning(f"Failed to initialize blockchain services: {e}")
                self.blockchain_service = None
                self.mood_analyzer = None
                self.crisis_detector = None
        else:
            self.blockchain_service = None
            self.mood_analyzer = None
            self.crisis_detector = None
        
        # Token reward amounts
        self.rewards = {
            'mood_entry': 10,
            'helpful_peer': 25,
            'session_creation': 15,
            'crisis_support': 50,
            'consistent_logging': 20,
            'community_contribution': 30
        }
    
    def process_mood_entry_reward(self, user_commitment: str, user_address: Optional[str], db: Session) -> Optional[str]:
        """Reward user for mood tracking entry"""
        try:
            # Basic mood entry reward
            base_reward = self.rewards['mood_entry']
            
            # Check for consistency bonus
            if self._check_consistency_bonus(user_commitment, db):
                base_reward += self.rewards['consistent_logging']
                self.logger.info(f"Consistency bonus awarded to {user_commitment[:8]}...")
            
            # Reward user with tokens (if blockchain is available)
            if self.blockchain_service and user_address:
                tx_hash = self.blockchain_service.reward_user(user_address, base_reward)
                if tx_hash:
                    self.logger.info(f"Mood entry reward: {base_reward} tokens to {user_commitment[:8]}...")
                    return tx_hash
            else:
                self.logger.info(f"Mood entry logged for {user_commitment[:8]}... (blockchain not available)")
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error processing mood entry reward: {e}")
            return None
    
    def process_peer_support_reward(self, user_commitment: str, user_address: str, support_quality: str = 'helpful') -> Optional[str]:
        """Reward user for providing peer support"""
        try:
            reward_amount = self.rewards['helpful_peer']
            
            # Adjust reward based on support quality
            if support_quality == 'exceptional':
                reward_amount = int(reward_amount * 1.5)
            elif support_quality == 'crisis_intervention':
                reward_amount = self.rewards['crisis_support']
            
            if self.blockchain_service:
                tx_hash = self.blockchain_service.reward_user(user_address, reward_amount)
                if tx_hash:
                    self.logger.info(f"Peer support reward: {reward_amount} tokens to {user_commitment[:8]}...")
                    return tx_hash
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error processing peer support reward: {e}")
            return None
    
    def process_crisis_intervention_reward(self, user_commitment: str, user_address: Optional[str], intervention_data: Dict) -> Optional[str]:
        """Reward users who successfully handle crisis situations"""
        try:
            reward_amount = self.rewards['crisis_support']
            
            # Bonus for helping others in crisis
            if intervention_data.get('helped_others', False):
                reward_amount += 25
            
            if self.blockchain_service and user_address:
                tx_hash = self.blockchain_service.reward_user(user_address, reward_amount)
                if tx_hash:
                    self.logger.info(f"Crisis intervention reward: {reward_amount} tokens to {user_commitment[:8]}...")
                    return tx_hash
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error processing crisis intervention reward: {e}")
            return None
    
    def _check_consistency_bonus(self, user_commitment: str, db: Session) -> bool:
        """Check if user qualifies for consistency bonus"""
        try:
            # Check if user has logged mood in last 7 days consistently
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=7)
            entries = db.query(MoodEntry).filter(
                MoodEntry.user_commitment == user_commitment,
                MoodEntry.timestamp >= cutoff_date
            ).all()
            
            # User gets bonus if they have entries on at least 5 of last 7 days
            days_with_entries = len(set(entry.timestamp.date() for entry in entries))
            return days_with_entries >= 5
            
        except Exception as e:
            self.logger.error(f"Error checking consistency bonus: {e}")
            return False
    
    def update_user_reputation(self, user_commitment: str, db: Session) -> Dict:
        """Update user reputation based on recent activity"""
        try:
            user = db.query(User).filter(User.commitment == user_commitment).first()
            if not user:
                return {'error': 'User not found'}
            
            # Calculate reputation adjustment
            reputation_change = self._calculate_reputation_adjustment(user_commitment, db)
            
            # Update user reputation
            old_reputation = user.reputation_score
            new_reputation = max(0, min(100, old_reputation + reputation_change))
            user.reputation_score = new_reputation
            db.commit()
            
            self.logger.info(f"Reputation updated for {user_commitment[:8]}...: {old_reputation} → {new_reputation}")
            
            return {
                'user_commitment': user_commitment,
                'old_reputation': old_reputation,
                'new_reputation': new_reputation,
                'change': reputation_change
            }
            
        except Exception as e:
            self.logger.error(f"Error updating user reputation: {e}")
            return {'error': str(e)}
    
    def _calculate_reputation_adjustment(self, user_commitment: str, db: Session) -> float:
        """Calculate reputation adjustment based on recent activity"""
        try:
            adjustment = 0.0
            
            # Check recent mood entries (last 7 days)
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=7)
            recent_entries = db.query(MoodEntry).filter(
                MoodEntry.user_commitment == user_commitment,
                MoodEntry.timestamp >= cutoff_date
            ).all()
            
            # Positive adjustments
            if len(recent_entries) >= 5:  # Consistent logging
                adjustment += 2.0
            
            if len(recent_entries) > 0:
                avg_mood = sum(entry.mood_score for entry in recent_entries) / len(recent_entries)
                if avg_mood > 7:  # Good mood trend
                    adjustment += 1.0
            
            # Check for crisis recovery
            crisis_entries = [e for e in recent_entries if e.crisis_flag]
            if len(crisis_entries) == 0 and len(recent_entries) > 0:
                adjustment += 1.0  # No crisis episodes
            
            return min(5.0, adjustment)  # Cap at +5 points per update
            
        except Exception as e:
            self.logger.error(f"Error calculating reputation adjustment: {e}")
            return 0.0


# Legacy class alias for backward compatibility
class AdvancedReputationService(TokenAutomationService):
    """Alias for TokenAutomationService to maintain backward compatibility"""
    pass
