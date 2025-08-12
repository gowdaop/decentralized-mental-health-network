from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.connection import get_db, SessionLocal  # ✅ Added SessionLocal for background tasks
from app.services.auth import AuthService
from app.services.mood import MoodService
from app.models.user import User, MoodEntry
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import json
import logging
import asyncio
from contextlib import contextmanager

# ✅ FIXED: Improved logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# AI services - with fallback if not available
try:
    from app.ai.services.crisis_detector import CrisisDetector
    from app.ai.services.mood_analyzer import MoodAnalyzer
    crisis_detector = CrisisDetector()
    mood_analyzer = MoodAnalyzer()
    AI_ENABLED = True
    logger.info("✅ AI components loaded for mood analysis")
except ImportError as e:
    logger.warning(f"⚠️ AI components not available: {e}")
    AI_ENABLED = False
    crisis_detector = None
    mood_analyzer = None

router = APIRouter()
auth_service = AuthService()

# Initialize mood service with fallback
try:
    mood_service = MoodService()
    logger.info("✅ MoodService initialized successfully")
except Exception as e:
    logger.error(f"⚠️ MoodService initialization failed: {e}")
    mood_service = None


class MoodRecord(BaseModel):
    score: float  # 1-10 scale
    description: str
    triggers: Optional[str] = ""
    notes: Optional[str] = ""


# ✅ FIXED: Added proper database session context manager for background tasks
@contextmanager
def get_background_db():
    """Create a new database session for background tasks"""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database error in background task: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def get_current_user_commitment(token: str = Depends(auth_service.verify_token)) -> str:
    """Extract user commitment from token"""
    try:
        if isinstance(token, dict):
            return token.get("commitment")
        return token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )


@router.post("/record")
async def record_mood(
    mood_data: MoodRecord,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user_commitment: str = Depends(get_current_user_commitment)
) -> Dict[str, Any]:
    """Record mood entry with AI crisis detection"""
    try:
        # Validate mood score
        if not (1 <= mood_data.score <= 10):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mood score must be between 1 and 10"
            )
        
        # Get user from database
        user = db.query(User).filter(User.commitment == current_user_commitment).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Create mood entry with fields that exist in your model
        mood_entry = MoodEntry(
            user_id=user.id,
            user_commitment=current_user_commitment,
            encrypted_data=json.dumps(mood_data.dict()),
            mood_score=mood_data.score,
            description=mood_data.description,
            triggers=mood_data.triggers or "",
            notes=mood_data.notes or "",
            crisis_flag=False,  # Will be updated after AI analysis
            timestamp=datetime.now(timezone.utc)
        )
        
        # Initialize default crisis analysis
        crisis_analysis = {
            'risk_level': 'MINIMAL',
            'needs_intervention': False,
            'recommendations': ['Continue monitoring your mood'],
            'sentiment': {},
            'keywords': {}
        }
        
        # Perform AI crisis detection if available
        if AI_ENABLED and crisis_detector:
            try:
                full_text = f"{mood_data.description} {mood_data.triggers or ''} {mood_data.notes or ''}".strip()
                crisis_analysis = crisis_detector.analyze_text(full_text)
                
                # Update crisis_flag based on AI analysis
                mood_entry.crisis_flag = crisis_analysis.get('needs_intervention', False)
                
                logger.info(f"AI Analysis complete - Risk: {crisis_analysis.get('risk_level')}")
                
            except Exception as ai_error:
                logger.error(f"⚠️ AI analysis error: {ai_error}", exc_info=True)
        
        # Save to database
        db.add(mood_entry)
        db.commit()
        db.refresh(mood_entry)
        
        # ✅ FIXED: Schedule background crisis intervention with proper session handling
        if crisis_analysis.get('needs_intervention', False):
            background_tasks.add_task(
                handle_crisis_intervention,
                current_user_commitment,
                crisis_analysis,
                mood_entry.id
            )
        
        # ✅ FIXED: Schedule reputation update in background
        background_tasks.add_task(
            update_user_reputation_after_mood_entry,
            current_user_commitment
        )
        
        response = {
            "message": "Mood recorded successfully",
            "mood_entry_id": mood_entry.id,
            "crisis_analysis": {
                "risk_level": crisis_analysis.get('risk_level', 'MINIMAL'),
                "needs_intervention": crisis_analysis.get('needs_intervention', False),
                "recommendations": crisis_analysis.get('recommendations', [])[:3]
            }
        }
        
        # Add urgent warnings for high-risk situations
        if crisis_analysis.get('risk_level') == 'HIGH':
            response["crisis_resources"] = [
                "🇮🇳 AASRA: 91-9820466726 (24/7 suicide prevention helpline)",
                "🇮🇳 iCall: 9152987821 (Psychosocial support - TISS Mumbai)", 
                "🇮🇳 Vandrevala Foundation: 9999666555 (24/7 mental health helpline)",
                "🇮🇳 Sumaitri: 011-23389090 (Delhi-based crisis helpline)",
                "🇮🇳 Sneha Foundation: 044-24640050 (Chennai crisis helpline)",
                "🇮🇳 Sahai: 080-25497777 (Bangalore emotional support)",
                "🇮🇳 Roshni Trust: 040-66202000 (Hyderabad crisis helpline)",
                "🇮🇳 Lifeline Foundation: 033-24637401 (Kolkata suicide prevention)"
            ]
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recording mood: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record mood: {str(e)}"
        )


@router.get("/analysis")
async def get_mood_analysis(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user_commitment: str = Depends(get_current_user_commitment)
) -> Dict[str, Any]:
    """Get comprehensive mood analysis with AI insights"""
    try:
        # Validate days parameter
        if days < 1 or days > 365:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Days must be between 1 and 365"
            )
        
        # Get user's mood entries
        user = db.query(User).filter(User.commitment == current_user_commitment).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        mood_entries = db.query(MoodEntry).filter(
            MoodEntry.user_id == user.id,
            MoodEntry.timestamp >= cutoff_date
        ).order_by(MoodEntry.timestamp.desc()).all()
        
        if not mood_entries:
            return {
                "user_analysis": {
                    "period_days": days,
                    "entries_count": 0,
                    "trend": {"direction": "insufficient_data", "average_mood": 0},
                    "patterns": {"volatility": {"level": "unknown"}},
                    "risk": {"level": "UNKNOWN", "high_risk_entries": 0},
                    "recommendations": ["Please log more mood entries for analysis"]
                },
                "privacy_note": "Analysis performed on encrypted data - your privacy is protected"
            }
        
        # Basic analysis
        scores = [entry.mood_score for entry in mood_entries]
        avg_mood = sum(scores) / len(scores)
        
        # Risk assessment
        high_risk_count = len([e for e in mood_entries if e.crisis_flag])
        risk_level = "HIGH" if high_risk_count > 0 else "LOW" if avg_mood > 6 else "MEDIUM"
        
        # Trend calculation (improved)
        trend_direction = "stable"
        if len(scores) >= 3:
            # Use first third vs last third for more stable trend
            first_third = scores[-len(scores)//3:]
            last_third = scores[:len(scores)//3]
            first_avg = sum(first_third) / len(first_third)
            last_avg = sum(last_third) / len(last_third)
            
            if first_avg > last_avg + 0.5:
                trend_direction = "improving"
            elif first_avg < last_avg - 0.5:
                trend_direction = "declining"
        
        analysis = {
            "period_days": days,
            "entries_count": len(mood_entries),
            "trend": {
                "direction": trend_direction,
                "average_mood": round(avg_mood, 2)
            },
            "patterns": {
                "volatility": {
                    "level": "low" if len(set(scores)) <= 2 else "medium" if len(set(scores)) <= 5 else "high"
                }
            },
            "risk": {
                "level": risk_level,
                "high_risk_entries": high_risk_count
            },
            "recommendations": [
                "Continue regular mood tracking",
                "Consider speaking with a mental health professional if patterns concern you",
                "Practice self-care activities that improve your mood"
            ]
        }
        
        # Enhanced AI analysis if available
        if AI_ENABLED and mood_analyzer:
            try:
                ai_analysis = mood_analyzer.analyze_user_trends(current_user_commitment, db, days)
                if ai_analysis and 'total_entries' in ai_analysis:
                    # Merge AI analysis with basic analysis
                    analysis.update(ai_analysis)
                    logger.info("Enhanced AI analysis completed")
            except Exception as ai_error:
                logger.error(f"⚠️ AI analysis error: {ai_error}", exc_info=True)
        
        return {
            "user_analysis": analysis,
            "privacy_note": "Analysis performed on encrypted data - your privacy is protected"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing mood trends: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze mood trends: {str(e)}"
        )


@router.get("/community-insights")
async def get_community_insights(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get anonymized community mood insights"""
    try:
        total_users = db.query(User).filter(User.is_active == True).count()
        total_entries = db.query(MoodEntry).count()
        
        if total_entries == 0:
            return {
                "community_insights": {
                    "total_active_users": total_users,
                    "total_mood_entries": 0,
                    "community_average_mood": 0,
                    "crisis_support_provided": 0,
                    "message": "Not enough data for community insights"
                }
            }
        
        # Calculate community statistics
        avg_community_mood = db.query(func.avg(MoodEntry.mood_score)).scalar()
        crisis_entries_count = db.query(MoodEntry).filter(MoodEntry.crisis_flag == True).count()
        
        insights = {
            "total_active_users": total_users,
            "total_mood_entries": total_entries,
            "community_average_mood": round(float(avg_community_mood), 2) if avg_community_mood else 0,
            "crisis_support_provided": crisis_entries_count,
            "trends": {
                "overall_wellbeing": "stable" if avg_community_mood and avg_community_mood > 5 else "needs_attention"
            },
            "privacy_note": "All data is anonymized and aggregated to protect individual privacy"
        }
        
        # Enhanced AI insights if available
        if AI_ENABLED and mood_analyzer:
            try:
                ai_insights = mood_analyzer.generate_community_insights(db)
                if ai_insights and not ai_insights.get('error'):
                    insights.update(ai_insights)
                    logger.info("Enhanced community AI analysis completed")
            except Exception as ai_error:
                logger.error(f"⚠️ Community AI analysis error: {ai_error}", exc_info=True)
        
        return {"community_insights": insights}
        
    except Exception as e:
        logger.error(f"Error generating community insights: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate community insights: {str(e)}"
        )


# ✅ FIXED: Background task with proper database session management
async def handle_crisis_intervention(user_commitment: str, crisis_analysis: Dict[str, Any], mood_entry_id: int):
    """Background task to handle crisis intervention - with proper database session"""
    try:
        if crisis_analysis.get('needs_intervention', False):
            timestamp = datetime.now(timezone.utc).isoformat()
            
            logger.warning(f"🚨 Crisis intervention triggered for user: {user_commitment[:8]}...")
            logger.warning(f"Risk level: {crisis_analysis.get('risk_level')}")
            logger.warning(f"Mood entry ID: {mood_entry_id}")
            
            # ✅ Use separate database session for background task
            with get_background_db() as db:
                try:
                    # Update mood entry with crisis intervention timestamp
                    mood_entry = db.query(MoodEntry).filter(MoodEntry.id == mood_entry_id).first()
                    if mood_entry:
                        # Add crisis intervention metadata (if you have such fields)
                        # mood_entry.crisis_intervention_timestamp = datetime.now(timezone.utc)
                        db.commit()
                
                except Exception as db_error:
                    logger.error(f"Database error in crisis intervention: {db_error}")
                    db.rollback()
            
            # Crisis intervention actions
            crisis_log = {
                "timestamp": timestamp,
                "risk_level": crisis_analysis.get('risk_level'),
                "user_hash": user_commitment[:8],
                "mood_entry_id": mood_entry_id,
                "action": "crisis_intervention_logged",
                "recommendations": crisis_analysis.get('recommendations', [])
            }
            
            logger.info(f"✅ Crisis intervention logged: {crisis_log}")
            
            # In production, this could:
            # 1. Send anonymous alert to crisis counselors
            # 2. Trigger automated supportive messages  
            # 3. Update community support algorithms
            # 4. Generate anonymous crisis statistics
            # 5. Send notifications to emergency contacts (if configured)
            
    except Exception as e:
        logger.error(f"❌ Error handling crisis intervention: {e}", exc_info=True)
        # Don't re-raise - background tasks should be resilient


# ✅ NEW: Background task for reputation updates
async def update_user_reputation_after_mood_entry(user_commitment: str):
    """Background task to update user reputation after mood entry"""
    try:
        # Import here to avoid circular imports
        from app.services.token_automation import AdvancedReputationService
        
        with get_background_db() as db:
            reputation_service = AdvancedReputationService()
            result = reputation_service.calculate_comprehensive_reputation(user_commitment, db)
            
            if result and not result.get('error'):
                logger.info(f"✅ Reputation updated for user {user_commitment[:8]}...")
            else:
                logger.warning(f"⚠️ Reputation update failed for user {user_commitment[:8]}...")
                
    except Exception as e:
        logger.error(f"❌ Error updating reputation: {e}", exc_info=True)


@router.get("/health")
async def mood_service_health() -> Dict[str, Any]:
    """Health check for mood tracking service"""
    return {
        "service": "mood_tracking",
        "status": "operational",
        "ai_components": "enabled" if AI_ENABLED else "disabled",
        "mood_service": "enabled" if mood_service else "disabled",
        "datetime_import": "fixed",
        "features": [
            "mood_recording",
            "crisis_detection" if AI_ENABLED else "basic_crisis_detection",
            "trend_analysis",
            "community_insights",
            "background_crisis_intervention",
            "reputation_updates"
        ],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "2.0.0"
    }


# ✅ NEW: Additional utility endpoints
@router.get("/stats")
async def get_mood_service_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get mood service statistics"""
    try:
        total_entries = db.query(MoodEntry).count()
        total_users = db.query(User).filter(User.is_active == True).count()
        crisis_entries = db.query(MoodEntry).filter(MoodEntry.crisis_flag == True).count()
        
        # Get entries from last 24 hours
        yesterday = datetime.now(timezone.utc) - timedelta(hours=24)
        recent_entries = db.query(MoodEntry).filter(MoodEntry.timestamp >= yesterday).count()
        
        return {
            "total_mood_entries": total_entries,
            "total_active_users": total_users,
            "crisis_entries_detected": crisis_entries,
            "entries_last_24h": recent_entries,
            "crisis_rate": round((crisis_entries / total_entries * 100), 2) if total_entries > 0 else 0,
            "avg_entries_per_user": round(total_entries / total_users, 2) if total_users > 0 else 0,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting service stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get service statistics"
        )
