from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import logging

from ..db.database import get_db
from ..models import User, Submission, Problem
from ..core.security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

def compute_skill_scores(submissions: List[Submission]) -> Dict[str, float]:
    from collections import defaultdict
    by_topic = defaultdict(list)
    for s in submissions:
        # Extract topics from problem tags
        if s.problem and s.problem.tags:
            for topic in s.problem.tags:
                by_topic[topic].append(s)
        elif s.problem and s.problem.syllabus_topic:
            by_topic[s.problem.syllabus_topic].append(s)

    scores = {}
    for topic, subs in by_topic.items():
        total = len(subs)
        ac = sum(1 for s in subs if s.status == "AC")
        accuracy = ac / total
        
        # Simple heuristic for speed and difficulty
        avg_runtime = sum(s.runtime_ms for s in subs) / total
        speed_factor = 1.0 if avg_runtime < 500 else 0.7
        
        # Difficulty weight
        diff_weight = 1.0
        # (Simplified: could be improved by checking s.problem.difficulty)
        
        score = (0.4 * accuracy + 0.3 * speed_factor + 0.3 * 0.8) * 100
        scores[topic] = round(score, 2)
    
    return scores

@router.get("/report")
async def get_dashboard_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Fetch real user submissions and return analytics."""
    submissions = db.query(Submission).filter(Submission.user_id == current_user.id).all()
    
    scores = compute_skill_scores(submissions)
    
    # Summary stats
    total_solved = db.query(Submission).filter(
        Submission.user_id == current_user.id,
        Submission.status == "AC"
    ).count()
    
    # Success rate
    total_attempts = len(submissions)
    success_rate = round((total_solved / total_attempts * 100), 1) if total_attempts > 0 else 0
    
    # Streak
    streak = current_user.streak
    
    # Avg time
    avg_time = 0
    if submissions:
        avg_time = round(sum(s.runtime_ms for s in submissions) / len(submissions) / 1000, 1) # in seconds/min?
    
    # Weakest topics
    weak = sorted(scores.items(), key=lambda x: x[1])[:2]
    
    return {
        "summary": {
            "total_solved": total_solved,
            "streak": streak,
            "avg_time_min": avg_time, # simplified
            "success_rate": success_rate
        },
        "skill_scores": scores,
        "weak_topics": [t for t, s in weak],
        "exam_readiness": 75 # Stub
    }

@router.post("/recommend")
@router.get("/recommend")
async def get_recommendations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Suggest problems based on weakest skills."""
    # Logic: find topics with score < 60, pick easy/medium problems from those topics
    submissions = db.query(Submission).filter(Submission.user_id == current_user.id).all()
    scores = compute_skill_scores(submissions)
    
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
