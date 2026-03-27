"""
AI Service — powered by Groq (llama-3.3-70b-versatile).
Handles: hints, bug analysis, complexity, flowchart, testcase generation,
         syllabus parsing, success explanation, solution explanation,
         problem parsing from text.

All public functions log errors and never raise to caller.
"""
import os
import json
import re
import time
import logging
import functools
from typing import Optional

import requests

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "REMOVED")
GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"
MODEL        = "llama-3.3-70b-versatile"

_RETRY_STATUSES = {429, 503}
_MAX_RETRIES    = 2
_RETRY_DELAY    = 1.0  # seconds


# ─── Core HTTP helper ──────────────────────────────────────────────────────────

def _call(
    system: str,
    user: str,
    temperature: float = 0.2,
    max_tokens: int = 1500,
) -> str:
    """Call Groq API with up to _MAX_RETRIES retries on 429/503."""
    if not GROQ_API_KEY:
        return "⚠️ GROQ_API_KEY not set. Configure it in Settings."

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
    }

    for attempt in range(_MAX_RETRIES + 1):
        try:
            r = requests.post(GROQ_URL, headers=headers, json=payload, timeout=30)
            if r.status_code in _RETRY_STATUSES and attempt < _MAX_RETRIES:
                logger.warning("Groq returned %s, retrying in %ss (attempt %d/%d)",
                               r.status_code, _RETRY_DELAY, attempt + 1, _MAX_RETRIES)
                time.sleep(_RETRY_DELAY)
                continue
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"].strip()
        except requests.HTTPError as e:
            logger.error("Groq HTTP error: %s", e)
            if attempt >= _MAX_RETRIES:
                return f"AI Error: {e}"
            time.sleep(_RETRY_DELAY)
        except Exception as e:
            logger.error("Groq call failed: %s", e)
            return f"AI Error: {e}"

    return "AI Error: max retries exceeded"


# ─── Hint (with lru_cache for repeated same-level requests) ───────────────────

@functools.lru_cache(maxsize=256)
def _cached_hint(problem_id: str, hint_level: int, code_hash: str, problem_description: str) -> str:
    """Internal cached hint call — keyed by problem_id + level + code hash."""
    system = """Bạn là AI hỗ trợ sinh viên lập trình. Nhiệm vụ: đưa gợi ý KHÔNG tiết lộ đáp án.
Hint level 1: gợi ý khái niệm, tư duy thuật toán.
Hint level 2: gợi ý cụ thể hơn về cách tiếp cận.
Hint level 3: gợi ý gần lời giải nhưng vẫn để sinh viên tự code.
KHÔNG viết code hoàn chỉnh. KHÔNG đưa đáp án trực tiếp."""
    user = f"""Đề bài: {problem_description}

Hãy đưa gợi ý cấp độ {hint_level}. Trả lời bằng tiếng Việt, ngắn gọn, súc tích."""
    return _call(system, user)


def get_hint(
    problem_description: str,
    code: str,
    hint_level: int,
    previous_hints: list,
    problem_id: str = "",
) -> str:
    """Return a hint for the given problem, using lru_cache to avoid duplicate calls."""
    code_hash = str(hash(code))
    try:
        return _cached_hint(problem_id, hint_level, code_hash, problem_description)
    except Exception as e:
        logger.error("get_hint failed: %s", e)
        return "Không thể lấy gợi ý lúc này."


# ─── Bug Analysis ──────────────────────────────────────────────────────────────

def analyze_bugs(
    code: str,
    language: str,
    error_message: str,
    problem_description: str,
) -> dict:
    """Analyse code for bugs. Returns {bugs: [...], summary: ...}."""
    system = """Bạn là chuyên gia phân tích lỗi code. Phân tích lỗi và trả về JSON theo format:
{"bugs": [{"type": "...", "line": N, "message": "...", "fix": "..."}], "summary": "..."}
Các loại lỗi: syntax_error, logic_error, off_by_one, infinite_loop, uninitialized_var, missing_base_case, edge_case, tle_risk."""
    user = f"""Ngôn ngữ: {language}
Đề bài: {problem_description}
Lỗi: {error_message or 'WA - kết quả sai'}

Code:
```{language}
{code}
```

Trả về JSON hợp lệ."""
    result = _call(system, user, temperature=0.1)
    try:
        match = re.search(r'\{.*\}', result, re.DOTALL)
        return json.loads(match.group()) if match else {"bugs": [], "summary": result}
    except Exception:
        return {"bugs": [], "summary": result}


# ─── Static Analysis ──────────────────────────────────────────────────────────

def static_analyze(code: str, language: str) -> dict:
    """Run static/style/performance checks on code. Returns same schema as analyze_bugs."""
    system = """Bạn là linter chuyên nghiệp. Phân tích code về phong cách, hiệu năng, và rủi ro tiềm ẩn.
Trả về JSON: {"bugs": [{"type": "...", "line": N, "message": "...", "fix": "..."}], "summary": "..."}
Loại: naming_convention, unused_variable, complexity_warning, missing_docstring, redundant_code."""
    user = f"""Ngôn ngữ: {language}
```{language}
{code}
```
Trả về JSON hợp lệ."""
    result = _call(system, user, temperature=0.1)
    try:
        match = re.search(r'\{.*\}', result, re.DOTALL)
        return json.loads(match.group()) if match else {"bugs": [], "summary": result}
    except Exception:
        return {"bugs": [], "summary": result}


# ─── Complexity Analysis ───────────────────────────────────────────────────────

def analyze_complexity(code: str, language: str) -> dict:
    """Analyse algorithmic complexity. Returns {algorithm, time_complexity, space_complexity, explanation}."""
    system = """Phân tích độ phức tạp thuật toán và trả về JSON:
{"algorithm": "...", "time_complexity": "O(...)", "space_complexity": "O(...)", "explanation": "..."}"""
    user = f"""Ngôn ngữ: {language}
```{language}
{code}
```
Trả về JSON hợp lệ."""
    result = _call(system, user, temperature=0.1)
    try:
        match = re.search(r'\{.*\}', result, re.DOTALL)
        return json.loads(match.group()) if match else {
            "time_complexity": "?", "space_complexity": "?", "explanation": result
        }
    except Exception:
        return {"time_complexity": "?", "space_complexity": "?", "explanation": result}


# ─── Flowchart Generation ──────────────────────────────────────────────────────

def generate_flowchart(code: str, language: str) -> str:
    """
    Ask Groq to produce a Mermaid flowchart from code.
    System prompt is complete and strict to prevent malformed output.
    """
    system = """You are a Mermaid flowchart generator. Convert the given code to a Mermaid flowchart.

STRICT RULES — violating any rule causes failure:
1. Output ONLY raw Mermaid lines. Start with exactly: graph TD
2. Do NOT wrap output in markdown fences (no ```mermaid or ``` blocks).
3. Do NOT add any explanation, description, or prose.
4. Node syntax: use A["Label"] for rectangles, B{"Condition"} for diamonds, C(["Start/End"]) for stadiums.
5. Edge syntax: --> for unlabelled, -->|Yes| or -->|No| for labelled.
6. Node IDs must be short alphanumeric: A, B, N1, N2, etc.
7. Labels must NOT contain: double-quotes, colons, semicolons, or parentheses — use single-quotes or rephrase.
8. Every branch of every if/else must have an outgoing edge to a merge node.

Begin your response with "graph TD" on the first line."""

    user = f"""Convert this {language} code to a Mermaid flowchart:
```{language}
{code}
```"""
    raw = _call(system, user, temperature=0.0, max_tokens=900)

    # Post-process: strip markdown fences and sanitize characters
    lines = ["graph TD"]
    for line in raw.splitlines():
        line = line.strip()
        if not line or line.startswith("graph") or line.startswith("```"):
            continue
        line = line.replace(";", "").replace("(", "[").replace(")", "]")
        line = re.sub(r'["\':()]', '', line)
        lines.append("    " + line)
    return "\n".join(lines)


# ─── Solution Explanation ──────────────────────────────────────────────────────

def explain_solution(code: str, language: str, problem_description: str) -> dict:
    """
    Return a structured explanation of the solution.
    Keys: algorithm, time_complexity, space_complexity, walkthrough, alternatives.
    """
    system = """Bạn là giảng viên lập trình. Giải thích lời giải theo cấu trúc JSON:
{
  "algorithm": "Tên/mô tả thuật toán",
  "time_complexity": "O(...)",
  "space_complexity": "O(...)",
  "walkthrough": ["Bước 1: ...", "Bước 2: ..."],
  "alternatives": [{"name": "...", "complexity": "O(...)", "note": "..."}]
}
Viết bằng tiếng Việt. Trả về JSON hợp lệ duy nhất."""
    user = f"""Đề bài: {problem_description}
Code ({language}):
```{language}
{code}
```
Trả về JSON."""
    result = _call(system, user, temperature=0.2, max_tokens=1200)
    try:
        match = re.search(r'\{.*\}', result, re.DOTALL)
        return json.loads(match.group()) if match else {
            "algorithm": "N/A", "walkthrough": [result], "alternatives": []
        }
    except Exception:
        return {"algorithm": "N/A", "walkthrough": [result], "alternatives": []}


# ─── Remaining helpers (unchanged logic, docstrings added) ────────────────────

def generate_testcases(problem_description: str, examples: list) -> list:
    """Generate diverse test cases (happy path, boundary, corner, stress) as a list of dicts."""
    system = """Tạo test cases cho bài lập trình. Trả về JSON array:
[{"input": "...", "expected_output": "...", "type": "happy_path|boundary|corner|stress"}]
Tạo đủ 4 loại: happy path, boundary (min/max), corner cases, stress test."""
    user = f"""Đề bài: {problem_description}
Ví dụ có sẵn: {json.dumps(examples, ensure_ascii=False)}
Tạo 8-10 test case đa dạng. Trả về JSON array hợp lệ."""
    result = _call(system, user, temperature=0.3, max_tokens=1500)
    try:
        match = re.search(r'\[.*\]', result, re.DOTALL)
        return json.loads(match.group()) if match else []
    except Exception:
        return []


def explain_success(
    code: str,
    language: str,
    problem_description: str,
    user_time: str,
    user_space: str,
    optimal_time: str,
    optimal_space: str,
) -> str:
    """Congratulate and explain the student's accepted solution."""
    system = """Bạn là mentor lập trình. Khi sinh viên làm đúng, hãy:
1. Giải thích tư duy giải thuật của họ
2. So sánh với cách tối ưu hơn (nếu có)
3. Đề xuất cải tiến
Viết bằng tiếng Việt, thân thiện, khuyến khích."""
    user = f"""Đề bài: {problem_description}
Code của sinh viên ({language}):
```{language}
{code}
```
Độ phức tạp của sinh viên: Time={user_time}, Space={user_space}
Độ phức tạp tối ưu: Time={optimal_time}, Space={optimal_space}"""
    return _call(system, user, temperature=0.4, max_tokens=600)


def parse_syllabus(text: str) -> list:
    """Parse a syllabus document into a list of topic dicts."""
    system = """Phân tích đề cương học phần lập trình và trích xuất danh sách chủ đề. Trả về JSON array:
[{"name": "...", "description": "...", "subtopics": ["...", "..."], "difficulty": "easy|medium|hard"}]"""
    user = f"""Đề cương:
{text[:4000]}

Trả về JSON array các chủ đề chính. JSON hợp lệ."""
    result = _call(system, user, temperature=0.2, max_tokens=1500)
    try:
        match = re.search(r'\[.*\]', result, re.DOTALL)
        return json.loads(match.group()) if match else []
    except Exception:
        return []


def parse_problem_from_text(text: str) -> dict:
    """Extract a structured problem definition from raw text."""
    system = """Đọc đề bài lập trình và trích xuất thông tin. Trả về JSON:
{
  "title": "...",
  "description": "...",
  "difficulty": "easy|medium|hard",
  "tags": ["..."],
  "examples": [{"input": "...", "output": "...", "explanation": "..."}],
  "constraints": "...",
  "time_limit": 2.0,
  "memory_limit": 256
}"""
    user = f"""Đề bài:
{text[:3000]}

Trả về JSON hợp lệ."""
    result = _call(system, user, temperature=0.1, max_tokens=1200)
    try:
        match = re.search(r'\{.*\}', result, re.DOTALL)
        return json.loads(match.group()) if match else {}
    except Exception:
        return {}
