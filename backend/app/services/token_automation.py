from app.services.blockchain_service import BlockchainService
from app.ai.services.mood_analyzer import MoodAnalyzer
from app.ai.services.crisis_detector import CrisisDetector
from sqlalchemy.orm import Session
from typing import Dict, Optional
import logging

class TokenAutomationService:
    def __init__(self):
        self.blockchain_service = BlockchainService()
        self.mood_analyzer = MoodAnalyzer()
        self.crisis_detector = CrisisDetector()
        self.logger = logging.getLogger(__name__)
        
        # Token reward amounts
        self.rewards = {
            'mood_entry': 10,
            'helpful_peer': 25,
            'session_creation': 15,
            'crisis_support': 50,
            'consistent_logging': 20,
            'community_contribution': 30
        }
    
    def process_mood_entry_reward(self, user_commitment: str, user_address: str, db: Session) -> Optional[str]:
        """Reward user for consistent mood tracking"""
        try:
            # Analyze user's mood tracking consistency
            analysis = self.mood_analyzer.analyze_user_trends(user_commitment, db, days=7)
            
            base_reward = self.rewards['mood_entry']
            
            # Bonus for consistency
            if analysis['progress']['engagement_score'] > 0.8:
                base_reward += self.rewards['consistent_logging']
                self.logger.info(f"Consistency bonus awarded to {user_commitment[:8]}...")
            
            # Reward user with tokens
            tx_hash = self.blockchain_service.reward_user(user_address, base_reward)
            
            if tx_hash:
                self.logger.info(f"Mood entry reward: {base_reward} tokens to {user_commitment[:8]}...")
                return tx_hash
            
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
            
            tx_hash = self.blockchain_service.reward_user(user_address, reward_amount)
            
            if tx_hash:
                self.logger.info(f"Peer support reward: {reward_amount} tokens to {user_commitment[:8]}...")
                return tx_hash
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error processing peer support reward: {e}")
            return None
    
    def process_session_creation_reward(self, user_commitment: str, user_address: str, session_impact: Dict) -> Optional[str]:
        """Reward user for creating valuable peer sessions"""
        try:
            base_reward = self.rewards['session_creation']
            
            # Bonus for high participation sessions
            participants = session_impact.get('participant_count', 1)
            if participants >= 3:
                base_reward += 10  # Bonus for successful group formation
            
            tx_hash = self.blockchain_service.reward_user(user_address, base_reward)
            
            if tx_hash:
                self.logger.info(f"Session creation reward: {base_reward} tokens to {user_commitment[:8]}...")
                return tx_hash
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error processing session creation reward: {e}")
            return None
    
    def process_community_contribution_reward(self, user_commitment: str, user_address: str, contribution_type: str) -> Optional[str]:
        """Reward users for various community contributions"""
        try:
            reward_amount = self.rewards['community_contribution']
            
            # Adjust based on contribution type
            if contribution_type == 'crisis_intervention':
                reward_amount = self.rewards['crisis_support']
            elif contribution_type == 'mentorship':
                reward_amount = int(reward_amount * 1.2)
            
            tx_hash = self.blockchain_service.reward_user(user_address, reward_amount)
            
            if tx_hash:
                self.logger.info(f"Community contribution reward: {reward_amount} tokens to {user_commitment[:8]}...")
                return tx_hash
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error processing community contribution reward: {e}")
            return None
    
    def calculate_reputation_adjustment(self, user_commitment: str, db: Session) -> Dict:
        """Calculate reputation adjustments based on AI analysis"""
        try:
            # Analyze user behavior patterns
            analysis = self.mood_analyzer.analyze_user_trends(user_commitment, db)
            
            reputation_change = 0
            reasons = []
            
            # Positive adjustments
            if analysis['trend']['direction'] == 'improving':
                reputation_change += 5
                reasons.append("Positive mood trend")
            
            if analysis['progress']['consistency_score'] > 0.8:
                reputation_change += 3
                reasons.append("Consistent engagement")
            
            if analysis['progress']['engagement_score'] > 0.9:
                reputation_change += 2
                reasons.append("High platform engagement")
            
            # Negative adjustments (minimal, focused on platform abuse)
            if analysis['risk']['level'] == 'HIGH' and analysis['risk']['crisis_rate'] > 0.5:
                # Note: This is for platform stability, not penalizing mental health struggles
                reputation_change -= 1
                reasons.append("May need additional support")
            
            return {
                'reputation_change': reputation_change,
                'reasons': reasons,
                'current_analysis': analysis
            }
            
        except Exception as e:
            self.logger.error(f"Error calculating reputation adjustment: {e}")
            return {'reputation_change': 0, 'reasons': [], 'error': str(e)}
    
    def process_automated_rewards(self, db: Session) -> Dict:
        """Process automated rewards for all eligible users"""
        try:
            results = {
                'processed': 0,
                'successful': 0,
                'failed': 0,
                'total_tokens_distributed': 0
            }
            
            # This would be called periodically (e.g., daily cron job)
            # For now, we'll implement a basic version
            
            self.logger.info("Starting automated reward processing...")
            
            # In a production system, this would:
            # 1. Query users eligible for rewards
            # 2. Calculate reward amounts based on AI analysis
            # 3. Execute blockchain transactions
            # 4. Update reputation scores
            # 5. Log all activities for transparency
            
            return results
            
        except Exception as e:
            self.logger.error(f"Error in automated reward processing: {e}")
            return {'error': str(e)}
