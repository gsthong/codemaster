import os
import io
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image
from dotenv import load_dotenv
from google import genai
from google.genai import types

# ==========================================
# PHẦN 1: CẤU HÌNH HỆ THỐNG & API KEY
# ==========================================
# Load biến môi trường từ file .env
load_dotenv(".env")

# Khởi tạo ứng dụng FastAPI
app = FastAPI(
    title="Auto Testcase Generator API",
    description="API nhận ảnh đề bài C++ và tự động sinh script Python tạo testcases bằng Gemini AI."
)

# Lấy API Key. 

api_key = os.getenv("gemini_api_key")
if not api_key:
    raise RuntimeError("❌ LỖI: Không tìm thấy 'gemini_api_key' trong file .env. Vui lòng kiểm tra lại!")

# Khởi tạo Client của Google Gemini
client = genai.Client(api_key=api_key)

# ==========================================
# PHẦN 2: CẤU HÌNH PROMPT CHO AI
# ==========================================
PROMPT_TOI_UU = """
Bạn là một Chuyên gia Lập trình thi đấu. Hãy đọc đề bài lập trình C++ trong bức ảnh đính kèm.

Nhiệm vụ duy nhất của bạn: Dựa vào đề bài trong ảnh, hãy viết một script Python hoàn chỉnh dùng thư viện `random` và `os` để tự động tạo ra thư mục 'testcases_output', bên trong chứa 10 file input (01.in...) và output (01.out...).

🚨 CÁC RÀNG BUỘC KỸ THUẬT BẮT BUỘC:
1. Phải bao phủ đủ 4 cấp độ test case: Happy path, Boundary (min/max), Corner cases (mảng rỗng, số âm, số giống nhau) và Stress test.
2. Để chuyển hướng I/O khi chạy hàm logic tạo file .out, TUYỆT ĐỐI KHÔNG DÙNG `os.dup` hay `os.dup2` (vì sẽ gây lỗi trên Windows). BẮT BUỘC phải dùng `sys.stdin` và `sys.stdout` kết hợp với `with open(...)`.
3. CHỈ TRẢ VỀ MÃ NGUỒN PYTHON, KHÔNG GIẢI THÍCH, KHÔNG DÙNG THẺ MARKDOWN (```python).
"""

# ==========================================
# PHẦN 3: ĐỊNH NGHĨA API ENDPOINT
# ==========================================
@app.post("/generate-testcase", summary="Tạo script testcase từ ảnh đề bài")
async def generate_testcase(file: UploadFile = File(...)):
    """
    Endpoint này nhận một file ảnh (png, jpg...), gửi lên Gemini để phân tích 
    và trả về mã nguồn Python tự động sinh testcase.
    """
    # 1. Kiểm tra định dạng đầu vào có phải là ảnh không
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="❌ Lỗi: File upload bắt buộc phải là hình ảnh (png, jpg, jpeg...).")

    try:
        # 2. Đọc ảnh trực tiếp vào RAM (Tối ưu hóa hiệu suất, không cần lưu file tạm)
        image_bytes = await file.read()
        img = Image.open(io.BytesIO(image_bytes))

        # 3. Gọi API Gemini 2.5 Flash
        print(f">> Đang gửi ảnh '{file.filename}' lên Gemini để xử lý...")
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[PROMPT_TOI_UU, img],
            config=types.GenerateContentConfig(
                temperature=0.2, # Giữ ở mức thấp để code sinh ra ổn định, ít bay bổng
            )
        )

        # 4. Tiền xử lý kết quả trả về (Cắt bỏ thẻ markdown nếu AI lỡ thêm vào)
        ai_code = response.text.replace("```python", "").replace("```", "").strip()

        # 5. Lưu kết quả ra file trên Server
        output_filename = "auto_generator.py"
        with open(output_filename, "w", encoding="utf-8") as f:
            f.write(ai_code)

        print(f">> THÀNH CÔNG! Đã lưu mã nguồn vào {output_filename}.")

        # 6. Trả kết quả JSON về cho người dùng (Client)
        return JSONResponse(content={
            "status": "success",
            "message": f"Đã phân tích ảnh '{file.filename}' và tạo script thành công.",
            "saved_file": output_filename,
            "generated_code": ai_code
        })

    except Exception as e:
        print(f"❌ Lỗi hệ thống: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi khi xử lý với Gemini: {str(e)}")

# ==========================================
# PHẦN 4: KHỞI CHẠY SERVER LOKAL
# ==========================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ocr_sinhtc_fastapi:app", host="0.0.0.0", port=8000, reload=True)