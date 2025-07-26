from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
from sqlalchemy.orm import Session
from app.models.user import UserCommitment, MoodEntry, PeerSession
from app.crypto.identity import AnonymousIdentity
import logging

class PeerMatcher:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2),
            lowercase=True
        )
        self.identity_manager = AnonymousIdentity()
        self.logger = logging.getLogger(__name__)
        self.user_profiles = {}
        self.compatibility_threshold = 0.3
    
    def create_user_profile(self, user_commitment: str, preferences: Dict, db: Session) -> Dict:
        """Create comprehensive user profile for matching"""
        try:
            # Basic preference text
            preference_text = self._build_preference_text(preferences)
            
            # Get mood history for behavioral matching
            mood_patterns = self._analyze_mood_patterns(user_commitment, db)
            
            # Get session participation history
            session_history = self._analyze_session_history(user_commitment, db)
            
            profile = {
                'commitment': user_commitment,
                'preference_text': preference_text,
                'preferences': preferences,
                'mood_patterns': mood_patterns,
                'session_history': session_history,
                'created_at': self._get_timestamp(),
                'compatibility_vector': None  # Will be computed during matching
            }
            
            # Store profile
            self.user_profiles[user_commitment] = profile
            
            return profile
            
        except Exception as e:
            self.logger.error(f"Error creating user profile: {e}")
            return {}
    
    def find_compatible_peers(self, user_commitment: str, db: Session, limit: int = 5) -> List[Dict]:
        """Find most compatible peers using multiple matching algorithms"""
        try:
            if user_commitment not in self.user_profiles:
                return []
            
            user_profile = self.user_profiles[user_commitment]
            candidates = []
            
            # Get all other user profiles
            other_profiles = {k: v for k, v in self.user_profiles.items() 
                            if k != user_commitment}
            
            if len(other_profiles) == 0:
                return []
            
            # Text-based similarity (preferences and topics)
            text_similarities = self._calculate_text_similarity(user_profile, other_profiles)
            
            # Behavioral similarity (mood patterns and session history)
            behavioral_similarities = self._calculate_behavioral_similarity(user_profile, other_profiles)
            
            # Temporal compatibility (active times, session preferences)
            temporal_compatibility = self._calculate_temporal_compatibility(user_profile, other_profiles)
            
            # Combine similarity scores
            for other_commitment, other_profile in other_profiles.items():
                text_sim = text_similarities.get(other_commitment, 0)
                behavioral_sim = behavioral_similarities.get(other_commitment, 0)
                temporal_sim = temporal_compatibility.get(other_commitment, 0)
                
                # Weighted combination
                combined_score = (
                    text_sim * 0.4 +
                    behavioral_sim * 0.4 +
                    temporal_sim * 0.2
                )
                
                if combined_score >= self.compatibility_threshold:
                    candidates.append({
                        'user_commitment': other_commitment,
                        'compatibility_score': round(combined_score, 3),
                        'text_similarity': round(text_sim, 3),
                        'behavioral_similarity': round(behavioral_sim, 3),
                        'temporal_compatibility': round(temporal_sim, 3),
                        'shared_topics': self._find_shared_topics(user_profile, other_profile),
                        'profile_summary': self._create_profile_summary(other_profile)
                    })
            
            # Sort by compatibility score and return top matches
            candidates.sort(key=lambda x: x['compatibility_score'], reverse=True)
            return candidates[:limit]
            
        except Exception as e:
            self.logger.error(f"Error finding compatible peers: {e}")
            return []
    
    def _build_preference_text(self, preferences: Dict) -> str:
        """Build text representation of user preferences"""
        text_parts = []
        
        # Add topics
        topics = preferences.get('topics', '')
        if topics:
            text_parts.append(topics)
        
        # Add severity level context
        severity = preferences.get('severity_level', '')
        if severity:
            text_parts.append(f"severity {severity}")
        
        # Add age range context
        age_range = preferences.get('age_range', '')
        if age_range:
            text_parts.append(f"age {age_range}")
        
        # Add preferred times as context
        preferred_times = preferences.get('preferred_times', [])
        if preferred_times:
            times_text = ' '.join(preferred_times)
            text_parts.append(f"active {times_text}")
        
        return ' '.join(text_parts).lower()
    
    def _analyze_mood_patterns(self, user_commitment: str, db: Session) -> Dict:
        """Analyze user's mood patterns for behavioral matching"""
        try:
            # Get recent mood entries
            mood_entries = db.query(MoodEntry).filter(
                MoodEntry.user_commitment == user_commitment
            ).order_by(MoodEntry.timestamp.desc()).limit(30).all()
            
            if not mood_entries:
                return {'avg_mood': 5.0, 'mood_variance': 0.0, 'trend': 'stable'}
            
            scores = [entry.mood_score for entry in mood_entries]
            
            return {
                'avg_mood': np.mean(scores),
                'mood_variance': np.var(scores),
                'trend': 'improving' if len(scores) > 5 and scores[0] > scores[-1] else 'stable',
                'crisis_episodes': sum(1 for entry in mood_entries if entry.crisis_flag),
                'total_entries': len(scores)
            }
            
        except Exception as e:
            self.logger.error(f"Error analyzing mood patterns: {e}")
            return {'avg_mood': 5.0, 'mood_variance': 0.0, 'trend': 'stable'}
    
    def _analyze_session_history(self, user_commitment: str, db: Session) -> Dict:
        """Analyze user's session participation history"""
        try:
            # Get session participation
            sessions = db.query(PeerSession).filter(
                PeerSession.creator_commitment == user_commitment
            ).all()
            
            return {
                'sessions_created': len(sessions),
                'preferred_session_size': np.mean([s.max_participants for s in sessions]) if sessions else 4,
                'active_participant': len(sessions) > 0
            }
            
        except Exception as e:
            self.logger.error(f"Error analyzing session history: {e}")
            return {'sessions_created': 0, 'preferred_session_size': 4, 'active_participant': False}
    
    def _calculate_text_similarity(self, user_profile: Dict, other_profiles: Dict) -> Dict:
        """Calculate text-based similarity using TF-IDF"""
        try:
            # Collect all preference texts
            all_texts = [user_profile['preference_text']]
            commitments = [user_profile['commitment']]
            
            for commitment, profile in other_profiles.items():
                all_texts.append(profile['preference_text'])
                commitments.append(commitment)
            
            if len(all_texts) < 2:
                return {}
            
            # Vectorize texts
            tfidf_matrix = self.vectorizer.fit_transform(all_texts)
            
            # Calculate similarities
            similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
            
            # Map similarities to commitments
            similarity_dict = {}
            for i, similarity in enumerate(similarities):
                other_commitment = commitments[i + 1]  # Skip first (user's own)
                similarity_dict[other_commitment] = similarity
            
            return similarity_dict
            
        except Exception as e:
            self.logger.error(f"Error calculating text similarity: {e}")
            return {}
    
    def _calculate_behavioral_similarity(self, user_profile: Dict, other_profiles: Dict) -> Dict:
        """Calculate behavioral similarity based on mood patterns"""
        try:
            user_mood = user_profile['mood_patterns']
            similarities = {}
            
            for commitment, other_profile in other_profiles.items():
                other_mood = other_profile['mood_patterns']
                
                # Compare mood averages (closer averages = higher similarity)
                mood_diff = abs(user_mood['avg_mood'] - other_mood['avg_mood'])
                mood_similarity = max(0, 1 - (mood_diff / 5.0))  # Normalize to 0-1
                
                # Compare variance (similar variance = similar stability)
                var_diff = abs(user_mood['mood_variance'] - other_mood['mood_variance'])
                var_similarity = max(0, 1 - (var_diff / 2.0))
                
                # Combine behavioral factors
                behavioral_score = (mood_similarity * 0.7 + var_similarity * 0.3)
                similarities[commitment] = behavioral_score
            
            return similarities
            
        except Exception as e:
            self.logger.error(f"Error calculating behavioral similarity: {e}")
            return {}
    
    def _calculate_temporal_compatibility(self, user_profile: Dict, other_profiles: Dict) -> Dict:
        """Calculate temporal compatibility (active times, session preferences)"""
        try:
            user_times = set(user_profile['preferences'].get('preferred_times', []))
            compatibilities = {}
            
            for commitment, other_profile in other_profiles.items():
                other_times = set(other_profile['preferences'].get('preferred_times', []))
                
                if not user_times or not other_times:
                    compatibilities[commitment] = 0.5  # Neutral compatibility
                else:
                    # Calculate overlap
                    overlap = len(user_times.intersection(other_times))
                    total = len(user_times.union(other_times))
                    compatibility = overlap / total if total > 0 else 0
                    compatibilities[commitment] = compatibility
            
            return compatibilities
            
        except Exception as e:
            self.logger.error(f"Error calculating temporal compatibility: {e}")
            return {}
    
    def _find_shared_topics(self, user_profile: Dict, other_profile: Dict) -> List[str]:
        """Find shared topics between users"""
        try:
            user_topics = set(user_profile['preferences'].get('topics', '').lower().split(', '))
            other_topics = set(other_profile['preferences'].get('topics', '').lower().split(', '))
            
            shared = user_topics.intersection(other_topics)
            return list(shared) if shared else []
            
        except Exception as e:
            self.logger.error(f"Error finding shared topics: {e}")
            return []
    
    def _create_profile_summary(self, profile: Dict) -> Dict:
        """Create anonymous profile summary for display"""
        return {
            'topics': profile['preferences'].get('topics', 'General support'),
            'severity_level': profile['preferences'].get('severity_level', 'moderate'),
            'age_range': profile['preferences'].get('age_range', '25-35'),
            'active_times': profile['preferences'].get('preferred_times', []),
            'avg_mood': round(profile['mood_patterns'].get('avg_mood', 5.0), 1),
            'sessions_created': profile['session_history'].get('sessions_created', 0)
        }
    
    def update_user_activity(self, user_commitment: str, activity_data: Dict):
        """Update user profile based on new activity"""
        if user_commitment in self.user_profiles:
            profile = self.user_profiles[user_commitment]
            profile['last_activity'] = self._get_timestamp()
            # Update activity-based metrics
            if 'mood_score' in activity_data:
                # Update mood patterns (simplified)
                pass
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.utcnow().isoformat()
