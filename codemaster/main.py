"""
main.py — CodeMaster Backend Entry Point
Tổng hợp tất cả modules: API, Visualize, Dashboard

Khởi động:
    uvicorn main:app --reload --port 8000

Endpoints chính:
    /api/ai/*        — AI hints, bug analysis, OCR, flowchart (Groq LLM)
    /api/problems/*  — CRUD problems
    /api/submissions/* — Submit code, run test cases
    /api/auth/*      — Login/Register
    /visualize/*     — Trace + Flowchart (KHÔNG AI, pure graph)
    /dashboard/*     — Analytics, skill scores, recommendations
    /docs            — Swagger UI
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ── Routers ──────────────────────────────────
from backend.api.ai import router as ai_router
from backend.api.auth import router as auth_router
from backend.api.problems import router as problems_router
from backend.api.submissions import router as submissions_router
from visualize.code_tracer import router as visualize_router
from backend.api.dashboard import router as dashboard_router

app = FastAPI(
    title="CodeMaster API",
    description="Hệ thống hỗ trợ lập trình tích hợp AI — LeetCode + GPT style",
    version="1.0.0",
)

# ── CORS (cho phép FE Next.js gọi) ───────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Init DB & Mock Data ───────────────────────
from backend.db.database import engine, Base, SessionLocal
from backend.models import Problem, TestCase
from backend.services import harness_service

# Create tables
Base.metadata.create_all(bind=engine)

# Inject Mock Problem: Two Sum with Harness
def init_data():
    db = SessionLocal()
    try:
        if db.query(Problem).count() == 0:
            print("Initializing mock data...")
            p_data = {
                "title": "Two Sum",
                "description": "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.\n\nYou may assume each input has exactly one solution, and you cannot use the same element twice.",
                "difficulty": "easy",
                "tags": ["Array", "Hash Table"],
                "examples": [
                    {"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]"},
                    {"input": "nums = [3,2,4], target = 6", "output": "[1,2]"}
                ]
            }
            
            # Generate harnesses
            boilerplate = {}
            harness = {}
            for lang in ["cpp", "python", "java", "javascript"]:
                try:
                    h = harness_service.generate_harness(p_data, lang)
                    boilerplate[lang] = h.get("starter", "")
                    harness[lang] = h.get("harness", "")
                except Exception as e:
                    print(f"Failed to generate {lang} harness: {e}")
                    
            p = Problem(
                title=p_data["title"],
                description=p_data["description"],
                difficulty=p_data["difficulty"],
                tags=p_data["tags"],
                examples=p_data["examples"],
                boilerplate=boilerplate,
                harness=harness
            )
            db.add(p)
            db.commit()
            db.refresh(p)
            
            # Add test cases
            db.add(TestCase(problem_id=p.id, input="nums = [2,7,11,15], target = 9", expected_output="[0,1]", order=1))
            db.add(TestCase(problem_id=p.id, input="nums = [3,2,4], target = 6", expected_output="[1,2]", order=2))
            db.commit()
            print("Mock data initialized.")
    except Exception as e:
        print(f"init_data failed but continuing: {e}")
    finally:
        db.close()

init_data()

# ── Register routers ──────────────────────────
app.include_router(auth_router)
app.include_router(ai_router)
app.include_router(problems_router)
app.include_router(submissions_router)
app.include_router(visualize_router)
app.include_router(dashboard_router)


@app.get("/")
def root():
    return {
        "service": "CodeMaster API",
        "status": "running",
        "docs": "/docs",
        "modules": {
            "ai": "/api/ai — hints, bugs, OCR, complexity (Groq LLM)",
            "visualize": "/visualize — trace + flowchart (NO AI, pure graph)",
            "dashboard": "/dashboard — analytics + skill scores",
            "problems": "/api/problems — CRUD",
            "submissions": "/api/submissions — run + judge",
            "auth": "/api/auth — login/register",
        }
    }
