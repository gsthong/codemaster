from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import logging

from ..db.database import get_db
from ..models import User, Problem
from ..core.security import get_current_user, require_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/problems", tags=["problems"])

class ProblemBase(BaseModel):
    title: str
    description: str
    difficulty: str
    tags: List[str] = []
    examples: List[dict] = []
    constraints: Optional[str] = None
    syllabus_topic: Optional[str] = None
    time_limit: float = 2.0
    memory_limit: int = 256

class ProblemCreate(ProblemBase):
    pass

class ProblemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[str] = None
    tags: Optional[List[str]] = None
    examples: Optional[List[dict]] = None
    constraints: Optional[str] = None
    syllabus_topic: Optional[str] = None
    time_limit: Optional[float] = None
    memory_limit: Optional[int] = None

class ProblemResponse(ProblemBase):
    id: int
    acceptance: float
    class Config:
        from_attributes = True


@router.get("/", response_model=List[ProblemResponse])
async def list_problems(
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Problem)
    if topic:
        query = query.filter(Problem.syllabus_topic == topic)
    if difficulty:
        query = query.filter(Problem.difficulty == difficulty)
    if search:
        query = query.filter(Problem.title.ilike(f"%{search}%"))
        
    return query.all()


@router.post("/", response_model=ProblemResponse, status_code=201)
async def create_problem(req: ProblemCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    problem = Problem(**req.dict())
    db.add(problem)
    db.commit()
    db.refresh(problem)
    return problem


@router.get("/{problem_id}", response_model=ProblemResponse)
async def get_problem(problem_id: int, db: Session = Depends(get_db)):
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(404, "Problem not found")
    return problem


@router.put("/{problem_id}", response_model=ProblemResponse)
async def update_problem(
    problem_id: int, 
    req: ProblemUpdate, 
    db: Session = Depends(get_db), 
    _: User = Depends(require_admin)
):
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(404, "Problem not found")
    
    update_data = req.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(problem, key, value)
        
    db.commit()
    db.refresh(problem)
    return problem


@router.delete("/{problem_id}", status_code=204)
async def delete_problem(
    problem_id: int, 
    db: Session = Depends(get_db), 
    _: User = Depends(require_admin)
):
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(404, "Problem not found")
    
    db.delete(problem)
    db.commit()
    return None
