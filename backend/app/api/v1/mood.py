from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.auth import AuthService
from app.services.mood import MoodService
from app.ai.services.crisis_detector import CrisisDetector
from app.ai.services.mood_analyzer import MoodAnalyzer
from app.models.user import MoodEntry
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()
auth_service = AuthService()
mood_service = MoodService()
crisis_detector = CrisisDetector()
mood_analyzer = MoodAnalyzer()

class MoodRecord(BaseModel):
    score: float
    description: str
    triggers: Optional[str] = ""
    notes: Optional[str] = ""

@router.post("/record")
async def record_mood(
    mood_data: MoodRecord,
    background_tasks: BackgroundTasks,
    current_user: str = Depends(auth_service.verify_token),
    db: Session = Depends(get_db)
):
    """Record mood entry with AI analysis"""
    try:
        # Create mood entry in database
        mood_entry = mood_service.record_mood(current_user, mood_data.dict(), db)
        
        # Perform crisis detection analysis
        full_text = f"{mood_data.description} {mood_data.triggers} {mood_data.notes}".strip()
        crisis_analysis = crisis_detector.analyze_text(full_text)
        
        # Update crisis flag if needed
        if crisis_analysis['needs_intervention']:
            mood_entry.crisis_flag = True
            db.commit()
        
        # Schedule background tasks
        background_tasks.add_task(
            handle_crisis_intervention,
            current_user,
            crisis_analysis,
            db
        )
        
        response = {
            "message": "Mood recorded successfully",
            "mood_entry_id": mood_entry.id,
            "crisis_analysis": {
                "risk_level": crisis_analysis['risk_level'],
                "needs_intervention": crisis_analysis['needs_intervention'],
                "recommendations": crisis_analysis['recommendations'][:3]  # Limit for API response
            }
        }
        
        # Add urgent warnings for high-risk situations
        if crisis_analysis['risk_level'] == 'HIGH':
            response["urgent_notice"] = "High risk detected. Please consider immediate professional support."
            response["crisis_resources"] = [
                "Crisis Text Line: Text HOME to 741741",
                "National Suicide Prevention Lifeline: 988",
                "Emergency Services: 911"
            ]
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record mood: {str(e)}"
        )

@router.get("/analysis")
async def get_mood_analysis(
    days: int = 30,
    current_user: str = Depends(auth_service.verify_token),
    db: Session = Depends(get_db)
):
    """Get comprehensive mood analysis with AI insights"""
    try:
        # Get AI-powered mood analysis
        analysis = mood_analyzer.analyze_user_trends(current_user, db, days)
        
        return {
            "user_analysis": analysis,
            "privacy_note": "Analysis performed on encrypted data - your privacy is protected"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze mood trends: {str(e)}"
        )

@router.get("/community-insights")
async def get_community_insights(db: Session = Depends(get_db)):
    """Get anonymized community mood insights"""
    try:
        insights = mood_analyzer.generate_community_insights(db)
        return insights
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate community insights: {str(e)}"
        )

async def handle_crisis_intervention(user_commitment: str, crisis_analysis: dict, db: Session):
    """Background task to handle crisis intervention"""
    try:
        if crisis_analysis['needs_intervention']:
            # Log crisis event
            print(f"🚨 Crisis intervention needed for user: {user_commitment[:8]}...")
            print(f"Risk level: {crisis_analysis['risk_level']}")
            
            # In a production system, this could:
            # 1. Trigger notifications to crisis counselors
            # 2. Send automated supportive messages
            # 3. Connect user to immediate resources
            # 4. Update user's support network (with consent)
            
            # For now, we'll log the intervention
            pass
            
    except Exception as e:
        print(f"Error handling crisis intervention: {e}")
