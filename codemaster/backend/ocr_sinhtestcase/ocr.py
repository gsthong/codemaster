from google import genai
from PIL import Image

def lay_de_bai_tu_anh(duong_dan_anh):
    """
    Hàm này nhận đầu vào là đường dẫn ảnh, trả về chuỗi JSON chứa đề bài.
    """
    print("--- HỆ THỐNG VISION LLM ĐỌC ĐỀ ---")

    # 1. Khởi tạo Client 
    client = genai.Client(api_key="api_key") #nhap api key vo 

    print(f"1. Đang tải ảnh Wecode từ: {duong_dan_anh}...")
    try:
        img = Image.open(duong_dan_anh)
    except FileNotFoundError:
        print(f"❌ Lỗi: Không tìm thấy ảnh tại {duong_dan_anh}")
        return None

    # 2. Ép AI nhả ra định dạng JSON
    prompt = """
    Bạn là một hệ thống trích xuất dữ liệu đề bài lập trình (Wecode) tự động. Hãy đọc bức ảnh và bóc tách thông tin thành một file JSON chuẩn cấu trúc.

    Cấu trúc bắt buộc:
    {
        "Ten_Bai_Tap": "Tên bài toán",
        "Yeu_Cau": "Tóm tắt ngắn gọn yêu cầu cốt lõi",
        "Input": "Định dạng dữ liệu đầu vào",
        "Output": "Định dạng dữ liệu đầu ra",
        "Vi_Du": "Trình bày rõ ràng Input và Output của các ví dụ"
    }

    🚨 QUY TẮC SỐNG CÒN (BẮT BUỘC TUÂN THỦ):
    1. Chỉ trả về ĐÚNG chuỗi JSON, KHÔNG bọc trong markdown (```json).
    2. TRUNG THỰC TUYỆT ĐỐI VỚI OUTPUT: Giữ nguyên văn 100% các chuỗi ký tự được yêu cầu in ra màn hình. TUYỆT ĐỐI KHÔNG tự ý thêm dấu tiếng Việt vào các chuỗi Output (Ví dụ: Phải giữ nguyên "Vi tri <k> khong thoa dieu kien.").
    3. Trình bày phần "Vi_Du" rõ ràng, tách biệt các dòng bằng ký tự xuống dòng (\\n).
    """

    print("2. Đang gửi dữ liệu lên Gemini")
    try:
        # 3. Sử dụng model Flash thế hệ mới nhất cho tốc độ bàn thờ
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[prompt, img]
        )
        print("\n✅ KẾT QUẢ TRẢ VỀ TỪ OCR:\n" + "="*40)
        print(response.text)
        print("="*40)
        
        # ĐÂY LÀ ĐIỂM QUAN TRỌNG NHẤT: Trả dữ liệu về cho file khác xài
        return response.text 

    except Exception as e:
        print(f"\n❌ Lỗi khi gọi API OCR: {e}")
        return None

