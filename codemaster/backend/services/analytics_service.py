from __future__ import annotations
from collections import defaultdict
from typing import List, Dict, Any
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

# Re-using the Submission model from dashboard_service for compatibility with FE inputs if needed,
# but primarily this service will handle DB models.
class AnalyticsSubmission(BaseModel):
    user_id: int
    topic: str
    difficulty: str
    status: str
    time_used: float
    runtime_ms: float = 0
    nested_loop: int = 0
    memo_missing: int = 0
    edge_case: int = 0

def compute_skill_scores(submissions: List[Any]) -> Dict[str, float]:
    """
    Tính skill score cho từng topic (0–100).
    Hỗ trợ cả DB model Submission và AnalyticsSubmission (Pydantic).
    Formula: 40% accuracy + 30% speed + 20% difficulty_weight + 10% consistency
    """
    by_topic = defaultdict(list)
    for s in submissions:
        # Resolve topic/difficulty from either DB model or Pydantic
        topic = getattr(s, "topic", None)
        if not topic and hasattr(s, "problem") and s.problem:
            topic = s.problem.tags[0] if s.problem.tags else "General"
        
        if not topic: topic = "General"
        by_topic[topic].append(s)

    scores = {}
    for topic, subs in by_topic.items():
        total = len(subs)
        ac = sum(1 for s in subs if getattr(s, "status", "") == "AC")
        accuracy = ac / total

        # Time used (seconds)
        avg_time = sum(getattr(s, "time_used", 0) or (getattr(s, "runtime_ms", 0) / 1000) for s in subs) / total
        speed_factor = 1.0 if avg_time < 2.0 else 0.7

        # Difficulty weight
        diff_weights = {"easy": 1.0, "medium": 1.2, "hard": 1.5}
        total_weight = 0
        for s in subs:
            diff = getattr(s, "difficulty", None)
            if not diff and hasattr(s, "problem") and s.problem:
                diff = s.problem.difficulty
            total_weight += diff_weights.get(diff or "easy", 1.0)
        
        diff_factor = total_weight / total

        score = (0.4 * accuracy + 0.3 * speed_factor + 0.2 * (diff_factor / 1.5) + 0.1 * 0.8) * 100
        scores[topic] = round(score, 2)

    return scores

def compute_summary(submissions: List[Any]) -> Dict[str, Any]:
    total = len(submissions)
    ac = sum(1 for s in submissions if getattr(s, "status", "") == "AC")
    wa = sum(1 for s in submissions if getattr(s, "status", "") == "WA")
    tle = sum(1 for s in submissions if getattr(s, "status", "") == "TLE")
    
    return {
        "total": total,
        "AC": ac,
        "WA": wa,
        "TLE": tle,
        "accuracy_rate": round(ac / total, 2) if total else 0,
        "tle_rate": round(tle / total, 2) if total else 0,
    }

def recommend_next(skill_scores: Dict[str, float]) -> Dict[str, str]:
    recs = {}
    for topic, score in skill_scores.items():
        if score < 50:
            recs[topic] = f"Luyện 3 bài easy về {topic} để củng cố nền tảng"
        elif score < 70:
            recs[topic] = f"Thử 2 bài medium về {topic} để nâng cao"
        else:
            recs[topic] = f"Thử 1 bài hard về {topic} — bạn đã sẵn sàng!"
    return recs

def exam_readiness(skill_scores: Dict[str, float]) -> Dict[str, float]:
    if not skill_scores:
        return {}
    avg_score = sum(skill_scores.values()) / len(skill_scores)
    coverage_bonus = min(len(skill_scores) / 5, 1.0)
    
    readiness = {}
    for topic, score in skill_scores.items():
        r = 0.7 * (score / 100) + 0.3 * coverage_bonus
        readiness[topic] = round(r * 100, 1) # Return percentage
    return readiness

def root_cause_analysis(submissions: List[Any]) -> Dict[str, Any]:
    by_topic = defaultdict(list)
    for s in submissions:
        if getattr(s, "status", "") != "AC":
            topic = getattr(s, "topic", None)
            if not topic and hasattr(s, "problem") and s.problem:
                topic = s.problem.tags[0] if s.problem.tags else "General"
            by_topic[topic or "General"].append(s)

    result = {}
    for topic, subs in by_topic.items():
        n = len(subs)
        # These fields might only exist in static analysis results, but we stub them for now
        result[topic] = {
            "nested_loop_rate": round(sum(getattr(s, "nested_loop", 0) for s in subs) / n, 2),
            "memo_missing_rate": round(sum(getattr(s, "memo_missing", 0) for s in subs) / n, 2),
            "edge_case_rate": round(sum(getattr(s, "edge_case", 0) for s in subs) / n, 2),
            "wrong_count": n,
        }
    return result

def get_full_report(submissions: List[Any]) -> Dict[str, Any]:
    scores = compute_skill_scores(submissions)
    summary = compute_summary(submissions)
    recs = recommend_next(scores)
    readiness = exam_readiness(scores)
    causes = root_cause_analysis(submissions)

    weak = sorted(scores.items(), key=lambda x: x[1])[:3]

    return {
        "summary": summary,
        "skill_scores": scores,
        "weak_topics": [{"topic": t, "score": s} for t, s in weak],
        "recommendations": recs,
        "exam_readiness_by_topic": readiness,
        "exam_readiness_avg": round(sum(readiness.values()) / len(readiness), 1) if readiness else 0,
        "root_cause": causes,
    }
