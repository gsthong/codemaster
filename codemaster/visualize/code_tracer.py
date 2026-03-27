"""
code_tracer.py — Visualize module (KHÔNG dùng AI)
Chạy trace Python code → trả về JSON steps để frontend render graph/animation.

API output format:
  POST /visualize/trace   → { steps: [...], flowchart_mermaid: "..." }
  POST /visualize/flowchart → { mermaid: "..." }

Dùng trong FastAPI backend. Frontend nhận JSON → vẽ bằng Mermaid.js / D3.
"""

import sys
import ast
import copy
import logging
from collections import Counter
from typing import Any

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# 1. EXECUTION TRACER (step-by-step)
# ─────────────────────────────────────────────

def _safe_copy(d: dict) -> dict:
    """
    Fast serialisation-safe copy of locals dict.
    Uses isinstance checks instead of json.dumps loop — O(n) not O(n*json_cost).
    Non-serialisable objects are converted with repr().
    """
    out: dict = {}
    for k, v in d.items():
        if isinstance(v, (int, float, str, bool)) or v is None:
            out[k] = v
        elif isinstance(v, list):
            out[k] = [_safe_scalar(x) for x in v]
        elif isinstance(v, dict):
            out[k] = {str(dk): _safe_scalar(dv) for dk, dv in v.items()}
        else:
            out[k] = repr(v)
    return out


def _safe_scalar(v: Any) -> Any:
    """Convert a single value to a JSON-safe primitive."""
    if isinstance(v, (int, float, str, bool)) or v is None:
        return v
    if isinstance(v, list):
        return [_safe_scalar(x) for x in v]
    if isinstance(v, dict):
        return {str(k): _safe_scalar(val) for k, val in v.items()}
    return repr(v)


def trace_code(source_code: str, input_array: list) -> dict:
    """
    Run solve() in source_code with input_array.
    Return step-by-step execution (line number + variable state).
    KHÔNG gọi AI.
    """
    namespace: dict = {}
    try:
        exec(source_code, namespace)  # noqa: S102
    except SyntaxError as e:
        return {"error": f"SyntaxError: {e}", "steps": [], "result": None}

    if "solve" not in namespace:
        return {"error": "Không tìm thấy hàm solve()", "steps": [], "result": None}

    solve_func = namespace["solve"]
    steps: list[dict] = []
    prev_locals: dict = {}

    def tracefunc(frame, event, arg):  # noqa: ANN001
        nonlocal prev_locals
        if event == "line" and frame.f_code.co_name == "solve":
            current = frame.f_locals.copy()
            changed = [k for k in current if k not in prev_locals or prev_locals.get(k) != current[k]]
            steps.append({
                "line": frame.f_lineno,
                "vars": _safe_copy(current),
                "changed": changed,
            })
            prev_locals = copy.deepcopy(current)
        return tracefunc

    sys.settrace(tracefunc)
    try:
        result = solve_func(input_array)
        status = "OK"
    except Exception as e:
        result = str(e)
        status = "RUNTIME_ERROR"
        logger.warning("trace_code runtime error: %s", e)
    finally:
        sys.settrace(None)

    return {
        "status": status,
        "result": result,
        "steps": steps,
        "total_steps": len(steps),
    }


# ─────────────────────────────────────────────
# 2. FLOWCHART BUILDER (AST → Mermaid)
# ─────────────────────────────────────────────

class FlowchartBuilder(ast.NodeVisitor):
    """
    Analyse Python AST → generate Mermaid TD flowchart.
    Supports: FunctionDef, Assign, AugAssign, AnnAssign, For, While, If, Return, Expr.
    """

    def __init__(self) -> None:
        self.nodes: list[tuple[str, str, str]] = []   # (id, label, shape)
        self.edges: list[tuple[str, str, str]] = []   # (src, dst, label)
        self._counter = 0
        self._prev: str | None = None

    def _new_id(self) -> str:
        self._counter += 1
        return f"N{self._counter}"

    def _add_node(self, label: str, shape: str = "rect") -> str:
        nid = self._new_id()
        self.nodes.append((nid, label, shape))
        if self._prev:
            self.edges.append((self._prev, nid, ""))
        self._prev = nid
        return nid

    def _add_edge(self, src: str, dst: str, label: str = "") -> None:
        self.edges.append((src, dst, label))

    # ── Visitors ──────────────────────────────

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self._add_node("Start", "stadium")
        for stmt in node.body:
            self.visit(stmt)
        self._add_node("End", "stadium")

    def visit_Assign(self, node: ast.Assign) -> None:
        try:
            t = ast.unparse(node.targets[0])
            v = ast.unparse(node.value)
            self._add_node(f"{t} = {v}")
        except Exception:
            self._add_node("Assign")

    def visit_AugAssign(self, node: ast.AugAssign) -> None:
        try:
            t = ast.unparse(node.target)
            op = (
                type(node.op).__name__
                .replace("Add", "+=").replace("Sub", "-=")
                .replace("Mult", "*=").replace("Div", "/=")
            )
            v = ast.unparse(node.value)
            self._add_node(f"{t} {op} {v}")
        except Exception:
            self._add_node("AugAssign")

    def visit_AnnAssign(self, node: ast.AnnAssign) -> None:
        """Handle type-annotated assignments like x: int = 0."""
        try:
            t = ast.unparse(node.target)
            ann = ast.unparse(node.annotation)
            if node.value is not None:
                v = ast.unparse(node.value)
                self._add_node(f"{t}: {ann} = {v}")
            else:
                self._add_node(f"{t}: {ann}")
        except Exception:
            self._add_node("AnnAssign")

    def visit_For(self, node: ast.For) -> None:
        try:
            loop_cond = f"for {ast.unparse(node.target)} in {ast.unparse(node.iter)}"
        except Exception:
            loop_cond = "For Loop"
        loop_node = self._add_node(loop_cond, "diamond")

        for stmt in node.body:
            self.visit(stmt)

        # back-edge from loop body end → loop condition
        if self._prev:
            self._add_edge(self._prev, loop_node, "next iter")
        self._prev = loop_node  # exit path continues downward from diamond

    def visit_While(self, node: ast.While) -> None:
        try:
            cond = f"while {ast.unparse(node.test)}"
        except Exception:
            cond = "While"
        loop_node = self._add_node(cond, "diamond")

        for stmt in node.body:
            self.visit(stmt)

        if self._prev:
            self._add_edge(self._prev, loop_node, "repeat")
        self._prev = loop_node

    def visit_If(self, node: ast.If) -> None:
        try:
            cond = f"if {ast.unparse(node.test)}"
        except Exception:
            cond = "If"
        if_node = self._add_node(cond, "diamond")

        # True branch
        self._prev = if_node
        for stmt in node.body:
            self.visit(stmt)
        true_end = self._prev

        # False branch
        self._prev = if_node
        for stmt in node.orelse:
            self.visit(stmt)
        false_end = self._prev

        # Merge node — only add false→merge edge when there IS an else body
        has_else_body = len(node.orelse) > 0
        if true_end and true_end != if_node:
            merge = self._new_id()
            self.nodes.append((merge, "", "rect"))
            self._add_edge(true_end, merge, "")
            # Only draw false branch edge if false_end is different from if_node
            # (i.e. there was actual else content that ended somewhere new)
            if has_else_body and false_end and false_end != if_node:
                self._add_edge(false_end, merge, "")
            else:
                # No else body — draw direct edge from if_node to merge (the "No" path)
                self._add_edge(if_node, merge, "No")
            self._prev = merge

    def visit_Return(self, node: ast.Return) -> None:
        try:
            val = ast.unparse(node.value) if node.value else ""
            self._add_node(f"return {val}", "stadium")
        except Exception:
            self._add_node("return", "stadium")

    def visit_Expr(self, node: ast.Expr) -> None:
        try:
            self._add_node(ast.unparse(node))
        except Exception:
            pass

    # ── Mermaid output ────────────────────────

    def _shape_wrap(self, nid: str, label: str, shape: str) -> str:
        label = label.replace('"', "'")
        if shape == "diamond":
            return f'{nid}{{"{label}"}}'
        elif shape == "stadium":
            return f'{nid}(["{label}"])'
        else:
            return f'{nid}["{label}"]'

    def generate_mermaid(self) -> str:
        lines = ["graph TD"]
        for nid, label, shape in self.nodes:
            if label:
                lines.append(f"  {self._shape_wrap(nid, label, shape)}")
        for src, dst, label in self.edges:
            if label:
                lines.append(f"  {src} -->|{label}| {dst}")
            else:
                lines.append(f"  {src} --> {dst}")
        return "\n".join(lines)

    def build(self, source_code: str) -> str:
        try:
            tree = ast.parse(source_code)
        except SyntaxError as e:
            return f'graph TD\n  ERR["SyntaxError: {e}"]'
        for node in tree.body:
            if isinstance(node, ast.FunctionDef):
                self.visit(node)
                break
        else:
            self._add_node("Start", "stadium")
            for node in tree.body:
                self.visit(node)
            self._add_node("End", "stadium")
        return self.generate_mermaid()


def build_flowchart(source_code: str) -> str:
    """Convenience wrapper. Returns Mermaid string."""
    return FlowchartBuilder().build(source_code)


# ─────────────────────────────────────────────
# 3. COMPLEXITY ESTIMATOR (thuần heuristic)
# ─────────────────────────────────────────────

def estimate_complexity(steps: list, input_size: int) -> dict:
    """
    Estimate O() from trace step count / input_size heuristic.
    Also estimates space complexity from max list/dict sizes in trace.
    KHÔNG dùng AI.
    """
    if not steps or input_size == 0:
        return {"time": "O(1)", "space": "O(1)", "note": "Không đủ dữ liệu"}

    line_counts = Counter(s["line"] for s in steps)
    max_count = max(line_counts.values())
    ratio = max_count / input_size

    if ratio <= 2:
        time_c = "O(n)"
    else:
        import math
        if ratio <= math.log2(max(input_size, 2)) * 3:
            time_c = "O(n log n)"
        elif ratio <= input_size * 1.5:
            time_c = "O(n²)"
        else:
            time_c = "O(n²) hoặc tệ hơn"

    # Space complexity: track maximum size of list/dict variables across all steps
    max_sizes: list[int] = []
    for step in steps:
        for v in step.get("vars", {}).values():
            if isinstance(v, list):
                max_sizes.append(len(v))
            elif isinstance(v, dict):
                max_sizes.append(len(v))
    max_space = max(max_sizes, default=0)

    if max_space == 0:
        space_c = "O(1)"
    elif max_space <= input_size:
        space_c = "O(n)"
    else:
        space_c = "O(n²)"

    return {
        "time": time_c,
        "space": space_c,
        "note": f"Max {max_count} lần lặp / {input_size} phần tử · max space buffer {max_space}",
    }


# ─────────────────────────────────────────────
# 4. FastAPI ROUTER (mount vào main app)
# ─────────────────────────────────────────────

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/visualize", tags=["visualize"])


class TraceRequest(BaseModel):
    code: str
    input_array: list
    build_flowchart: bool = True


class FlowchartRequest(BaseModel):
    code: str


@router.post("/trace")
def api_trace(req: TraceRequest):
    """
    Run code trace → return steps (for frontend animation)
    + Mermaid flowchart (for frontend graph render).
    KHÔNG gọi AI.
    """
    trace_result = trace_code(req.code, req.input_array)
    mermaid = ""
    if req.build_flowchart:
        mermaid = build_flowchart(req.code)
    complexity = estimate_complexity(
        trace_result.get("steps", []),
        len(req.input_array),
    )
    return {
        **trace_result,
        "flowchart_mermaid": mermaid,
        "complexity": complexity,
    }


@router.post("/flowchart")
def api_flowchart(req: FlowchartRequest):
    """Generate only a Mermaid flowchart from code. No execution, no AI."""
    return {"mermaid": build_flowchart(req.code)}


# ─────────────────────────────────────────────
# QUICK TEST (chạy trực tiếp: python code_tracer.py)
# ─────────────────────────────────────────────

if __name__ == "__main__":
    sample = """
def solve(arr):
    max_sum = float('-inf')
    current: int = 0
    for x in arr:
        current += x
        max_sum = max(max_sum, current)
        if current < 0:
            current = 0
    return max_sum
"""
    print("=== TRACE ===")
    r = trace_code(sample, [1, -2, 3, 4, -1])
    print(f"Status: {r['status']}, Result: {r['result']}, Steps: {r['total_steps']}")
    for s in r["steps"][:5]:
        print(f"  Line {s['line']}: {s['vars']}")

    print("\n=== FLOWCHART ===")
    print(build_flowchart(sample))

    print("\n=== COMPLEXITY ===")
    print(estimate_complexity(r["steps"], 5))
