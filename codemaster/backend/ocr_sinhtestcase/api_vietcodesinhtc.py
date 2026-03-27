import google as genai
import os
from google.genai import types  

# BƯỚC 1: IMPORT HÀM TỪ FILE OCR CỦA BẠN


from google import genai
from test_ocr import lay_de_bai_tu_anh 

print(">> BƯỚC 1: KÍCH HOẠT LUỒNG ĐỌC ẢNH...")
# Gọi hàm bóc chữ từ ảnh
de_bai_ocr = lay_de_bai_tu_anh('alice_va_bob.png')

if de_bai_ocr is not None:
    print("\n>> BƯỚC 2: BẮT ĐẦU ĐẺ TESTCASE TỪ ĐỀ BÀI VỪA ĐỌC...")
    
    # 1. Khởi tạo Client (Cú pháp MỚI)
    client = genai.Client(api_key="AIzaSyCuvTIJ6gQQBAnFoEBHdYtbc-enmNXxMTQ")
    
    prompt_testcase = f"""
    Bạn là Kỹ sư phần mềm. Dưới đây là đề bài C++ được trích xuất từ ảnh dưới dạng JSON:
    ---
    {de_bai_ocr}
    ---
    Nhiệm vụ: Viết một script Python dùng thư viện `random` và `os` để tự động tạo ra thư mục 'testcases_output', bên trong chứa 10 file input (01.in...) và output (01.out...) cho đề bài trên.
Cấp độ 1: Happy Path (Test case bình thường - 20% số điểm)Mục đích: Kiểm tra xem code của sinh viên có chạy đúng mạch logic cơ bản nhất không.
Cấp độ 2: Boundary Cases (Trường hợp Biên / Cực hạn - 30% số điểm)Mục đích: Đánh vào giới hạn của dữ liệu (Min/Max). Sinh viên rất hay quên check điều kiện này dẫn đến lỗi tràn mảng hoặc chia cho 0.
 Cấp độ 3: Corner/Edge Cases (Trường hợp "Dị" - 40% số điểm)Mục đích: Đây là nơi sinh viên UIT rớt môn nhiều nhất. Đánh vào các tình huống logic hiếm gặp, đòi hỏi code phải bao quát mọi ngóc ngách.
 Cấp độ 4: Stress Test (Test chống gian lận/Hiệu năng - 10% số điểm)Mục đích: Ép Time Limit Exceeded (TLE). Đưa vào những mảng kích thước khổng lồ với các phần tử random để ép sinh viên phải dùng thuật toán $O(N)$ thay vì $O(N^2)$.   
 CHỈ TRẢ VỀ MÃ NGUỒN PYTHON, KHÔNG GIẢI THÍCH, KHÔNG DÙNG THẺ MARKDOWN.
    """
    
    print(">> Đang gọi Gemini-2.5-Flash viết code...")
    # 2. Gọi model sinh nội dung (Cú pháp MỚI)
    response_testcase = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt_testcase,
      config=types.GenerateContentConfig(
        temperature=0.1,)
    )
    
    # Chuẩn hóa chuỗi trả về
    ai_code = response_testcase.text.replace("```python", "").replace("```", "").strip()

    # Lưu thành file script tự động
    with open("auto_generator.py", "w", encoding="utf-8") as f:
        f.write(ai_code)

    print(">> THÀNH CÔNG! Đã đẻ ra file 'auto_generator.py'. Hãy chạy nó để lấy Testcase!")
else:
    print("❌ Luồng bị dừng do đọc ảnh thất bại!")