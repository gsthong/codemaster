# CodeMaster — Hệ thống hỗ trợ lập trình tích hợp AI

> LeetCode + GPT | Hỗ trợ wecode | Visualize graph | Dashboard tiến độ

---

## Cấu trúc folder

```
codemaster/
├── main.py
│
├── backend/
│   ├── api/
│   │   ├── ai.py
│   │   ├── auth.py 
│   │   ├── problems.py 
│   │   └── submissions.py
│   │
│   ├── services/
│   │   ├── ai_service.py 
│   │   ├── judge.py    
│   │   ├── ocr_service.py  
│   │   └── static_analyzer.py   
│   │
│   └── ocr_sinhtestcase/
│       ├── ocr.py               
│       ├── ocr+sinhtc.py       
│       ├── ocr_sinhtc_fastapi.py
│       └── api_vietcodesinhtc.py  
│
├── visualize/
│   └── code_tracer.py           
│       ├── trace_code()   
│       ├── FlowchartBuilder   
│       ├── estimate_complexity()  
│       └── FastAPI router:
│           POST /visualize/trace 
│           POST /visualize/flowchart 
│
├── dashboard/
│   └── dashboard_service.py       
│       ├── compute_skill_scores() 
│       ├── compute_summary()    
│       ├── recommend_next()      
│       ├── exam_readiness()     
│       ├── root_cause_analysis()
│       └── FastAPI router:
│           POST /dashboard/report  
│           POST /dashboard/skill-scores 
│           POST /dashboard/recommend     
│           POST /dashboard/exam-readiness
│
├── frontend/                     
│   ├── app/
│   │   ├── page.tsx              
│   │   ├── practice/page.tsx      
│   │   ├── dashboard/page.tsx    
│   │   ├── mock-exams/page.tsx   
│   │   ├── syllabus-upload/page.tsx 
│   │   └── settings/page.tsx
│   ├── components/
│   │   ├── practice/
│   │   │   ├── IDEWorkspace.tsx  
│   │   │   ├── CodeEditor.tsx   
│   │   │   ├── AIAssistant.tsx   
│   │   │   └── ProblemContext.tsx 
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
└── docker-compose.yml         
```

---

## HDSD 

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

## Phân chia công việc

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
## Env Variables cần thiết

```env
GROQ_API_KEY=gsk_...          # AI hints, bugs, complexity, flowchart (LLM)
GEMINI_API_KEY=AIza...         # OCR ảnh đề bài (Vision)
DATABASE_URL=sqlite:///./db.sqlite3
SECRET_KEY=your-secret-key
```

Visualize và Dashboard **KHÔNG cần API key** nào.
