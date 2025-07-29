from sqlalchemy.orm import Session
from app.models.user import User, PeerSession, SessionMatch  # ✅ Changed from UserCommitment to User
from typing import List, Dict
import json

class PeerMatcher:
    def __init__(self):
        self.matching_factors = [
            'topics', 'severity_level', 'age_range', 'preferred_times'
        ]
    
    def find_compatible_peers(self, user_commitment: str, db: Session, limit: int = 5) -> List[Dict]:
        """Find compatible peers for matching"""
        try:
            # Get current user
            current_user = db.query(User).filter(User.commitment == user_commitment).first()
            if not current_user:
                return []
            
            # Find potential matches
            potential_matches = db.query(User).filter(
                User.commitment != user_commitment,
                User.is_active == True
            ).limit(limit * 2).all()  # Get more to filter better matches
            
            matches = []
            for user in potential_matches:
                compatibility_score = self._calculate_compatibility(current_user, user)
                
                if compatibility_score > 0.3:  # Minimum compatibility threshold
                    matches.append({
                        "user_commitment": user.commitment,
                        "compatibility_score": round(compatibility_score, 2),
                        "shared_topics": self._get_shared_topics(current_user, user),
                        "profile_summary": {
                            "topics": user.topics,
                            "severity_level": user.severity_level,
                            "age_range": user.age_range
                        }
                    })
            
            # Sort by compatibility score and return top matches
            matches.sort(key=lambda x: x["compatibility_score"], reverse=True)
            return matches[:limit]
            
        except Exception as e:
            print(f"Error in peer matching: {e}")
            return []
    
    def create_user_profile(self, user_commitment: str, preferences: dict, db: Session) -> bool:
        """Create or update user matching profile"""
        try:
            user = db.query(User).filter(User.commitment == user_commitment).first()
            if not user:
                return False
            
            # Update user profile with matching preferences
            if 'topics' in preferences:
                user.topics = preferences['topics']
            if 'severity_level' in preferences:
                user.severity_level = preferences['severity_level']
            if 'preferred_times' in preferences:
                user.preferred_times = json.dumps(preferences['preferred_times'])
            if 'age_range' in preferences:
                user.age_range = preferences['age_range']
            
            db.commit()
            return True
            
        except Exception as e:
            print(f"Error creating user profile: {e}")
            return False
    
    def _calculate_compatibility(self, user1: User, user2: User) -> float:
        """Calculate compatibility score between two users"""
        score = 0.0
        factors_checked = 0
        
        # Topic similarity
        if user1.topics and user2.topics:
            topics1 = set(user1.topics.lower().split(','))
            topics2 = set(user2.topics.lower().split(','))
            topic_overlap = len(topics1.intersection(topics2))
            topic_similarity = topic_overlap / max(len(topics1), len(topics2))
            score += topic_similarity * 0.4
            factors_checked += 1
        
        # Severity level compatibility
        if user1.severity_level and user2.severity_level:
            severity_levels = ['mild', 'moderate', 'severe']
            if user1.severity_level in severity_levels and user2.severity_level in severity_levels:
                level_diff = abs(severity_levels.index(user1.severity_level) - 
                               severity_levels.index(user2.severity_level))
                severity_compatibility = 1.0 - (level_diff / 2.0)  # Max diff is 2
                score += severity_compatibility * 0.3
                factors_checked += 1
        
        # Age range compatibility
        if user1.age_range and user2.age_range:
            age_compatibility = 1.0 if user1.age_range == user2.age_range else 0.7
            score += age_compatibility * 0.2
            factors_checked += 1
        
        # Time preference overlap
        if user1.preferred_times and user2.preferred_times:
            try:
                times1 = set(json.loads(user1.preferred_times))
                times2 = set(json.loads(user2.preferred_times))
                time_overlap = len(times1.intersection(times2))
                time_compatibility = time_overlap / max(len(times1), len(times2))
                score += time_compatibility * 0.1
                factors_checked += 1
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Normalize score based on factors checked
        return score / max(factors_checked, 1) if factors_checked > 0 else 0.0
    
    def _get_shared_topics(self, user1: User, user2: User) -> List[str]:
        """Get shared topics between two users"""
        if not (user1.topics and user2.topics):
            return []
        
        topics1 = set(topic.strip().lower() for topic in user1.topics.split(','))
        topics2 = set(topic.strip().lower() for topic in user2.topics.split(','))
        
        return list(topics1.intersection(topics2))
