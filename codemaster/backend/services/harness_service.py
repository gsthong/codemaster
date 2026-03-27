import os
import json
import logging
import requests
from typing import Dict, Optional

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL   = "llama-3.3-70b-versatile"

HARNESS_PROMPT = """You are an expert system for competitive programming platforms like LeetCode.
Based on the problem JSON, generate a 'starter_code' (what the user sees) and a 'harness_code' (the hidden main/driver) for {lang}.

The harness MUST:
1. Include all necessary headers and namespaces.
2. Read the ENTIRE input from stdin.
3. The input may be in 'Variable Assignment' format, e.g., "nums = [2,7,11,15], target = 9".
   Your code MUST be smart enough to extract the values (the [2,7,11,15] and the 9) while ignoring the "nums =", "target =", and commas between assignments.
4. Instantiate the 'Solution' class and call the appropriate method.
5. Print ONLY the result followed by a newline (e.g., "[0,1]").

Return ONLY a JSON with keys: 'starter', 'harness'. NO markdown code blocks. NO extra text.

Problem JSON:
{problem_json}
"""

def generate_harness(problem_data: dict, lang: str) -> Dict[str, str]:
    """Generate boilerplate and harness using AI."""
    try:
        if not GROQ_API_KEY:
            return {"starter": "", "harness": ""}
            
        headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
        prompt = HARNESS_PROMPT.replace("{lang}", lang).replace("{problem_json}", json.dumps(problem_data, ensure_ascii=False))
        
        payload = {
            "model": GROQ_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1
        }
        r = requests.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers, timeout=30)
        r.raise_for_status()
        
        raw = r.json()["choices"][0]["message"]["content"].strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)
    except Exception as e:
        logger.error(f"Failed to generate harness for {lang}: {e}")
        return {"starter": "", "harness": ""}

def wrap_code(user_code: str, harness_code: str, lang: str) -> str:
    """Merge user code with the harness."""
    if not harness_code:
        # Fallback for old problems: Prepend common headers at least
        if lang == "cpp":
            if "#include" not in user_code:
                return "#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include <map>\n#include <set>\n#include <queue>\n#include <stack>\nusing namespace std;\n\n" + user_code
        return user_code
        
    if "{{USER_CODE}}" in harness_code:
        return harness_code.replace("{{USER_CODE}}", user_code)
    
    # Default: Prepend headers, then user code, then harness (main)
    if lang == "cpp":
        headers = "#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include <map>\n#include <set>\n#include <queue>\n#include <stack>\nusing namespace std;\n\n"
        return headers + user_code + "\n\n" + harness_code
    elif lang == "python":
        return user_code + "\n\n" + harness_code
        
    return user_code
