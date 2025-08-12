import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.user import MoodEntry
from app.crypto.identity import AnonymousIdentity
from datetime import datetime, timezone, timedelta  # ✅ Added timedelta
import logging


class MoodAnalyzer:
    def __init__(self):
        self.identity_manager = AnonymousIdentity()
        self.logger = logging.getLogger(__name__)
    
    def analyze_user_trends(self, user_commitment: str, db: Session, days: int = 30) -> Dict:
        """Analyze user mood trends over specified period"""
        try:
            # Get mood entries
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            entries = db.query(MoodEntry).filter(
                MoodEntry.user_commitment == user_commitment,
                MoodEntry.timestamp >= cutoff_date
            ).order_by(MoodEntry.timestamp.asc()).all()
            
            if len(entries) < 2:
                return self._minimal_analysis()
            
            # Convert to pandas for analysis
            df = pd.DataFrame([{
                'timestamp': entry.timestamp,
                'mood_score': entry.mood_score,
                'crisis_flag': entry.crisis_flag
            } for entry in entries])
            
            # Trend analysis
            trend_analysis = self._calculate_trend(df)
            
            # Pattern analysis
            pattern_analysis = self._analyze_patterns(df)
            
            # Risk assessment
            risk_analysis = self._assess_risk_trends(df)
            
            # Progress indicators
            progress_metrics = self._calculate_progress(df)
            
            return {
                'period_days': days,
                'total_entries': len(entries),
                'trend': trend_analysis,
                'patterns': pattern_analysis,
                'risk': risk_analysis,
                'progress': progress_metrics,
                'recommendations': self._generate_trend_recommendations(trend_analysis, risk_analysis),
                'analyzed_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error analyzing mood trends: {e}")
            return self._minimal_analysis()
    
    def _calculate_trend(self, df: pd.DataFrame) -> Dict:
        """Calculate mood trend using linear regression"""
        try:
            # Convert timestamps to numeric for regression
            df['timestamp_numeric'] = pd.to_numeric(df['timestamp'])
            
            # Linear regression coefficient
            correlation = np.corrcoef(df['timestamp_numeric'], df['mood_score'])[0, 1]
            slope = np.polyfit(df['timestamp_numeric'], df['mood_score'], 1)[0]
            
            # Trend classification
            if slope > 0.01:
                trend_direction = "improving"
            elif slope < -0.01:
                trend_direction = "declining"
            else:
                trend_direction = "stable"
            
            return {
                'direction': trend_direction,
                'slope': float(slope),
                'correlation': float(correlation) if not np.isnan(correlation) else 0.0,
                'average_mood': float(df['mood_score'].mean()),
                'mood_range': {
                    'min': float(df['mood_score'].min()),
                    'max': float(df['mood_score'].max())
                }
            }
            
        except Exception as e:
            self.logger.error(f"Error calculating trend: {e}")
            return {'direction': 'stable', 'slope': 0.0, 'correlation': 0.0}
    
    def _analyze_patterns(self, df: pd.DataFrame) -> Dict:
        """Analyze mood patterns and cycles"""
        try:
            # Day of week patterns
            df['day_of_week'] = df['timestamp'].dt.dayofweek
            daily_avg = df.groupby('day_of_week')['mood_score'].mean()
            
            # Time of day patterns (if timestamp includes time)
            df['hour'] = df['timestamp'].dt.hour
            hourly_avg = df.groupby('hour')['mood_score'].mean()
            
            # Volatility analysis
            mood_std = df['mood_score'].std()
            volatility_level = "high" if mood_std > 2 else "medium" if mood_std > 1 else "low"
            
            return {
                'volatility': {
                    'level': volatility_level,
                    'standard_deviation': float(mood_std)
                },
                'daily_patterns': {
                    'best_day': int(daily_avg.idxmax()) if len(daily_avg) > 0 else None,
                    'worst_day': int(daily_avg.idxmin()) if len(daily_avg) > 0 else None,
                    'day_averages': daily_avg.to_dict()
                },
                'time_patterns': {
                    'best_hour': int(hourly_avg.idxmax()) if len(hourly_avg) > 0 else None,
                    'worst_hour': int(hourly_avg.idxmin()) if len(hourly_avg) > 0 else None
                }
            }
            
        except Exception as e:
            self.logger.error(f"Error analyzing patterns: {e}")
            return {'volatility': {'level': 'unknown', 'standard_deviation': 0.0}}
    
    def _assess_risk_trends(self, df: pd.DataFrame) -> Dict:
        """Assess risk trends and crisis indicators"""
        try:
            # Crisis episode analysis
            crisis_entries = df[df['crisis_flag'] == True]
            crisis_rate = len(crisis_entries) / len(df) if len(df) > 0 else 0
            
            # Low mood episodes
            low_mood_threshold = 3.0
            low_mood_entries = df[df['mood_score'] <= low_mood_threshold]
            low_mood_rate = len(low_mood_entries) / len(df) if len(df) > 0 else 0
            
            # Recent trend in crises (last 7 days vs previous period)
            recent_cutoff = df['timestamp'].max() - timedelta(days=7)
            recent_df = df[df['timestamp'] >= recent_cutoff]
            older_df = df[df['timestamp'] < recent_cutoff]
            
            recent_crisis_rate = len(recent_df[recent_df['crisis_flag']]) / len(recent_df) if len(recent_df) > 0 else 0
            older_crisis_rate = len(older_df[older_df['crisis_flag']]) / len(older_df) if len(older_df) > 0 else 0
            
            # Risk level assessment
            if crisis_rate > 0.3 or recent_crisis_rate > 0.4:
                risk_level = "HIGH"
            elif crisis_rate > 0.1 or low_mood_rate > 0.4:
                risk_level = "MEDIUM"
            elif low_mood_rate > 0.2:
                risk_level = "LOW"
            else:
                risk_level = "MINIMAL"
            
            return {
                'level': risk_level,
                'crisis_rate': crisis_rate,
                'low_mood_rate': low_mood_rate,
                'recent_trend': 'increasing' if recent_crisis_rate > older_crisis_rate else 'stable',
                'total_crisis_episodes': int(df['crisis_flag'].sum())
            }
            
        except Exception as e:
            self.logger.error(f"Error assessing risk trends: {e}")
            return {'level': 'UNKNOWN', 'crisis_rate': 0.0}
    
    def _calculate_progress(self, df: pd.DataFrame) -> Dict:
        """Calculate progress indicators"""
        try:
            # Split data into periods for comparison
            mid_point = len(df) // 2
            early_period = df.iloc[:mid_point]
            recent_period = df.iloc[mid_point:]
            
            early_avg = early_period['mood_score'].mean()
            recent_avg = recent_period['mood_score'].mean()
            
            improvement = recent_avg - early_avg
            
            return {
                'improvement_score': float(improvement),
                'early_period_avg': float(early_avg),
                'recent_period_avg': float(recent_avg),
                'consistency_score': float(1 / (df['mood_score'].std() + 1)),  # Higher = more consistent
                'engagement_score': min(len(df) / 30, 1.0)  # Based on entry frequency
            }
            
        except Exception as e:
            self.logger.error(f"Error calculating progress: {e}")
            return {'improvement_score': 0.0, 'consistency_score': 0.0}
    
    def _generate_trend_recommendations(self, trend: Dict, risk: Dict) -> List[str]:
        """Generate personalized recommendations based on trends"""
        recommendations = []
        
        # Trend-based recommendations
        if trend['direction'] == 'improving':
            recommendations.append("Great progress! Continue with current strategies")
            recommendations.append("Consider sharing your success with the community")
        elif trend['direction'] == 'declining':
            recommendations.append("Consider reaching out for additional support")
            recommendations.append("Review recent changes that might be affecting your mood")
        else:
            recommendations.append("Your mood appears stable - maintain current routine")
        
        # Risk-based recommendations
        if risk['level'] == 'HIGH':
            recommendations.append("High risk detected - please consider professional support")
            recommendations.append("Crisis resources: 988 (US) or local emergency services")
        elif risk['level'] == 'MEDIUM':
            recommendations.append("Increased support recommended - engage with community")
            recommendations.append("Consider scheduling regular check-ins with support network")
        
        # General recommendations
        if len(recommendations) == 0:
            recommendations.append("Continue monitoring your mood patterns")
            recommendations.append("Stay connected with your support community")
        
        return recommendations
    
    def _minimal_analysis(self) -> Dict:
        """Return minimal analysis for insufficient data"""
        return {
            'period_days': 30,
            'total_entries': 0,
            'trend': {'direction': 'insufficient_data'},
            'patterns': {'volatility': {'level': 'unknown'}},
            'risk': {'level': 'UNKNOWN'},
            'progress': {'improvement_score': 0.0},
            'recommendations': ['Please log more mood entries for detailed analysis'],
            'analyzed_at': datetime.utcnow().isoformat()
        }

    def generate_community_insights(self, db: Session, days: int = 7) -> Dict:
        """Generate anonymized community mood insights"""
        try:
            # Get community mood data (last 7 days)
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            entries = db.query(MoodEntry).filter(
                MoodEntry.timestamp >= cutoff_date
            ).all()
            
            if len(entries) < 10:  # Need minimum data for meaningful insights
                return {'error': 'Insufficient community data'}
            
            # Aggregate statistics
            mood_scores = [entry.mood_score for entry in entries]
            crisis_flags = [entry.crisis_flag for entry in entries]
            
            return {
                'period_days': days,
                'total_entries': len(entries),
                'community_metrics': {
                    'average_mood': np.mean(mood_scores),
                    'mood_distribution': {
                        'excellent': sum(1 for score in mood_scores if score >= 8),
                        'good': sum(1 for score in mood_scores if 6 <= score < 8),
                        'moderate': sum(1 for score in mood_scores if 4 <= score < 6),
                        'low': sum(1 for score in mood_scores if 2 <= score < 4),
                        'crisis': sum(1 for score in mood_scores if score < 2)
                    },
                    'crisis_rate': sum(crisis_flags) / len(crisis_flags),
                    'active_users': len(set(entry.user_commitment for entry in entries))
                },
                'insights': self._generate_community_insights_text(mood_scores, crisis_flags),
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error generating community insights: {e}")
            return {'error': 'Unable to generate community insights'}
    
    def _generate_community_insights_text(self, mood_scores: List[float], crisis_flags: List[bool]) -> List[str]:
        """Generate textual insights about community mood"""
        insights = []
        
        avg_mood = np.mean(mood_scores)
        if avg_mood >= 6:
            insights.append("Community mood is generally positive this week")
        elif avg_mood <= 4:
            insights.append("Community may benefit from additional support resources")
        else:
            insights.append("Community mood is moderate - mixed experiences reported")
        
        crisis_rate = sum(crisis_flags) / len(crisis_flags)
        if crisis_rate > 0.15:
            insights.append("Higher than usual crisis indicators - community support is important")
        elif crisis_rate < 0.05:
            insights.append("Low crisis indicators - community appears stable")
        
        return insights
