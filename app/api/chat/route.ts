import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chưa cấu hình API Key. Hãy kiểm tra file .env.local' }, { status: 500 });
    }

    const { type, message, province } = await req.json();
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Dùng bản 2.5-flash-lite theo ý bạn
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    
    // NHIỆM VỤ 1: TẠO CÂU HỎI TRẮC NGHIỆM BẰNG AI
    if (type === 'quiz') {
      const prompt = `Bạn là một giáo viên chuyên ra đề thi Địa lý và Lịch sử Việt Nam.
      Hãy tạo 1 câu hỏi trắc nghiệm MỚI, KHÓ, VÀ HẤP DẪN về tỉnh/thành: ${province}.
      Yêu cầu bắt buộc: 
      - Chỉ trả về ĐÚNG MỘT OBJECT JSON, không kèm bất kỳ câu chữ nào khác (không dùng markdown).
      - Tuyệt đối KHÔNG ra câu hỏi về các chức danh lãnh đạo, chính trị gia hiện tại (Ví dụ: Không hỏi Bí thư, Chủ tịch là ai) vì thông tin này dễ thay đổi và gây sai lệch.
      - CHỈ tập trung vào các kiến thức cố định: Địa lý tự nhiên, Sự kiện Lịch sử, Di tích, Văn hóa, Ẩm thực, Lễ hội.
      - Cấu trúc JSON phải chính xác như sau:
      {
        "question": "Nội dung câu hỏi?",
        "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
        "answer": 0, 
        "explanation": "Giải thích chi tiết tại sao lại chọn đáp án này."
      }`;

      const result = await model.generateContent(prompt);
      let text = await result.response.text();
      
      // Dọn dẹp phòng trường hợp AI trả về ký tự thừa
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const quizData = JSON.parse(text);
      return NextResponse.json(quizData);
    }

    // NHIỆM VỤ 2: CHATBOT BÌNH THƯỜNG
    const prompt = `Bạn là chuyên gia Địa lý, Lịch sử và Văn hóa Việt Nam. 
    Học sinh đang hỏi về đơn vị hành chính: ${province}. 
    Câu hỏi của học sinh: "${message}". 
    
    ⚠️ QUY TẮC TRẢ LỜI BẮT BUỘC:
    1. Nếu học sinh hỏi về các chức danh lãnh đạo, chính trị gia ĐƯƠNG NHIỆM (ví dụ: Bí thư, Chủ tịch hiện tại là ai), hãy từ chối trả lời khéo léo. Hãy nói rằng bạn là Trợ lý AI chuyên về Lịch sử - Địa lý - Văn hóa, không cập nhật thông tin nhân sự chính trị thời gian thực để tránh sai sót.
    2. Nếu học sinh chỉ ra lỗi sai của bạn (ví dụ: "Bí thư hiện tại là ông A chứ không phải ông B"), hãy chân thành xin lỗi vì dữ liệu AI bị cũ, cảm ơn học sinh đã đính chính thông tin.
    3. Luôn trả lời với thái độ thân thiện, chính xác, khoa học và ngắn gọn (dưới 150 chữ).`;

    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    return NextResponse.json({ text });
    
  } catch (error: any) {
    console.error("LỖI AI:", error);
    // Bắt lỗi và gửi thẳng lên màn hình để chúng ta biết
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}