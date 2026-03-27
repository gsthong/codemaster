# CodeMaster — Hệ thống hỗ trợ lập trình tích hợp AI

> LeetCode + GPT style | Hỗ trợ wecode | Visualize graph | Dashboard tiến độ

---

## 📁 Cấu trúc folder

```
codemaster/
├── main.py                        # FastAPI entry point — gọi tất cả routers
│
├── backend/
│   ├── api/
│   │   ├── ai.py                  # /api/ai/* — hints, bugs, OCR, flowchart (Groq LLM)
│   │   ├── auth.py                # /api/auth/* — login/register
│   │   ├── problems.py            # /api/problems/* — CRUD bài tập
│   │   └── submissions.py         # /api/submissions/* — submit + judge
│   │
│   ├── services/
│   │   ├── ai_service.py          # Groq llama-3.3-70b — hint, bug, complexity, flowchart
│   │   ├── judge.py               # Chạy code sandbox (Docker / subprocess)
│   │   ├── ocr_service.py         # OCR ảnh/PDF đề bài → JSON (Gemini Vision + EasyOCR)
│   │   └── static_analyzer.py     # GNN heuristic — TLE risk, bug hints (NO API key)
│   │
│   └── ocr_sinhtestcase/
│       ├── ocr.py                 # PaddleOCR wrapper
│       ├── ocr+sinhtc.py          # OCR + sinh test case
│       ├── ocr_sinhtc_fastapi.py  # FastAPI endpoint standalone
│       └── api_vietcodesinhtc.py  # Wecode integration
│
├── visualize/
│   └── code_tracer.py             # ⭐ Visualize module — KHÔNG dùng AI
│       ├── trace_code()           # Chạy Python + ghi từng bước → JSON steps
│       ├── FlowchartBuilder       # AST → Mermaid flowchart (pure Python)
│       ├── estimate_complexity()  # Heuristic O() từ trace
│       └── FastAPI router:
│           POST /visualize/trace      → { steps, flowchart_mermaid, complexity }
│           POST /visualize/flowchart  → { mermaid }
│
├── dashboard/
│   └── dashboard_service.py       # ⭐ Analytics module (Phúc)
│       ├── compute_skill_scores() # Skill score theo topic (0–100)
│       ├── compute_summary()      # Tổng AC/WA/TLE
│       ├── recommend_next()       # Đề xuất bài luyện tiếp theo
│       ├── exam_readiness()       # Điểm sẵn sàng thi
│       ├── root_cause_analysis()  # Phân tích lỗi phổ biến
│       └── FastAPI router:
│           POST /dashboard/report         → full analytics
│           POST /dashboard/skill-scores   → skill per topic
│           POST /dashboard/recommend      → gợi ý bài tiếp
│           POST /dashboard/exam-readiness → điểm thi
│
├── frontend/                      # Next.js 14 (App Router)
│   ├── app/
│   │   ├── page.tsx               # Home
│   │   ├── practice/page.tsx      # IDE workspace
│   │   ├── dashboard/page.tsx     # Dashboard thống kê
│   │   ├── mock-exams/page.tsx    # Thi thử
│   │   ├── syllabus-upload/page.tsx # Upload đề cương
│   │   └── settings/page.tsx
│   ├── components/
│   │   ├── practice/
│   │   │   ├── IDEWorkspace.tsx   # IDE layout
│   │   │   ├── CodeEditor.tsx     # Monaco editor
│   │   │   ├── AIAssistant.tsx    # Hint panel
│   │   │   └── ProblemContext.tsx # Đề bài + test case
│   │   └── dashboard/
│   │       ├── SkillRadarChart.tsx
│   │       ├── ProblemStatsChart.tsx
│   │       ├── ExamReadinessIndicator.tsx
│   │       ├── RecentActivityFeed.tsx
│   │       └── WecodeSync.tsx
│   └── lib/
│       ├── types.ts
│       ├── constants.ts
│       └── utils.ts
│
└── docker-compose.yml             # Full stack: FE + BE + DB
```

---

## 🚀 Chạy nhanh

```bash
# Backend
cd codemaster
pip install fastapi uvicorn sqlalchemy groq pdfplumber easyocr
uvicorn main:app --reload --port 8000
# → http://localhost:8000/docs

# Frontend
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

---

## 🎯 Phân chia module theo team

| Module | File chính | Owner | Ghi chú |
|---|---|---|---|
| Frontend IDE | `frontend/components/practice/` | Khang, Trung | React, Monaco editor |
| Frontend Dashboard | `frontend/components/dashboard/` | Phúc | Charts, Recharts |
| Backend API | `backend/api/` | Ngọc, Huỳnh | FastAPI routes |
| AI Service | `backend/services/ai_service.py` | Ngọc, Huỳnh | Groq LLM |
| Judge (run code) | `backend/services/judge.py` | Ngọc, Huỳnh | Docker sandbox |
| OCR + Sinh TC | `backend/ocr_sinhtestcase/` | Sang, Dũng, Thông | PaddleOCR |
| **Visualize** | `visualize/code_tracer.py` | **Minh** | **KHÔNG AI — pure graph** |
| **Dashboard logic** | `dashboard/dashboard_service.py` | **Phúc** | Analytics, skill score |

---

## ⭐ Visualize Module (Minh)

**KHÔNG dùng AI.** Dùng Python `ast` + `sys.settrace` để phân tích code.

```
POST /visualize/trace
{
  "code": "def solve(arr):\n    ...",
  "input_array": [1, -2, 3, 4, -1],
  "build_flowchart": true
}

Response:
{
  "status": "OK",
  "result": 7,
  "steps": [
    { "line": 2, "vars": { "max_sum": "-inf", "current": 0 }, "changed": [] },
    ...
  ],
  "flowchart_mermaid": "graph TD\n  N1([\"Start\"])\n  ...",
  "complexity": { "time": "O(n)", "note": "Max 5 lần lặp / 5 phần tử" }
}
```

Frontend nhận `flowchart_mermaid` → render bằng **Mermaid.js**.  
Frontend nhận `steps` → animate từng bước (highlight dòng + hiện biến).

### Cách tích hợp Mermaid vào Next.js:
```bash
npm install mermaid
```
```tsx
import mermaid from 'mermaid'
// render mermaid string từ /visualize/flowchart
```

---

## 📊 Dashboard Module (Phúc)

```
POST /dashboard/report
{ "submissions": [ { "user_id":1, "topic":"Array", "difficulty":"medium",
                      "status":"AC", "time_used":0.8 }, ... ] }

Response:
{
  "summary": { "total": 100, "AC": 60, "WA": 25, "TLE": 15, "accuracy_rate": 0.6 },
  "skill_scores": { "Array": 72.5, "Graph": 48.0, "DP": 55.2 },
  "weak_topics": [ { "topic":"Graph", "score":48.0 }, ... ],
  "recommendations": { "Graph": "Luyện 3 bài easy về Graph để củng cố nền tảng" },
  "exam_readiness": { "Array": 0.81, "Graph": 0.54 },
  "root_cause": { "Graph": { "nested_loop_rate": 0.6, "edge_case_rate": 0.4 } }
}
```

---

## 🔑 Env Variables cần thiết

```env
GROQ_API_KEY=gsk_...          # AI hints, bugs, complexity, flowchart (LLM)
GEMINI_API_KEY=AIza...         # OCR ảnh đề bài (Vision)
DATABASE_URL=sqlite:///./db.sqlite3
SECRET_KEY=your-secret-key
```

Visualize và Dashboard **KHÔNG cần API key** nào.
