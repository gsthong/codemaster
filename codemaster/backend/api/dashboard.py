from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import logging

from ..db.database import get_db
from ..models import User, Submission, Problem
from ..core.security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

from ..services import analytics_service

@router.get("/report")
async def get_dashboard_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Fetch real user submissions and return analytics."""
    submissions = db.query(Submission).filter(Submission.user_id == current_user.id).all()
    
    report = analytics_service.get_full_report(submissions)
    
    # Success rate
    total_attempts = len(submissions)
    total_solved = report["summary"]["AC"]
    success_rate = round((total_solved / total_attempts * 100), 1) if total_attempts > 0 else 0
    
    # Streak
    streak = current_user.streak
    
    # Avg time (minutes)
    avg_time = 0
    if submissions:
        avg_runtime_ms = sum(s.runtime_ms for s in submissions) / len(submissions)
        avg_time = round(avg_runtime_ms / (1000 * 60), 1)
    
    return {
        "summary": {
            "total_solved": total_solved,
            "streak": streak,
            "avg_time_min": avg_time,
            "success_rate": success_rate
        },
        "skill_scores": report["skill_scores"],
        "weak_topics": [t["topic"] for t in report["weak_topics"]],
        "exam_readiness": report["exam_readiness_avg"],
        "full_analytics": report
    }

@router.post("/recommend")
@router.get("/recommend")
async def get_recommendations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Suggest problems based on weakest skills."""
    submissions = db.query(Submission).filter(Submission.user_id == current_user.id).all()
    scores = analytics_service.compute_skill_scores(submissions)
    
    weak_topics = [t for t, s in scores.items() if s < 60]
    if not weak_topics:
        # Just pick some unattempted problems
        problems = db.query(Problem).limit(5).all()
    else:
        # Search for problems in weak topics
        # Filter in Python for cross-DB JSON compatibility
        all_problems = db.query(Problem).all()
        problems = [p for p in all_problems if p.tags and any(t in p.tags for t in weak_topics)]
        problems = problems[:5]

    return [
        {
            "id": p.id,
            "title": p.title,
            "difficulty": p.difficulty,
            "topic": p.tags[0] if p.tags else "General",
            "reason": "Củng cố kỹ năng cơ bản" if p.difficulty == "easy" else "Thử thách nâng cao"
        }
        for p in problems
    ]
