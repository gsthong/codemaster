from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import json
import logging

from ..db.database import get_db
from ..models import User, Problem, HintUsage, TestCase, Syllabus
from ..core.security import get_current_user, require_admin, get_optional_user
from ..services import ai_service
from ..services.static_analyzer import full_analyze

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["ai"])

class HintRequest(BaseModel):
    problem_id: int
    code: str = ""
    hint_level: int = 1

class BugRequest(BaseModel):
    code: str
    language: str
    error_message: str = ""
    problem_id: Optional[int] = None

class FlowchartRequest(BaseModel):
    code: str
    language: str

class ComplexityRequest(BaseModel):
    code: str
    language: str

class StaticAnalyzeRequest(BaseModel):
    code: str
    language: str = "cpp"

class ProblemTextRequest(BaseModel):
    text: str

class GenerateTestcasesRequest(BaseModel):
    problem_id: int


@router.post("/hint")
async def get_hint(
    req: HintRequest, 
    db: Session = Depends(get_db), 
    current_user: Optional[User] = Depends(get_optional_user)
):
    problem = db.query(Problem).filter(Problem.id == req.problem_id).first()
    if not problem:
        raise HTTPException(404, "Problem not found")
    
    prev_hints_data = []
    
    if current_user:
        # Check if student already unlocked previous hint
        if req.hint_level > 1:
            prev_unlocked = db.query(HintUsage).filter(
                HintUsage.user_id == current_user.id,
                HintUsage.problem_id == req.problem_id,
                HintUsage.hint_level == req.hint_level - 1
            ).first()
            if not prev_unlocked:
                raise HTTPException(403, f"Must unlock Hint {req.hint_level - 1} first")

        # Record usage
        usage = db.query(HintUsage).filter(
            HintUsage.user_id == current_user.id,
            HintUsage.problem_id == req.problem_id,
            HintUsage.hint_level == req.hint_level
        ).first()
        
        if not usage:
            usage = HintUsage(user_id=current_user.id, problem_id=req.problem_id, hint_level=req.hint_level)
            db.add(usage)
            db.commit()

        prev_usages = db.query(HintUsage).filter(
            HintUsage.user_id == current_user.id,
            HintUsage.problem_id == req.problem_id,
            HintUsage.hint_level < req.hint_level
        ).all()
        prev_hints_data = [{"level": u.hint_level, "content": ""} for u in prev_usages]
    else:
        # Guest: assume all previous levels "unlocked" but no history recorded
        prev_hints_data = [{"level": i, "content": ""} for i in range(1, req.hint_level)]

    hint = ai_service.get_hint(
        problem.description, 
        req.code, 
        req.hint_level,
        prev_hints_data,
        problem_id=str(problem.id)
    )
    return {"hint": hint, "level": req.hint_level}


@router.post("/static-analyze")
async def static_analyze_endpoint(req: StaticAnalyzeRequest):
    """Pure heuristic analysis — no auth needed."""
    if not req.code.strip():
        raise HTTPException(400, "Empty code")
    return full_analyze(req.code, req.language)


@router.post("/analyze-bugs")
async def analyze_bugs_endpoint(
    req: BugRequest, 
    db: Session = Depends(get_db), 
    _: Optional[User] = Depends(get_optional_user)
):
    """Static + LLM hybrid analysis."""
    problem_desc = ""
    if req.problem_id:
        p = db.query(Problem).filter(Problem.id == req.problem_id).first()
        if p: problem_desc = p.description
    
    # Combined analysis
    static = full_analyze(req.code, req.language)
    llm_result = ai_service.analyze_bugs(req.code, req.language, req.error_message, problem_desc)
    
    # Merge findings
    seen = set()
    merged = []
    for b in (static.get("bugs", []) + llm_result.get("bugs", [])):
        key = (b.get("type"), b.get("line"))
        if key not in seen:
            seen.add(key)
            merged.append(b)
            
    return {
        "bugs": merged, 
        "summary": llm_result.get("summary", ""),
        "tle_risk": static.get("tle_risk", 0),
        "tle_label": static.get("tle_label", "")
    }


@router.post("/flowchart")
async def generate_flowchart_endpoint(req: FlowchartRequest, _: Optional[User] = Depends(get_optional_user)):
    return {"mermaid": ai_service.generate_flowchart(req.code, req.language)}


@router.post("/complexity")
async def analyze_complexity_endpoint(req: ComplexityRequest, _: Optional[User] = Depends(get_optional_user)):
    return ai_service.analyze_complexity(req.code, req.language)


@router.post("/generate-testcases")
async def generate_testcases_endpoint(req: GenerateTestcasesRequest, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    problem = db.query(Problem).filter(Problem.id == req.problem_id).first()
    if not problem:
        raise HTTPException(404, "Problem not found")
        
    tcs = ai_service.generate_testcases(
        problem.description, 
        problem.examples or []
    )
    
    for i, tc in enumerate(tcs):
        db.add(TestCase(
            problem_id=problem.id,
            input=tc.get("input", ""),
            expected_output=tc.get("expected_output", ""),
            is_hidden=True,
            order=100 + i
        ))
    db.commit()
    return {"created": len(tcs), "testcases": tcs}


@router.post("/parse-problem")
async def parse_problem_endpoint(req: ProblemTextRequest, _: Optional[User] = Depends(get_optional_user)):
    return ai_service.parse_problem_from_text(req.text)


@router.post("/ocr/image")
async def ocr_image_endpoint(
    file: UploadFile = File(...),
    _: Optional[User] = Depends(get_optional_user)
):
    content = await file.read()
    filename = file.filename.lower()
    
    if filename.endswith(".pdf"):
        # Explicit import to avoid circular dependencies if any
        from ..services.ocr_service import pdf_to_problem_json
        result = pdf_to_problem_json(content)
    else:
        from ..services.ocr_service import image_to_problem_json
        result = image_to_problem_json(content, file.content_type or "image/png")
        
    return result

@router.post("/upload-syllabus")
async def upload_syllabus_endpoint(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    content = await file.read()
    filename = file.filename.lower()
    
    if filename.endswith(".pdf"):
        # Lazy import if needed, but assuming ocr_service is ready
        from ..services.ocr_service import extract_text_from_pdf
        text = extract_text_from_pdf(content)
    else:
        text = content.decode("utf-8", errors="replace")
        
    topics = ai_service.parse_syllabus(text)
    
    syllabus = Syllabus(
        user_id=current_user.id,
        filename=file.filename,
        topics=topics,
        raw_text=text[:5000]
    )
    db.add(syllabus)
    db.commit()
    
    return {"topics": topics, "filename": file.filename}
