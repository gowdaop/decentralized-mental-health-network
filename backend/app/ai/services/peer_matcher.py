from sqlalchemy.orm import Session
from app.models.user import User, PeerSession, SessionMatch
from typing import List, Dict, Optional
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class PeerService:
    """Service class for peer matching and connection management"""

    def __init__(self, db: Session):
        self.db = db
        self.matching_factors = ['topics', 'severity_level', 'age_range', 'preferred_times']

    def find_compatible_peers(self, user_commitment: str, limit: int = 10) -> List[Dict]:
        """Find compatible peers using advanced algorithm"""
        try:
            # Get current user
            current_user = self.db.query(User).filter(User.commitment == user_commitment).first()
            if not current_user:
                return []

            # Find potential matches
            potential_matches = self.db.query(User).filter(
                User.commitment != user_commitment,
                User.is_active == True
            ).limit(limit * 2).all()

            matches = []
            for user in potential_matches:
                compatibility_score = self._calculate_compatibility(current_user, user)
                
                if compatibility_score > 30:  # Minimum compatibility threshold
                    matches.append({
                        "id": str(user.id),
                        "anonymous_id": f"User_{user.id}",
                        "match_score": int(compatibility_score),
                        "common_topics": self._get_shared_topics(current_user, user),
                        "last_active": user.updated_at.isoformat() if user.updated_at else datetime.utcnow().isoformat(),
                        "reputation_level": getattr(user, 'reputation_level', 'Trusted'),
                        "is_online": getattr(user, 'is_online', True),
                    })

            # Sort by compatibility score descending
            matches.sort(key=lambda x: x["match_score"], reverse=True)
            return matches[:limit]
            
        except Exception as e:
            logger.error(f"Error in peer matching: {e}")
            return []

    def find_peers_by_criteria(self, user_commitment: str, criteria: Dict, limit: int = 10) -> List[Dict]:
        """Find peers based on specific criteria"""
        try:
            current_user = self.db.query(User).filter(User.commitment == user_commitment).first()
            if not current_user:
                return []
            
            query = self.db.query(User).filter(
                User.commitment != user_commitment,
                User.is_active == True
            )
            
            # Apply filters based on criteria
            topics = criteria.get('topics', '')
            if topics:
                topic_list = [t.strip() for t in topics.split(',')]
                for topic in topic_list:
                    if topic:
                        query = query.filter(User.topics.ilike(f"%{topic}%"))
            
            severity_level = criteria.get('severity_level', '')
            if severity_level:
                query = query.filter(User.severity_level == severity_level)
            
            age_range = criteria.get('age_range', '')
            if age_range:
                query = query.filter(User.age_range == age_range)
            
            similar_users = query.limit(limit).all()
            
            matches = []
            for user in similar_users:
                # Calculate basic compatibility score
                score = 50  # Base score
                
                # Find common topics
                common_topics = []
                if topics and user.topics:
                    user_topics = set(t.strip().lower() for t in topics.split(','))
                    similar_topics = set(t.strip().lower() for t in user.topics.split(','))
                    common_topics = list(user_topics.intersection(similar_topics))
                    score += len(common_topics) * 15
                
                # Severity level match
                if severity_level == user.severity_level:
                    score += 25
                
                # Age range match
                if age_range == user.age_range:
                    score += 15
                
                matches.append({
                    "id": str(user.id),
                    "anonymous_id": f"User_{user.id}",
                    "match_score": min(score, 100),
                    "common_topics": common_topics,
                    "last_active": user.updated_at.isoformat() if user.updated_at else datetime.utcnow().isoformat(),
                    "reputation_level": getattr(user, 'reputation_level', 'Trusted'),
                    "is_online": getattr(user, 'is_online', True),
                })
            
            # Sort by match score descending
            matches.sort(key=lambda x: x["match_score"], reverse=True)
            return matches
            
        except Exception as e:
            logger.error(f"Error finding peers by criteria: {e}")
            return []

    def send_connection_request(self, requester_commitment: str, target_user_id: str, message: str) -> bool:
        """Send connection request between peers"""
        try:
            # Find requester and target users
            requester = self.db.query(User).filter(User.commitment == requester_commitment).first()
            target = self.db.query(User).filter(User.id == int(target_user_id)).first()
            
            if not requester or not target:
                return False
            
            # Check if connection request already exists
            existing_request = self.db.query(SessionMatch).filter(
                SessionMatch.requester_id == requester.id,
                SessionMatch.target_id == target.id,
                SessionMatch.status == "pending"
            ).first()
            
            if existing_request:
                return False  # Request already exists
            
            # Create new connection request
            connection_request = SessionMatch(
                requester_id=requester.id,
                target_id=target.id,
                message=message,
                status="pending",
                created_at=datetime.utcnow()
            )
            
            self.db.add(connection_request)
            self.db.commit()
            return True
            
        except Exception as e:
            logger.error(f"Error sending connection request: {e}")
            self.db.rollback()
            return False

    def get_connection_requests(self, user_commitment: str) -> List[Dict]:
        """Get all connection requests for user (incoming and outgoing)"""
        try:
            user = self.db.query(User).filter(User.commitment == user_commitment).first()
            if not user:
                return []
            
            # Get incoming requests (where user is the target)
            incoming_requests = self.db.query(SessionMatch).filter(
                SessionMatch.target_id == user.id
            ).order_by(SessionMatch.created_at.desc()).all()
            
            # Get outgoing requests (where user is the requester)
            outgoing_requests = self.db.query(SessionMatch).filter(
                SessionMatch.requester_id == user.id
            ).order_by(SessionMatch.created_at.desc()).all()
            
            requests_data = []
            
            # Process incoming requests
            for request in incoming_requests:
                requester = self.db.query(User).filter(User.id == request.requester_id).first()
                requests_data.append({
                    "id": request.id,
                    "from_peer": f"User_{requester.id}" if requester else "Unknown",
                    "to_peer": f"User_{user.id}",
                    "message": request.message,
                    "status": request.status,
                    "created_at": request.created_at.isoformat(),
                    "type": "incoming"
                })
            
            # Process outgoing requests
            for request in outgoing_requests:
                target = self.db.query(User).filter(User.id == request.target_id).first()
                requests_data.append({
                    "id": request.id,
                    "from_peer": f"User_{user.id}",
                    "to_peer": f"User_{target.id}" if target else "Unknown",
                    "message": request.message,
                    "status": request.status,
                    "created_at": request.created_at.isoformat(),
                    "type": "outgoing"
                })
            
            return requests_data
            
        except Exception as e:
            logger.error(f"Error getting connection requests: {e}")
            return []

    def respond_to_connection_request(self, user_commitment: str, request_id: int, response: str) -> bool:
        """Accept or decline a connection request"""
        try:
            user = self.db.query(User).filter(User.commitment == user_commitment).first()
            if not user:
                return False
            
            # Find the connection request
            connection_request = self.db.query(SessionMatch).filter(
                SessionMatch.id == request_id,
                SessionMatch.target_id == user.id,  # User must be the target
                SessionMatch.status == "pending"
            ).first()
            
            if not connection_request:
                return False
            
            # Update request status
            if response.lower() == "accept":
                connection_request.status = "accepted"
            elif response.lower() == "decline":
                connection_request.status = "declined"
            else:
                return False
            
            connection_request.responded_at = datetime.utcnow()
            self.db.commit()
            return True
            
        except Exception as e:
            logger.error(f"Error responding to connection request: {e}")
            self.db.rollback()
            return False

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
            
            user.updated_at = datetime.utcnow()
            db.commit()
            return True
            
        except Exception as e:
            logger.error(f"Error creating user profile: {e}")
            return False

    def _calculate_compatibility(self, user1: User, user2: User) -> float:
        """Calculate compatibility score between two users"""
        score = 0.0
        factors_checked = 0
        
        # Topic similarity (40% weight)
        if user1.topics and user2.topics:
            topics1 = set(user1.topics.lower().split(','))
            topics2 = set(user2.topics.lower().split(','))
            topic_overlap = len(topics1.intersection(topics2))
            topic_similarity = topic_overlap / max(len(topics1), len(topics2))
            score += topic_similarity * 0.4
            factors_checked += 1
        
        # Severity level compatibility (30% weight)
        if user1.severity_level and user2.severity_level:
            severity_levels = ['mild', 'moderate', 'severe']
            if user1.severity_level in severity_levels and user2.severity_level in severity_levels:
                level_diff = abs(severity_levels.index(user1.severity_level) - 
                               severity_levels.index(user2.severity_level))
                severity_compatibility = 1.0 - (level_diff / 2.0)  # Max diff is 2
                score += severity_compatibility * 0.3
                factors_checked += 1
        
        # Age range compatibility (20% weight)
        if user1.age_range and user2.age_range:
            age_compatibility = 1.0 if user1.age_range == user2.age_range else 0.7
            score += age_compatibility * 0.2
            factors_checked += 1
        
        # Time preference overlap (10% weight)
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
        
        # Normalize score based on factors checked and convert to 0-100 scale
        normalized_score = (score / max(factors_checked, 1)) if factors_checked > 0 else 0.0
        return normalized_score * 100

    def _get_shared_topics(self, user1: User, user2: User) -> List[str]:
        """Get shared topics between two users"""
        if not (user1.topics and user2.topics):
            return []
        
        topics1 = set(topic.strip().lower() for topic in user1.topics.split(','))
        topics2 = set(topic.strip().lower() for topic in user2.topics.split(','))
        
        return list(topics1.intersection(topics2))

# Legacy alias for backward compatibility
class PeerMatcher(PeerService):
    """Legacy alias for PeerService - maintains backward compatibility"""
    pass
