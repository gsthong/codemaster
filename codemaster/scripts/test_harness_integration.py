import asyncio
import sys
import os

# Add parent dir to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.services import harness_service, judge

async def test_python():
    print("Testing Python...")
    user_code = "class Solution:\n    def add(self, a, b):\n        return a + b"
    harness = "sol = Solution()\nimport sys\nprint(sol.add(1, 2))"
    wrapped = harness_service.wrap_code(user_code, harness, "python")
    result = await judge.run_code("python", wrapped, "")
    print(f"Result: {result}")
    if result["status"] != "OK":
        print(f"Error in Python: {result.get('error')}")
    assert result["status"] == "OK"
    assert result["output"] == "3"

async def test_cpp():
    print("Testing C++...")
    user_code = "int add(int a, int b) { return a + b; }"
    harness = "int main() { std::cout << add(1, 2) << std::endl; return 0; }"
    wrapped = harness_service.wrap_code(user_code, harness, "cpp")
    result = await judge.run_code("cpp", wrapped, "")
    print(f"Result: {result}")
    # Note: might fail if g++ or docker not available on this environment, 
    # but we want to see the error message.
    if result["status"] == "OK":
        assert result["output"] == "3"

async def test_java():
    print("Testing Java...")
    user_code = "public int add(int a, int b) { return a + b; }"
    harness = "public class Solution {\n    public static void main(String[] args) {\n        System.out.println(new Solution().add(1, 2));\n    }\n    {{USER_CODE}}\n}"
    # This should use the {{USER_CODE}} replacement
    wrapped = harness_service.wrap_code(user_code, harness, "java")
    print(f"Wrapped sample: {wrapped[:50]}...")
    assert "public class Solution" in wrapped
    # Execution requires javac/docker
    result = await judge.run_code("java", wrapped, "")
    print(f"Result: {result}")

async def main():
    await test_python()
    await test_cpp()
    await test_java()
    print("Verification script finished.")

if __name__ == "__main__":
    asyncio.run(main())
