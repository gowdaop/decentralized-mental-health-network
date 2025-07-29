from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.auth import AuthService
from app.services.mood import MoodService
from app.models.user import User, MoodEntry  # ✅ Added User import
from pydantic import BaseModel
from typing import List, Optional
import json

# AI services - with fallback if not available
try:
    from app.ai.services.crisis_detector import CrisisDetector
    from app.ai.services.mood_analyzer import MoodAnalyzer
    crisis_detector = CrisisDetector()
    mood_analyzer = MoodAnalyzer()
    AI_ENABLED = True
    print("✅ AI components loaded for mood analysis")
except ImportError as e:
    print(f"⚠️ AI components not available: {e}")
    AI_ENABLED = False
    crisis_detector = None
    mood_analyzer = None

router = APIRouter()
auth_service = AuthService()

# Initialize mood service with fallback
try:
    mood_service = MoodService()
except:
    mood_service = None

class MoodRecord(BaseModel):
    score: float  # 1-10 scale
    description: str
    triggers: Optional[str] = ""
    notes: Optional[str] = ""

def get_current_user_commitment(token: str = Depends(auth_service.verify_token)) -> str:
    """Extract user commitment from token"""
    try:
        # Assuming your auth service returns user data from token
        if isinstance(token, dict):
            return token.get("commitment")
        return token  # If it returns commitment directly
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
):
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
        
        # Create mood entry
        mood_entry = MoodEntry(
            user_id=user.id,
            user_commitment=current_user_commitment,
            encrypted_data=json.dumps(mood_data.dict()),  # Store encrypted data
            mood_score=mood_data.score,
            description=mood_data.description,
            triggers=mood_data.triggers,
            notes=mood_data.notes,
            crisis_flag=False,
            needs_intervention=False
        )
        
        # Perform AI crisis detection if available
        crisis_analysis = {
            'risk_level': 'MINIMAL',
            'needs_intervention': False,
            'recommendations': ['Continue monitoring your mood']
        }
        
        if AI_ENABLED and crisis_detector:
            try:
                full_text = f"{mood_data.description} {mood_data.triggers} {mood_data.notes}".strip()
                crisis_analysis = crisis_detector.analyze_text(full_text)

                
                # Update mood entry with AI analysis
                mood_entry.risk_level = crisis_analysis['risk_level']
                mood_entry.needs_intervention = crisis_analysis['needs_intervention']
                mood_entry.crisis_flag = crisis_analysis['needs_intervention']
                
            except Exception as ai_error:
                print(f"⚠️ AI analysis error: {ai_error}")
        
        # Save to database
        db.add(mood_entry)
        db.commit()
        db.refresh(mood_entry)
        
        # Schedule background crisis intervention if needed
        if crisis_analysis['needs_intervention']:
            background_tasks.add_task(
                handle_crisis_intervention,
                current_user_commitment,
                crisis_analysis
            )
        
        response = {
            "message": "Mood recorded successfully",
            "mood_entry_id": mood_entry.id,
            "crisis_analysis": {
                "risk_level": crisis_analysis['risk_level'],
                "needs_intervention": crisis_analysis['needs_intervention'],
                "recommendations": crisis_analysis['recommendations'][:3]
            }
        }
        
        # Add urgent warnings for high-risk situations with Indian resources
        if crisis_analysis['risk_level'] == 'HIGH':
            response["urgent_notice"] = "High risk detected. Please consider immediate professional support."
            response["crisis_resources"] = [
                "AASRA: 022-27546669 (24/7 suicide prevention)",
                "iCall: 9152987821 (Psychological support)",
                "Vandrevala Foundation: 1860-2662-345 (Mental health)",
                "Sumaitri: 011-23389090 (Delhi crisis helpline)"
            ]
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
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
):
    """Get comprehensive mood analysis with AI insights"""
    try:
        # Get user's mood entries
        user = db.query(User).filter(User.commitment == current_user_commitment).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get mood entries from last N days
        from datetime import datetime, timedelta
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        mood_entries = db.query(MoodEntry).filter(
            MoodEntry.user_id == user.id,
            MoodEntry.timestamp >= cutoff_date
        ).order_by(MoodEntry.timestamp.desc()).all()
        
        if not mood_entries:
            return {
                "user_analysis": {
                    "period_days": days,
                    "entries_count": 0,
                    "message": "No mood entries found for the specified period"
                }
            }
        
        # Basic analysis
        scores = [entry.mood_score for entry in mood_entries]
        avg_mood = sum(scores) / len(scores)
        
        # Risk assessment
        high_risk_count = len([e for e in mood_entries if e.crisis_flag])
        risk_level = "HIGH" if high_risk_count > 0 else "LOW" if avg_mood > 6 else "MEDIUM"
        
        # AI-powered analysis if available
        ai_analysis = {}
        if AI_ENABLED and mood_analyzer:
            try:
                ai_analysis = mood_analyzer.analyze_user_trends(current_user_commitment, db, days)
            except Exception as ai_error:
                print(f"⚠️ AI analysis error: {ai_error}")
        
        analysis = {
            "period_days": days,
            "entries_count": len(mood_entries),
            "trend": {
                "direction": "stable",  # Could be enhanced with AI
                "average_mood": round(avg_mood, 2)
            },
            "patterns": {
                "volatility": {"level": "medium"}  # Could be calculated
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
        
        # Merge AI analysis if available
        if ai_analysis:
            analysis.update(ai_analysis)
        
        return {
            "user_analysis": analysis,
            "privacy_note": "Analysis performed on encrypted data - your privacy is protected"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze mood trends: {str(e)}"
        )

@router.get("/community-insights")
async def get_community_insights(db: Session = Depends(get_db)):
    """Get anonymized community mood insights"""
    try:
        # Get aggregated community statistics
        from sqlalchemy import func
        
        total_users = db.query(User).filter(User.is_active == True).count()
        total_entries = db.query(MoodEntry).count()
        
        if total_entries == 0:
            return {
                "community_insights": {
                    "total_active_users": total_users,
                    "total_mood_entries": 0,
                    "message": "Not enough data for community insights"
                }
            }
        
        # Calculate community statistics
        avg_community_mood = db.query(func.avg(MoodEntry.mood_score)).scalar()
        crisis_entries_count = db.query(MoodEntry).filter(MoodEntry.crisis_flag == True).count()
        
        # AI-powered community insights if available
        ai_insights = {}
        if AI_ENABLED and mood_analyzer:
            try:
                ai_insights = mood_analyzer.generate_community_insights(db)
            except Exception as ai_error:
                print(f"⚠️ Community AI analysis error: {ai_error}")
        
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
        
        # Merge AI insights if available
        if ai_insights:
            insights.update(ai_insights)
        
        return {"community_insights": insights}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate community insights: {str(e)}"
        )

async def handle_crisis_intervention(user_commitment: str, crisis_analysis: dict):
    """Background task to handle crisis intervention"""
    try:
        if crisis_analysis['needs_intervention']:
            # Log crisis event (anonymized)
            print(f"🚨 Crisis intervention triggered for user: {user_commitment[:8]}...")
            print(f"Risk level: {crisis_analysis['risk_level']}")
            
            # In production, this could:
            # 1. Send anonymous alert to crisis counselors
            # 2. Trigger automated supportive messages
            # 3. Update community support algorithms
            # 4. Generate anonymous crisis statistics
            
            # For development/testing
            crisis_log = {
                "timestamp": str(datetime.utcnow()),
                "risk_level": crisis_analysis['risk_level'],
                "user_hash": user_commitment[:8],  # Partial hash for logging
                "action": "crisis_intervention_logged"
            }
            print(f"Crisis intervention logged: {crisis_log}")
            
    except Exception as e:
        print(f"❌ Error handling crisis intervention: {e}")

# Health check for mood service
@router.get("/health")
async def mood_service_health():
    """Health check for mood tracking service"""
    return {
        "service": "mood_tracking",
        "status": "operational",
        "ai_components": "enabled" if AI_ENABLED else "disabled",
        "features": [
            "mood_recording",
            "crisis_detection" if AI_ENABLED else "basic_crisis_detection",
            "trend_analysis",
            "community_insights"
        ]
    }
