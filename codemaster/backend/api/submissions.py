from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import logging
import asyncio

from ..db.database import get_db
from ..models import User, Problem, Submission, TestCase
from ..core.security import get_current_user, get_optional_user
from ..services import judge, ai_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/submissions", tags=["submissions"])

class RunRequest(BaseModel):
    code: str
    language: str
    stdin: str = ""
    problem_id: Optional[int] = None

class SubmitRequest(BaseModel):
    problem_id: int
    code: str
    language: str

class SubmissionResponse(BaseModel):
    id: int
    problem_id: int
    user_id: int
    language: str
    status: str
    runtime_ms: float
    created_at: str # Serialized datetime
    class Config:
        from_attributes = True


async def run_judge_internal(submission_id: int, db_session: Session):
    """Background task to run all testcases for a submission."""
    submission = db_session.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        return

    problem = db_session.query(Problem).filter(Problem.id == submission.problem_id).first()
    testcases = db_session.query(TestCase).filter(TestCase.problem_id == problem.id).order_by(TestCase.order).all()
    
    results = []
    overall_status = "OK"
    total_runtime = 0.0
    
    for tc in testcases:
        # Run code against this testcase
        harness = (problem.harness or {}).get(submission.language)
        res = await judge.run_code(
            submission.language, 
            submission.code, 
            tc.input, 
            time_limit=problem.time_limit,
            harness_code=harness
        )
        
        # Check output
        # Normalize whitespace for comparison
        expected = tc.expected_output.strip()
        actual = res.get("output", "").strip()
        
        status = res["status"]
        if status == "OK" and actual != expected:
            status = "WA"
            
        results.append({
            "id": tc.id,
            "status": status,
            "input": tc.input if not tc.is_hidden else "Hidden",
            "expected": tc.expected_output if not tc.is_hidden else "Hidden",
            "output": res.get("output", "") if not tc.is_hidden else "Hidden",
            "error": res.get("error", "")
        })
        
        total_runtime += res.get("runtime_ms", 0.0)
        
        # Update overall status if not already failed
        if overall_status == "OK" and status != "OK":
            overall_status = status
            
    submission.status = overall_status
    submission.runtime_ms = round(total_runtime / (len(testcases) or 1), 2)
    submission.test_results = results
    
    # Update problem acceptance if AC
    if overall_status == "OK":
        all_subs = db_session.query(Submission).filter(Submission.problem_id == problem.id).count()
        ac_subs = db_session.query(Submission).filter(Submission.problem_id == problem.id, Submission.status == "OK").count()
        problem.acceptance = round((ac_subs / all_subs) * 100, 2)
        
    db_session.commit()


@router.post("/run")
async def run_code(
    req: RunRequest, 
    _: Optional[User] = Depends(get_optional_user)
):
    """Run code on a single input (standard execution)."""
    # Fetch harness if problem_id is provided
    harness = None
    if req.problem_id:
        db = next(get_db()) # Get DB session
        problem = db.query(Problem).filter(Problem.id == req.problem_id).first()
        if problem:
            harness = (problem.harness or {}).get(req.language)
            
    result = await judge.run_code(req.language, req.code, req.stdin, harness_code=harness)
    return result


@router.post("/submit")
async def submit_code(
    req: SubmitRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Submit code for problem evaluation (all testcases)."""
    problem = db.query(Problem).filter(Problem.id == req.problem_id).first()
    if not problem:
        raise HTTPException(404, "Problem not found")
        
    submission = Submission(
        user_id=current_user.id,
        problem_id=req.problem_id,
        code=req.code,
        language=req.language,
        status="PENDING",
        runtime_ms=0.0
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    # Run judging in background
    background_tasks.add_task(run_judge_internal, submission.id, db)
    
    return {
        "id": submission.id, 
        "status": "PENDING",
        "message": "Submission received and queued for judging"
    }


@router.get("/{submission_id}")
async def get_submission(submission_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(404, "Submission not found")
    
    # Check ownership or admin
    if submission.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Access denied")
        
    return submission


@router.get("/user/me")
async def list_my_submissions(
    problem_id: Optional[int] = None, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query = db.query(Submission).filter(Submission.user_id == current_user.id)
    if problem_id:
        query = query.filter(Submission.problem_id == problem_id)
        
    return query.order_by(Submission.created_at.desc()).all()
