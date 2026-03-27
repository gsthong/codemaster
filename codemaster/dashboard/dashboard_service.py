"""
dashboard_service.py — Hệ thống thống kê tiến độ sinh viên
Tổng hợp từ dashboard notebook (Phúc).

Cung cấp:
  - compute_skill_scores(submissions) → dict topic → score
  - compute_summary(submissions) → tổng quan AC/WA/TLE
  - recommend_next(skill_scores) → đề xuất bài tiếp theo
  - exam_readiness(skill_scores, weekly_trend) → điểm sẵn sàng thi
  - root_cause_analysis(submissions) → phân tích lỗi phổ biến theo topic

Mount vào FastAPI: router prefix="/dashboard"
"""

from __future__ import annotations
from collections import defaultdict
from typing import Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session


# ─────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────

class Submission(BaseModel):
    user_id: int
    topic: str          # "Array", "Graph", "DP", "Greedy", "String", ...
    difficulty: str     # "easy" | "medium" | "hard"
    status: str         # "AC" | "WA" | "TLE"
    time_used: float    # seconds
    # Optional error features (từ static_analyzer)
    nested_loop: int = 0
    memo_missing: int = 0
    edge_case: int = 0


class DashboardRequest(BaseModel):
    submissions: list[Submission]


# ─────────────────────────────────────────────
# CORE ANALYTICS
# ─────────────────────────────────────────────

def compute_skill_scores(submissions: list[Submission]) -> dict[str, float]:
    """
    Tính skill score mỗi topic (0–100).
    Formula: 40% accuracy + 30% speed + 20% difficulty_weight + 10% consistency
    """
    by_topic: dict[str, list[Submission]] = defaultdict(list)
    for s in submissions:
        by_topic[s.topic].append(s)

    scores = {}
    for topic, subs in by_topic.items():
        total = len(subs)
        ac = sum(1 for s in subs if s.status == "AC")
        accuracy = ac / total

        avg_time = sum(s.time_used for s in subs) / total
        speed_factor = 1.0 if avg_time < 1.0 else 0.7

        easy  = sum(1 for s in subs if s.difficulty == "easy")
        med   = sum(1 for s in subs if s.difficulty == "medium")
        hard  = sum(1 for s in subs if s.difficulty == "hard")
        diff_weight = (easy * 1.0 + med * 1.2 + hard * 1.5) / total

        score = (0.4 * accuracy + 0.3 * speed_factor + 0.2 * (diff_weight / 1.5) + 0.1 * 0.8) * 100
        scores[topic] = round(score, 2)

    return scores


def compute_summary(submissions: list[Submission]) -> dict:
    total = len(submissions)
    ac  = sum(1 for s in submissions if s.status == "AC")
    wa  = sum(1 for s in submissions if s.status == "WA")
    tle = sum(1 for s in submissions if s.status == "TLE")
    return {
        "total": total,
        "AC": ac,
        "WA": wa,
        "TLE": tle,
        "accuracy_rate": round(ac / total, 2) if total else 0,
        "tle_rate": round(tle / total, 2) if total else 0,
    }


def recommend_next(skill_scores: dict[str, float]) -> dict[str, str]:
    """
    Đề xuất bài tiếp theo theo topic dựa trên skill score.
    """
    recs = {}
    for topic, score in skill_scores.items():
        if score < 50:
            recs[topic] = f"Luyện 3 bài easy về {topic} để củng cố nền tảng"
        elif score < 70:
            recs[topic] = f"Thử 2 bài medium về {topic} để nâng cao"
        else:
            recs[topic] = f"Thử 1 bài hard về {topic} — bạn đã sẵn sàng!"
    return recs


def exam_readiness(skill_scores: dict[str, float]) -> dict[str, float]:
    """
    Điểm sẵn sàng thi = 70% skill score + 30% số topic đã practice.
    """
    if not skill_scores:
        return {}
    avg_score = sum(skill_scores.values()) / len(skill_scores)
    coverage_bonus = min(len(skill_scores) / 5, 1.0)  # assume 5 core topics
    readiness = {}
    for topic, score in skill_scores.items():
        r = 0.7 * (score / 100) + 0.3 * coverage_bonus
        readiness[topic] = round(r, 2)
    return readiness


def root_cause_analysis(submissions: list[Submission]) -> dict[str, dict]:
    """
    Phân tích tỷ lệ lỗi phổ biến cho từng topic (chỉ submissions sai).
    """
    by_topic: dict[str, list[Submission]] = defaultdict(list)
    for s in submissions:
        if s.status != "AC":
            by_topic[s.topic].append(s)

    result = {}
    for topic, subs in by_topic.items():
        n = len(subs)
        result[topic] = {
            "nested_loop_rate": round(sum(s.nested_loop for s in subs) / n, 2),
            "memo_missing_rate": round(sum(s.memo_missing for s in subs) / n, 2),
            "edge_case_rate": round(sum(s.edge_case for s in subs) / n, 2),
            "wrong_count": n,
        }
    return result


def weekly_trend(submissions: list[Submission]) -> dict[str, float]:
    """
    Tỷ lệ AC theo tuần (key = "W{week_number}").
    """
    from datetime import datetime
    # submissions phải có trường date nếu muốn dùng tính năng này
    # Đây là stub — FE có thể group submissions theo week rồi gọi summary
    return {}


# ─────────────────────────────────────────────
# FULL REPORT (1 call trả hết)
# ─────────────────────────────────────────────

def full_report(submissions: list[Submission]) -> dict:
    scores    = compute_skill_scores(submissions)
    summary   = compute_summary(submissions)
    recs      = recommend_next(scores)
    readiness = exam_readiness(scores)
    causes    = root_cause_analysis(submissions)

    # Weakest topics
    weak = sorted(scores.items(), key=lambda x: x[1])[:3]

    return {
        "summary": summary,
        "skill_scores": scores,
        "weak_topics": [{"topic": t, "score": s} for t, s in weak],
        "recommendations": recs,
        "exam_readiness": readiness,
        "root_cause": causes,
    }


# ─────────────────────────────────────────────
# FastAPI ROUTER
# ─────────────────────────────────────────────

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.post("/report")
def api_full_report(req: DashboardRequest):
    """
    Nhận danh sách submissions → trả toàn bộ analytics.
    Frontend dùng để render Dashboard page.
    """
    return full_report(req.submissions)


@router.post("/skill-scores")
def api_skill_scores(req: DashboardRequest):
    return compute_skill_scores(req.submissions)


@router.post("/recommend")
def api_recommend(req: DashboardRequest):
    scores = compute_skill_scores(req.submissions)
    return recommend_next(scores)


@router.post("/exam-readiness")
def api_exam_readiness(req: DashboardRequest):
    scores = compute_skill_scores(req.submissions)
    return exam_readiness(scores)


# ─────────────────────────────────────────────
# QUICK TEST
# ─────────────────────────────────────────────

if __name__ == "__main__":
    import random, json
    random.seed(42)
    topics = ["Array", "Graph", "DP", "Greedy", "String"]
    diffs  = ["easy", "medium", "hard"]
    stats  = ["AC", "WA", "TLE"]

    fake_subs = [
        Submission(
            user_id=1,
            topic=random.choice(topics),
            difficulty=random.choice(diffs),
            status=random.choices(stats, weights=[0.6, 0.25, 0.15])[0],
            time_used=round(random.uniform(0.1, 2.5), 3),
            nested_loop=random.randint(0, 1),
            memo_missing=random.randint(0, 1),
            edge_case=random.randint(0, 1),
        )
        for _ in range(100)
    ]

    report = full_report(fake_subs)
    print(json.dumps(report, ensure_ascii=False, indent=2))
