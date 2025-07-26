import re
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from textblob import TextBlob
from typing import Dict, List, Tuple
from app.crypto.identity import AnonymousIdentity
import logging

# Download required NLTK data
try:
    nltk.data.find('vader_lexicon')
except LookupError:
    nltk.download('vader_lexicon')
    
try:
    nltk.data.find('punkt')
except LookupError:
    nltk.download('punkt')

class CrisisDetector:
    def __init__(self):
        self.analyzer = SentimentIntensityAnalyzer()
        self.identity_manager = AnonymousIdentity()
        self.logger = logging.getLogger(__name__)
        
        # Crisis keywords with severity weights
        self.crisis_keywords = {
            'high_risk': {
                'suicide': 1.0, 'kill myself': 1.0, 'end it all': 0.9,
                'not worth living': 0.8, 'want to die': 1.0, 'take my life': 1.0,
                'hurt myself': 0.7, 'self-harm': 0.8, 'cut myself': 0.8
            },
            'medium_risk': {
                'hopeless': 0.6, 'pointless': 0.5, 'give up': 0.6,
                'nobody cares': 0.5, 'alone forever': 0.6, 'worthless': 0.5,
                'burden': 0.4, 'hate myself': 0.6, 'can\'t go on': 0.7
            },
            'low_risk': {
                'sad': 0.2, 'depressed': 0.3, 'down': 0.2,
                'anxious': 0.3, 'worried': 0.2, 'stressed': 0.3
            }
        }
    
    def analyze_encrypted_text(self, encrypted_text: str, user_commitment: str) -> Dict:
        """Analyze encrypted mood text for crisis indicators"""
        try:
            # Decrypt text for analysis (server-side only, never stored)
            decrypted_text = self.identity_manager.decrypt_sensitive_data(encrypted_text)
            
            # Perform analysis
            analysis_result = self.analyze_text(decrypted_text)
            
            # Add user context
            analysis_result['user_commitment'] = user_commitment
            analysis_result['encrypted_original'] = True
            
            return analysis_result
            
        except Exception as e:
            self.logger.error(f"Error analyzing encrypted text: {e}")
            return self._default_analysis()
    
    def analyze_text(self, text: str) -> Dict:
        """Analyze plain text for crisis indicators"""
        try:
            # Clean and normalize text
            cleaned_text = self._clean_text(text)
            
            # Sentiment analysis using VADER
            sentiment_scores = self.analyzer.polarity_scores(cleaned_text)
            
            # TextBlob for additional sentiment validation
            blob = TextBlob(cleaned_text)
            textblob_sentiment = {
                'polarity': blob.sentiment.polarity,
                'subjectivity': blob.sentiment.subjectivity
            }
            
            # Crisis keyword detection
            keyword_analysis = self._analyze_keywords(cleaned_text)
            
            # Risk assessment
            risk_assessment = self._calculate_risk(
                sentiment_scores, textblob_sentiment, keyword_analysis
            )
            
            # Generate recommendations
            recommendations = self._generate_recommendations(risk_assessment)
            
            return {
                'risk_level': risk_assessment['risk_level'],
                'risk_score': risk_assessment['risk_score'],
                'needs_intervention': risk_assessment['needs_intervention'],
                'sentiment': {
                    'vader': sentiment_scores,
                    'textblob': textblob_sentiment
                },
                'keywords': keyword_analysis,
                'recommendations': recommendations,
                'analyzed_at': self._get_timestamp()
            }
            
        except Exception as e:
            self.logger.error(f"Error analyzing text: {e}")
            return self._default_analysis()
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text for analysis"""
        # Convert to lowercase
        text = text.lower()
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        # Remove special characters but keep punctuation for sentiment
        text = re.sub(r'[^\w\s\.\!\?\,\;\:]', '', text)
        return text
    
    def _analyze_keywords(self, text: str) -> Dict:
        """Analyze crisis keywords in text"""
        keyword_matches = {
            'high_risk': [],
            'medium_risk': [],
            'low_risk': []
        }
        
        total_weight = 0.0
        
        for risk_category, keywords in self.crisis_keywords.items():
            for keyword, weight in keywords.items():
                if keyword in text:
                    keyword_matches[risk_category].append({
                        'keyword': keyword,
                        'weight': weight,
                        'count': text.count(keyword)
                    })
                    total_weight += weight * text.count(keyword)
        
        return {
            'matches': keyword_matches,
            'total_weight': total_weight,
            'total_matches': sum(len(matches) for matches in keyword_matches.values())
        }
    
    def _calculate_risk(self, sentiment: Dict, textblob: Dict, keywords: Dict) -> Dict:
        """Calculate overall risk assessment"""
        # Sentiment-based risk (negative sentiment indicates higher risk)
        sentiment_risk = max(0, -sentiment['compound']) * 0.4
        
        # Keyword-based risk
        keyword_risk = min(keywords['total_weight'] * 0.3, 0.6)
        
        # TextBlob polarity (very negative = higher risk)
        textblob_risk = max(0, -textblob['polarity']) * 0.2
        
        # Combined risk score
        total_risk = sentiment_risk + keyword_risk + textblob_risk
        
        # Risk level categorization
        if total_risk >= 0.7:
            risk_level = "HIGH"
            needs_intervention = True
        elif total_risk >= 0.4:
            risk_level = "MEDIUM"
            needs_intervention = True
        elif total_risk >= 0.2:
            risk_level = "LOW"
            needs_intervention = False
        else:
            risk_level = "MINIMAL"
            needs_intervention = False
        
        return {
            'risk_score': round(total_risk, 3),
            'risk_level': risk_level,
            'needs_intervention': needs_intervention,
            'components': {
                'sentiment_risk': sentiment_risk,
                'keyword_risk': keyword_risk,
                'textblob_risk': textblob_risk
            }
        }
    
    def _generate_recommendations(self, risk_assessment: Dict) -> List[str]:
        """Generate recommendations based on risk level"""
        risk_level = risk_assessment['risk_level']
        
        recommendations = {
            'HIGH': [
                "Immediate professional intervention recommended",
                "Contact crisis hotline: 988 (US) or local emergency services",
                "Reach out to trusted friend or family member",
                "Consider emergency room visit if in immediate danger"
            ],
            'MEDIUM': [
                "Consider speaking with a mental health professional",
                "Engage with peer support community",
                "Practice grounding techniques or meditation",
                "Maintain regular sleep and exercise routine"
            ],
            'LOW': [
                "Connect with supportive community members",
                "Practice self-care activities",
                "Consider journaling or mindfulness exercises",
                "Monitor mood patterns over time"
            ],
            'MINIMAL': [
                "Continue positive mental health practices",
                "Stay connected with support network",
                "Maintain healthy lifestyle habits"
            ]
        }
        
        return recommendations.get(risk_level, recommendations['MINIMAL'])
    
    def _default_analysis(self) -> Dict:
        """Return default analysis when errors occur"""
        return {
            'risk_level': 'UNKNOWN',
            'risk_score': 0.0,
            'needs_intervention': False,
            'sentiment': {'vader': {}, 'textblob': {}},
            'keywords': {'matches': {}, 'total_weight': 0},
            'recommendations': ['Unable to analyze - please try again'],
            'error': True,
            'analyzed_at': self._get_timestamp()
        }
    
    def _get_timestamp(self) -> str:
        """Get current timestamp for analysis"""
        from datetime import datetime
        return datetime.utcnow().isoformat()
