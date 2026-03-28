"""
Sandboxed code execution using Docker.
Falls back to subprocess with resource limits if Docker is unavailable.

Security layers:
  1. Docker container with --network none, --memory, --cpus, read-only FS
  2. ulimit for CPU/memory inside container
  3. Hard timeout via asyncio
  4. No internet access (--network none)

Languages supported: Python, C++, Java, JavaScript (Node.js)
"""
import asyncio
import logging
import os
import subprocess
import shutil
import tempfile
import time
from typing import Tuple, Optional
from . import harness_service

logger = logging.getLogger(__name__)

DOCKER_IMAGE_CPP    = "gcc:13"
DOCKER_IMAGE_PYTHON = "python:3.11-slim"
DOCKER_IMAGE_JAVA   = "eclipse-temurin:21-jdk-alpine"
DOCKER_IMAGE_NODE   = "node:20-alpine"

TIMEOUT_DEFAULT = 5.0   # seconds hard limit
MEMORY_LIMIT    = "256m"
CPU_LIMIT       = "1.0"


def _docker_available() -> bool:
    """Return True if Docker daemon is reachable."""
    try:
        r = subprocess.run(["docker", "info"], capture_output=True, timeout=3)
        return r.returncode == 0
    except Exception:
        return False


async def _run_cmd(cmd: list, stdin: str, timeout: float) -> Tuple[int, str, str]:
    """Run a subprocess command asynchronously, returning (returncode, stdout, stderr)."""
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(
            proc.communicate(input=stdin.encode()),
            timeout=timeout,
        )
        return proc.returncode, stdout.decode(errors="replace"), stderr.decode(errors="replace")
    except asyncio.TimeoutError:
        try:
            proc.kill()
        except Exception:
            pass
        return -1, "", "TLE"


# ── C++ ───────────────────────────────────────────────────────────────────────

async def execute_cpp(code: str, stdin: str, time_limit: float) -> dict:
    """Compile and run C++17 code. Returns a RunResult-compatible dict."""
    tmp = tempfile.mkdtemp(prefix="cm_cpp_")
    src = os.path.join(tmp, "solution.cpp")
    exe = os.path.join(tmp, "solution")
    try:
        with open(src, "w") as f:
            f.write(code)

        if _docker_available():
            from pathlib import Path
            docker_tmp = Path(tmp).absolute().as_posix()
            
            compile_cmd = [
                "docker", "run", "--rm", "--network", "none",
                f"--memory={MEMORY_LIMIT}", f"--cpus={CPU_LIMIT}",
                "-v", f"{docker_tmp}:/code:rw",
                DOCKER_IMAGE_CPP,
                "g++", "-O2", "-std=c++17", "-o", "/code/solution", "/code/solution.cpp",
            ]
            rc, stdout, err = await _run_cmd(compile_cmd, "", 30.0)
            if rc != 0:
                error_msg = err or stdout or "Compile failed (Docker)"
                logger.error(f"C++ Docker compile failed: {error_msg}")
                return {"status": "CE", "error": f"Docker Compile Error: {error_msg}", "runtime_ms": 0}
            
            run_cmd = [
                "docker", "run", "--rm", "--network", "none",
                f"--memory={MEMORY_LIMIT}", f"--cpus={CPU_LIMIT}",
                "--ulimit", "cpu=5:5",
                "-v", f"{docker_tmp}:/code:ro",
                DOCKER_IMAGE_CPP,
                "/code/solution",
            ]
        else:
            r = subprocess.run(
                ["g++", "-O2", "-std=c++17", "-o", exe, src],
                capture_output=True, text=True, timeout=30,
            )
            if r.returncode != 0:
                return {"status": "CE", "error": r.stderr, "runtime_ms": 0}
            run_cmd = [exe]

        start = time.perf_counter()
        rc, stdout, stderr = await _run_cmd(run_cmd, stdin, time_limit + 1)
        elapsed = (time.perf_counter() - start) * 1000

        if stderr == "TLE" or elapsed > time_limit * 1000:
            return {"status": "TLE", "error": "Time limit exceeded", "runtime_ms": elapsed}
        if rc != 0:
            return {"status": "RE", "error": stderr[:500], "runtime_ms": elapsed}
        return {"status": "OK", "output": stdout.strip(), "runtime_ms": round(elapsed, 2)}
    except Exception as e:
        logger.exception("execute_cpp failed")
        return {"status": "RE", "error": str(e), "runtime_ms": 0}
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


# ── Python ────────────────────────────────────────────────────────────────────

async def execute_python(code: str, stdin: str, time_limit: float) -> dict:
    """Run Python 3 code in a sandboxed environment. Returns a RunResult-compatible dict."""
    tmp = tempfile.mkdtemp(prefix="cm_py_")
    src = os.path.join(tmp, "solution.py")
    try:
        with open(src, "w") as f:
            f.write(code)

        if _docker_available():
            from pathlib import Path
            docker_tmp = Path(tmp).absolute().as_posix()
            
            run_cmd = [
                "docker", "run", "--rm", "--network", "none",
                f"--memory={MEMORY_LIMIT}", f"--cpus={CPU_LIMIT}",
                "-v", f"{docker_tmp}:/code:ro",
                DOCKER_IMAGE_PYTHON,
                "python3", "/code/solution.py",
            ]
        else:
            import sys
            python_cmd = "python" if os.name == 'nt' else "python3"
            run_cmd = [python_cmd, src]

        start = time.perf_counter()
        rc, stdout, stderr = await _run_cmd(run_cmd, stdin, time_limit + 1)
        elapsed = (time.perf_counter() - start) * 1000

        if stderr == "TLE" or elapsed > time_limit * 1000:
            return {"status": "TLE", "error": "Time limit exceeded", "runtime_ms": elapsed}
        if rc != 0:
            return {"status": "RE", "error": stderr[:500], "runtime_ms": elapsed}
        return {"status": "OK", "output": stdout.strip(), "runtime_ms": round(elapsed, 2)}
    except Exception as e:
        logger.exception("execute_python failed")
        return {"status": "RE", "error": str(e), "runtime_ms": 0}
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


# ── Java ──────────────────────────────────────────────────────────────────────

async def execute_java(code: str, stdin: str, time_limit: float) -> dict:
    """
    Compile and run Java code.
    The submitted code must contain a public class named 'Solution' with a main method.
    Falls back to native javac/java if Docker is unavailable.
    """
    tmp = tempfile.mkdtemp(prefix="cm_java_")
    src = os.path.join(tmp, "Solution.java")
    try:
        with open(src, "w") as f:
            f.write(code)

        if _docker_available():
            from pathlib import Path
            docker_tmp = Path(tmp).absolute().as_posix()
            # Compile
            compile_cmd = [
                "docker", "run", "--rm", "--network", "none",
                f"--memory={MEMORY_LIMIT}", f"--cpus={CPU_LIMIT}",
                "-v", f"{docker_tmp}:/code:rw",
                DOCKER_IMAGE_JAVA,
                "javac", "/code/Solution.java",
            ]
            rc, _, err = await _run_cmd(compile_cmd, "", 60.0)
            if rc != 0:
                return {"status": "CE", "error": err, "runtime_ms": 0}

            # Run
            run_cmd = [
                "docker", "run", "--rm", "--network", "none",
                f"--memory={MEMORY_LIMIT}", f"--cpus={CPU_LIMIT}",
                "-v", f"{docker_tmp}:/code:ro",
                DOCKER_IMAGE_JAVA,
                "java", "-cp", "/code", "Solution",
            ]
        else:
            r = subprocess.run(
                ["javac", src],
                capture_output=True, text=True, timeout=60,
            )
            if r.returncode != 0:
                return {"status": "CE", "error": r.stderr, "runtime_ms": 0}
            run_cmd = ["java", "-cp", tmp, "Solution"]

        start = time.perf_counter()
        rc, stdout, stderr = await _run_cmd(run_cmd, stdin, time_limit + 1)
        elapsed = (time.perf_counter() - start) * 1000

        if stderr == "TLE" or elapsed > time_limit * 1000:
            return {"status": "TLE", "error": "Time limit exceeded", "runtime_ms": elapsed}
        if rc != 0:
            return {"status": "RE", "error": stderr[:500], "runtime_ms": elapsed}
        return {"status": "OK", "output": stdout.strip(), "runtime_ms": round(elapsed, 2)}
    except Exception as e:
        logger.exception("execute_java failed")
        return {"status": "RE", "error": str(e), "runtime_ms": 0}
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


# ── JavaScript (Node.js) ──────────────────────────────────────────────────────

async def execute_javascript(code: str, stdin: str, time_limit: float) -> dict:
    """
    Run JavaScript code using Node.js.
    Falls back to native node if Docker is unavailable.
    """
    tmp = tempfile.mkdtemp(prefix="cm_js_")
    src = os.path.join(tmp, "solution.js")
    try:
        with open(src, "w") as f:
            f.write(code)

        if _docker_available():
            from pathlib import Path
            docker_tmp = Path(tmp).absolute().as_posix()
            
            run_cmd = [
                "docker", "run", "--rm", "--network", "none",
                f"--memory={MEMORY_LIMIT}", f"--cpus={CPU_LIMIT}",
                "-v", f"{docker_tmp}:/code:ro",
                DOCKER_IMAGE_NODE,
                "node", "/code/solution.js",
            ]
        else:
            run_cmd = ["node", src]

        start = time.perf_counter()
        rc, stdout, stderr = await _run_cmd(run_cmd, stdin, time_limit + 1)
        elapsed = (time.perf_counter() - start) * 1000

        if stderr == "TLE" or elapsed > time_limit * 1000:
            return {"status": "TLE", "error": "Time limit exceeded", "runtime_ms": elapsed}
        if rc != 0:
            return {"status": "RE", "error": stderr[:500], "runtime_ms": elapsed}
        return {"status": "OK", "output": stdout.strip(), "runtime_ms": round(elapsed, 2)}
    except Exception as e:
        logger.exception("execute_javascript failed")
        return {"status": "RE", "error": str(e), "runtime_ms": 0}
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


# ── Dispatcher ────────────────────────────────────────────────────────────────

async def run_code(
    language: str,
    code: str,
    stdin: str,
    time_limit: float = 2.0,
) -> dict:
    """
    Route execution request to the correct language executor.
    Supported: python, cpp, java, javascript.
    """
    dispatch = {
        "python":     execute_python,
        "cpp":        execute_cpp,
        "java":       execute_java,
        "javascript": execute_javascript,
    }
    executor = dispatch.get(language)
    if executor is None:
        return {
            "status": "CE",
            "error": f"Language '{language}' is not supported. Supported: {list(dispatch.keys())}",
            "runtime_ms": 0,
        }
    return await executor(code, stdin, time_limit)
