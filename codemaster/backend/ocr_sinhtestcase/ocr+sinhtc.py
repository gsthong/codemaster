import google as genai
import os
from dotenv import load_dotenv, dotenv_values
from google.genai import types  
from google import genai
from PIL import Image

load_dotenv(".env")

print("___START___")

api_key = os.getenv("gemini_api_key")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY not set. Please set it in .env or environment variables.")

# 1. Khởi tạo Client
client = genai.Client(api_key=api_key)


# 2. Đọc trực tiếp file ảnh
try:
    img = Image.open('alice_va_bob.png') #nhap ten anh (file png) vao day
except FileNotFoundError:
    print("❌ Lỗi: Không tìm thấy ảnh. Dừng luồng!")
    exit()

# 3. Prompt
prompt_toi_uu = """
Bạn là một Chuyên gia Lập trình thi đấu. Hãy đọc đề bài lập trình C++ trong bức ảnh đính kèm.

Nhiệm vụ duy nhất của bạn: Dựa vào đề bài trong ảnh, hãy viết một script Python hoàn chỉnh dùng thư viện `random` và `os` để tự động tạo ra thư mục 'testcases_output', bên trong chứa 10 file input (01.in...) và output (01.out...).

🚨 CÁC RÀNG BUỘC KỸ THUẬT BẮT BUỘC:
1. Phải bao phủ đủ 4 cấp độ test case: Happy path, Boundary (min/max), Corner cases (mảng rỗng, số âm, số giống nhau) và Stress test.
2. Để chuyển hướng I/O khi chạy hàm logic tạo file .out, TUYỆT ĐỐI KHÔNG DÙNG `os.dup` hay `os.dup2` (vì sẽ gây lỗi trên Windows). BẮT BUỘC phải dùng `sys.stdin` và `sys.stdout` kết hợp với `with open(...)`.
3. CHỈ TRẢ VỀ MÃ NGUỒN PYTHON, KHÔNG GIẢI THÍCH, KHÔNG DÙNG THẺ MARKDOWN (```python).
"""

print(">> Đang gửi ẢNH + YÊU CẦU lên Gemini")

# 4. Gọi API 
try:
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=[prompt_toi_uu, img],
        config=types.GenerateContentConfig(
            temperature=0.2,
    )
    )
    
    # 5. Lọc thẻ markdown và Lưu file
    ai_code = response.text.replace("```python", "").replace("```", "").strip()

    with open("auto_generator.py", "w", encoding="utf-8") as f:
        f.write(ai_code)

    print(">> THÀNH CÔNG! Đã sinh ra file 'auto_generator.py'.")

except Exception as e:
    print(f"❌ Lỗi gọi API: {e}")