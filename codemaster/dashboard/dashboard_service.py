from fastapi import APIRouter, Body
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime

# ==========================================
# 1. KHỞI TẠO ROUTER CỦA FASTAPI
# ==========================================
router = APIRouter()

# ==========================================
# 2. ĐỊNH NGHĨA CÁC MODEL DỮ LIỆU (PYDANTIC)
# ==========================================
class Submission(BaseModel):
    problem_id: str
    topic: str
    status: str
    time_taken_min: int
    submitted_at: datetime  # Đã thêm trường này để sau này làm logic tính Streak

# ==========================================
# 3. CÁC HÀM XỬ LÝ LOGIC (CORE FUNCTIONS)
# ==========================================

def compute_summary(submissions: List[Submission]) -> Dict[str, int]:
    """Tính toán 4 chỉ số tổng quan (Analytics)"""
    if not submissions:
        return {"total_solved": 0, "success_rate": 0, "avg_time_min": 0, "current_streak": 0}

    total_subs = len(submissions)
    accepted_subs = [s for s in submissions if s.status == "Accepted"]
    
    # Lọc bài trùng (1 bài nộp đúng nhiều lần chỉ đếm 1)
    unique_solved = len(set(s.problem_id for s in accepted_subs))
    
    # Tỉ lệ thành công (tổng số lần đúng / tổng số lần nộp)
    success_rate = round((len(accepted_subs) / total_subs) * 100) if total_subs > 0 else 0
    
    # Thời gian trung bình giải bài
    avg_time = 0
    if accepted_subs:
        avg_time = round(sum(s.time_taken_min for s in accepted_subs) / len(accepted_subs))

    return {
        "total_solved": unique_solved,
        "success_rate": success_rate,
        "avg_time_min": avg_time,
        "current_streak": 7  # Ghi chú: Cần logic đếm ngày liên tục dựa vào trường submitted_at
    }

def compute_skill_scores(submissions: List[Submission]) -> List[Dict[str, Any]]:
    """Tính điểm kỹ năng cho biểu đồ Radar 6 cánh"""
    skills = {
        "Arrays": 0, "Strings": 0, "Graphs": 0, 
        "Dynamic Programming": 0, "Trees": 0, "Binary Search": 0
    }

    # Lấy danh sách các bài nộp đúng
    accepted_subs = [s for s in submissions if s.status == "Accepted"]
    
    # FIX LOGIC CHUẨN: Lọc bỏ bài nộp trùng. 
    # Mỗi bài (problem_id) chỉ giữ lại 1 record để tính điểm 1 lần duy nhất.
    unique_accepted = {s.problem_id: s for s in accepted_subs}.values()

    POINTS_PER_PROBLEM = 25 # Mỗi bài đúng cộng 25 điểm

    for sub in unique_accepted:
        if sub.topic in skills:
            skills[sub.topic] = min(100, skills[sub.topic] + POINTS_PER_PROBLEM)

    # Format chuẩn để Frontend Recharts đọc được
    radar_data = [
        {"topic": topic, "proficiency": score, "fullMark": 100} 
        for topic, score in skills.items()
    ]
    return radar_data

def recommend_next() -> Dict[str, str]:
    """Gợi ý bài tập tiếp theo (Skeleton)"""
    return {"recommended_problem": "Two Sum", "reason": "Củng cố kỹ năng Arrays"}

def exam_readiness() -> Dict[str, int]:
    """Đánh giá độ sẵn sàng cho kỳ thi (Skeleton)"""
    return {"readiness_score": 72, "easy_solved": 12, "medium_solved": 10, "hard_solved": 2}

def root_cause_analysis() -> Dict[str, str]:
    """Phân tích nguyên nhân lỗi sai thường gặp (Skeleton)"""
    return {"main_issue": "Time Limit Exceeded", "advice": "Cần tối ưu vòng lặp lồng nhau"}

# ==========================================
# 4. KHAI BÁO CÁC API ENDPOINT (FASTAPI ROUTER)
# ==========================================

@router.post("/dashboard/report")
async def get_dashboard_report(submissions: List[Submission] = Body(...)):
    """API trả về dữ liệu Analytics (4 ô thống kê)"""
    data = compute_summary(submissions)
    return {"status": "success", "data": data}

@router.post("/dashboard/skill-scores")
async def get_skill_scores(submissions: List[Submission] = Body(...)):
    """API trả về dữ liệu cho biểu đồ Radar"""
    data = compute_skill_scores(submissions)
    return {"status": "success", "data": data}

@router.post("/dashboard/recommend")
async def get_recommendation():
    """API trả về gợi ý bài tập"""
    return {"status": "success", "data": recommend_next()}

@router.post("/dashboard/exam-readiness")
async def get_exam_readiness():
    """API trả về độ sẵn sàng thi"""
    return {"status": "success", "data": exam_readiness()}